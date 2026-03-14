/**
 * League standings calculations and round-robin scheduling.
 */

export function generateRoundRobin(playerIds: string[]): [string, string | null][][] {
  const ids = [...playerIds];
  // Add a bye placeholder for odd number of players
  if (ids.length % 2 !== 0) {
    ids.push('__BYE__');
  }

  const n = ids.length;
  const weeks: [string, string | null][][] = [];

  // Standard rotation algorithm
  for (let round = 0; round < n - 1; round++) {
    const matchups: [string, string | null][] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = ids[i];
      const away = ids[n - 1 - i];
      if (home === '__BYE__') {
        matchups.push([away, null]);
      } else if (away === '__BYE__') {
        matchups.push([home, null]);
      } else {
        matchups.push([home, away]);
      }
    }
    weeks.push(matchups);

    // Rotate: fix first element, rotate rest
    const last = ids.pop()!;
    ids.splice(1, 0, last);
  }

  return weeks;
}

interface StandingInput {
  player_id: string;
  wins: number;
  losses: number;
  ties: number;
  scoring_avg: number | null;
}

interface PointsConfig {
  win: number;
  tie: number;
  loss: number;
  bye: number;
}

const DEFAULT_POINTS: PointsConfig = { win: 2, tie: 1, loss: 0, bye: 1 };

export function calculateStandings(
  standings: StandingInput[],
  config?: Partial<PointsConfig>
): { player_id: string; points: number; rank: number }[] {
  const pts = { ...DEFAULT_POINTS, ...config };

  const scored = standings.map(s => ({
    player_id: s.player_id,
    points: s.wins * pts.win + s.ties * pts.tie + s.losses * pts.loss,
    scoring_avg: s.scoring_avg,
  }));

  // Sort: points desc, then scoring_avg asc (lower is better)
  scored.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (a.scoring_avg !== null && b.scoring_avg !== null) return a.scoring_avg - b.scoring_avg;
    if (a.scoring_avg !== null) return -1;
    if (b.scoring_avg !== null) return 1;
    return 0;
  });

  return scored.map((s, i) => ({
    player_id: s.player_id,
    points: s.points,
    rank: i + 1,
  }));
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
