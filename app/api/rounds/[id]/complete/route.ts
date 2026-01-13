import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  calculateScoreDifferential,
  calculateNineHoleDifferential,
  applyEquitableStrokeControl,
  calculateHandicapIndex,
  calculatePlayingHandicap,
  calculateCourseHandicap,
} from '@/lib/calculations/handicap';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: roundId } = await params;

    // Parse request body for 9-hole mode
    let nineHoleMode: 'front' | 'back' | undefined;
    try {
      const body = await request.json();
      nineHoleMode = body.nineHoleMode;
    } catch {
      // No body or invalid JSON, assume full round
    }

    const isNineHole = nineHoleMode === 'front' || nineHoleMode === 'back';

    // Fetch the round with all related data
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        course: true,
        tee_set: {
          include: {
            holes: true,
          },
        },
        round_players: {
          include: {
            player: true,
            scores: {
              include: {
                hole: true,
              },
            },
          },
        },
      },
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    const userPlayer = await prisma.player.findFirst({
      where: { user_id: session.user.id },
    });

    const isCreator = round.created_by === session.user.id;
    const isParticipant = userPlayer && round.round_players.some(
      (rp) => rp.player_id === userPlayer.id
    );

    if (!isCreator && !isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check round is still in progress
    if (round.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Round is not in progress' },
        { status: 400 }
      );
    }

    // Validate scores are entered for the selected holes
    const totalHoles = round.tee_set.holes.length;
    const requiredHoles = isNineHole ? 9 : totalHoles;

    // Determine which holes to validate based on mode
    const getRelevantHoles = (holeNumber: number) => {
      if (!isNineHole) return true;
      if (nineHoleMode === 'front') return holeNumber <= 9;
      return holeNumber > 9;
    };

    for (const roundPlayer of round.round_players) {
      const completedScores = roundPlayer.scores.filter(
        (s) => s.strokes !== null && getRelevantHoles(s.hole.hole_number)
      );

      if (completedScores.length < requiredHoles) {
        const nineLabel = nineHoleMode === 'front' ? 'front 9' : 'back 9';
        return NextResponse.json(
          {
            error: isNineHole
              ? `${roundPlayer.player.name} has only completed ${completedScores.length} of ${requiredHoles} ${nineLabel} holes`
              : `${roundPlayer.player.name} has only completed ${completedScores.length} of ${totalHoles} holes`,
            incomplete_player: roundPlayer.player.name,
            holes_completed: completedScores.length,
            total_holes: requiredHoles,
          },
          { status: 400 }
        );
      }
    }

    // Calculate scores and update round_players
    const courseRating = Number(round.tee_set.course_rating);
    const slopeRating = round.tee_set.slope_rating;

    // Get holes for the selected nine (or all holes for full round)
    const relevantHoles = round.tee_set.holes.filter((h) => getRelevantHoles(h.hole_number));
    const totalPar = relevantHoles.reduce((sum, h) => sum + h.par, 0);

    const playerResults = [];

    for (const roundPlayer of round.round_players) {
      // Only count scores from relevant holes
      const relevantScores = roundPlayer.scores.filter(
        (s) => getRelevantHoles(s.hole.hole_number)
      );

      // Calculate raw gross score
      const rawGrossScore = relevantScores.reduce(
        (sum, s) => sum + (s.strokes || 0),
        0
      );

      // Get course handicap for ESC calculation
      // If playing_handicap wasn't set on round, look up player's current handicap
      // Default to 20 handicap for new players without history
      const DEFAULT_STARTING_HANDICAP = 20;
      let courseHandicap: number;
      if (roundPlayer.playing_handicap !== null) {
        courseHandicap = Math.round(Number(roundPlayer.playing_handicap));
      } else {
        // Look up player's current handicap index
        const latestHandicap = await prisma.handicapHistory.findFirst({
          where: { player_id: roundPlayer.player_id },
          orderBy: { effective_date: 'desc' },
        });
        if (latestHandicap) {
          // Calculate course handicap from handicap index
          const handicapIndex = Number(latestHandicap.handicap_index);
          courseHandicap = calculateCourseHandicap(handicapIndex, slopeRating);
        } else {
          // No handicap history - use default starting handicap
          courseHandicap = calculateCourseHandicap(DEFAULT_STARTING_HANDICAP, slopeRating);
        }
      }

      // Apply Equitable Stroke Control (ESC) to get adjusted gross score
      const holeScoresForESC = relevantScores.map((s) => ({
        strokes: s.strokes || 0,
        par: s.hole.par,
      }));
      const adjustedGrossScore = applyEquitableStrokeControl(holeScoresForESC, courseHandicap);

      // Use adjusted gross for handicap calculation, raw gross for display
      const grossScore = rawGrossScore;

      // Calculate score differential using WHS formula
      let scoreDifferential: number;
      if (isNineHole) {
        // For 9-hole rounds, calculate 18-hole equivalent differential
        scoreDifferential = calculateNineHoleDifferential(
          adjustedGrossScore,
          courseRating,
          slopeRating
        );
      } else {
        scoreDifferential = calculateScoreDifferential(
          adjustedGrossScore,
          courseRating,
          slopeRating
        );
      }

      // For 9-hole rounds, use half the playing handicap
      const adjustedHandicap = isNineHole && roundPlayer.playing_handicap !== null
        ? Number(roundPlayer.playing_handicap) / 2
        : roundPlayer.playing_handicap !== null
          ? Number(roundPlayer.playing_handicap)
          : null;

      const netScore = adjustedHandicap !== null
        ? grossScore - Math.round(adjustedHandicap)
        : null;

      const scoreToPar = grossScore - totalPar;

      // Calculate front/back nine scores
      const frontNineHoles = round.tee_set.holes.filter((h) => h.hole_number <= 9);
      const backNineHoles = round.tee_set.holes.filter((h) => h.hole_number > 9);

      const frontNineScore = roundPlayer.scores
        .filter((s) => s.hole.hole_number <= 9)
        .reduce((sum, s) => sum + (s.strokes || 0), 0);

      const backNineScore = roundPlayer.scores
        .filter((s) => s.hole.hole_number > 9)
        .reduce((sum, s) => sum + (s.strokes || 0), 0);

      const frontNinePar = frontNineHoles.reduce((sum, h) => sum + h.par, 0);
      const backNinePar = backNineHoles.reduce((sum, h) => sum + h.par, 0);

      // Find best and worst holes (only from relevant scores)
      const holesWithDiff = relevantScores.map((s) => ({
        holeNumber: s.hole.hole_number,
        strokes: s.strokes || 0,
        par: s.hole.par,
        diff: (s.strokes || 0) - s.hole.par,
      }));

      const sortedByDiff = [...holesWithDiff].sort((a, b) => a.diff - b.diff);
      const bestHoles = sortedByDiff.slice(0, 3);
      const worstHoles = sortedByDiff.slice(-3).reverse();

      // Calculate stats
      const birdiesOrBetter = holesWithDiff.filter((h) => h.diff <= -1).length;
      const pars = holesWithDiff.filter((h) => h.diff === 0).length;
      const bogeys = holesWithDiff.filter((h) => h.diff === 1).length;
      const doublePlus = holesWithDiff.filter((h) => h.diff >= 2).length;

      // Update round_player with final scores
      await prisma.roundPlayer.update({
        where: { id: roundPlayer.id },
        data: {
          gross_score: grossScore,
          net_score: netScore,
        },
      });

      // Fetch player's existing differentials (last 20 rounds)
      // Only include entries that have a valid differential stored
      const existingHistory = await prisma.handicapHistory.findMany({
        where: {
          player_id: roundPlayer.player_id,
          calculation_details: {
            path: ['source'],
            equals: 'round',
          },
        },
        orderBy: { effective_date: 'desc' },
        take: 19, // We'll add this round to make 20
      });

      // Extract differentials from history
      // IMPORTANT: Only use entries that have an actual differential stored
      // Do NOT fall back to handicap_index - that's a different value!
      const existingDifferentials = existingHistory
        .map((h) => {
          const details = h.calculation_details as { differential?: number } | null;
          return details?.differential;
        })
        .filter((d): d is number => d !== null && d !== undefined);

      // Add current round's differential
      const allDifferentials = [scoreDifferential, ...existingDifferentials].slice(0, 20);

      // Calculate new handicap index using WHS formula
      const newHandicapIndex = calculateHandicapIndex(allDifferentials);

      // Create handicap history entry with the differential
      // Use the round's date_played as the effective date, not the current date
      await prisma.handicapHistory.create({
        data: {
          player_id: roundPlayer.player_id,
          handicap_index: newHandicapIndex ?? scoreDifferential,
          effective_date: round.date_played,
          calculation_details: {
            source: 'round',
            round_id: roundId,
            gross_score: grossScore,
            adjusted_gross_score: adjustedGrossScore,
            course_rating: courseRating,
            slope_rating: slopeRating,
            differential: scoreDifferential,
            is_nine_hole: isNineHole,
            nine_hole_type: nineHoleMode,
            differentials_used: allDifferentials.length,
            handicap_index: newHandicapIndex,
          },
        },
      });

      // Update player's current handicap if they have one calculated
      if (newHandicapIndex !== null) {
        // We could update a current_handicap field on Player if we had one
        // For now, the most recent handicap_history entry is the current handicap
      }

      playerResults.push({
        playerId: roundPlayer.player_id,
        playerName: roundPlayer.player.name,
        grossScore,
        adjustedGrossScore,
        netScore,
        scoreToPar,
        scoreDifferential,
        handicapIndex: newHandicapIndex,
        playingHandicap: roundPlayer.playing_handicap,
        frontNine: {
          score: frontNineScore,
          par: frontNinePar,
          toPar: frontNineScore - frontNinePar,
        },
        backNine: {
          score: backNineScore,
          par: backNinePar,
          toPar: backNineScore - backNinePar,
        },
        stats: {
          birdiesOrBetter,
          pars,
          bogeys,
          doublePlus,
        },
        bestHoles,
        worstHoles,
      });
    }

    // Update round status with notes about 9-hole completion
    const completedRound = await prisma.round.update({
      where: { id: roundId },
      data: {
        status: 'completed',
        completed_at: new Date(),
        notes: isNineHole
          ? `${round.notes ? round.notes + '\n' : ''}[${nineHoleMode === 'front' ? 'Front' : 'Back'} 9 only]`
          : round.notes,
      },
      include: {
        course: true,
        tee_set: true,
      },
    });

    return NextResponse.json({
      success: true,
      round: {
        id: completedRound.id,
        status: completedRound.status,
        completed_at: completedRound.completed_at,
        course: {
          name: completedRound.course.name,
          city: completedRound.course.city,
          state: completedRound.course.state,
        },
        teeSet: {
          name: completedRound.tee_set.name,
          courseRating,
          slopeRating,
        },
        totalPar,
        datePlayed: completedRound.date_played,
        isNineHole,
        nineHoleType: nineHoleMode,
        holesPlayed: isNineHole ? 9 : totalHoles,
      },
      players: playerResults,
    });
  } catch (error) {
    console.error('Error completing round:', error);
    return NextResponse.json(
      { error: 'Failed to complete round' },
      { status: 500 }
    );
  }
}
