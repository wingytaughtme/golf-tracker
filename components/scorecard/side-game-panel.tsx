'use client';

import { useState, useEffect, useCallback } from 'react';

interface SideGamePanelProps {
  roundId: string;
}

interface GameData {
  id: string;
  game_type: 'skins' | 'nassau' | 'match_play';
  status: string;
  config: { bet_amount: number; gross_net: string; carryover?: boolean };
  calculated_results: unknown;
}

export default function SideGamePanel({ roundId }: SideGamePanelProps) {
  const [games, setGames] = useState<GameData[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGames = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/rounds/${roundId}/side-games`);
      if (res.ok) {
        const data = await res.json();
        setGames(data.games || []);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [roundId]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Auto-refresh when expanded
  useEffect(() => {
    if (!isExpanded) return;
    const interval = setInterval(fetchGames, 10000);
    return () => clearInterval(interval);
  }, [isExpanded, fetchGames]);

  if (games.length === 0 && !isLoading) return null;

  return (
    <div className="border-t border-card-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-cream-300 hover:bg-cream-400 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-charcoal">
            Side Games ({games.length})
          </span>
        </div>
        <svg className={`h-4 w-4 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 py-3 space-y-3 bg-cream-200">
          {games.map(game => {
            const renderResults = () => {
              if (!game.calculated_results) return null;
              if (game.game_type === 'skins') return <SkinsResults results={game.calculated_results as SkinsResultData} />;
              if (game.game_type === 'nassau') return <NassauResults results={game.calculated_results as NassauResultData} />;
              if (game.game_type === 'match_play') return <MatchPlayResults results={game.calculated_results as MatchPlayResultData} />;
              return null;
            };
            return (
              <div key={game.id} className="bg-card rounded-lg p-3 border border-card-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-charcoal capitalize">
                    {game.game_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-muted">
                    ${game.config.bet_amount} {game.config.gross_net}
                  </span>
                </div>
                {renderResults()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SkinsResultData {
  playerResults: { round_player_id: string; skins_won: number; skins_value: number }[];
  details: { hole: number; winner_id: string | null; value: number; carried_over: boolean }[];
}

function SkinsResults({ results }: { results: SkinsResultData }) {
  const totalCarryover = results.details.filter(d => d.carried_over).length;

  return (
    <div className="space-y-1">
      {results.playerResults.map(p => (
        <div key={p.round_player_id} className="flex justify-between text-sm">
          <span className="text-muted truncate">{p.round_player_id.slice(0, 8)}...</span>
          <span className="font-medium text-charcoal">
            {p.skins_won} skin{p.skins_won !== 1 ? 's' : ''} = ${p.skins_value}
          </span>
        </div>
      ))}
      {totalCarryover > 0 && (
        <p className="text-xs text-score-bogey">{totalCarryover} carryover(s)</p>
      )}
    </div>
  );
}

interface NassauResultData {
  front: { winner_id: string | null; score: number };
  back: { winner_id: string | null; score: number };
  overall: { winner_id: string | null; score: number };
  presses: { start_hole: number; winner_id: string | null; score: number }[];
  player_a_payout: number;
}

function NassauResults({ results }: { results: NassauResultData }) {
  const formatScore = (score: number) => {
    if (score === 0) return 'AS';
    return score > 0 ? `+${score}` : `${score}`;
  };

  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-muted">Front 9</span>
        <span className="font-medium text-charcoal">{formatScore(results.front.score)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted">Back 9</span>
        <span className="font-medium text-charcoal">{formatScore(results.back.score)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted">Overall</span>
        <span className="font-medium text-charcoal">{formatScore(results.overall.score)}</span>
      </div>
      {results.presses.length > 0 && (
        <div className="text-xs text-score-bogey">
          {results.presses.length} press{results.presses.length !== 1 ? 'es' : ''} active
        </div>
      )}
    </div>
  );
}

interface MatchPlayResultData {
  playerA: { match_status: string; result: string };
  playerB: { match_status: string };
}

function MatchPlayResults({ results }: { results: MatchPlayResultData }) {
  return (
    <div className="text-sm">
      <p className="font-medium text-charcoal">{results.playerA.match_status}</p>
      <p className="text-xs text-muted">{results.playerA.result}</p>
    </div>
  );
}
