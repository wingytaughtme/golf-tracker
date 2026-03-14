'use client';

import { useState } from 'react';

interface ScheduleEditorProps {
  leagueId: string;
  seasonId: string;
  playerCount: number;
}

export default function ScheduleEditor({ leagueId, seasonId, playerCount }: ScheduleEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGenerate = async () => {
    if (playerCount < 2) {
      setMessage({ type: 'error', text: 'Need at least 2 players to generate a schedule.' });
      return;
    }

    if (!confirm(
      `This will generate a round-robin schedule for ${playerCount} players. ` +
      `This will create ${playerCount % 2 === 0 ? playerCount - 1 : playerCount} weeks of matchups. Continue?`
    )) {
      return;
    }

    setIsGenerating(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/leagues/${leagueId}/seasons/${seasonId}/matchups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'round_robin' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate schedule');
      }

      const data = await response.json();
      setMessage({
        type: 'success',
        text: `Schedule generated: ${data.weeks_created} weeks, ${data.total_matchups} matchups.`,
      });

      // Refresh the page to show the new schedule
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to generate schedule',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={isGenerating || playerCount < 2}
        className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Auto-Generate Round Robin
          </>
        )}
      </button>

      {playerCount < 2 && (
        <p className="text-sm text-muted mt-2">Add at least 2 players to generate a schedule.</p>
      )}

      {message && (
        <div className={`mt-3 px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === 'success'
            ? 'bg-score-birdie/10 text-score-birdie border border-score-birdie/30'
            : 'bg-status-error border border-status-error-text/30 text-status-error-text'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
