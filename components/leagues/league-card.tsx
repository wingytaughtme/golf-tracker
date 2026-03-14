'use client';

import Link from 'next/link';

interface LeagueCardProps {
  id: string;
  name: string;
  member_count: number;
  is_commissioner: boolean;
  active_season?: { name: string } | null;
  commissioner_name: string | null;
}

export default function LeagueCard({
  id,
  name,
  member_count,
  is_commissioner,
  active_season,
  commissioner_name,
}: LeagueCardProps) {
  return (
    <Link
      href={`/leagues/${id}`}
      className="card hover:shadow-md transition-all duration-200 overflow-hidden block"
    >
      <div className="p-5">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-charcoal truncate">{name}</h3>
            {commissioner_name && (
              <p className="text-muted text-sm mt-1">
                Commissioner: {commissioner_name}
              </p>
            )}
          </div>
          {is_commissioner && (
            <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary-700">
              Commissioner
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {active_season && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary-700">
              {active_season.name}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cream-300 text-muted">
            {member_count} member{member_count !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-card-border">
          <span className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
            View League
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
