import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchupId: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { id, matchupId } = await params;

    const league = await prisma.league.findUnique({ where: { id }, select: { commissioner_id: true } });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });
    if (league.commissioner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only the commissioner can update matchups' }, { status: 403 });
    }

    const matchup = await prisma.leagueMatchup.findUnique({
      where: { id: matchupId },
      include: { week: { select: { season: { select: { league_id: true } } } } },
    });
    if (!matchup) return NextResponse.json({ error: 'Matchup not found' }, { status: 404 });
    if (matchup.week.season.league_id !== id) {
      return NextResponse.json({ error: 'Matchup does not belong to this league' }, { status: 404 });
    }

    const body = await request.json();

    const updated = await prisma.leagueMatchup.update({
      where: { id: matchupId },
      data: {
        status: body.status || undefined,
        result: body.result !== undefined ? body.result : undefined,
        completed_at: body.status === 'completed' ? new Date() : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating matchup:', error);
    return NextResponse.json({ error: 'Failed to update matchup' }, { status: 500 });
  }
}
