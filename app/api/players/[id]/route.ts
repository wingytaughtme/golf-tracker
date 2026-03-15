import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireOwnership } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

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
                round_nines: {
                  select: { id: true },
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

    // Calculate basic stats — normalize 9-hole scores to 18-hole equivalent
    const roundsWithScores = player.round_players.filter(rp => rp.gross_score !== null);
    const normalizedScores = roundsWithScores.map(rp => {
      const isNineHole = rp.round.round_nines.length === 1;
      const raw = rp.gross_score as number;
      return isNineHole ? raw * 2 : raw;
    });

    const avgScore = normalizedScores.length > 0
      ? Math.round(normalizedScores.reduce((sum, s) => sum + s, 0) / normalizedScores.length)
      : null;

    const bestScore = normalizedScores.length > 0
      ? Math.min(...normalizedScores)
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
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

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

    // Ownership check: user-linked players check user_id, guest players check created_by
    const ownerId = existingPlayer.user_id ?? existingPlayer.created_by;
    const { error: ownerError } = requireOwnership(ownerId, session);
    if (ownerError) return ownerError;

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
          calculation_details: {
            source: 'manual',
            reason: 'Manual handicap update',
            previous_handicap: currentHandicap ? Number(currentHandicap) : null,
          },
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
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

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

    // Cannot delete your own linked player profile
    if (player.user_id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own player profile' },
        { status: 403 }
      );
    }

    // For user-linked players, only admin can delete
    if (player.user_id) {
      if (session.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Cannot delete a player linked to a user account' },
          { status: 403 }
        );
      }
    } else {
      // Guest player: only the creator or admin can delete
      const { error: ownerError } = requireOwnership(player.created_by, session);
      if (ownerError) return ownerError;
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
