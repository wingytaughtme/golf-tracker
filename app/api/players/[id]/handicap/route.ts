import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  calculateHandicapIndex,
  calculateCourseHandicap,
  calculatePlayingHandicap,
  getDifferentialsUsedCount,
  getHandicapAdjustment,
  formatHandicap,
} from '@/lib/calculations/handicap';

interface DifferentialRecord {
  date: Date;
  courseName: string;
  grossScore: number;
  adjustedGrossScore: number;
  courseRating: number;
  slopeRating: number;
  differential: number;
  isNineHole: boolean;
  roundId: string;
}

/**
 * GET /api/players/[id]/handicap
 *
 * Returns the player's current handicap, handicap history, and recent differentials.
 *
 * Query parameters:
 * - limit: Number of history entries to return (default: 20)
 * - include_details: Include calculation details (default: true)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const includeDetails = searchParams.get('include_details') !== 'false';

    // Find the player
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Verify user has access (must be the player's user or viewing their own rounds)
    const userPlayer = await prisma.player.findFirst({
      where: { user_id: session.user.id },
    });

    const isOwner = player.user_id === session.user.id;
    const isSameUser = userPlayer?.id === playerId;

    // For now, allow any authenticated user to view handicap info
    // In a more restricted app, you might check if they've played together
    if (!isOwner && !isSameUser) {
      // Check if they've played in any rounds together
      const hasPlayedTogether = await prisma.roundPlayer.findFirst({
        where: {
          player_id: playerId,
          round: {
            round_players: {
              some: {
                player_id: userPlayer?.id,
              },
            },
          },
        },
      });

      if (!hasPlayedTogether && !userPlayer) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Get handicap history entries from rounds
    const handicapHistory = await prisma.handicapHistory.findMany({
      where: {
        player_id: playerId,
        calculation_details: {
          path: ['source'],
          equals: 'round',
        },
      },
      orderBy: { effective_date: 'desc' },
      take: limit,
    });

    // Extract differentials and build detailed records
    const differentials: DifferentialRecord[] = [];
    const rawDifferentials: number[] = [];

    for (const history of handicapHistory) {
      const details = history.calculation_details as {
        source?: string;
        round_id?: string;
        gross_score?: number;
        adjusted_gross_score?: number;
        course_rating?: number;
        slope_rating?: number;
        differential?: number;
        is_nine_hole?: boolean;
        nine_hole_type?: string;
      } | null;

      if (details?.differential !== undefined) {
        rawDifferentials.push(details.differential);

        // Get round details for rich display
        if (details.round_id && includeDetails) {
          const round = await prisma.round.findUnique({
            where: { id: details.round_id },
            include: {
              course: true,
            },
          });

          differentials.push({
            // Use round's date_played, not the handicap entry's effective_date
            date: round?.date_played || history.effective_date,
            courseName: round?.course?.name || 'Unknown Course',
            grossScore: details.gross_score || 0,
            adjustedGrossScore: details.adjusted_gross_score || details.gross_score || 0,
            courseRating: details.course_rating || 0,
            slopeRating: details.slope_rating || 0,
            differential: details.differential,
            isNineHole: details.is_nine_hole || false,
            roundId: details.round_id,
          });
        }
      }
    }

    // Calculate current handicap index from the differentials
    const currentHandicapIndex = calculateHandicapIndex(rawDifferentials.slice(0, 20));

    // Get the most recent handicap history entry (may include manual adjustments)
    const mostRecentEntry = handicapHistory[0];
    const displayHandicapIndex = mostRecentEntry
      ? Number(mostRecentEntry.handicap_index)
      : currentHandicapIndex;

    // Calculate statistics
    const differentialsUsed = getDifferentialsUsedCount(rawDifferentials.length);
    const adjustment = getHandicapAdjustment(rawDifferentials.length);

    // Get low and high indexes for the soft cap calculation
    const sortedDifferentials = [...rawDifferentials].sort((a, b) => a - b);
    const lowestDifferential = sortedDifferentials[0] ?? null;
    const highestDifferential = sortedDifferentials[sortedDifferentials.length - 1] ?? null;
    const averageDifferential = rawDifferentials.length > 0
      ? rawDifferentials.reduce((a, b) => a + b, 0) / rawDifferentials.length
      : null;

    // Build response
    const response: {
      player: {
        id: string;
        name: string;
      };
      currentHandicap: {
        index: number | null;
        formatted: string;
        effectiveDate: Date | null;
        totalRounds: number;
        differentialsUsed: number;
        adjustment: number;
      };
      statistics: {
        lowestDifferential: number | null;
        highestDifferential: number | null;
        averageDifferential: number | null;
        roundsInWindow: number;
      };
      recentDifferentials?: DifferentialRecord[];
      history?: Array<{
        date: Date;
        handicapIndex: number;
        differential: number | null;
        roundId: string | null;
      }>;
    } = {
      player: {
        id: player.id,
        name: player.name,
      },
      currentHandicap: {
        index: displayHandicapIndex,
        formatted: formatHandicap(displayHandicapIndex),
        effectiveDate: mostRecentEntry?.effective_date || null,
        totalRounds: rawDifferentials.length,
        differentialsUsed,
        adjustment,
      },
      statistics: {
        lowestDifferential,
        highestDifferential,
        averageDifferential: averageDifferential !== null
          ? Math.round(averageDifferential * 10) / 10
          : null,
        roundsInWindow: Math.min(rawDifferentials.length, 20),
      },
    };

    if (includeDetails) {
      response.recentDifferentials = differentials;

      // For history, we need to fetch round dates for round-based entries
      const roundIds = handicapHistory
        .map((h) => {
          const details = h.calculation_details as { round_id?: string } | null;
          return details?.round_id;
        })
        .filter((id): id is string => !!id);

      const rounds = await prisma.round.findMany({
        where: { id: { in: roundIds } },
        select: { id: true, date_played: true },
      });
      const roundDateMap = new Map(rounds.map((r) => [r.id, r.date_played]));

      response.history = handicapHistory.map((h) => {
        const details = h.calculation_details as {
          differential?: number;
          round_id?: string;
          source?: string;
        } | null;
        // Use round's date_played for round-based entries, effective_date for manual
        const date = details?.round_id
          ? roundDateMap.get(details.round_id) || h.effective_date
          : h.effective_date;
        return {
          date,
          handicapIndex: Number(h.handicap_index),
          differential: details?.differential ?? null,
          roundId: details?.round_id ?? null,
          source: details?.source ?? null,
        };
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching player handicap:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player handicap' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players/[id]/handicap/calculate
 *
 * Calculate what a player's course/playing handicap would be for a specific tee set.
 *
 * Body:
 * - teeSetId: The tee set to calculate for
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId } = await params;
    const body = await request.json();

    if (!body.teeSetId) {
      return NextResponse.json(
        { error: 'teeSetId is required' },
        { status: 400 }
      );
    }

    // Find the player
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get the tee set with course info
    const teeSet = await prisma.teeSet.findUnique({
      where: { id: body.teeSetId },
      include: {
        course: true,
        holes: true,
      },
    });

    if (!teeSet) {
      return NextResponse.json(
        { error: 'Tee set not found' },
        { status: 404 }
      );
    }

    // Get player's handicap history to calculate current index
    const handicapHistory = await prisma.handicapHistory.findMany({
      where: {
        player_id: playerId,
        calculation_details: {
          path: ['source'],
          equals: 'round',
        },
      },
      orderBy: { effective_date: 'desc' },
      take: 20,
    });

    // Extract differentials
    const differentials: number[] = handicapHistory
      .map((h) => {
        const details = h.calculation_details as { differential?: number } | null;
        return details?.differential;
      })
      .filter((d): d is number => d !== undefined);

    // Calculate handicap index
    const handicapIndex = calculateHandicapIndex(differentials);

    if (handicapIndex === null) {
      return NextResponse.json({
        player: {
          id: player.id,
          name: player.name,
        },
        teeSet: {
          id: teeSet.id,
          name: teeSet.name,
          courseRating: Number(teeSet.course_rating),
          slopeRating: teeSet.slope_rating,
        },
        handicapIndex: null,
        courseHandicap: null,
        playingHandicap: null,
        message: 'Insufficient rounds to calculate handicap (minimum 3 required)',
      });
    }

    const courseRating = Number(teeSet.course_rating);
    const slopeRating = teeSet.slope_rating;
    const totalPar = teeSet.holes.reduce((sum, h) => sum + h.par, 0);

    // Calculate course and playing handicaps
    const courseHandicap = calculateCourseHandicap(handicapIndex, slopeRating);
    const playingHandicap = calculatePlayingHandicap(
      handicapIndex,
      slopeRating,
      courseRating,
      totalPar
    );

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
      },
      teeSet: {
        id: teeSet.id,
        name: teeSet.name,
        course: teeSet.course.name,
        courseRating,
        slopeRating,
        par: totalPar,
      },
      handicapIndex: {
        value: handicapIndex,
        formatted: formatHandicap(handicapIndex),
      },
      courseHandicap,
      playingHandicap,
    });
  } catch (error) {
    console.error('Error calculating playing handicap:', error);
    return NextResponse.json(
      { error: 'Failed to calculate playing handicap' },
      { status: 500 }
    );
  }
}
