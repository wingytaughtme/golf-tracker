/**
 * Club distance analytics and default club configuration.
 */

interface DistanceEntry {
  distance: number;
  recorded_at: Date;
}

interface ClubStats {
  avg: number;
  min: number;
  max: number;
  count: number;
  last_recorded: Date | null;
}

export function calculateClubStats(distances: DistanceEntry[]): ClubStats | null {
  if (distances.length === 0) return null;

  const values = distances.map(d => d.distance);
  const sum = values.reduce((a, b) => a + b, 0);
  const sorted = [...distances].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

  return {
    avg: Math.round(sum / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
    last_recorded: sorted[0]?.recorded_at || null,
  };
}

interface DefaultClub {
  name: string;
  club_type: 'driver' | 'wood' | 'hybrid' | 'iron' | 'wedge' | 'putter';
  display_order: number;
}

export function getDefaultClubs(): DefaultClub[] {
  return [
    { name: 'Driver', club_type: 'driver', display_order: 0 },
    { name: '3 Wood', club_type: 'wood', display_order: 1 },
    { name: '5 Wood', club_type: 'wood', display_order: 2 },
    { name: '4 Hybrid', club_type: 'hybrid', display_order: 3 },
    { name: '5 Iron', club_type: 'iron', display_order: 4 },
    { name: '6 Iron', club_type: 'iron', display_order: 5 },
    { name: '7 Iron', club_type: 'iron', display_order: 6 },
    { name: '8 Iron', club_type: 'iron', display_order: 7 },
    { name: '9 Iron', club_type: 'iron', display_order: 8 },
    { name: 'Pitching Wedge', club_type: 'wedge', display_order: 9 },
    { name: 'Gap Wedge', club_type: 'wedge', display_order: 10 },
    { name: 'Sand Wedge', club_type: 'wedge', display_order: 11 },
    { name: 'Lob Wedge', club_type: 'wedge', display_order: 12 },
    { name: 'Putter', club_type: 'putter', display_order: 13 },
  ];
}

export const CLUB_TYPE_COLORS: Record<string, string> = {
  driver: '#1e40af',
  wood: '#059669',
  hybrid: '#d97706',
  iron: '#6366f1',
  wedge: '#dc2626',
  putter: '#6b7280',
};
