'use client';

import { useState, useEffect } from 'react';
import { useOfflineStore } from '@/stores/offline-store';

interface OfflineIndicatorProps {
  roundId: string;
}

export default function OfflineIndicator({ roundId }: OfflineIndicatorProps) {
  const {
    isOnline,
    isSyncing,
    lastSyncError,
    pendingChanges,
    getPendingForRound,
  } = useOfflineStore();

  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [previousPendingCount, setPreviousPendingCount] = useState(0);

  const pendingForRound = getPendingForRound(roundId);
  const totalPending = pendingChanges.length;

  // Show success message when sync completes
  useEffect(() => {
    if (previousPendingCount > 0 && pendingForRound.length === 0 && isOnline) {
      setShowSyncSuccess(true);
      const timer = setTimeout(() => setShowSyncSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    setPreviousPendingCount(pendingForRound.length);
  }, [pendingForRound.length, isOnline, previousPendingCount]);

  // Don't show anything if online with no pending changes and no recent sync
  if (isOnline && totalPending === 0 && !showSyncSuccess && !isSyncing) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-score-bogey text-white px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
              <span className="font-medium">You&apos;re offline</span>
            </div>
            <div className="text-sm opacity-90">
              Scores saved locally
            </div>
          </div>
        </div>
      )}

      {/* Pending Changes Banner */}
      {isOnline && pendingForRound.length > 0 && !isSyncing && (
        <div className="bg-secondary text-secondary-900 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 flex-shrink-0 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="font-medium">
                {pendingForRound.length} change{pendingForRound.length !== 1 ? 's' : ''} pending sync
              </span>
            </div>
            <div className="text-sm opacity-90">
              Will sync automatically
            </div>
          </div>
        </div>
      )}

      {/* Syncing Banner */}
      {isSyncing && (
        <div className="bg-primary text-white px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            <span className="font-medium">Syncing changes...</span>
          </div>
        </div>
      )}

      {/* Sync Error Banner */}
      {lastSyncError && !isSyncing && (
        <div className="bg-score-triple text-white px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="font-medium">Sync failed</span>
            </div>
            <div className="text-sm opacity-90">
              Will retry automatically
            </div>
          </div>
        </div>
      )}

      {/* Sync Success Banner */}
      {showSyncSuccess && (
        <div className="bg-score-birdie text-white px-4 py-2 animate-in slide-in-from-top duration-300">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">All changes synced</span>
          </div>
        </div>
      )}
    </div>
  );
}
