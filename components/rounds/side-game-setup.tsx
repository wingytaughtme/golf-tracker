'use client';

import { useState } from 'react';

export interface SideGameConfig {
  game_type: 'skins' | 'nassau' | 'match_play';
  config: {
    bet_amount: number;
    gross_net: 'gross' | 'net';
    carryover?: boolean;
    press_threshold?: number;
    player_a_id?: string;
    player_b_id?: string;
  };
}

interface Player {
  player_id: string;
  name: string;
}

interface SideGameSetupProps {
  players: Player[];
  games: SideGameConfig[];
  onChange: (games: SideGameConfig[]) => void;
}

const GAME_TYPE_LABELS = {
  skins: 'Skins',
  nassau: 'Nassau',
  match_play: 'Match Play',
};

export default function SideGameSetup({ players, games, onChange }: SideGameSetupProps) {
  const [isEnabled, setIsEnabled] = useState(games.length > 0);

  const addGame = (type: SideGameConfig['game_type']) => {
    if (games.length >= 3) return;
    const newGame: SideGameConfig = {
      game_type: type,
      config: {
        bet_amount: type === 'skins' ? 1 : 5,
        gross_net: 'gross',
        carryover: type === 'skins' ? true : undefined,
        press_threshold: type === 'nassau' ? 2 : undefined,
        player_a_id: players.length >= 2 ? players[0].player_id : undefined,
        player_b_id: players.length >= 2 ? players[1].player_id : undefined,
      },
    };
    onChange([...games, newGame]);
  };

  const removeGame = (index: number) => {
    const updated = games.filter((_, i) => i !== index);
    onChange(updated);
    if (updated.length === 0) setIsEnabled(false);
  };

  const updateGame = (index: number, updates: Partial<SideGameConfig['config']>) => {
    const updated = games.map((g, i) =>
      i === index ? { ...g, config: { ...g.config, ...updates } } : g
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-charcoal mb-2">Side Games</h2>
        <p className="text-muted text-sm">Add optional wagers to make the round more interesting</p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between p-4 bg-cream-300 rounded-lg">
        <span className="font-medium text-charcoal">Playing any side games?</span>
        <button
          onClick={() => {
            setIsEnabled(!isEnabled);
            if (isEnabled) onChange([]);
          }}
          className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors ${
            isEnabled ? 'bg-primary' : 'bg-cream-500'
          }`}
          role="switch"
          aria-checked={isEnabled}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            isEnabled ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {isEnabled && (
        <>
          {/* Game List */}
          {games.map((game, idx) => (
            <div key={idx} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-charcoal">{GAME_TYPE_LABELS[game.game_type]}</h3>
                <button onClick={() => removeGame(idx)} className="text-muted hover:text-score-triple">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Bet Amount */}
                <div>
                  <label className="text-xs text-muted block mb-1">
                    {game.game_type === 'skins' ? 'Per Skin ($)' : 'Bet Amount ($)'}
                  </label>
                  <input
                    type="number"
                    value={game.config.bet_amount}
                    onChange={e => updateGame(idx, { bet_amount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="1"
                    className="input text-sm"
                  />
                </div>

                {/* Gross/Net */}
                <div>
                  <label className="text-xs text-muted block mb-1">Mode</label>
                  <select
                    value={game.config.gross_net}
                    onChange={e => updateGame(idx, { gross_net: e.target.value as 'gross' | 'net' })}
                    className="input text-sm"
                  >
                    <option value="gross">Gross</option>
                    <option value="net">Net (Handicap)</option>
                  </select>
                </div>
              </div>

              {/* Skins-specific: Carryover */}
              {game.game_type === 'skins' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={game.config.carryover || false}
                    onChange={e => updateGame(idx, { carryover: e.target.checked })}
                    className="rounded border-card-border"
                    id={`carryover-${idx}`}
                  />
                  <label htmlFor={`carryover-${idx}`} className="text-sm text-charcoal">Carryover ties</label>
                </div>
              )}

              {/* Nassau-specific: Press */}
              {game.game_type === 'nassau' && (
                <div>
                  <label className="text-xs text-muted block mb-1">Auto-press when down by</label>
                  <select
                    value={game.config.press_threshold || 0}
                    onChange={e => updateGame(idx, { press_threshold: parseInt(e.target.value) || undefined })}
                    className="input text-sm w-32"
                  >
                    <option value="0">No auto-press</option>
                    <option value="2">2 holes</option>
                    <option value="3">3 holes</option>
                  </select>
                </div>
              )}

              {/* Player pairing for Nassau/Match Play with >2 players */}
              {(game.game_type === 'nassau' || game.game_type === 'match_play') && players.length > 2 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted block mb-1">Player A</label>
                    <select value={game.config.player_a_id || ''} onChange={e => updateGame(idx, { player_a_id: e.target.value })}
                      className="input text-sm">
                      {players.map(p => <option key={p.player_id} value={p.player_id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">Player B</label>
                    <select value={game.config.player_b_id || ''} onChange={e => updateGame(idx, { player_b_id: e.target.value })}
                      className="input text-sm">
                      {players.map(p => <option key={p.player_id} value={p.player_id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Game Buttons */}
          {games.length < 3 && (
            <div className="flex gap-2">
              {!games.some(g => g.game_type === 'skins') && (
                <button onClick={() => addGame('skins')}
                  className="flex-1 py-2 px-3 border border-card-border rounded-lg text-sm text-charcoal hover:border-secondary/50 hover:bg-cream-300 transition-colors">
                  + Skins
                </button>
              )}
              {!games.some(g => g.game_type === 'nassau') && players.length >= 2 && (
                <button onClick={() => addGame('nassau')}
                  className="flex-1 py-2 px-3 border border-card-border rounded-lg text-sm text-charcoal hover:border-secondary/50 hover:bg-cream-300 transition-colors">
                  + Nassau
                </button>
              )}
              {!games.some(g => g.game_type === 'match_play') && players.length >= 2 && (
                <button onClick={() => addGame('match_play')}
                  className="flex-1 py-2 px-3 border border-card-border rounded-lg text-sm text-charcoal hover:border-secondary/50 hover:bg-cream-300 transition-colors">
                  + Match Play
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
