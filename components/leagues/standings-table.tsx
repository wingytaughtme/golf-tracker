'use client';

interface StandingRow {
  rank: number;
  player_name: string;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  scoring_avg: number | null;
  is_current_user?: boolean;
}

interface StandingsTableProps {
  standings: StandingRow[];
}

export default function StandingsTable({ standings }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-muted">No standings available yet. Complete some matchups to see standings.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider">Rank</th>
              <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider">Player</th>
              <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">W-L-T</th>
              <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider">Points</th>
              <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider">Scoring Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {standings.map((row) => (
              <tr
                key={row.rank}
                className={`transition-colors ${
                  row.is_current_user ? 'bg-secondary/10' : 'hover:bg-cream-300'
                }`}
              >
                <td className="py-3 px-4">
                  <span className={`text-sm font-semibold ${
                    row.rank === 1 ? 'text-secondary-700' : 'text-charcoal'
                  }`}>
                    {row.rank}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-charcoal">
                    {row.player_name}
                    {row.is_current_user && (
                      <span className="ml-2 text-xs text-muted">(You)</span>
                    )}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-sm text-charcoal">
                    {row.wins}-{row.losses}-{row.ties}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-semibold text-charcoal">
                    {Number(row.points)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm text-muted">
                    {row.scoring_avg != null ? Number(row.scoring_avg).toFixed(1) : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
