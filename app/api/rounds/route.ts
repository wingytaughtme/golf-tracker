import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface RoundPlayerInput {
  player_id: string;
  playing_handicap?: number | null;
}

interface CreateRoundInput {
  course_id: string;
  tee_set_id: string;
  date_played: string;
  round_type: 'casual' | 'tournament' | 'practice';
  weather?: string | null;
  temperature?: number | null;
  notes?: string | null;
  players: RoundPlayerInput[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateRoundInput = await request.json();

    // Validate required fields
    if (!body.course_id || !body.tee_set_id || !body.date_played) {
      return NextResponse.json(
        { error: 'Missing required fields: course_id, tee_set_id, date_played' },
        { status: 400 }
      );
    }

    if (!body.players || body.players.length === 0) {
      return NextResponse.json(
        { error: 'At least one player is required' },
        { status: 400 }
      );
    }

    if (body.players.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 players allowed per round' },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: body.course_id },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify tee set exists and belongs to course
    const teeSet = await prisma.teeSet.findFirst({
      where: {
        id: body.tee_set_id,
        course_id: body.course_id,
      },
      include: {
        holes: {
          orderBy: { hole_number: 'asc' },
        },
      },
    });

    if (!teeSet) {
      return NextResponse.json(
        { error: 'Tee set not found or does not belong to this course' },
        { status: 404 }
      );
    }

    // Verify all players exist
    const playerIds = body.players.map((p) => p.player_id);
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
    });

    if (players.length !== playerIds.length) {
      return NextResponse.json(
        { error: 'One or more players not found' },
        { status: 404 }
      );
    }

    // Create the round with players and empty scores in a transaction
    const round = await prisma.$transaction(async (tx) => {
      // Create the round
      const newRound = await tx.round.create({
        data: {
          course_id: body.course_id,
          tee_set_id: body.tee_set_id,
          created_by: session.user.id,
          date_played: new Date(body.date_played),
          status: 'in_progress',
          round_type: body.round_type || 'casual',
          weather: body.weather || null,
          temperature: body.temperature || null,
          notes: body.notes || null,
          started_at: new Date(),
        },
      });

      // Create round players with their scores
      for (const playerInput of body.players) {
        const roundPlayer = await tx.roundPlayer.create({
          data: {
            round_id: newRound.id,
            player_id: playerInput.player_id,
            playing_handicap: playerInput.playing_handicap ?? null,
          },
        });

        // Create empty scores for all holes
        await tx.score.createMany({
          data: teeSet.holes.map((hole) => ({
            round_player_id: roundPlayer.id,
            hole_id: hole.id,
            strokes: null,
            putts: null,
            fairway_hit: null,
            green_in_regulation: null,
            penalties: 0,
            sand_shots: 0,
          })),
        });
      }

      return newRound;
    });

    // Fetch the created round with relations
    const createdRound = await prisma.round.findUnique({
      where: { id: round.id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        tee_set: {
          select: {
            id: true,
            name: true,
            color: true,
            course_rating: true,
            slope_rating: true,
          },
        },
        round_players: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(createdRound, { status: 201 });
  } catch (error) {
    console.error('Error creating round:', error);
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const courseId = searchParams.get('course_id');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'date';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's player ID
    const userPlayer = await prisma.player.findFirst({
      where: { user_id: session.user.id },
    });

    if (!userPlayer) {
      return NextResponse.json({ data: [], pagination: { total: 0, limit, offset, hasMore: false } });
    }

    // Build where clause - rounds where user is a participant or creator
    const where: Prisma.RoundWhereInput = {
      OR: [
        { round_players: { some: { player_id: userPlayer.id } } },
        { created_by: session.user.id },
      ],
    };

    // Status filter
    if (status && ['in_progress', 'completed', 'abandoned'].includes(status)) {
      where.status = status as 'in_progress' | 'completed' | 'abandoned';
    }

    // Date range filter
    if (startDate || endDate) {
      where.date_played = {};
      if (startDate) {
        (where.date_played as Prisma.DateTimeFilter).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date_played as Prisma.DateTimeFilter).lte = new Date(endDate);
      }
    }

    // Course filter
    if (courseId) {
      where.course_id = courseId;
    }

    // Course name search
    if (search) {
      where.course = {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    // Build orderBy clause
    let orderBy: Prisma.RoundOrderByWithRelationInput[] = [];
    if (sortBy === 'date') {
      orderBy = [{ date_played: sortOrder as 'asc' | 'desc' }];
    } else if (sortBy === 'course') {
      orderBy = [{ course: { name: sortOrder as 'asc' | 'desc' } }];
    } else {
      orderBy = [{ date_played: 'desc' }];
    }

    const total = await prisma.round.count({ where });

    const rounds = await prisma.round.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        tee_set: {
          select: {
            id: true,
            name: true,
            color: true,
            course_rating: true,
            slope_rating: true,
            holes: {
              select: {
                par: true,
              },
            },
          },
        },
        round_players: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    // Transform to include computed fields
    const data = rounds.map((round) => {
      const totalPar = round.tee_set.holes.reduce((sum, h) => sum + h.par, 0);
      const userScore = round.round_players.find(rp => rp.player_id === userPlayer.id)?.gross_score;

      return {
        id: round.id,
        date_played: round.date_played,
        status: round.status,
        round_type: round.round_type,
        weather: round.weather,
        course: round.course,
        tee_set: {
          id: round.tee_set.id,
          name: round.tee_set.name,
          color: round.tee_set.color,
          course_rating: round.tee_set.course_rating,
          slope_rating: round.tee_set.slope_rating,
        },
        total_par: totalPar,
        round_players: round.round_players.map(rp => ({
          id: rp.id,
          player: rp.player,
          gross_score: rp.gross_score,
          net_score: rp.net_score,
        })),
        player_count: round.round_players.length,
        player_names: round.round_players.map((rp) => rp.player.name),
        user_score: userScore,
        score_vs_par: userScore ? userScore - totalPar : null,
      };
    });

    return NextResponse.json({
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + rounds.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching rounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rounds' },
      { status: 500 }
    );
  }
}
