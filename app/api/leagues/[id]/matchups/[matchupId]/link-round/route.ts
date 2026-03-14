import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchupId: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;
    const { id, matchupId } = await params;

    const league = await prisma.league.findUnique({ where: { id }, select: { id: true } });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });

    const matchup = await prisma.leagueMatchup.findUnique({
      where: { id: matchupId },
      include: { week: { select: { season: { select: { league_id: true } } } } },
    });
    if (!matchup) return NextResponse.json({ error: 'Matchup not found' }, { status: 404 });
    if (matchup.week.season.league_id !== id) {
      return NextResponse.json({ error: 'Matchup does not belong to this league' }, { status: 404 });
    }

    const body = await request.json();
    if (!body.round_id) return NextResponse.json({ error: 'round_id is required' }, { status: 400 });
    if (!body.player_position || !['a', 'b'].includes(body.player_position)) {
      return NextResponse.json({ error: 'player_position must be "a" or "b"' }, { status: 400 });
    }

    // Verify the round exists
    const round = await prisma.round.findUnique({ where: { id: body.round_id }, select: { id: true } });
    if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 });

    const updateData = body.player_position === 'a'
      ? { round_a_id: body.round_id }
      : { round_b_id: body.round_id };

    const updated = await prisma.leagueMatchup.update({
      where: { id: matchupId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error linking round to matchup:', error);
    return NextResponse.json({ error: 'Failed to link round to matchup' }, { status: 500 });
  }
}
