import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { id } = await params;

    const league = await prisma.league.findUnique({ where: { id }, select: { commissioner_id: true } });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });
    if (league.commissioner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only the commissioner can add players' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.user_id || !body.player_id) {
      return NextResponse.json({ error: 'user_id and player_id are required' }, { status: 400 });
    }

    // Check if already a member
    const existing = await prisma.leaguePlayer.findUnique({
      where: { league_id_user_id: { league_id: id, user_id: body.user_id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Player is already a member of this league' }, { status: 409 });
    }

    const leaguePlayer = await prisma.leaguePlayer.create({
      data: {
        league_id: id,
        user_id: body.user_id,
        player_id: body.player_id,
        role: 'player',
      },
      include: {
        player: { select: { id: true, name: true } },
        user: { select: { name: true } },
      },
    });

    return NextResponse.json(leaguePlayer, { status: 201 });
  } catch (error) {
    console.error('Error adding player to league:', error);
    return NextResponse.json({ error: 'Failed to add player' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;
    const { id } = await params;

    const league = await prisma.league.findUnique({ where: { id }, select: { id: true } });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });

    const players = await prisma.leaguePlayer.findMany({
      where: { league_id: id },
      include: {
        player: { select: { id: true, name: true } },
        user: { select: { name: true } },
      },
      orderBy: { joined_at: 'asc' },
    });

    return NextResponse.json({ data: players });
  } catch (error) {
    console.error('Error fetching league players:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}
