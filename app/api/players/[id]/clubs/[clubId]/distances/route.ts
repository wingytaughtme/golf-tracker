import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(
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

    const distances = await prisma.clubDistance.findMany({
      where: { club_id: clubId, club: { bag: { player_id: playerId } } },
      orderBy: { recorded_at: 'desc' },
    });

    return NextResponse.json({ data: distances });
  } catch (error) {
    console.error('Error fetching distances:', error);
    return NextResponse.json({ error: 'Failed to fetch distances' }, { status: 500 });
  }
}

export async function POST(
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

    const distance = await prisma.clubDistance.create({
      data: {
        club_id: clubId,
        distance: body.distance,
        source: body.source || 'manual',
        notes: body.notes || null,
      },
    });

    return NextResponse.json(distance, { status: 201 });
  } catch (error) {
    console.error('Error adding distance:', error);
    return NextResponse.json({ error: 'Failed to add distance' }, { status: 500 });
  }
}
