import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StandingsTable from '@/components/leagues/standings-table';
import MatchupCard from '@/components/leagues/matchup-card';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeagueDashboardPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="card p-12 text-center">
        <p className="text-muted">Please log in to view this league.</p>
      </div>
    );
  }

  const { id } = await params;

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      commissioner: { select: { id: true, name: true } },
      default_course: { select: { id: true, name: true, city: true, state: true } },
      players: {
        where: { is_active: true },
        include: {
          player: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { joined_at: 'asc' },
      },
      seasons: {
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!league) notFound();

  const isCommissioner = league.commissioner_id === session.user.id;

  // Get active season standings
  const activeSeason = league.seasons.find((s) => s.status === 'active');
  let standings: {
    rank: number;
    player_name: string;
    wins: number;
    losses: number;
    ties: number;
    points: number;
    scoring_avg: number | null;
    is_current_user?: boolean;
  }[] = [];

  if (activeSeason) {
    const rawStandings = await prisma.leagueStanding.findMany({
      where: { season_id: activeSeason.id },
      include: {
        league_player: {
          include: {
            player: { select: { id: true, name: true } },
            user: { select: { id: true } },
          },
        },
      },
      orderBy: [{ points: 'desc' }, { scoring_avg: 'asc' }],
    });

    standings = rawStandings.map((s, index) => ({
      rank: index + 1,
      player_name: s.league_player.player.name,
      wins: s.wins,
      losses: s.losses,
      ties: s.ties,
      points: Number(s.points),
      scoring_avg: s.scoring_avg ? Number(s.scoring_avg) : null,
      is_current_user: s.league_player.user.id === session.user.id,
    }));
  }

  // Get current/upcoming week matchups
  let currentWeekMatchups: {
    playerA: string;
    playerB: string | null;
    scoreA: number | null;
    scoreB: number | null;
    status: string;
  }[] = [];
  let currentWeekNumber: number | null = null;

  if (activeSeason) {
    // Find the latest week that has matchups
    const latestWeek = await prisma.leagueWeek.findFirst({
      where: { season_id: activeSeason.id },
      include: {
        matchups: {
          include: {
            player_a: { include: { player: { select: { name: true } } } },
            player_b: { include: { player: { select: { name: true } } } },
          },
        },
      },
      orderBy: { week_number: 'desc' },
    });

    if (latestWeek) {
      currentWeekNumber = latestWeek.week_number;
      currentWeekMatchups = latestWeek.matchups.map((m) => ({
        playerA: m.player_a.player.name,
        playerB: m.player_b?.player.name ?? null,
        scoreA: m.result ? (m.result as { score_a?: number }).score_a ?? null : null,
        scoreB: m.result ? (m.result as { score_b?: number }).score_b ?? null : null,
        status: m.status,
      }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href="/leagues"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal transition-colors mb-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Leagues
          </Link>
          <h1 className="text-2xl font-serif font-bold text-charcoal">{league.name}</h1>
          {league.description && (
            <p className="text-muted mt-1">{league.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {isCommissioner && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary-700">
                Commissioner
              </span>
            )}
            <span className="text-sm text-muted">
              {league.players.length} member{league.players.length !== 1 ? 's' : ''}
            </span>
            {activeSeason && (
              <span className="text-sm text-muted">
                Season: {activeSeason.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/leagues/${id}/schedule`}
            className="btn-outline inline-flex items-center gap-2 text-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule
          </Link>
          {isCommissioner && (
            <Link
              href={`/leagues/${id}/settings`}
              className="btn-outline inline-flex items-center gap-2 text-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          )}
        </div>
      </div>

      {/* Standings */}
      <div>
        <h2 className="text-lg font-serif font-semibold text-charcoal mb-3">Standings</h2>
        {activeSeason ? (
          <StandingsTable standings={standings} />
        ) : (
          <div className="card p-8 text-center">
            <p className="text-muted">No active season. {isCommissioner ? 'Create a season in Settings to get started.' : 'The commissioner needs to set up a season.'}</p>
          </div>
        )}
      </div>

      {/* This Week's Matchups */}
      <div>
        <h2 className="text-lg font-serif font-semibold text-charcoal mb-3">
          {currentWeekNumber ? `Week ${currentWeekNumber} Matchups` : 'Matchups'}
        </h2>
        {currentWeekMatchups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentWeekMatchups.map((matchup, i) => (
              <MatchupCard
                key={i}
                playerA={matchup.playerA}
                playerB={matchup.playerB}
                scoreA={matchup.scoreA}
                scoreB={matchup.scoreB}
                status={matchup.status}
              />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-muted">
              No matchups scheduled yet.
              {isCommissioner && (
                <> <Link href={`/leagues/${id}/settings`} className="text-secondary hover:text-secondary-700 font-medium transition-colors">Generate a schedule</Link> to get started.</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Members */}
      <div>
        <h2 className="text-lg font-serif font-semibold text-charcoal mb-3">Members</h2>
        <div className="card overflow-hidden">
          <div className="divide-y divide-card-border">
            {league.players.map((lp) => (
              <div key={lp.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-cream-400 flex items-center justify-center text-sm font-medium text-muted">
                    {lp.player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">{lp.player.name}</p>
                    {lp.user.id === league.commissioner_id && (
                      <p className="text-xs text-muted">Commissioner</p>
                    )}
                  </div>
                </div>
                {lp.role === 'commissioner' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary-700">
                    Commissioner
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
