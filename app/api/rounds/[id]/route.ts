import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const { id } = await params;

    const round = await prisma.round.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            num_holes: true,
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
                email: true,
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

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this round (either created it or is a player)
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

    // Calculate totals and stats for each player
    const roundPlayersWithStats = round.round_players.map((rp) => {
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
          total_putts: completedScores.reduce((sum, s) => sum + (s.putts || 0), 0),
          fairways_hit: completedScores.filter((s) => s.fairway_hit).length,
          fairways_possible: completedScores.filter((s) => s.hole.par > 3).length,
          greens_in_regulation: completedScores.filter((s) => s.green_in_regulation).length,
        },
      };
    });

    return NextResponse.json({
      ...round,
      round_players: roundPlayersWithStats,
      holes: round.tee_set.holes,
    });
  } catch (error) {
    console.error('Error fetching round:', error);
    return NextResponse.json(
      { error: 'Failed to fetch round' },
      { status: 500 }
    );
  }
}

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

    const { id } = await params;
    const body = await request.json();

    // Find the round
    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    // Verify user created this round
    if (round.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.status && ['in_progress', 'completed', 'abandoned'].includes(body.status)) {
      updateData.status = body.status;
      if (body.status === 'completed' && !round.completed_at) {
        updateData.completed_at = new Date();
      }
    }

    if (body.round_type && ['casual', 'tournament', 'practice'].includes(body.round_type)) {
      updateData.round_type = body.round_type;
    }

    if (body.date_played) {
      updateData.date_played = new Date(body.date_played);
    }

    if (body.weather !== undefined) {
      updateData.weather = body.weather || null;
    }

    if (body.temperature !== undefined) {
      updateData.temperature = body.temperature ? parseInt(body.temperature) : null;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes || null;
    }

    const updatedRound = await prisma.round.update({
      where: { id },
      data: updateData,
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
          select: {
            id: true,
            name: true,
            color: true,
            course_rating: true,
            slope_rating: true,
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
          },
        },
      },
    });

    return NextResponse.json(updatedRound);
  } catch (error) {
    console.error('Error updating round:', error);
    return NextResponse.json(
      { error: 'Failed to update round' },
      { status: 500 }
    );
  }
}

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

    const { id } = await params;
    const body = await request.json();

    // Find the round
    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    // Verify user created this round
    if (round.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update allowed fields
    const updateData: Record<string, unknown> = {};

    if (body.status && ['in_progress', 'completed', 'abandoned'].includes(body.status)) {
      updateData.status = body.status;
      if (body.status === 'completed') {
        updateData.completed_at = new Date();
      }
    }

    if (body.weather !== undefined) {
      updateData.weather = body.weather;
    }

    if (body.temperature !== undefined) {
      updateData.temperature = body.temperature ? parseInt(body.temperature) : null;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    const updatedRound = await prisma.round.update({
      where: { id },
      data: updateData,
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
          select: {
            id: true,
            name: true,
            color: true,
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
          },
        },
      },
    });

    return NextResponse.json(updatedRound);
  } catch (error) {
    console.error('Error updating round:', error);
    return NextResponse.json(
      { error: 'Failed to update round' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;

    // Find the round
    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    // Verify user created this round
    if (round.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete the round (cascade will delete round_players and scores)
    await prisma.round.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting round:', error);
    return NextResponse.json(
      { error: 'Failed to delete round' },
      { status: 500 }
    );
  }
}
