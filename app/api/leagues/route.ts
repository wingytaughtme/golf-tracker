import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { generateInviteCode } from '@/lib/calculations/league-standings';

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const userPlayer = await prisma.player.findFirst({ where: { user_id: session.user.id } });
    if (!userPlayer) return NextResponse.json({ error: 'No player profile found' }, { status: 400 });

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.league.findUnique({ where: { invite_code: inviteCode } });
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const league = await prisma.$transaction(async (tx) => {
      const l = await tx.league.create({
        data: {
          name: body.name,
          description: body.description || null,
          commissioner_id: session.user.id,
          default_course_id: body.default_course_id || null,
          invite_code: inviteCode,
          status: 'setup',
          config: body.config || { points: { win: 2, tie: 1, loss: 0, bye: 1 } },
        },
      });

      // Auto-add commissioner as player
      await tx.leaguePlayer.create({
        data: {
          league_id: l.id,
          user_id: session.user.id,
          player_id: userPlayer.id,
          role: 'commissioner',
        },
      });

      // Auto-create first season if provided
      if (body.season_name) {
        await tx.leagueSeason.create({
          data: {
            league_id: l.id,
            name: body.season_name,
            status: 'planning',
          },
        });
      }

      return l;
    });

    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    console.error('Error creating league:', error);
    return NextResponse.json({ error: 'Failed to create league' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const leagues = await prisma.league.findMany({
      where: {
        OR: [
          { commissioner_id: session.user.id },
          { players: { some: { user_id: session.user.id } } },
        ],
        status: { not: 'archived' },
      },
      include: {
        players: { select: { id: true } },
        seasons: { where: { status: 'active' }, take: 1, select: { id: true, name: true } },
        default_course: { select: { name: true } },
        commissioner: { select: { name: true } },
      },
      orderBy: { updated_at: 'desc' },
    });

    const data = leagues.map(l => ({
      id: l.id,
      name: l.name,
      description: l.description,
      status: l.status,
      member_count: l.players.length,
      commissioner_name: l.commissioner.name,
      is_commissioner: l.commissioner_id === session.user.id,
      active_season: l.seasons[0] || null,
      default_course_name: l.default_course?.name || null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 });
  }
}
