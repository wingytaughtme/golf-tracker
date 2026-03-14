import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;
    const { code } = await params;

    const league = await prisma.league.findUnique({
      where: { invite_code: code.toUpperCase() },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        commissioner: { select: { name: true } },
        players: { where: { is_active: true }, select: { id: true } },
      },
    });

    if (!league) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    if (league.status === 'archived') {
      return NextResponse.json({ error: 'This league is no longer active' }, { status: 410 });
    }

    return NextResponse.json({
      id: league.id,
      name: league.name,
      description: league.description,
      status: league.status,
      commissioner_name: league.commissioner.name,
      member_count: league.players.length,
    });
  } catch (error) {
    console.error('Error fetching league by invite code:', error);
    return NextResponse.json({ error: 'Failed to fetch league' }, { status: 500 });
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { code } = await params;

    const league = await prisma.league.findUnique({
      where: { invite_code: code.toUpperCase() },
      select: { id: true, status: true },
    });

    if (!league) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    if (league.status === 'archived') {
      return NextResponse.json({ error: 'This league is no longer active' }, { status: 410 });
    }

    // Check if already a member
    const existing = await prisma.leaguePlayer.findUnique({
      where: { league_id_user_id: { league_id: league.id, user_id: session.user.id } },
    });
    if (existing) {
      if (existing.is_active) {
        return NextResponse.json({ error: 'You are already a member of this league' }, { status: 409 });
      }
      // Reactivate if previously removed
      await prisma.leaguePlayer.update({
        where: { id: existing.id },
        data: { is_active: true },
      });
      return NextResponse.json({ message: 'Rejoined league successfully', league_id: league.id });
    }

    // Find the user's player profile
    const player = await prisma.player.findFirst({ where: { user_id: session.user.id } });
    if (!player) {
      return NextResponse.json({ error: 'No player profile found. Create a player profile first.' }, { status: 400 });
    }

    const leaguePlayer = await prisma.leaguePlayer.create({
      data: {
        league_id: league.id,
        user_id: session.user.id,
        player_id: player.id,
        role: 'player',
      },
    });

    return NextResponse.json({
      message: 'Joined league successfully',
      league_id: league.id,
      league_player_id: leaguePlayer.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Error joining league:', error);
    return NextResponse.json({ error: 'Failed to join league' }, { status: 500 });
  }
}
