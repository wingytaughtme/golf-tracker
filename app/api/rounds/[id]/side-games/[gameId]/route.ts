import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; gameId: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { id: roundId, gameId } = await params;

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      select: { status: true, created_by: true },
    });

    if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    if (round.status !== 'in_progress') {
      return NextResponse.json({ error: 'Cannot remove side game from completed round' }, { status: 400 });
    }

    await prisma.sideGame.delete({ where: { id: gameId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting side game:', error);
    return NextResponse.json({ error: 'Failed to delete side game' }, { status: 500 });
  }
}
