import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ScoreUpdate {
  scoreId: string;
  strokes?: number | null;
  putts?: number | null;
  fairway_hit?: boolean | null;
  green_in_regulation?: boolean | null;
}

// PUT - Full batch update with all score fields
export async function PUT(
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

    // Find the round
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        round_players: {
          include: {
            scores: true,
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

    // Verify user has access (created the round or is a participant)
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
        { error: 'Cannot update scores for a round that is not in progress' },
        { status: 400 }
      );
    }

    // Get all valid score IDs for this round
    const validScoreIds = new Set(
      round.round_players.flatMap((rp) => rp.scores.map((s) => s.id))
    );

    // Validate all score IDs belong to this round
    const scores = body.scores as ScoreUpdate[];
    for (const scoreUpdate of scores) {
      if (!validScoreIds.has(scoreUpdate.scoreId)) {
        return NextResponse.json(
          { error: `Score ${scoreUpdate.scoreId} does not belong to this round` },
          { status: 400 }
        );
      }
    }

    // Update scores in a transaction with all fields
    await prisma.$transaction(
      scores.map((scoreUpdate) => {
        const updateData: Record<string, unknown> = {};

        if (scoreUpdate.strokes !== undefined) {
          updateData.strokes = scoreUpdate.strokes;
        }
        if (scoreUpdate.putts !== undefined) {
          updateData.putts = scoreUpdate.putts;
        }
        if (scoreUpdate.fairway_hit !== undefined) {
          updateData.fairway_hit = scoreUpdate.fairway_hit;
        }
        if (scoreUpdate.green_in_regulation !== undefined) {
          updateData.green_in_regulation = scoreUpdate.green_in_regulation;
        }

        return prisma.score.update({
          where: { id: scoreUpdate.scoreId },
          data: updateData,
        });
      })
    );

    // Fetch updated scores only (lightweight response for auto-save)
    const updatedScores = await prisma.score.findMany({
      where: {
        id: { in: scores.map((s) => s.scoreId) },
      },
      select: {
        id: true,
        strokes: true,
        putts: true,
        fairway_hit: true,
        green_in_regulation: true,
        hole: {
          select: {
            hole_number: true,
            par: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      updated_count: scores.length,
      scores: updatedScores,
      saved_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating scores:', error);
    return NextResponse.json(
      { error: 'Failed to update scores' },
      { status: 500 }
    );
  }
}

// PATCH - Simple strokes-only update (legacy support)
export async function PATCH(
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
        { error: 'Invalid request body. Expected { scores: Array<{ scoreId: string, strokes: number | null }> }' },
        { status: 400 }
      );
    }

    // Find the round
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        round_players: {
          include: {
            scores: true,
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

    // Verify user has access (created the round or is a participant)
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
        { error: 'Cannot update scores for a round that is not in progress' },
        { status: 400 }
      );
    }

    // Get all valid score IDs for this round
    const validScoreIds = new Set(
      round.round_players.flatMap((rp) => rp.scores.map((s) => s.id))
    );

    // Validate all score IDs belong to this round
    for (const scoreUpdate of body.scores) {
      if (!validScoreIds.has(scoreUpdate.scoreId)) {
        return NextResponse.json(
          { error: `Score ${scoreUpdate.scoreId} does not belong to this round` },
          { status: 400 }
        );
      }
    }

    // Update scores in a transaction
    await prisma.$transaction(
      body.scores.map((scoreUpdate: { scoreId: string; strokes: number | null }) =>
        prisma.score.update({
          where: { id: scoreUpdate.scoreId },
          data: { strokes: scoreUpdate.strokes },
        })
      )
    );

    // Fetch updated round data
    const updatedRound = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        tee_set: {
          include: {
            holes: {
              orderBy: { hole_number: 'asc' },
            },
          },
        },
        round_players: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
              },
            },
            scores: {
              include: {
                hole: {
                  select: {
                    id: true,
                    hole_number: true,
                    par: true,
                    distance: true,
                    handicap_index: true,
                  },
                },
              },
              orderBy: {
                hole: {
                  hole_number: 'asc',
                },
              },
            },
          },
        },
      },
    });

    // Calculate stats for each player
    const roundPlayersWithStats = updatedRound?.round_players.map((rp) => {
      const completedScores = rp.scores.filter((s) => s.strokes !== null);
      const totalStrokes = completedScores.reduce((sum, s) => sum + (s.strokes || 0), 0);
      const totalPar = completedScores.reduce((sum, s) => sum + s.hole.par, 0);
      const holesCompleted = completedScores.length;

      return {
        ...rp,
        stats: {
          holes_completed: holesCompleted,
          total_strokes: totalStrokes,
          total_par: totalPar,
          score_to_par: holesCompleted > 0 ? totalStrokes - totalPar : null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      updated_count: body.scores.length,
      round: updatedRound ? {
        ...updatedRound,
        round_players: roundPlayersWithStats,
        holes: updatedRound.tee_set.holes,
      } : null,
    });
  } catch (error) {
    console.error('Error updating scores:', error);
    return NextResponse.json(
      { error: 'Failed to update scores' },
      { status: 500 }
    );
  }
}
