import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { getDefaultClubs, calculateClubStats } from '@/lib/calculations/club-distances';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id: playerId } = await params;

    // Validate player belongs to user
    const player = await prisma.player.findFirst({
      where: { id: playerId, user_id: session.user.id },
    });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Get or create active bag
    let bag = await prisma.clubBag.findFirst({
      where: { player_id: playerId, is_active: true },
      include: {
        clubs: {
          orderBy: { display_order: 'asc' },
          include: { distances: { orderBy: { recorded_at: 'desc' } } },
        },
      },
    });

    if (!bag) {
      // Auto-create bag with default clubs
      bag = await prisma.clubBag.create({
        data: {
          player_id: playerId,
          name: 'My Bag',
          clubs: {
            create: getDefaultClubs().map(c => ({
              name: c.name,
              club_type: c.club_type,
              display_order: c.display_order,
            })),
          },
        },
        include: {
          clubs: {
            orderBy: { display_order: 'asc' },
            include: { distances: { orderBy: { recorded_at: 'desc' } } },
          },
        },
      });
    }

    // Calculate stats for each club
    const clubsWithStats = bag.clubs.map(club => ({
      id: club.id,
      name: club.name,
      club_type: club.club_type,
      brand: club.brand,
      model: club.model,
      loft: club.loft,
      display_order: club.display_order,
      stats: calculateClubStats(
        club.distances.map(d => ({ distance: d.distance, recorded_at: d.recorded_at }))
      ),
      distance_count: club.distances.length,
    }));

    return NextResponse.json({
      bag: { id: bag.id, name: bag.name },
      clubs: clubsWithStats,
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id: playerId } = await params;
    const body = await request.json();

    const player = await prisma.player.findFirst({
      where: { id: playerId, user_id: session.user.id },
    });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    let bag = await prisma.clubBag.findFirst({
      where: { player_id: playerId, is_active: true },
      include: { clubs: true },
    });

    if (!bag) {
      bag = await prisma.clubBag.create({
        data: { player_id: playerId, name: 'My Bag' },
        include: { clubs: true },
      });
    }

    if (bag.clubs.length >= 14) {
      return NextResponse.json(
        { error: 'Maximum 14 clubs allowed in a bag' },
        { status: 400 }
      );
    }

    const maxOrder = bag.clubs.reduce((max, c) => Math.max(max, c.display_order), -1);

    const club = await prisma.club.create({
      data: {
        bag_id: bag.id,
        name: body.name,
        club_type: body.club_type,
        brand: body.brand || null,
        model: body.model || null,
        loft: body.loft || null,
        display_order: maxOrder + 1,
      },
    });

    return NextResponse.json(club, { status: 201 });
  } catch (error) {
    console.error('Error adding club:', error);
    return NextResponse.json({ error: 'Failed to add club' }, { status: 500 });
  }
}
