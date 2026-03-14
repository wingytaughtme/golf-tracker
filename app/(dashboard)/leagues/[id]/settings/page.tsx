'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import InviteLink from '@/components/leagues/invite-link';
import ScheduleEditor from '@/components/leagues/schedule-editor';

interface LeaguePlayer {
  id: string;
  role: string;
  user: { name: string | null };
  player: { id: string; name: string };
}

interface Season {
  id: string;
  name: string;
  status: string;
}

interface League {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  is_commissioner: boolean;
  players: LeaguePlayer[];
  seasons: Season[];
}

export default function LeagueSettingsPage() {
  const params = useParams();
  const leagueId = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Remove player state
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeague() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/leagues/${leagueId}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error('League not found');
          throw new Error('Failed to fetch league');
        }

        const data = await response.json();

        if (!data.is_commissioner) {
          setError('Access denied. Only the commissioner can manage league settings.');
          setIsLoading(false);
          return;
        }

        setLeague(data);
        setEditName(data.name);
        setEditDescription(data.description || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeague();
  }, [leagueId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`/api/leagues/${leagueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update league');
      }

      setLeague((prev) => prev ? { ...prev, name: editName.trim(), description: editDescription.trim() || null } : prev);
      setSaveMessage({ type: 'success', text: 'League updated successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePlayer = async (leaguePlayerId: string, playerName: string) => {
    if (!confirm(`Remove ${playerName} from the league? They can rejoin with the invite link.`)) return;

    setRemovingPlayerId(leaguePlayerId);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/players/${leaguePlayerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove player');
      }

      setLeague((prev) => prev ? {
        ...prev,
        players: prev.players.filter((p) => p.id !== leaguePlayerId),
      } : prev);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove player');
    } finally {
      setRemovingPlayerId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="animate-pulse">
          <div className="h-6 bg-cream-400 rounded w-48 mb-2" />
          <div className="h-4 bg-cream-400 rounded w-32" />
        </div>
        <div className="card p-6 animate-pulse">
          <div className="h-10 bg-cream-400 rounded mb-4" />
          <div className="h-20 bg-cream-400 rounded" />
        </div>
      </div>
    );
  }

  if (error && !league) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <Link
          href={`/leagues/${leagueId}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to League
        </Link>
        <div className="card p-12 text-center">
          <div className="h-16 w-16 bg-status-error rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-status-error-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-serif font-medium text-charcoal mb-2">Access Denied</h3>
          <p className="text-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!league) return null;

  const activeSeason = league.seasons.find((s) => s.status === 'active') || league.seasons[0];
  const nonCommissionerPlayers = league.players.filter((p) => p.role !== 'commissioner');

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href={`/leagues/${leagueId}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal transition-colors mb-4"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {league.name}
        </Link>
        <h1 className="text-2xl font-serif font-bold text-charcoal">League Settings</h1>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          saveMessage.type === 'success'
            ? 'bg-score-birdie/10 text-score-birdie border border-score-birdie/30'
            : 'bg-status-error border border-status-error-text/30 text-status-error-text'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Edit League Info */}
      <div className="card p-6">
        <h2 className="text-lg font-serif font-semibold text-charcoal mb-4">League Info</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="name" className="label">League Name</label>
            <input
              id="name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input"
              required
              maxLength={100}
            />
          </div>
          <div>
            <label htmlFor="description" className="label">Description</label>
            <textarea
              id="description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="input min-h-[80px] resize-y"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={isSaving || !editName.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Invite Link */}
      <div className="card p-6">
        <h2 className="text-lg font-serif font-semibold text-charcoal mb-2">Invite Link</h2>
        <p className="text-sm text-muted mb-4">
          Share this link to invite players to your league.
        </p>
        <InviteLink
          inviteCode={league.invite_code}
          leagueId={leagueId}
          isCommissioner={true}
        />
      </div>

      {/* Players */}
      <div className="card p-6">
        <h2 className="text-lg font-serif font-semibold text-charcoal mb-4">
          Players ({league.players.length})
        </h2>
        <div className="divide-y divide-card-border">
          {league.players.map((lp) => (
            <div key={lp.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-cream-400 flex items-center justify-center text-sm font-medium text-muted">
                  {lp.player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal">{lp.player.name}</p>
                  {lp.role === 'commissioner' && (
                    <p className="text-xs text-secondary-700">Commissioner</p>
                  )}
                </div>
              </div>
              {lp.role !== 'commissioner' && (
                <button
                  onClick={() => handleRemovePlayer(lp.id, lp.player.name)}
                  disabled={removingPlayerId === lp.id}
                  className="p-1.5 text-muted hover:text-status-error-text hover:bg-status-error rounded transition-colors disabled:opacity-50"
                  title={`Remove ${lp.player.name}`}
                >
                  {removingPlayerId === lp.id ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
        {nonCommissionerPlayers.length === 0 && (
          <p className="text-sm text-muted py-2">No other players yet. Share the invite link above.</p>
        )}
      </div>

      {/* Schedule Generation */}
      {activeSeason && (
        <div className="card p-6">
          <h2 className="text-lg font-serif font-semibold text-charcoal mb-2">Schedule</h2>
          <p className="text-sm text-muted mb-4">
            Generate a round-robin schedule for &quot;{activeSeason.name}&quot;.
            Each player will play every other player once.
          </p>
          <ScheduleEditor
            leagueId={leagueId}
            seasonId={activeSeason.id}
            playerCount={league.players.length}
          />
        </div>
      )}

      {!activeSeason && league.seasons.length === 0 && (
        <div className="card p-6 text-center">
          <p className="text-muted text-sm">
            No seasons created yet. A season was not created when the league was set up.
            Season management is coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
