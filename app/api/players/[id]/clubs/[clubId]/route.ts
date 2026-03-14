import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clubId: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id: playerId, clubId } = await params;
    const body = await request.json();

    const player = await prisma.player.findFirst({
      where: { id: playerId, user_id: session.user.id },
    });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const club = await prisma.club.findFirst({
      where: { id: clubId, bag: { player_id: playerId } },
    });
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const updated = await prisma.club.update({
      where: { id: clubId },
      data: {
        name: body.name ?? club.name,
        brand: body.brand !== undefined ? body.brand : club.brand,
        model: body.model !== undefined ? body.model : club.model,
        loft: body.loft !== undefined ? body.loft : club.loft,
        display_order: body.display_order ?? club.display_order,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating club:', error);
    return NextResponse.json({ error: 'Failed to update club' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; clubId: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id: playerId, clubId } = await params;

    const player = await prisma.player.findFirst({
      where: { id: playerId, user_id: session.user.id },
    });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const club = await prisma.club.findFirst({
      where: { id: clubId, bag: { player_id: playerId } },
    });
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    await prisma.club.delete({ where: { id: clubId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting club:', error);
    return NextResponse.json({ error: 'Failed to delete club' }, { status: 500 });
  }
}
