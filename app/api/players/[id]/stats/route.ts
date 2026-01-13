import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAllPlayerStats,
  getPlayerOverallStats,
  getPlayerScoringStats,
  getPlayerDetailedStats,
  getPlayerTrends,
  getPlayerCourseStats,
} from '@/lib/calculations/statistics';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/players/[id]/stats
 *
 * Returns comprehensive statistics for a player.
 *
 * Query parameters:
 * - type: 'all' | 'overall' | 'scoring' | 'detailed' | 'trends' | 'courses'
 *         (default: 'all')
 * - trendLimit: number (default: 20) - Number of rounds for trend data
 * - courseId: string (optional) - Filter course stats to specific course
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type') || 'all';
    const trendLimit = parseInt(searchParams.get('trendLimit') || '20', 10);
    const courseId = searchParams.get('courseId') || undefined;

    // Verify player exists
    const player = await prisma.player.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Return specific stat type or all stats
    switch (type) {
      case 'overall': {
        const stats = await getPlayerOverallStats(id);
        return NextResponse.json({
          playerId: id,
          playerName: player.name,
          type: 'overall',
          data: stats,
        });
      }

      case 'scoring': {
        const stats = await getPlayerScoringStats(id);
        return NextResponse.json({
          playerId: id,
          playerName: player.name,
          type: 'scoring',
          data: stats,
        });
      }

      case 'detailed': {
        const stats = await getPlayerDetailedStats(id);
        return NextResponse.json({
          playerId: id,
          playerName: player.name,
          type: 'detailed',
          data: stats,
        });
      }

      case 'trends': {
        const stats = await getPlayerTrends(id, trendLimit);
        return NextResponse.json({
          playerId: id,
          playerName: player.name,
          type: 'trends',
          limit: trendLimit,
          data: stats,
        });
      }

      case 'courses': {
        const stats = await getPlayerCourseStats(id, courseId);
        return NextResponse.json({
          playerId: id,
          playerName: player.name,
          type: 'courses',
          courseFilter: courseId || null,
          data: stats,
        });
      }

      case 'all':
      default: {
        const stats = await getAllPlayerStats(id, {
          trendLimit,
          courseId,
        });
        return NextResponse.json({
          playerId: id,
          playerName: player.name,
          type: 'all',
          data: stats,
        });
      }
    }
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player statistics' },
      { status: 500 }
    );
  }
}
