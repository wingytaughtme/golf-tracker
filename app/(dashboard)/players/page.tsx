'use client';

import { useState, useEffect } from 'react';
import PlayerCard from '@/components/players/player-card';
import PlayerCreateModal from '@/components/players/player-create-modal';

interface Player {
  id: string;
  name: string;
  email?: string | null;
  ghin_number?: string | null;
  current_handicap?: number | string | null;
  rounds_played: number;
  is_user: boolean;
  home_course?: {
    id: string;
    name: string;
    city: string;
    state: string;
  } | null;
}

interface PlayersResponse {
  own_player: Player | null;
  guest_players: Player[];
}

export default function PlayersPage() {
  const [ownPlayer, setOwnPlayer] = useState<Player | null>(null);
  const [guestPlayers, setGuestPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    try {
      const response = await fetch('/api/players');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view players');
        }
        throw new Error('Failed to fetch players');
      }
      const data: PlayersResponse = await response.json();
      setOwnPlayer(data.own_player);
      setGuestPlayers(data.guest_players);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  function handlePlayerCreated(player: Player) {
    setGuestPlayers((prev) => [...prev, player]);
  }

  async function handleDeletePlayer(playerId: string) {
    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete player');
      }

      setGuestPlayers((prev) => prev.filter((p) => p.id !== playerId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete player');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-golf-text">Players</h1>
          <p className="text-gray-600 mt-1">Manage your playing partners</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Player
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex gap-3 mt-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Players Grid */}
      {!isLoading && !error && (
        <>
          {/* Your Profile */}
          {ownPlayer && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Your Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <PlayerCard player={ownPlayer} highlighted />
              </div>
            </div>
          )}

          {/* Guest Players */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Playing Partners ({guestPlayers.length})
            </h2>
            {guestPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {guestPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onDelete={handleDeletePlayer}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No playing partners yet</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Add players to track their scores and handicaps
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-primary hover:text-primary-600 font-medium text-sm"
                >
                  Add your first player
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Player Modal */}
      <PlayerCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePlayerCreated}
      />
    </div>
  );
}
