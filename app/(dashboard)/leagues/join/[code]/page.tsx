'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface LeagueInfo {
  id: string;
  name: string;
  description: string | null;
  status: string;
  commissioner_name: string | null;
  member_count: number;
}

export default function JoinLeaguePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [league, setLeague] = useState<LeagueInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeague() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/leagues/join/${code}`);

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 404) {
            throw new Error('Invalid invite code. Please check the link and try again.');
          }
          if (response.status === 409) {
            throw new Error(data.error || 'You are already a member of this league.');
          }
          if (response.status === 410) {
            throw new Error('This league is no longer active.');
          }
          throw new Error(data.error || 'Failed to fetch league info');
        }

        const data = await response.json();
        setLeague(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeague();
  }, [code]);

  const handleJoin = async () => {
    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch(`/api/leagues/join/${code}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Already a member — redirect to league page
          if (league) {
            router.push(`/leagues/${league.id}`);
            return;
          }
          throw new Error(data.error || 'You are already a member of this league.');
        }
        throw new Error(data.error || 'Failed to join league');
      }

      router.push(`/leagues/${data.league_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join league');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="card p-8 animate-pulse">
          <div className="h-6 bg-cream-400 rounded w-48 mb-4" />
          <div className="h-4 bg-cream-400 rounded w-full mb-2" />
          <div className="h-4 bg-cream-400 rounded w-3/4 mb-6" />
          <div className="h-10 bg-cream-400 rounded" />
        </div>
      </div>
    );
  }

  if (error && !league) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="card p-8 text-center">
          <div className="h-16 w-16 bg-status-error rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-status-error-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-serif font-medium text-charcoal mb-2">Unable to Join</h3>
          <p className="text-muted text-sm mb-6">{error}</p>
          <Link href="/leagues" className="btn-outline">
            Back to Leagues
          </Link>
        </div>
      </div>
    );
  }

  if (!league) return null;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="card p-8 text-center">
        <div className="h-16 w-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>

        <h2 className="text-xl font-serif font-bold text-charcoal mb-1">
          Join {league.name}
        </h2>
        {league.description && (
          <p className="text-muted text-sm mb-4">{league.description}</p>
        )}

        <div className="flex items-center justify-center gap-4 mb-6">
          {league.commissioner_name && (
            <span className="text-sm text-muted">
              Commissioner: {league.commissioner_name}
            </span>
          )}
          <span className="text-sm text-muted">
            {league.member_count} member{league.member_count !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-status-error border border-status-error-text/30 rounded-xl p-3 mb-4">
            <p className="text-status-error-text text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Joining...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Join League
              </>
            )}
          </button>
          <Link href="/leagues" className="btn-outline w-full text-center">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
