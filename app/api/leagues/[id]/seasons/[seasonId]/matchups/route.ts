import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { generateRoundRobin } from '@/lib/calculations/league-standings';

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
      return NextResponse.json({ error: 'Only the commissioner can create matchups' }, { status: 403 });
    }

    const season = await prisma.leagueSeason.findFirst({
      where: { id: seasonId, league_id: id },
      select: { id: true },
    });
    if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 });

    const body = await request.json();
    if (!body.mode) return NextResponse.json({ error: 'Mode is required (round_robin or manual)' }, { status: 400 });

    if (body.mode === 'round_robin') {
      // Get active league players
      const leaguePlayers = await prisma.leaguePlayer.findMany({
        where: { league_id: id, is_active: true },
        select: { id: true },
      });

      if (leaguePlayers.length < 2) {
        return NextResponse.json({ error: 'Need at least 2 players for round robin' }, { status: 400 });
      }

      const playerIds = leaguePlayers.map(p => p.id);
      const schedule = generateRoundRobin(playerIds);

      // Create weeks and matchups in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const createdWeeks = [];
        for (let i = 0; i < schedule.length; i++) {
          const week = await tx.leagueWeek.create({
            data: {
              season_id: seasonId,
              week_number: i + 1,
            },
          });

          const matchups = await Promise.all(
            schedule[i].map(([playerA, playerB]) =>
              tx.leagueMatchup.create({
                data: {
                  week_id: week.id,
                  player_a_id: playerA,
                  player_b_id: playerB,
                  status: playerB === null ? 'bye' : 'scheduled',
                },
              })
            )
          );

          createdWeeks.push({ week, matchups });
        }
        return createdWeeks;
      });

      return NextResponse.json({
        weeks_created: result.length,
        total_matchups: result.reduce((sum, w) => sum + w.matchups.length, 0),
        data: result,
      }, { status: 201 });
    }

    if (body.mode === 'manual') {
      if (!body.week_id) return NextResponse.json({ error: 'week_id is required for manual mode' }, { status: 400 });
      if (!body.manual_matchups || !Array.isArray(body.manual_matchups)) {
        return NextResponse.json({ error: 'manual_matchups array is required' }, { status: 400 });
      }

      const week = await prisma.leagueWeek.findFirst({
        where: { id: body.week_id, season_id: seasonId },
        select: { id: true },
      });
      if (!week) return NextResponse.json({ error: 'Week not found in this season' }, { status: 404 });

      const matchups = await prisma.$transaction(
        body.manual_matchups.map((m: { player_a_id: string; player_b_id?: string }) =>
          prisma.leagueMatchup.create({
            data: {
              week_id: body.week_id,
              player_a_id: m.player_a_id,
              player_b_id: m.player_b_id || null,
              status: m.player_b_id ? 'scheduled' : 'bye',
            },
          })
        )
      );

      return NextResponse.json({ data: matchups }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid mode. Use round_robin or manual' }, { status: 400 });
  } catch (error) {
    console.error('Error creating matchups:', error);
    return NextResponse.json({ error: 'Failed to create matchups' }, { status: 500 });
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
        matchups: {
          include: {
            player_a: { include: { player: { select: { name: true } } } },
            player_b: { include: { player: { select: { name: true } } } },
          },
        },
      },
      orderBy: { week_number: 'asc' },
    });

    return NextResponse.json({ data: weeks });
  } catch (error) {
    console.error('Error fetching matchups:', error);
    return NextResponse.json({ error: 'Failed to fetch matchups' }, { status: 500 });
  }
}
