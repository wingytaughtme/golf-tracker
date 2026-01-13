'use client';

import Link from 'next/link';

interface RecentRound {
  id: string;
  date_played: string;
  course: {
    id: string;
    name: string;
  };
  tee_set: {
    name: string;
    color?: string;
  };
  gross_score: number | null;
  net_score?: number | string | null;
  score_differential?: number | null;
  par?: number;
  status: string;
}

interface RecentRoundsProps {
  rounds: RecentRound[];
  playerId: string;
  title?: string;
  showViewAll?: boolean;
  maxRounds?: number;
}

export function RecentRounds({
  rounds,
  playerId,
  title = 'Recent Rounds',
  showViewAll = true,
  maxRounds = 5
}: RecentRoundsProps) {
  const displayRounds = rounds.slice(0, maxRounds);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-golf-text">{title}</h3>
        {showViewAll && rounds.length > 0 && (
          <Link
            href={`/rounds?player=${playerId}`}
            className="text-sm text-primary hover:text-primary-600 font-medium"
          >
            View All
          </Link>
        )}
      </div>

      {displayRounds.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Tees</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">+/-</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayRounds.map((round) => {
                const scoreToPar = round.gross_score && round.par
                  ? round.gross_score - round.par
                  : null;

                return (
                  <tr
                    key={round.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/rounds/${round.id}`}
                  >
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {new Date(round.date_played).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm font-medium text-golf-text">{round.course.name}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className="inline-flex items-center gap-1.5 text-sm text-gray-600"
                      >
                        {round.tee_set.color && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getTeeColor(round.tee_set.color) }}
                          />
                        )}
                        {round.tee_set.name}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {round.gross_score ? (
                        <span className="text-sm font-semibold text-golf-text">{round.gross_score}</span>
                      ) : (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          round.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {round.status === 'in_progress' ? 'In Progress' : round.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {scoreToPar !== null ? (
                        <span className={`text-sm font-medium ${
                          scoreToPar < 0 ? 'text-green-600' :
                          scoreToPar === 0 ? 'text-gray-600' :
                          'text-red-600'
                        }`}>
                          {scoreToPar > 0 ? '+' : ''}{scoreToPar}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {round.score_differential !== null && round.score_differential !== undefined ? (
                        <span className="text-sm text-gray-600">{round.score_differential.toFixed(1)}</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>No rounds played yet</p>
          <Link href="/rounds/new" className="text-primary hover:text-primary-600 font-medium text-sm mt-2 inline-block">
            Start a round
          </Link>
        </div>
      )}
    </div>
  );
}

function getTeeColor(colorName: string): string {
  const colors: Record<string, string> = {
    black: '#1f2937',
    blue: '#3b82f6',
    white: '#e5e7eb',
    gold: '#eab308',
    yellow: '#facc15',
    red: '#ef4444',
    green: '#22c55e',
  };
  return colors[colorName.toLowerCase()] || '#9ca3af';
}

export function RecentRoundsSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="flex gap-4">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-4 bg-gray-200 rounded w-8"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
