import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ScoreUpdate {
  scoreId: string;
  strokes: number | null;
  putts?: number | null;
}

// Calculate handicap differential
function calculateHandicapDifferential(
  grossScore: number,
  courseRating: number,
  slopeRating: number,
  isNineHole: boolean = false
): number {
  const adjustedCourseRating = isNineHole ? courseRating / 2 : courseRating;
  const differential = ((grossScore - adjustedCourseRating) * 113) / slopeRating;
  return Math.round(differential * 10) / 10;
}

// POST - Edit scores on a completed round (with audit logging)
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
    const body = await request.json();

    // Validate request body
    if (!body.scores || !Array.isArray(body.scores)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { scores: Array<ScoreUpdate> }' },
        { status: 400 }
      );
    }

    // Find the round with all related data
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
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

    // Verify user has access (must be the creator)
    if (round.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the round creator can edit scores' },
        { status: 403 }
      );
    }

    // Only allow editing completed rounds (in_progress rounds use the normal flow)
    if (round.status !== 'completed') {
      return NextResponse.json(
        { error: 'This endpoint is for editing completed rounds. Use the normal score update for in-progress rounds.' },
        { status: 400 }
      );
    }

    // Get all valid score IDs for this round
    const scoreMap = new Map<string, {
      roundPlayerId: string;
      playerName: string;
      holeNumber: number;
      currentStrokes: number | null;
      currentPutts: number | null;
    }>();

    for (const rp of round.round_players) {
      for (const score of rp.scores) {
        scoreMap.set(score.id, {
          roundPlayerId: rp.id,
          playerName: rp.player.name,
          holeNumber: score.hole.hole_number,
          currentStrokes: score.strokes,
          currentPutts: score.putts,
        });
      }
    }

    // Validate all score IDs belong to this round
    const scores = body.scores as ScoreUpdate[];
    for (const scoreUpdate of scores) {
      if (!scoreMap.has(scoreUpdate.scoreId)) {
        return NextResponse.json(
          { error: `Score ${scoreUpdate.scoreId} does not belong to this round` },
          { status: 400 }
        );
      }
    }

    // Create audit logs and update scores in a transaction
    const auditLogs: Array<{
      score_id: string;
      round_id: string;
      edited_by: string;
      hole_number: number;
      player_name: string;
      old_strokes: number | null;
      new_strokes: number | null;
      old_putts: number | null;
      new_putts: number | null;
      reason: string | null;
    }> = [];

    for (const scoreUpdate of scores) {
      const scoreInfo = scoreMap.get(scoreUpdate.scoreId)!;

      // Only log if there's an actual change
      const strokesChanged = scoreUpdate.strokes !== scoreInfo.currentStrokes;
      const puttsChanged = scoreUpdate.putts !== undefined && scoreUpdate.putts !== scoreInfo.currentPutts;

      if (strokesChanged || puttsChanged) {
        auditLogs.push({
          score_id: scoreUpdate.scoreId,
          round_id: roundId,
          edited_by: session.user.id,
          hole_number: scoreInfo.holeNumber,
          player_name: scoreInfo.playerName,
          old_strokes: scoreInfo.currentStrokes,
          new_strokes: scoreUpdate.strokes,
          old_putts: scoreInfo.currentPutts,
          new_putts: scoreUpdate.putts ?? scoreInfo.currentPutts,
          reason: body.reason || null,
        });
      }
    }

    // Skip if no actual changes
    if (auditLogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes detected',
        changes_count: 0,
      });
    }

    // Execute updates in transaction
    await prisma.$transaction(async (tx) => {
      // Create audit log entries
      await tx.scoreEdit.createMany({
        data: auditLogs,
      });

      // Update scores
      for (const scoreUpdate of scores) {
        const updateData: Record<string, unknown> = {};
        if (scoreUpdate.strokes !== undefined) {
          updateData.strokes = scoreUpdate.strokes;
        }
        if (scoreUpdate.putts !== undefined) {
          updateData.putts = scoreUpdate.putts;
        }

        if (Object.keys(updateData).length > 0) {
          await tx.score.update({
            where: { id: scoreUpdate.scoreId },
            data: updateData,
          });
        }
      }

      // Recalculate gross scores for affected players
      const affectedPlayerIds = Array.from(new Set(
        scores.map(s => scoreMap.get(s.scoreId)!.roundPlayerId)
      ));

      const courseRating = Number(round.tee_set.course_rating);
      const slopeRating = round.tee_set.slope_rating;
      const totalPar = round.tee_set.holes.reduce((sum, h) => sum + h.par, 0);

      for (const roundPlayerId of affectedPlayerIds) {
        // Get updated scores for this player
        const playerScores = await tx.score.findMany({
          where: { round_player_id: roundPlayerId },
          include: { hole: true },
        });

        const grossScore = playerScores.reduce(
          (sum, s) => sum + (s.strokes || 0),
          0
        );

        // Get player's handicap
        const roundPlayer = round.round_players.find(rp => rp.id === roundPlayerId);
        const netScore = roundPlayer?.playing_handicap !== null
          ? grossScore - Math.round(Number(roundPlayer?.playing_handicap || 0))
          : null;

        // Update round_player
        await tx.roundPlayer.update({
          where: { id: roundPlayerId },
          data: {
            gross_score: grossScore,
            net_score: netScore,
          },
        });

        // Update handicap history entry for this round
        const handicapDifferential = calculateHandicapDifferential(
          grossScore,
          courseRating,
          slopeRating
        );

        await tx.handicapHistory.updateMany({
          where: {
            player_id: roundPlayer?.player_id,
            calculation_details: {
              path: ['round_id'],
              equals: roundId,
            },
          },
          data: {
            handicap_index: handicapDifferential,
            calculation_details: {
              source: 'round',
              round_id: roundId,
              gross_score: grossScore,
              course_rating: courseRating,
              slope_rating: slopeRating,
              edited: true,
              edited_at: new Date().toISOString(),
            },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${auditLogs.length} score(s)`,
      changes_count: auditLogs.length,
      audit_entries: auditLogs.map(log => ({
        player: log.player_name,
        hole: log.hole_number,
        old_strokes: log.old_strokes,
        new_strokes: log.new_strokes,
      })),
    });
  } catch (error) {
    console.error('Error editing scores:', error);
    return NextResponse.json(
      { error: 'Failed to edit scores' },
      { status: 500 }
    );
  }
}

// GET - Get edit history for a round
export async function GET(
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

    // Find the round
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        round_players: {
          include: {
            player: true,
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

    // Get edit history
    const editHistory = await prisma.scoreEdit.findMany({
      where: { round_id: roundId },
      include: {
        editor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { edited_at: 'desc' },
    });

    return NextResponse.json({
      round_id: roundId,
      edit_count: editHistory.length,
      edits: editHistory.map(edit => ({
        id: edit.id,
        edited_at: edit.edited_at,
        edited_by: edit.editor.name || edit.editor.email,
        player_name: edit.player_name,
        hole_number: edit.hole_number,
        old_strokes: edit.old_strokes,
        new_strokes: edit.new_strokes,
        old_putts: edit.old_putts,
        new_putts: edit.new_putts,
        reason: edit.reason,
      })),
    });
  } catch (error) {
    console.error('Error fetching edit history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch edit history' },
      { status: 500 }
    );
  }
}
