import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import LeagueCard from '@/components/leagues/league-card';

export const dynamic = 'force-dynamic';

export default async function LeaguesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="card p-12 text-center">
        <p className="text-muted">Please log in to view your leagues.</p>
      </div>
    );
  }

  const leagues = await prisma.league.findMany({
    where: {
      OR: [
        { commissioner_id: session.user.id },
        { players: { some: { user_id: session.user.id, is_active: true } } },
      ],
      status: { not: 'archived' },
    },
    include: {
      players: { where: { is_active: true }, select: { id: true } },
      seasons: { where: { status: 'active' }, take: 1, select: { id: true, name: true } },
      commissioner: { select: { name: true } },
    },
    orderBy: { updated_at: 'desc' },
  });

  const data = leagues.map((l) => ({
    id: l.id,
    name: l.name,
    member_count: l.players.length,
    is_commissioner: l.commissioner_id === session.user.id,
    active_season: l.seasons[0] || null,
    commissioner_name: l.commissioner.name,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Leagues</h1>
          <p className="text-muted mt-1">
            {data.length} league{data.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/leagues/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create League
          </Link>
          <Link
            href="/leagues/join"
            className="btn-outline inline-flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Join League
          </Link>
        </div>
      </div>

      {/* League List */}
      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((league) => (
            <LeagueCard
              key={league.id}
              id={league.id}
              name={league.name}
              member_count={league.member_count}
              is_commissioner={league.is_commissioner}
              active_season={league.active_season}
              commissioner_name={league.commissioner_name}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="h-16 w-16 bg-cream-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-serif font-medium text-charcoal mb-2">No leagues yet</h3>
          <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
            Create a league to organize weekly matches with your golf group, or join an existing one with an invite link.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/leagues/new"
              className="btn-primary inline-flex items-center gap-2"
            >
              Create League
            </Link>
            <Link
              href="/leagues/join"
              className="btn-outline inline-flex items-center gap-2"
            >
              Join League
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
