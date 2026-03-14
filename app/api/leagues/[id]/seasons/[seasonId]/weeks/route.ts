import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonId: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { id, seasonId } = await params;

    const league = await prisma.league.findUnique({ where: { id }, select: { commissioner_id: true } });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });
    if (league.commissioner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only the commissioner can create weeks' }, { status: 403 });
    }

    const season = await prisma.leagueSeason.findFirst({
      where: { id: seasonId, league_id: id },
      select: { id: true },
    });
    if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 });

    const body = await request.json();
    if (!body.week_number) return NextResponse.json({ error: 'Week number is required' }, { status: 400 });

    const week = await prisma.leagueWeek.create({
      data: {
        season_id: seasonId,
        week_number: body.week_number,
        course_id: body.course_id || null,
        start_date: body.start_date ? new Date(body.start_date) : null,
        end_date: body.end_date ? new Date(body.end_date) : null,
        format: body.format || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(week, { status: 201 });
  } catch (error) {
    console.error('Error creating week:', error);
    return NextResponse.json({ error: 'Failed to create week' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonId: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;
    const { id, seasonId } = await params;

    const season = await prisma.leagueSeason.findFirst({
      where: { id: seasonId, league_id: id },
      select: { id: true },
    });
    if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 });

    const weeks = await prisma.leagueWeek.findMany({
      where: { season_id: seasonId },
      include: {
        course: { select: { id: true, name: true } },
        matchups: { select: { id: true } },
      },
      orderBy: { week_number: 'asc' },
    });

    const data = weeks.map(w => ({
      ...w,
      matchup_count: w.matchups.length,
      matchups: undefined,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching weeks:', error);
    return NextResponse.json({ error: 'Failed to fetch weeks' }, { status: 500 });
  }
}
