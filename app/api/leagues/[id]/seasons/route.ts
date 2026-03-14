import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { id } = await params;

    const league = await prisma.league.findUnique({ where: { id }, select: { commissioner_id: true } });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });
    if (league.commissioner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only the commissioner can create seasons' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const season = await prisma.leagueSeason.create({
      data: {
        league_id: id,
        name: body.name,
        start_date: body.start_date ? new Date(body.start_date) : null,
        end_date: body.end_date ? new Date(body.end_date) : null,
        config: body.config || null,
        status: 'planning',
      },
    });

    return NextResponse.json(season, { status: 201 });
  } catch (error) {
    console.error('Error creating season:', error);
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;
    const { id } = await params;

    const league = await prisma.league.findUnique({ where: { id }, select: { id: true } });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });

    const seasons = await prisma.leagueSeason.findMany({
      where: { league_id: id },
      include: {
        weeks: { select: { id: true } },
        standings: { select: { id: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = seasons.map(s => ({
      ...s,
      week_count: s.weeks.length,
      player_count: s.standings.length,
      weeks: undefined,
      standings: undefined,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 });
  }
}
