'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Scorecard } from '@/components/scorecard';
import ScorecardControls from '@/components/scorecard/scorecard-controls';
import OfflineIndicator from '@/components/scorecard/offline-indicator';
import { useScorecardStore } from '@/stores/scorecard-store';
import { useOfflineSync } from '@/lib/hooks/use-offline-sync';
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes';
import { useToast } from '@/components/ui/toast';
import { SkeletonScorecard, SkeletonStatCard } from '@/components/ui/skeleton';

interface Hole {
  id: string;
  hole_number: number;
  par: number;
  distance: number;
  handicap_index: number;
}

interface Score {
  id: string;
  strokes: number | null;
  putts: number | null;
  fairway_hit: boolean | null;
  green_in_regulation: boolean | null;
  hole: {
    id: string;
    hole_number: number;
    par: number;
    distance: number;
    handicap_index: number;
  };
}

interface RoundPlayer {
  id: string;
  playing_handicap: number | null;
  gross_score: number | null;
  net_score: number | null;
  player: {
    id: string;
    name: string;
  };
  scores: Score[];
  stats?: {
    holes_completed: number;
    total_strokes: number;
    total_par: number;
    score_to_par: number | null;
  };
}

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
    total_yardage: number | null;
    holes?: Hole[];
  };
  round_players: RoundPlayer[];
  holes?: Hole[];
}

export default function RoundDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [round, setRound] = useState<Round | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit details modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    date_played: '',
    round_type: 'casual' as 'casual' | 'tournament' | 'practice',
    weather: '',
    temperature: '',
    notes: '',
  });
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Edit scores mode for completed rounds
  const [isEditingScores, setIsEditingScores] = useState(false);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [editScoresError, setEditScoresError] = useState<string | null>(null);

  // Edit history
  const [editHistory, setEditHistory] = useState<Array<{
    id: string;
    edited_at: string;
    edited_by: string;
    player_name: string;
    hole_number: number;
    old_strokes: number | null;
    new_strokes: number | null;
  }>>([]);
  const [showEditHistory, setShowEditHistory] = useState(false);

  // User preferences
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  const { scores: storeScores, getDirtyScores, initializeScores, resetStore, isDirty } = useScorecardStore();

  // Toast notifications
  const toast = useToast();

  // Unsaved changes warning
  useUnsavedChanges({
    isDirty,
    message: 'You have unsaved scores. Are you sure you want to leave?',
    enabled: round?.status === 'in_progress',
  });

  // Offline sync hook - only enable for in-progress rounds
  const {
    isOnline,
    queueChange,
  } = useOfflineSync({
    roundId: id,
    enabled: true,
  });

  useEffect(() => {
    async function fetchRound() {
      try {
        // Use cache: 'no-store' to ensure fresh data on every navigation
        const response = await fetch(`/api/rounds/${id}`, {
          cache: 'no-store',
        });
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

  // Fetch user preferences
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          setShowDetailedStats(data.track_detailed_stats ?? false);
        }
      } catch {
        // Silently fail - detailed stats is optional
      }
    }

    fetchPreferences();
  }, []);

  // Calculate holes completed from store (for in-progress rounds)
  const calculateHolesCompleted = useCallback(() => {
    if (!round) return { total: 0, front9: 0, back9: 0 };

    // Get unique holes with scores across all players
    const holesWithScores = new Set<number>();

    // First check the store for current values
    Object.values(storeScores).forEach((entry) => {
      if (entry.current.strokes !== null) {
        holesWithScores.add(entry.holeNumber);
      }
    });

    // If store is empty, fall back to round data
    if (holesWithScores.size === 0) {
      round.round_players.forEach((rp) => {
        rp.scores.forEach((score) => {
          if (score.strokes !== null) {
            holesWithScores.add(score.hole.hole_number);
          }
        });
      });
    }

    // Count front 9 (holes 1-9) and back 9 (holes 10-18)
    let front9 = 0;
    let back9 = 0;
    holesWithScores.forEach((holeNum) => {
      if (holeNum <= 9) {
        front9++;
      } else {
        back9++;
      }
    });

    return { total: holesWithScores.size, front9, back9 };
  }, [round, storeScores]);

  // Manual save function to pass to controls
  const handleSaveNow = useCallback(async () => {
    const dirtyScores = getDirtyScores();
    if (dirtyScores.length === 0) return;

    // If offline, queue changes for later sync
    if (!isOnline) {
      dirtyScores.forEach((entry) => {
        queueChange(entry.scoreId, {
          strokes: entry.current.strokes,
          putts: entry.current.putts,
          fairway_hit: entry.current.fairway_hit,
          green_in_regulation: entry.current.green_in_regulation,
        });
      });
      return;
    }

    const scoreUpdates = dirtyScores.map((entry) => ({
      scoreId: entry.scoreId,
      strokes: entry.current.strokes,
      putts: entry.current.putts,
      fairway_hit: entry.current.fairway_hit,
      green_in_regulation: entry.current.green_in_regulation,
    }));

    try {
      const response = await fetch(`/api/rounds/${id}/scores`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: scoreUpdates }),
      });
      if (response.ok) {
        toast.success('Scores saved');
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      console.error('Failed to save:', err);
      // If save fails due to network error, queue for offline sync
      dirtyScores.forEach((entry) => {
        queueChange(entry.scoreId, {
          strokes: entry.current.strokes,
          putts: entry.current.putts,
          fairway_hit: entry.current.fairway_hit,
          green_in_regulation: entry.current.green_in_regulation,
        });
      });
      toast.info('Saved offline - will sync when connected');
    }
  }, [id, getDirtyScores, isOnline, queueChange, toast]);

  // Open edit modal with current values
  const openEditModal = useCallback(() => {
    if (!round) return;
    setEditForm({
      date_played: round.date_played.split('T')[0],
      round_type: round.round_type,
      weather: round.weather || '',
      temperature: round.temperature?.toString() || '',
      notes: round.notes || '',
    });
    setEditError(null);
    setShowEditModal(true);
  }, [round]);

  // Save round details
  const handleSaveDetails = async () => {
    if (!round) return;
    setIsSavingDetails(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/rounds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_played: editForm.date_played,
          round_type: editForm.round_type,
          weather: editForm.weather || null,
          temperature: editForm.temperature || null,
          notes: editForm.notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update round');
      }

      const updatedRound = await response.json();
      setRound((prev) => prev ? { ...prev, ...updatedRound } : prev);
      setShowEditModal(false);
      toast.success('Round details updated');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save changes');
      toast.error('Failed to save details');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Start editing scores on a completed round
  const startEditingScores = useCallback(() => {
    if (!round) return;

    // Initialize the store with current scores
    const allScores = round.round_players.flatMap((rp) =>
      rp.scores.map((score) => ({
        id: score.id,
        roundPlayerId: rp.id,
        holeId: score.hole.id,
        holeNumber: score.hole.hole_number,
        par: score.hole.par,
        strokes: score.strokes,
        putts: score.putts,
        fairway_hit: score.fairway_hit,
        green_in_regulation: score.green_in_regulation,
      }))
    );

    initializeScores(round.id, allScores);
    setIsEditingScores(true);
    setEditScoresError(null);
  }, [round, initializeScores]);

  // Cancel editing scores
  const cancelEditingScores = useCallback(() => {
    resetStore();
    setIsEditingScores(false);
    setEditScoresError(null);
  }, [resetStore]);

  // Save edited scores
  const saveEditedScores = async () => {
    if (!round) return;

    const dirtyScores = getDirtyScores();
    if (dirtyScores.length === 0) {
      setIsEditingScores(false);
      return;
    }

    setIsSavingScores(true);
    setEditScoresError(null);

    try {
      const scoreUpdates = dirtyScores.map((entry) => ({
        scoreId: entry.scoreId,
        strokes: entry.current.strokes,
        putts: entry.current.putts,
      }));

      const response = await fetch(`/api/rounds/${id}/edit-scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: scoreUpdates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save changes');
      }

      // Refresh round data
      const roundResponse = await fetch(`/api/rounds/${id}`, {
        cache: 'no-store',
      });
      if (roundResponse.ok) {
        const updatedRound = await roundResponse.json();
        setRound(updatedRound);
      }

      // Refresh edit history
      fetchEditHistory();

      resetStore();
      setIsEditingScores(false);
      toast.success('Scores updated successfully');
    } catch (err) {
      setEditScoresError(err instanceof Error ? err.message : 'Failed to save changes');
      toast.error('Failed to save score changes');
    } finally {
      setIsSavingScores(false);
    }
  };

  // Fetch edit history
  const fetchEditHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/rounds/${id}/edit-scores`);
      if (response.ok) {
        const data = await response.json();
        setEditHistory(data.edits || []);
      }
    } catch {
      // Silently fail - edit history is not critical
    }
  }, [id]);

  // Fetch edit history when viewing a completed round
  useEffect(() => {
    if (round?.status === 'completed') {
      fetchEditHistory();
    }
  }, [round?.status, fetchEditHistory]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      in_progress: 'badge-warning',
      completed: 'badge-success',
      abandoned: 'badge',
    };
    const labels: Record<string, string> = {
      in_progress: 'In Progress',
      completed: 'Completed',
      abandoned: 'Abandoned',
    };
    return (
      <span className={styles[status]}>
        {labels[status]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <div className="h-4 bg-cream-400 rounded w-24 mb-4 animate-pulse" />
          <div className="flex items-start justify-between">
            <div>
              <div className="h-8 bg-cream-400 rounded w-64 mb-2 animate-pulse" />
              <div className="h-4 bg-cream-400 rounded w-48 animate-pulse" />
            </div>
            <div className="h-8 bg-cream-400 rounded-full w-24 animate-pulse" />
          </div>
        </div>

        {/* Scorecard skeleton */}
        <SkeletonScorecard />

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="space-y-6">
        <Link
          href="/rounds"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-secondary transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rounds
        </Link>
        <div className="bg-status-error border border-status-error-text/30 rounded-xl p-6 text-center">
          <p className="text-status-error-text">{error || 'Round not found'}</p>
        </div>
      </div>
    );
  }

  // Get holes from either the round or tee_set
  const holes = round.holes || round.tee_set.holes || [];
  const totalHoles = holes.length;
  const completionStatus = calculateHolesCompleted();
  const holesCompleted = completionStatus.total;

  const isInProgress = round.status === 'in_progress';
  const isCompleted = round.status === 'completed';
  // Scorecard is editable when in progress OR when editing a completed round
  const isEditable = isInProgress || isEditingScores;

  return (
    <div className={`space-y-6 ${isEditable || isEditingScores ? 'pb-24' : ''}`}>
      {/* Offline Indicator - only show for in-progress rounds */}
      {isInProgress && <OfflineIndicator roundId={id} />}

      {/* Header - Condensed Layout */}
      <div className="space-y-1">
        {/* Row 1: Back Link */}
        <Link
          href={isInProgress ? '/dashboard' : '/rounds'}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-secondary transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {isInProgress ? 'Dashboard' : 'Back to Rounds'}
        </Link>

        {/* Row 2: Course Name + Actions */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-serif font-bold text-charcoal">{round.course.name}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusBadge(round.status)}
            <button
              onClick={openEditModal}
              className="px-3 py-1 text-sm font-medium text-muted hover:text-charcoal hover:bg-cream-400 rounded-lg transition-colors"
            >
              Edit Details
            </button>
            {isCompleted && !isEditingScores && (
              <button
                onClick={startEditingScores}
                className="px-3 py-1 text-sm font-medium text-secondary hover:text-secondary-600 hover:bg-secondary/10 rounded-lg transition-colors"
              >
                Edit Scores
              </button>
            )}
            {isCompleted && !isEditingScores && (
              <Link
                href={`/rounds/${round.id}/summary`}
                className="px-3 py-1 text-sm font-medium text-secondary hover:text-secondary-600 transition-colors"
              >
                View Summary
              </Link>
            )}
          </div>
        </div>

        {/* Row 3: Location */}
        <p className="text-sm text-gray-500">{round.course.city}, {round.course.state}</p>
      </div>

      {/* Scorecard */}
      {holes.length > 0 ? (
        <Scorecard
          roundId={round.id}
          course={round.course}
          teeSet={round.tee_set}
          holes={holes}
          roundPlayers={round.round_players}
          datePlayed={round.date_played}
          weather={round.weather}
          temperature={round.temperature}
          isEditable={isEditable}
          showDetailedStats={showDetailedStats}
        />
      ) : (
        <div className="card p-8 text-center">
          <p className="text-muted">No hole data available for this round.</p>
        </div>
      )}

      {/* In-Progress Stats Summary */}
      {isEditable && round.round_players.some((rp) => rp.stats?.holes_completed && rp.stats.holes_completed > 0) && (
        <div className="card p-6">
          <h2 className="text-lg font-serif font-semibold text-charcoal mb-4">Current Standings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {round.round_players.map((rp) => (
              <div key={rp.id} className="bg-cream-300 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {rp.player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">{rp.player.name}</p>
                    {rp.playing_handicap !== null && (
                      <p className="text-xs text-muted">HCP: {Number(rp.playing_handicap).toFixed(1)}</p>
                    )}
                  </div>
                </div>
                {rp.stats && rp.stats.holes_completed > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted">Thru</p>
                      <p className="font-semibold text-charcoal">
                        {rp.stats.holes_completed === totalHoles ? 'F' : rp.stats.holes_completed}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Score</p>
                      <p className="font-semibold text-charcoal">{rp.stats.total_strokes}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted">vs Par</p>
                      <p className={`font-semibold ${
                        rp.stats.score_to_par !== null
                          ? rp.stats.score_to_par < 0
                            ? 'text-score-birdie'
                            : rp.stats.score_to_par > 0
                            ? 'text-score-bogey'
                            : 'text-charcoal'
                          : ''
                      }`}>
                        {rp.stats.score_to_par !== null
                          ? rp.stats.score_to_par > 0
                            ? `+${rp.stats.score_to_par}`
                            : rp.stats.score_to_par === 0
                            ? 'E'
                            : rp.stats.score_to_par
                          : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Scores - Only for completed rounds */}
      {!isEditable && round.round_players.length > 0 && (
        <div className="border border-[#B59A58] rounded-lg bg-[#FDFBF7]">
          <div className="p-6">
            <h2 className="text-lg font-serif font-bold text-charcoal mb-4">Final Scores</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {round.round_players.map((roundPlayer) => {
                const playerScores = roundPlayer.scores || [];
                const completedScores = playerScores.filter(s => s.strokes !== null);
                const grossScore = completedScores.length > 0
                  ? completedScores.reduce((sum, s) => sum + (s.strokes || 0), 0)
                  : null;
                const totalPar = completedScores.reduce((sum, s) => sum + (s.hole?.par || 0), 0);
                const vsPar = grossScore !== null ? grossScore - totalPar : null;
                const netScore = roundPlayer.playing_handicap && grossScore !== null
                  ? grossScore - Math.round(Number(roundPlayer.playing_handicap))
                  : null;

                const initials = roundPlayer.player.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                // Vs Par color coding
                const vsParColor = vsPar === null ? 'text-gray-400' :
                  vsPar < 0 ? 'text-[#355E3B]' :
                  vsPar > 0 ? 'text-[#8C3A3A]' : 'text-[#2C5530]';

                return (
                  <div
                    key={roundPlayer.id}
                    className="bg-card rounded-lg border border-[#B59A58] p-3"
                  >
                    {/* Player Header */}
                    <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-card-border">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-charcoal font-bold text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif font-bold text-charcoal text-sm truncate">{roundPlayer.player.name}</p>
                        {roundPlayer.playing_handicap !== null && (
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">HCP {Number(roundPlayer.playing_handicap).toFixed(1)}</p>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid - Compact 3-column layout */}
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Gross</p>
                        <p className="text-2xl font-bold font-serif text-charcoal leading-none">
                          {grossScore ?? '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Net</p>
                        <p className="text-2xl font-bold font-serif text-charcoal leading-none">
                          {netScore ?? '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">vs Par</p>
                        <p className={`text-2xl font-bold font-serif leading-none ${vsParColor}`}>
                          {vsPar === null ? '-' :
                           vsPar === 0 ? 'E' :
                           vsPar > 0 ? `+${vsPar}` : vsPar}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {round.notes && (
        <div className="border border-[#B59A58] rounded-lg bg-[#FDFBF7] p-6">
          <h2 className="text-lg font-serif font-bold text-charcoal mb-2">Notes</h2>
          <p className="text-muted">{round.notes}</p>
        </div>
      )}

      {/* Controls for in-progress rounds */}
      {isInProgress && (
        <ScorecardControls
          roundId={round.id}
          onSaveNow={handleSaveNow}
          totalHoles={totalHoles}
          holesCompleted={holesCompleted}
          front9Completed={completionStatus.front9}
          back9Completed={completionStatus.back9}
        />
      )}

      {/* Controls for editing completed rounds */}
      {isEditingScores && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border shadow-lg p-4 z-40">
          <div className="max-w-4xl mx-auto">
            {editScoresError && (
              <div className="mb-3 p-2 bg-status-error border border-status-error-text/30 rounded-lg text-sm text-status-error-text">
                {editScoresError}
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted">
                <span className="font-medium text-secondary">Editing completed round</span>
                {' '}- Changes will be logged
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelEditingScores}
                  disabled={isSavingScores}
                  className="btn-outline disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedScores}
                  disabled={isSavingScores}
                  className="btn-primary disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingScores ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit History */}
      {isCompleted && editHistory.length > 0 && !isEditingScores && (
        <div className="border border-[#B59A58] rounded-lg bg-[#FDFBF7] p-6">
          <button
            onClick={() => setShowEditHistory(!showEditHistory)}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-lg font-serif font-bold text-charcoal">
              Edit History ({editHistory.length} change{editHistory.length !== 1 ? 's' : ''})
            </h2>
            <svg
              className={`h-5 w-5 text-muted transition-transform ${showEditHistory ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showEditHistory && (
            <div className="mt-4 space-y-3">
              {editHistory.map((edit) => (
                <div key={edit.id} className="flex items-start gap-3 text-sm border-l-2 border-secondary pl-3">
                  <div className="flex-1">
                    <p className="text-charcoal">
                      <span className="font-medium">{edit.player_name}</span>
                      {' '}hole {edit.hole_number}:{' '}
                      <span className="text-muted">{edit.old_strokes ?? '-'}</span>
                      {' → '}
                      <span className="font-medium">{edit.new_strokes ?? '-'}</span>
                    </p>
                    <p className="text-muted text-xs">
                      {new Date(edit.edited_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {' by '}{edit.edited_by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isSavingDetails && setShowEditModal(false)}
          />
          <div className="relative bg-card rounded-xl shadow-elevated max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-secondary">
            <h3 className="text-lg font-serif font-semibold text-charcoal mb-4">Edit Round Details</h3>

            {editError && (
              <div className="mb-4 p-3 bg-status-error border border-status-error-text/30 rounded-lg text-sm text-status-error-text">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="label">
                  Date Played
                </label>
                <input
                  type="date"
                  value={editForm.date_played}
                  onChange={(e) => setEditForm({ ...editForm, date_played: e.target.value })}
                  className="input"
                />
              </div>

              {/* Round Type */}
              <div>
                <label className="label">
                  Round Type
                </label>
                <select
                  value={editForm.round_type}
                  onChange={(e) => setEditForm({ ...editForm, round_type: e.target.value as 'casual' | 'tournament' | 'practice' })}
                  className="input"
                >
                  <option value="casual">Casual</option>
                  <option value="tournament">Tournament</option>
                  <option value="practice">Practice</option>
                </select>
              </div>

              {/* Weather */}
              <div>
                <label className="label">
                  Weather
                </label>
                <select
                  value={editForm.weather}
                  onChange={(e) => setEditForm({ ...editForm, weather: e.target.value })}
                  className="input"
                >
                  <option value="">Not specified</option>
                  <option value="sunny">Sunny</option>
                  <option value="partly_cloudy">Partly Cloudy</option>
                  <option value="cloudy">Cloudy</option>
                  <option value="rainy">Rainy</option>
                  <option value="windy">Windy</option>
                </select>
              </div>

              {/* Temperature */}
              <div>
                <label className="label">
                  Temperature (°F)
                </label>
                <input
                  type="number"
                  value={editForm.temperature}
                  onChange={(e) => setEditForm({ ...editForm, temperature: e.target.value })}
                  placeholder="e.g., 72"
                  className="input"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="label">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Any notes about this round..."
                  className="input resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSavingDetails}
                className="flex-1 btn-outline disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDetails}
                disabled={isSavingDetails}
                className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingDetails ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
