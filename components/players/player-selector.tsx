'use client';

import { useState, useEffect } from 'react';
import PlayerCreateModal from './player-create-modal';

interface Player {
  id: string;
  name: string;
  email?: string | null;
  current_handicap?: number | string | null;
  rounds_played: number;
  is_user: boolean;
}

interface PlayerSelectorProps {
  selectedPlayerIds: string[];
  onChange: (playerIds: string[]) => void;
  maxPlayers?: number;
  requireCurrentUser?: boolean;
}

export default function PlayerSelector({
  selectedPlayerIds,
  onChange,
  maxPlayers = 4,
  requireCurrentUser = true,
}: PlayerSelectorProps) {
  const [ownPlayer, setOwnPlayer] = useState<Player | null>(null);
  const [guestPlayers, setGuestPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  // Auto-select current user if required
  useEffect(() => {
    if (requireCurrentUser && ownPlayer && !selectedPlayerIds.includes(ownPlayer.id)) {
      onChange([ownPlayer.id, ...selectedPlayerIds]);
    }
  }, [ownPlayer, requireCurrentUser]);

  async function fetchPlayers() {
    try {
      const response = await fetch('/api/players');
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const data = await response.json();
      setOwnPlayer(data.own_player);
      setGuestPlayers(data.guest_players);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  const togglePlayer = (playerId: string) => {
    // Don't allow deselecting current user if required
    if (requireCurrentUser && ownPlayer?.id === playerId && selectedPlayerIds.includes(playerId)) {
      return;
    }

    if (selectedPlayerIds.includes(playerId)) {
      onChange(selectedPlayerIds.filter((id) => id !== playerId));
    } else if (selectedPlayerIds.length < maxPlayers) {
      onChange([...selectedPlayerIds, playerId]);
    }
  };

  const removePlayer = (playerId: string) => {
    if (requireCurrentUser && ownPlayer?.id === playerId) {
      return;
    }
    onChange(selectedPlayerIds.filter((id) => id !== playerId));
  };

  const handlePlayerCreated = (player: Player) => {
    setGuestPlayers((prev) => [...prev, player]);
    if (selectedPlayerIds.length < maxPlayers) {
      onChange([...selectedPlayerIds, player.id]);
    }
  };

  const allPlayers = [...(ownPlayer ? [ownPlayer] : []), ...guestPlayers];
  const selectedPlayers = allPlayers.filter((p) => selectedPlayerIds.includes(p.id));

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-gray-200 rounded-lg"></div>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Players Chips */}
      {selectedPlayers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPlayers.map((player) => (
            <div
              key={player.id}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                player.is_user
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  player.is_user ? 'bg-primary/20' : 'bg-gray-200'
                }`}
              >
                {player.name.charAt(0).toUpperCase()}
              </span>
              <span>{player.name}</span>
              {player.current_handicap !== null && player.current_handicap !== undefined && (
                <span className="text-xs opacity-70">
                  ({Number(player.current_handicap).toFixed(1)})
                </span>
              )}
              {(!requireCurrentUser || !player.is_user) && (
                <button
                  onClick={() => removePlayer(player.id)}
                  className="ml-1 p-0.5 hover:bg-black/10 rounded-full transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Player Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {selectedPlayerIds.length} of {maxPlayers} players selected
        </span>
        {selectedPlayerIds.length >= maxPlayers && (
          <span className="text-amber-600">Maximum reached</span>
        )}
      </div>

      {/* Player List */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {/* Current User */}
        {ownPlayer && (
          <label
            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
              requireCurrentUser ? 'opacity-75' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={selectedPlayerIds.includes(ownPlayer.id)}
              onChange={() => togglePlayer(ownPlayer.id)}
              disabled={requireCurrentUser && selectedPlayerIds.includes(ownPlayer.id)}
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50"
            />
            <div
              className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold"
            >
              {ownPlayer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-golf-text truncate">{ownPlayer.name}</span>
                <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">You</span>
              </div>
              {ownPlayer.current_handicap !== null && ownPlayer.current_handicap !== undefined && (
                <p className="text-xs text-gray-500">
                  HCP: {Number(ownPlayer.current_handicap).toFixed(1)}
                </p>
              )}
            </div>
          </label>
        )}

        {/* Guest Players */}
        {guestPlayers.map((player) => (
          <label
            key={player.id}
            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedPlayerIds.length >= maxPlayers && !selectedPlayerIds.includes(player.id)
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            <input
              type="checkbox"
              checked={selectedPlayerIds.includes(player.id)}
              onChange={() => togglePlayer(player.id)}
              disabled={selectedPlayerIds.length >= maxPlayers && !selectedPlayerIds.includes(player.id)}
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50"
            />
            <div
              className="h-8 w-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold"
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-golf-text truncate block">{player.name}</span>
              {player.current_handicap !== null && player.current_handicap !== undefined && (
                <p className="text-xs text-gray-500">
                  HCP: {Number(player.current_handicap).toFixed(1)}
                </p>
              )}
            </div>
          </label>
        ))}

        {/* Empty State */}
        {guestPlayers.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No playing partners yet
          </div>
        )}
      </div>

      {/* Add New Player Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors border border-dashed border-primary/30"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add New Player
      </button>

      {/* Create Modal */}
      <PlayerCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePlayerCreated}
      />
    </div>
  );
}
