'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MatchupCard from '@/components/leagues/matchup-card';

interface Matchup {
  id: string;
  status: string;
  result: { score_a?: number; score_b?: number } | null;
  player_a: { player: { name: string } };
  player_b: { player: { name: string } } | null;
}

interface Week {
  id: string;
  week_number: number;
  course: { id: string; name: string } | null;
  start_date: string | null;
  end_date: string | null;
  matchups: Matchup[];
}

interface Season {
  id: string;
  name: string;
  status: string;
  week_count: number;
}

export default function SchedulePage() {
  const params = useParams();
  const leagueId = params.id as string;

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [leagueName, setLeagueName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch league info and seasons
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const [leagueRes, seasonsRes] = await Promise.all([
          fetch(`/api/leagues/${leagueId}`),
          fetch(`/api/leagues/${leagueId}/seasons`),
        ]);

        if (!leagueRes.ok) throw new Error('Failed to fetch league');
        if (!seasonsRes.ok) throw new Error('Failed to fetch seasons');

        const leagueData = await leagueRes.json();
        const seasonsData = await seasonsRes.json();

        setLeagueName(leagueData.name);
        setSeasons(seasonsData.data || []);

        // Auto-select active season, or first season
        const active = seasonsData.data?.find((s: Season) => s.status === 'active');
        if (active) {
          setSelectedSeasonId(active.id);
        } else if (seasonsData.data?.length > 0) {
          setSelectedSeasonId(seasonsData.data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [leagueId]);

  // Fetch matchups when season changes
  useEffect(() => {
    if (!selectedSeasonId) return;

    async function fetchWeeks() {
      setIsLoadingWeeks(true);
      try {
        const response = await fetch(
          `/api/leagues/${leagueId}/seasons/${selectedSeasonId}/matchups`
        );
        if (!response.ok) throw new Error('Failed to fetch schedule');
        const data = await response.json();
        setWeeks(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
      } finally {
        setIsLoadingWeeks(false);
      }
    }

    fetchWeeks();
  }, [leagueId, selectedSeasonId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-cream-400 rounded w-48 mb-2" />
          <div className="h-4 bg-cream-400 rounded w-32" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-5 bg-cream-400 rounded w-24 mb-4" />
            <div className="space-y-3">
              <div className="h-12 bg-cream-400 rounded" />
              <div className="h-12 bg-cream-400 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/leagues/${leagueId}`}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal transition-colors mb-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {leagueName}
          </Link>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Schedule</h1>
        </div>

        {/* Season Selector */}
        {seasons.length > 1 && (
          <div>
            <select
              value={selectedSeasonId || ''}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="input"
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} {season.status === 'active' ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-status-error border border-status-error-text/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-status-error-text flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-status-error-text text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading weeks */}
      {isLoadingWeeks && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-cream-400 rounded w-24 mb-4" />
              <div className="space-y-3">
                <div className="h-12 bg-cream-400 rounded" />
                <div className="h-12 bg-cream-400 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No seasons */}
      {!isLoadingWeeks && seasons.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-muted">No seasons created yet.</p>
        </div>
      )}

      {/* No weeks */}
      {!isLoadingWeeks && selectedSeasonId && weeks.length === 0 && (
        <div className="card p-12 text-center">
          <div className="h-16 w-16 bg-cream-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-serif font-medium text-charcoal mb-2">No schedule yet</h3>
          <p className="text-muted text-sm">
            The schedule hasn&apos;t been generated for this season yet.
          </p>
        </div>
      )}

      {/* Weeks */}
      {!isLoadingWeeks && weeks.map((week) => {
        const completedCount = week.matchups.filter((m) => m.status === 'completed').length;
        const totalCount = week.matchups.filter((m) => m.status !== 'bye').length;

        return (
          <div key={week.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-serif font-semibold text-charcoal">
                Week {week.week_number}
              </h2>
              <div className="flex items-center gap-3">
                {week.course && (
                  <span className="text-sm text-muted">{week.course.name}</span>
                )}
                {totalCount > 0 && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    completedCount === totalCount
                      ? 'bg-secondary/20 text-secondary-700'
                      : 'bg-cream-300 text-muted'
                  }`}>
                    {completedCount === totalCount
                      ? 'Complete'
                      : `${completedCount}/${totalCount} played`}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {week.matchups.map((matchup) => (
                <MatchupCard
                  key={matchup.id}
                  playerA={matchup.player_a.player.name}
                  playerB={matchup.player_b?.player.name ?? null}
                  scoreA={matchup.result?.score_a ?? null}
                  scoreB={matchup.result?.score_b ?? null}
                  status={matchup.status}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
