'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useOfflineStore } from '@/stores/offline-store';
import { useScorecardStore } from '@/stores/scorecard-store';

interface UseOfflineSyncOptions {
  roundId: string;
  enabled?: boolean;
}

export function useOfflineSync({ roundId, enabled = true }: UseOfflineSyncOptions) {
  const syncInProgressRef = useRef(false);

  const {
    isOnline,
    isSyncing,
    lastSyncAt,
    lastSyncError,
    setOnlineStatus,
    addPendingChange,
    clearPendingChanges,
    setSyncing,
    setSyncError,
    markSynced,
    loadFromStorage,
    getPendingCount,
    getPendingForRound,
  } = useOfflineStore();

  const { markAsSaved, saveToLocalStorage } = useScorecardStore();

  // Sync pending changes to server
  const syncPendingChanges = useCallback(async () => {
    if (!isOnline || syncInProgressRef.current) return;

    const pending = getPendingForRound(roundId);
    if (pending.length === 0) return;

    syncInProgressRef.current = true;
    setSyncing(true);
    setSyncError(null);

    try {
      // Group changes by round for batch update
      const scoreUpdates = pending.map((change) => ({
        scoreId: change.scoreId,
        strokes: change.data.strokes,
        putts: change.data.putts,
        fairway_hit: change.data.fairway_hit,
        green_in_regulation: change.data.green_in_regulation,
      }));

      const response = await fetch(`/api/rounds/${roundId}/scores`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: scoreUpdates }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      // Success - clear synced changes
      clearPendingChanges(roundId);
      markSynced();
      markAsSaved(new Date());

      console.log(`[OfflineSync] Synced ${pending.length} changes`);
    } catch (error) {
      console.error('[OfflineSync] Sync failed:', error);
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setSyncing(false);
      syncInProgressRef.current = false;
    }
  }, [
    isOnline,
    roundId,
    getPendingForRound,
    clearPendingChanges,
    markSynced,
    markAsSaved,
    setSyncing,
    setSyncError,
  ]);

  // Queue a change for offline sync
  const queueChange = useCallback(
    (scoreId: string, data: {
      strokes: number | null;
      putts: number | null;
      fairway_hit: boolean | null;
      green_in_regulation: boolean | null;
    }) => {
      addPendingChange({
        roundId,
        scoreId,
        data,
      });

      // Also save to localStorage as backup
      saveToLocalStorage();

      // If online, try to sync immediately
      if (isOnline && !syncInProgressRef.current) {
        // Small delay to batch rapid changes
        setTimeout(() => syncPendingChanges(), 500);
      }
    },
    [roundId, addPendingChange, saveToLocalStorage, isOnline, syncPendingChanges]
  );

  // Online/offline event listeners
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      console.log('[OfflineSync] Back online');
      setOnlineStatus(true);

      // Sync pending changes when back online
      setTimeout(() => syncPendingChanges(), 1000);
    };

    const handleOffline = () => {
      console.log('[OfflineSync] Went offline');
      setOnlineStatus(false);
    };

    // Set initial status
    setOnlineStatus(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, setOnlineStatus, syncPendingChanges]);

  // Load pending changes from storage on mount
  useEffect(() => {
    if (!enabled) return;
    loadFromStorage();
  }, [enabled, loadFromStorage]);

  // Listen for service worker sync messages
  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.serviceWorker) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_PENDING_SCORES') {
        syncPendingChanges();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [enabled, syncPendingChanges]);

  // Sync on visibility change (when user returns to tab)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnline) {
        syncPendingChanges();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isOnline, syncPendingChanges]);

  return {
    isOnline,
    isSyncing,
    lastSyncAt,
    lastSyncError,
    pendingCount: getPendingCount(),
    pendingForRound: getPendingForRound(roundId).length,
    queueChange,
    syncNow: syncPendingChanges,
  };
}
