import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    // Get user's own player profile
    const ownPlayer = await prisma.player.findFirst({
      where: { user_id: session.user.id },
      include: {
        home_course: {
          select: { id: true, name: true, city: true, state: true },
        },
        handicap_history: {
          orderBy: { effective_date: 'desc' },
          take: 1,
        },
        _count: {
          select: { round_players: true },
        },
      },
    });

    // Get guest players created by this user
    const guestPlayers = await prisma.player.findMany({
      where: {
        user_id: null,
        created_by: session.user.id,
      },
      include: {
        home_course: {
          select: { id: true, name: true, city: true, state: true },
        },
        handicap_history: {
          orderBy: { effective_date: 'desc' },
          take: 1,
        },
        _count: {
          select: { round_players: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatPlayer = (player: typeof ownPlayer) => {
      if (!player) return null;
      return {
        id: player.id,
        name: player.name,
        email: player.email,
        ghin_number: player.ghin_number,
        home_course: player.home_course,
        current_handicap: player.handicap_history[0]?.handicap_index ?? null,
        rounds_played: player._count.round_players,
        is_user: !!player.user_id,
        created_at: player.created_at,
      };
    };

    return NextResponse.json({
      own_player: formatPlayer(ownPlayer),
      guest_players: guestPlayers.map(formatPlayer),
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const { name, email, ghin_number, handicap } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (email) {
      const existingPlayer = await prisma.player.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingPlayer) {
        return NextResponse.json(
          { error: 'A player with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Create guest player with created_by tracking
    const player = await prisma.player.create({
      data: {
        name: name.trim(),
        email: email?.toLowerCase() || null,
        ghin_number: ghin_number || null,
        created_by: session.user.id,
      },
    });

    // If handicap provided, create initial handicap history
    if (handicap !== undefined && handicap !== null) {
      await prisma.handicapHistory.create({
        data: {
          player_id: player.id,
          handicap_index: handicap,
          effective_date: new Date(),
          calculation_details: {
            source: 'manual',
            reason: 'Initial handicap entry',
          },
        },
      });
    }

    return NextResponse.json({
      id: player.id,
      name: player.name,
      email: player.email,
      ghin_number: player.ghin_number,
      current_handicap: handicap ?? null,
      rounds_played: 0,
      is_user: false,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
