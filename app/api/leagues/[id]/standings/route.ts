import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;
    const { id } = await params;

    const league = await prisma.league.findUnique({
      where: { id },
      select: { id: true, config: true },
    });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });

    // Find the active season
    const activeSeason = await prisma.leagueSeason.findFirst({
      where: { league_id: id, status: 'active' },
      select: { id: true, name: true },
    });
    if (!activeSeason) {
      return NextResponse.json({ error: 'No active season found' }, { status: 404 });
    }

    const standings = await prisma.leagueStanding.findMany({
      where: { season_id: activeSeason.id },
      include: {
        league_player: {
          include: {
            player: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ points: 'desc' }, { scoring_avg: 'asc' }],
    });

    const data = standings.map((s, index) => ({
      rank: index + 1,
      league_player_id: s.league_player_id,
      player_name: s.league_player.player.name,
      player_id: s.league_player.player.id,
      wins: s.wins,
      losses: s.losses,
      ties: s.ties,
      points: s.points,
      scoring_avg: s.scoring_avg,
      rounds_played: s.rounds_played,
    }));

    return NextResponse.json({
      season: activeSeason,
      data,
    });
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json({ error: 'Failed to fetch standings' }, { status: 500 });
  }
}
