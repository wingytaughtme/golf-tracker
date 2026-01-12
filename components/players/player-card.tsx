'use client';

import Link from 'next/link';

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    email?: string | null;
    current_handicap?: number | string | null;
    rounds_played: number;
    is_user: boolean;
    home_course?: {
      name: string;
      city: string;
      state: string;
    } | null;
  };
  highlighted?: boolean;
  onDelete?: (playerId: string) => void;
}

export default function PlayerCard({ player, highlighted = false, onDelete }: PlayerCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && !player.is_user) {
      if (confirm(`Are you sure you want to delete ${player.name}?`)) {
        onDelete(player.id);
      }
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md ${
        highlighted
          ? 'border-primary/30 ring-2 ring-primary/10'
          : 'border-gray-100'
      }`}
    >
      <div className="p-5">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-golf-text truncate">
                {player.name}
              </h3>
              {player.is_user && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  You
                </span>
              )}
            </div>
            {player.email && (
              <p className="text-gray-500 text-sm mt-0.5 truncate">{player.email}</p>
            )}
          </div>

          {/* Avatar */}
          <div
            className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-lg font-semibold ${
              player.is_user
                ? 'bg-primary/10 text-primary'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {player.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span className="text-sm text-gray-600">
              {player.current_handicap !== null && player.current_handicap !== undefined
                ? `${Number(player.current_handicap).toFixed(1)} HCP`
                : 'No handicap'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-sm text-gray-600">
              {player.rounds_played} round{player.rounds_played !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {player.home_course && (
          <div className="flex items-center gap-1.5 mt-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
              />
            </svg>
            <span className="text-sm text-gray-500 truncate">
              {player.home_course.name}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          <Link
            href={`/players/${player.id}`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            View Profile
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {!player.is_user && onDelete && (
            <button
              onClick={handleDelete}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete player"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
