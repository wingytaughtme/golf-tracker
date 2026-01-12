'use client';

import { useState } from 'react';
import PlayerForm, { PlayerFormData } from './player-form';

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

interface PlayerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (player: Player) => void;
}

export default function PlayerCreateModal({ isOpen, onClose, onCreated }: PlayerCreateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (data: PlayerFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email || null,
          ghin_number: data.ghin_number || null,
          handicap: data.handicap ? parseFloat(data.handicap) : null,
          home_course_id: data.home_course_id || null,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to create player');
      }

      const newPlayer = await response.json();
      onCreated({
        ...newPlayer,
        is_user: false,
        rounds_played: 0,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create player');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-golf-text">Add Player</h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <PlayerForm
            onSubmit={handleSubmit}
            onCancel={handleClose}
            submitLabel="Add Player"
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
