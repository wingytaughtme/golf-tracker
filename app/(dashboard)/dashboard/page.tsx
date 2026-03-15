import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
  round_nines: { id: string }[];
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
      round_nines: {
        select: { id: true },
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

interface QuickStartConfig {
  course_id: string;
  course_name: string;
  tee_set_id: string;
  tee_set_name: string;
  nine_ids: string[];
  nine_names: string[];
  round_type: string;
  player_ids: string[];
  player_names: string[];
  saved_at: string;
}

async function getQuickStartConfig(userId: string): Promise<QuickStartConfig | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  const prefs = user?.preferences as { last_round_config?: QuickStartConfig } | null;
  const config = prefs?.last_round_config;
  if (!config) return null;

  // Validate course and tee set still exist
  const [course, teeSet, players] = await Promise.all([
    prisma.course.findUnique({ where: { id: config.course_id }, select: { id: true } }),
    prisma.teeSet.findFirst({ where: { id: config.tee_set_id, course_id: config.course_id }, select: { id: true } }),
    prisma.player.findMany({ where: { id: { in: config.player_ids } }, select: { id: true, name: true } }),
  ]);

  if (!course || !teeSet || players.length === 0) return null;

  // Update player names in case they changed
  return {
    ...config,
    player_names: config.player_ids.map(id => {
      const p = players.find(pl => pl.id === id);
      return p?.name || 'Unknown';
    }).filter(n => n !== 'Unknown'),
  };
}

async function getPlayerStats(userId: string): Promise<PlayerStats> {
  const userPlayer = await prisma.player.findFirst({
    where: { user_id: userId },
    include: {
      handicap_history: {
        where: {
          calculation_details: {
            path: ['source'],
            equals: 'round',
          },
        },
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
    select: {
      gross_score: true,
      round: {
        select: {
          round_nines: {
            select: {
              nine: {
                select: {
                  holes: {
                    select: { par: true },
                    where: { tee_set_id: undefined as unknown as string },
                  },
                },
              },
            },
          },
          tee_set_id: true,
        },
      },
    },
  });

  // Normalize scores: for 9-hole rounds, project to 18 by doubling the score
  const normalizedScores = roundsThisYear
    .filter((r) => r.gross_score !== null)
    .map((r) => {
      const isNineHole = r.round.round_nines.length === 1;
      const raw = r.gross_score as number;
      return isNineHole ? raw * 2 : raw;
    });

  // Get the calculated handicap from calculation_details, not the DB field
  // The DB field might be 0 for early rounds before 3 differentials were accumulated
  let handicap: number | null = null;
  if (userPlayer.handicap_history[0]) {
    const details = userPlayer.handicap_history[0].calculation_details as { handicap_index?: number | null } | null;
    handicap = details?.handicap_index ?? null;
  }

  return {
    handicap,
    roundsThisYear: normalizedScores.length,
    bestScore: normalizedScores.length > 0 ? Math.min(...normalizedScores) : null,
    averageScore: normalizedScores.length > 0
      ? Math.round(normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length)
      : null,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Golfer';
  const userId = session?.user?.id;

  const [activeRounds, recentRounds, stats, quickStartConfig] = await Promise.all([
    userId ? getActiveRounds(userId) : Promise.resolve([]),
    userId ? getRecentRounds(userId) : Promise.resolve([]),
    userId ? getPlayerStats(userId) : Promise.resolve({ handicap: null, roundsThisYear: 0, bestScore: null, averageScore: null }),
    userId ? getQuickStartConfig(userId) : Promise.resolve(null),
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
      <div className="card-accent p-6">
        <h1 className="text-3xl font-serif font-bold text-charcoal">
          Welcome back, {userName}!
        </h1>
        <p className="text-muted mt-2">
          Ready to hit the links? Start a new round or check your stats.
        </p>
      </div>

      {/* Active Rounds Alert */}
      {activeRounds.length > 0 && (
        <div className="bg-status-warning border border-secondary rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-charcoal">
                {activeRounds.length === 1 ? 'Round in Progress' : `${activeRounds.length} Rounds in Progress`}
              </h3>
              <div className="mt-2 space-y-2">
                {activeRounds.map((round) => (
                  <div key={round.id} className="flex items-center justify-between bg-card rounded-lg p-3 shadow-sm border border-card-border">
                    <div>
                      <p className="font-medium text-charcoal">{round.course.name}</p>
                      <p className="text-sm text-muted">
                        {round.tee_set.name} tees - {getHolesCompleted(round.round_players)}/{round.round_nines.length * 9} holes
                      </p>
                    </div>
                    <Link
                      href={`/rounds/${round.id}`}
                      className="btn-primary text-sm"
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
          className="group bg-primary hover:bg-primary-600 text-white rounded-xl p-6 shadow-card transition-all hover:shadow-card-hover"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-secondary/30 rounded-xl flex items-center justify-center group-hover:bg-secondary/40 transition-colors">
              <svg className="h-6 w-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="group card hover:shadow-card-hover transition-all"
        >
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-secondary/20 rounded-xl flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                <svg className="h-6 w-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-charcoal">View Courses</h3>
                <p className="text-muted text-sm">Browse golf courses</p>
              </div>
            </div>
          </div>
        </Link>

        {/* My Rounds */}
        <Link
          href="/rounds"
          className="group card hover:shadow-card-hover transition-all"
        >
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-charcoal">My Rounds</h3>
                <p className="text-muted text-sm">View round history</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Start */}
      {quickStartConfig && (
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-charcoal flex items-center gap-2">
                <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Start
              </h3>
              <p className="text-sm text-muted mt-1">
                {quickStartConfig.course_name} - {quickStartConfig.tee_set_name} tees
              </p>
              <p className="text-sm text-muted">
                {quickStartConfig.player_names.join(', ')} - {quickStartConfig.round_type}
              </p>
              {(() => {
                const daysSince = Math.floor((Date.now() - new Date(quickStartConfig.saved_at).getTime()) / 86400000);
                return daysSince > 30 ? (
                  <p className="text-xs text-score-bogey mt-1">Last used {daysSince} days ago</p>
                ) : null;
              })()}
            </div>
            <div className="flex gap-2">
              <Link
                href="/rounds/new?quickstart=true&edit=true"
                className="btn-outline text-sm px-3 py-1.5"
              >
                Edit
              </Link>
              <Link
                href="/rounds/new?quickstart=true"
                className="btn-primary text-sm px-3 py-1.5"
              >
                Start Round
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-accent p-5">
          <p className="text-sm text-muted mb-1">Handicap Index</p>
          <p className="text-3xl font-bold text-charcoal">
            {stats.handicap !== null ? stats.handicap.toFixed(1) : '--'}
          </p>
          <p className="text-xs text-muted mt-1">
            {stats.handicap !== null ? 'Current' : 'No rounds yet'}
          </p>
        </div>
        <div className="card-accent p-5">
          <p className="text-sm text-muted mb-1">Rounds Played</p>
          <p className="text-3xl font-bold text-charcoal">{stats.roundsThisYear}</p>
          <p className="text-xs text-muted mt-1">This year</p>
        </div>
        <div className="card-accent p-5">
          <p className="text-sm text-muted mb-1">Best Score</p>
          <p className="text-3xl font-bold text-charcoal">
            {stats.bestScore !== null ? stats.bestScore : '--'}
          </p>
          <p className="text-xs text-muted mt-1">
            {stats.bestScore !== null ? 'This year' : 'No rounds yet'}
          </p>
        </div>
        <div className="card-accent p-5">
          <p className="text-sm text-muted mb-1">Average Score</p>
          <p className="text-3xl font-bold text-charcoal">
            {stats.averageScore !== null ? stats.averageScore : '--'}
          </p>
          <p className="text-xs text-muted mt-1">
            {stats.averageScore !== null ? 'This year' : 'No rounds yet'}
          </p>
        </div>
      </div>

      {/* Recent Rounds */}
      <div className="card">
        <div className="p-6 border-b border-card-border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-serif font-semibold text-charcoal">Recent Rounds</h2>
            <Link
              href="/rounds"
              className="text-sm text-secondary hover:text-secondary-600 font-medium transition-colors"
            >
              View All
            </Link>
          </div>
        </div>

        {recentRounds.length > 0 ? (
          <div className="divide-y divide-card-border">
            {recentRounds.map((round) => (
              <Link
                key={round.id}
                href={`/rounds/${round.id}`}
                className="flex items-center justify-between p-4 hover:bg-cream-300 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-charcoal">{round.course.name}</p>
                  <p className="text-sm text-muted">
                    {formatDate(round.date_played)} - {round.tee_set.name} tees
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {round.round_players.map((rp) => (
                    rp.gross_score && (
                      <div key={rp.player.id} className="text-right">
                        <p className="text-lg font-bold text-charcoal">{rp.gross_score}</p>
                        <p className="text-xs text-muted">{rp.player.name}</p>
                      </div>
                    )
                  ))}
                  <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="h-16 w-16 bg-cream-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-serif font-medium text-charcoal mb-2">No rounds yet</h3>
            <p className="text-muted mb-4">Start tracking your golf game by creating your first round.</p>
            <Link
              href="/rounds/new"
              className="btn-primary inline-flex items-center gap-2"
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
