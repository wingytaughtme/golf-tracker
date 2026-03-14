import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id: playerId } = await params;
    const body: { club_id: string; display_order: number }[] = await request.json();

    const player = await prisma.player.findFirst({
      where: { id: playerId, user_id: session.user.id },
    });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    await prisma.$transaction(
      body.map(item =>
        prisma.club.update({
          where: { id: item.club_id },
          data: { display_order: item.display_order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering clubs:', error);
    return NextResponse.json({ error: 'Failed to reorder clubs' }, { status: 500 });
  }
}
