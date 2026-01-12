'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Round {
  id: string;
  date_played: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  round_type: 'casual' | 'tournament' | 'practice';
  weather?: string | null;
  temperature?: number | null;
  notes?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  course: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
  tee_set: {
    id: string;
    name: string;
    color: string;
    course_rating: number;
    slope_rating: number;
  };
  round_players: {
    id: string;
    playing_handicap?: number | null;
    gross_score?: number | null;
    net_score?: number | null;
    player: {
      id: string;
      name: string;
    };
  }[];
}

export default function RoundDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [round, setRound] = useState<Round | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRound() {
      try {
        const response = await fetch(`/api/rounds/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Round not found');
          }
          throw new Error('Failed to fetch round');
        }
        const data = await response.json();
        setRound(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRound();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      abandoned: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      in_progress: 'In Progress',
      completed: 'Completed',
      abandoned: 'Abandoned',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
          <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="space-y-6">
        <Link
          href="/rounds"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rounds
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error || 'Round not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/rounds"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rounds
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-golf-text">{round.course.name}</h1>
            <p className="text-gray-600 mt-1">
              {round.course.city}, {round.course.state} - {round.tee_set.name} tees
            </p>
          </div>
          {getStatusBadge(round.status)}
        </div>
      </div>

      {/* Round Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Date</p>
            <p className="font-medium text-golf-text">{formatDate(round.date_played)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Type</p>
            <p className="font-medium text-golf-text capitalize">{round.round_type}</p>
          </div>
          {round.weather && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Weather</p>
              <p className="font-medium text-golf-text">{round.weather}</p>
            </div>
          )}
          {round.temperature && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Temperature</p>
              <p className="font-medium text-golf-text">{round.temperature}F</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Course Rating / Slope</p>
          <p className="font-medium text-golf-text">
            {Number(round.tee_set.course_rating).toFixed(1)} / {round.tee_set.slope_rating}
          </p>
        </div>
      </div>

      {/* Players */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-golf-text mb-4">Players</h2>
        <div className="space-y-3">
          {round.round_players.map((rp) => (
            <div
              key={rp.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  {rp.player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-golf-text">{rp.player.name}</p>
                  {rp.playing_handicap !== null && rp.playing_handicap !== undefined && (
                    <p className="text-sm text-gray-500">
                      Playing HCP: {Number(rp.playing_handicap).toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
              {rp.gross_score && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-golf-text">{rp.gross_score}</p>
                  {rp.net_score && (
                    <p className="text-sm text-gray-500">Net: {Number(rp.net_score).toFixed(1)}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scorecard Placeholder */}
      {round.status === 'in_progress' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-golf-text mb-2">Ready to Score</h3>
          <p className="text-gray-500 mb-4">
            The scorecard feature will be available in the next update
          </p>
          <p className="text-sm text-gray-400">
            For now, you can track your scores manually and update the round when complete
          </p>
        </div>
      )}

      {/* Notes */}
      {round.notes && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-golf-text mb-2">Notes</h2>
          <p className="text-gray-600">{round.notes}</p>
        </div>
      )}
    </div>
  );
}
