import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface ActiveRound {
  id: string;
  date_played: Date;
  started_at: Date | null;
  course: {
    name: string;
    city: string;
    state: string;
  };
  tee_set: {
    name: string;
    color: string;
  };
  round_players: {
    player: {
      name: string;
    };
    scores: {
      strokes: number | null;
    }[];
  }[];
}

interface RecentRound {
  id: string;
  date_played: Date;
  course: {
    name: string;
    city: string;
    state: string;
  };
  tee_set: {
    name: string;
  };
  round_players: {
    player: {
      id: string;
      name: string;
    };
    gross_score: number | null;
  }[];
}

interface PlayerStats {
  handicap: number | null;
  roundsThisYear: number;
  bestScore: number | null;
  averageScore: number | null;
}

async function getActiveRounds(userId: string): Promise<ActiveRound[]> {
  const userPlayer = await prisma.player.findFirst({
    where: { user_id: userId },
  });

  if (!userPlayer) return [];

  return prisma.round.findMany({
    where: {
      status: 'in_progress',
      OR: [
        { round_players: { some: { player_id: userPlayer.id } } },
        { created_by: userId },
      ],
    },
    include: {
      course: {
        select: { name: true, city: true, state: true },
      },
      tee_set: {
        select: { name: true, color: true },
      },
      round_players: {
        include: {
          player: { select: { name: true } },
          scores: { select: { strokes: true } },
        },
      },
    },
    orderBy: { started_at: 'desc' },
    take: 5,
  });
}

async function getRecentRounds(userId: string): Promise<RecentRound[]> {
  const userPlayer = await prisma.player.findFirst({
    where: { user_id: userId },
  });

  if (!userPlayer) return [];

  return prisma.round.findMany({
    where: {
      status: 'completed',
      OR: [
        { round_players: { some: { player_id: userPlayer.id } } },
        { created_by: userId },
      ],
    },
    include: {
      course: {
        select: { name: true, city: true, state: true },
      },
      tee_set: {
        select: { name: true },
      },
      round_players: {
        include: {
          player: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date_played: 'desc' },
    take: 5,
  });
}

async function getPlayerStats(userId: string): Promise<PlayerStats> {
  const userPlayer = await prisma.player.findFirst({
    where: { user_id: userId },
    include: {
      handicap_history: {
        orderBy: { effective_date: 'desc' },
        take: 1,
      },
    },
  });

  if (!userPlayer) {
    return { handicap: null, roundsThisYear: 0, bestScore: null, averageScore: null };
  }

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);

  const roundsThisYear = await prisma.roundPlayer.findMany({
    where: {
      player_id: userPlayer.id,
      round: {
        status: 'completed',
        date_played: { gte: startOfYear },
      },
      gross_score: { not: null },
    },
    select: { gross_score: true },
  });

  const scores = roundsThisYear
    .map((r) => r.gross_score)
    .filter((s): s is number => s !== null);

  return {
    handicap: userPlayer.handicap_history[0]?.handicap_index
      ? Number(userPlayer.handicap_history[0].handicap_index)
      : null,
    roundsThisYear: scores.length,
    bestScore: scores.length > 0 ? Math.min(...scores) : null,
    averageScore: scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Golfer';
  const userId = session?.user?.id;

  const [activeRounds, recentRounds, stats] = await Promise.all([
    userId ? getActiveRounds(userId) : Promise.resolve([]),
    userId ? getRecentRounds(userId) : Promise.resolve([]),
    userId ? getPlayerStats(userId) : Promise.resolve({ handicap: null, roundsThisYear: 0, bestScore: null, averageScore: null }),
  ]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getHolesCompleted = (roundPlayers: ActiveRound['round_players']) => {
    const firstPlayer = roundPlayers[0];
    if (!firstPlayer) return 0;
    return firstPlayer.scores.filter((s) => s.strokes !== null).length;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-display font-bold text-golf-text">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Ready to hit the links? Start a new round or check your stats.
        </p>
      </div>

      {/* Active Rounds Alert */}
      {activeRounds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">
                {activeRounds.length === 1 ? 'Round in Progress' : `${activeRounds.length} Rounds in Progress`}
              </h3>
              <div className="mt-2 space-y-2">
                {activeRounds.map((round) => (
                  <div key={round.id} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                    <div>
                      <p className="font-medium text-golf-text">{round.course.name}</p>
                      <p className="text-sm text-gray-500">
                        {round.tee_set.name} tees - {getHolesCompleted(round.round_players)}/18 holes
                      </p>
                    </div>
                    <Link
                      href={`/rounds/${round.id}`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Resume
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start New Round */}
        <Link
          href="/rounds/new"
          className="group bg-primary hover:bg-primary-600 text-white rounded-xl p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Start New Round</h3>
              <p className="text-white/70 text-sm">Begin tracking a round</p>
            </div>
          </div>
        </Link>

        {/* View Courses */}
        <Link
          href="/courses"
          className="group bg-white hover:bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
              <svg className="h-6 w-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-golf-text">View Courses</h3>
              <p className="text-gray-500 text-sm">Browse golf courses</p>
            </div>
          </div>
        </Link>

        {/* My Stats */}
        <Link
          href="/rounds"
          className="group bg-white hover:bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-colors">
              <svg className="h-6 w-6 text-accent-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-golf-text">My Rounds</h3>
              <p className="text-gray-500 text-sm">View round history</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Handicap Index</p>
          <p className="text-3xl font-bold text-golf-text">
            {stats.handicap !== null ? stats.handicap.toFixed(1) : '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.handicap !== null ? 'Current' : 'No rounds yet'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Rounds Played</p>
          <p className="text-3xl font-bold text-golf-text">{stats.roundsThisYear}</p>
          <p className="text-xs text-gray-400 mt-1">This year</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Best Score</p>
          <p className="text-3xl font-bold text-golf-text">
            {stats.bestScore !== null ? stats.bestScore : '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.bestScore !== null ? 'This year' : 'No rounds yet'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Average Score</p>
          <p className="text-3xl font-bold text-golf-text">
            {stats.averageScore !== null ? stats.averageScore : '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.averageScore !== null ? 'This year' : 'No rounds yet'}
          </p>
        </div>
      </div>

      {/* Recent Rounds */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-golf-text">Recent Rounds</h2>
            <Link
              href="/rounds"
              className="text-sm text-primary hover:text-primary-600 font-medium transition-colors"
            >
              View All
            </Link>
          </div>
        </div>

        {recentRounds.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentRounds.map((round) => (
              <Link
                key={round.id}
                href={`/rounds/${round.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-golf-text">{round.course.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(round.date_played)} - {round.tee_set.name} tees
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {round.round_players.map((rp) => (
                    rp.gross_score && (
                      <div key={rp.player.id} className="text-right">
                        <p className="text-lg font-bold text-golf-text">{rp.gross_score}</p>
                        <p className="text-xs text-gray-500">{rp.player.name}</p>
                      </div>
                    )
                  ))}
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-golf-text mb-2">No rounds yet</h3>
            <p className="text-gray-500 mb-4">Start tracking your golf game by creating your first round.</p>
            <Link
              href="/rounds/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start Your First Round
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
