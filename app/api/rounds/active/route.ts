import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's player ID
    const userPlayer = await prisma.player.findFirst({
      where: { user_id: session.user.id },
    });

    if (!userPlayer) {
      return NextResponse.json({ data: [] });
    }

    // Find all in-progress rounds for this user
    const activeRounds = await prisma.round.findMany({
      where: {
        status: 'in_progress',
        OR: [
          { round_players: { some: { player_id: userPlayer.id } } },
          { created_by: session.user.id },
        ],
      },
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
            scores: {
              where: {
                strokes: { not: null },
              },
              select: {
                id: true,
                strokes: true,
              },
            },
          },
        },
      },
      orderBy: { started_at: 'desc' },
    });

    // Transform to include progress info
    const data = activeRounds.map((round) => {
      // Calculate holes completed (by checking if any player has entered strokes)
      const totalHoles = 18; // Assuming 18 holes
      const userRoundPlayer = round.round_players.find(
        (rp) => rp.player_id === userPlayer.id
      );
      const holesCompleted = userRoundPlayer?.scores.length || 0;

      return {
        id: round.id,
        date_played: round.date_played,
        started_at: round.started_at,
        round_type: round.round_type,
        weather: round.weather,
        course: round.course,
        tee_set: round.tee_set,
        players: round.round_players.map((rp) => ({
          id: rp.player.id,
          name: rp.player.name,
          holes_completed: rp.scores.length,
          current_score: rp.scores.reduce((sum, s) => sum + (s.strokes || 0), 0),
        })),
        progress: {
          holes_completed: holesCompleted,
          total_holes: totalHoles,
          percentage: Math.round((holesCompleted / totalHoles) * 100),
        },
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching active rounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active rounds' },
      { status: 500 }
    );
  }
}
