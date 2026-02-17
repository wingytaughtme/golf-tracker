import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import {
  calculateScoreDifferential,
  calculateNineHoleDifferential,
  applyEquitableStrokeControl,
  calculateHandicapIndex,
  calculateCourseHandicap,
} from '@/lib/calculations/handicap';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

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
        tee_set: true,
        round_nines: {
          orderBy: { play_order: 'asc' },
          include: {
            nine: {
              include: {
                holes: {
                  orderBy: { hole_number: 'asc' },
                },
              },
            },
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

    // Extract holes from round_nines in play order
    const allHoles = round.round_nines.flatMap((rn) => rn.nine.holes);
    const allHoleIds = new Set(allHoles.map((h) => h.id));

    // Validate scores are entered for the selected holes
    const totalHoles = allHoles.length;
    const requiredHoles = isNineHole ? 9 : totalHoles;

    // Get holes by nine position (first nine vs second nine)
    const firstNineHoles = round.round_nines[0]?.nine.holes || [];
    const secondNineHoles = round.round_nines[1]?.nine.holes || [];
    const firstNineHoleIds = new Set(firstNineHoles.map((h) => h.id));
    const secondNineHoleIds = new Set(secondNineHoles.map((h) => h.id));

    // Determine which holes to validate based on mode
    const getRelevantHoles = (holeId: string) => {
      if (!isNineHole) return allHoleIds.has(holeId);
      if (nineHoleMode === 'front') return firstNineHoleIds.has(holeId);
      return secondNineHoleIds.has(holeId);
    };

    for (const roundPlayer of round.round_players) {
      const completedScores = roundPlayer.scores.filter(
        (s) => s.strokes !== null && getRelevantHoles(s.hole.id)
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
    const relevantHoles = allHoles.filter((h) => getRelevantHoles(h.id));
    const totalPar = relevantHoles.reduce((sum, h) => sum + h.par, 0);

    const playerResults = [];

    for (const roundPlayer of round.round_players) {
      // Only count scores from relevant holes
      const relevantScores = roundPlayer.scores.filter(
        (s) => getRelevantHoles(s.hole.id)
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

      // Calculate first/second nine scores (based on round_nines play order)
      const firstNineScore = roundPlayer.scores
        .filter((s) => firstNineHoleIds.has(s.hole.id))
        .reduce((sum, s) => sum + (s.strokes || 0), 0);

      const secondNineScore = roundPlayer.scores
        .filter((s) => secondNineHoleIds.has(s.hole.id))
        .reduce((sum, s) => sum + (s.strokes || 0), 0);

      const firstNinePar = firstNineHoles.reduce((sum, h) => sum + h.par, 0);
      const secondNinePar = secondNineHoles.reduce((sum, h) => sum + h.par, 0);

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
      // IMPORTANT: Only store an actual handicap_index if we have enough rounds to calculate one (3+)
      // This prevents raw differentials from being displayed as handicap indices
      await prisma.handicapHistory.create({
        data: {
          player_id: roundPlayer.player_id,
          // Store 0 if no handicap calculated yet - the calculation_details.handicap_index has the real value
          // We use 0 instead of null because handicap_index is required in the schema
          handicap_index: newHandicapIndex ?? 0,
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
            // This is the REAL handicap index (null if < 3 rounds)
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
          score: firstNineScore,
          par: firstNinePar,
          toPar: firstNineScore - firstNinePar,
          name: round.round_nines[0]?.nine.name || 'Front',
        },
        backNine: {
          score: secondNineScore,
          par: secondNinePar,
          toPar: secondNineScore - secondNinePar,
          name: round.round_nines[1]?.nine.name || 'Back',
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
