import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        home_course: {
          select: { id: true, name: true, city: true, state: true },
        },
        handicap_history: {
          orderBy: { effective_date: 'desc' },
          take: 10,
        },
        round_players: {
          include: {
            round: {
              include: {
                course: {
                  select: { id: true, name: true, city: true, state: true },
                },
                tee_set: {
                  select: { name: true, color: true },
                },
              },
            },
          },
          orderBy: {
            round: { date_played: 'desc' },
          },
          take: 5,
        },
        _count: {
          select: { round_players: true },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Calculate basic stats
    const roundsWithScores = player.round_players.filter(rp => rp.gross_score !== null);
    const avgScore = roundsWithScores.length > 0
      ? Math.round(roundsWithScores.reduce((sum, rp) => sum + (rp.gross_score || 0), 0) / roundsWithScores.length)
      : null;

    const bestScore = roundsWithScores.length > 0
      ? Math.min(...roundsWithScores.map(rp => rp.gross_score || Infinity))
      : null;

    return NextResponse.json({
      id: player.id,
      name: player.name,
      email: player.email,
      ghin_number: player.ghin_number,
      home_course: player.home_course,
      current_handicap: player.handicap_history[0]?.handicap_index ?? null,
      handicap_history: player.handicap_history.map(h => ({
        handicap_index: h.handicap_index,
        effective_date: h.effective_date,
      })),
      rounds_played: player._count.round_players,
      is_user: !!player.user_id,
      created_at: player.created_at,
      stats: {
        avg_score: avgScore,
        best_score: bestScore,
      },
      recent_rounds: player.round_players.map(rp => ({
        id: rp.round.id,
        date_played: rp.round.date_played,
        course: rp.round.course,
        tee_set: rp.round.tee_set,
        gross_score: rp.gross_score,
        net_score: rp.net_score,
        status: rp.round.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const { name, email, ghin_number, handicap, home_course_id } = body;

    // Check if player exists
    const existingPlayer = await prisma.player.findUnique({
      where: { id },
      include: {
        handicap_history: {
          orderBy: { effective_date: 'desc' },
          take: 1,
        },
      },
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      );
    }

    // Check if email already exists for another player
    if (email && email !== existingPlayer.email) {
      const emailExists = await prisma.player.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: id },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'A player with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Update player
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        name: name?.trim() ?? existingPlayer.name,
        email: email?.toLowerCase() ?? existingPlayer.email,
        ghin_number: ghin_number ?? existingPlayer.ghin_number,
        home_course_id: home_course_id ?? existingPlayer.home_course_id,
      },
      include: {
        home_course: {
          select: { id: true, name: true, city: true, state: true },
        },
      },
    });

    // Update handicap if changed
    const currentHandicap = existingPlayer.handicap_history[0]?.handicap_index;
    if (handicap !== undefined && handicap !== null &&
        (currentHandicap === undefined || Number(currentHandicap) !== Number(handicap))) {
      await prisma.handicapHistory.create({
        data: {
          player_id: id,
          handicap_index: handicap,
          effective_date: new Date(),
        },
      });
    }

    return NextResponse.json({
      id: updatedPlayer.id,
      name: updatedPlayer.name,
      email: updatedPlayer.email,
      ghin_number: updatedPlayer.ghin_number,
      home_course: updatedPlayer.home_course,
      current_handicap: handicap ?? currentHandicap ?? null,
      is_user: !!updatedPlayer.user_id,
    });
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Cannot delete user's own player profile
    if (player.user_id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own player profile' },
        { status: 403 }
      );
    }

    // Cannot delete any player linked to a user account
    if (player.user_id) {
      return NextResponse.json(
        { error: 'Cannot delete a player linked to a user account' },
        { status: 403 }
      );
    }

    // Delete the player (cascades to handicap_history)
    await prisma.player.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Player deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}
