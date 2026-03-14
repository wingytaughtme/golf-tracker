import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { id, playerId } = await params;

    const league = await prisma.league.findUnique({ where: { id }, select: { commissioner_id: true } });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });
    if (league.commissioner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only the commissioner can remove players' }, { status: 403 });
    }

    const leaguePlayer = await prisma.leaguePlayer.findUnique({
      where: { id: playerId },
      select: { id: true, league_id: true, user_id: true },
    });
    if (!leaguePlayer) return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    if (leaguePlayer.league_id !== id) {
      return NextResponse.json({ error: 'Player does not belong to this league' }, { status: 404 });
    }

    // Can't remove yourself (commissioner)
    if (leaguePlayer.user_id === session.user.id) {
      return NextResponse.json({ error: 'Commissioner cannot remove themselves from the league' }, { status: 400 });
    }

    // Soft-delete: deactivate rather than hard-delete to preserve matchup history
    await prisma.leaguePlayer.update({
      where: { id: playerId },
      data: { is_active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing player from league:', error);
    return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 });
  }
}
