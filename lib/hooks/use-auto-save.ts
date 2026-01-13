'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useScorecardStore, type ScoreEntry } from '@/stores/scorecard-store';

interface UseAutoSaveOptions {
  roundId: string;
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  enabled?: boolean;
}

interface ScoreUpdate {
  scoreId: string;
  strokes: number | null;
  putts: number | null;
  fairway_hit: boolean | null;
  green_in_regulation: boolean | null;
}

export function useAutoSave({
  roundId,
  debounceMs = 2000,
  maxRetries = 3,
  retryDelayMs = 5000,
  enabled = true,
}: UseAutoSaveOptions) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const {
    isDirty,
    getDirtyScores,
    markAsSaved,
    setSaveStatus,
    retryCount,
    incrementRetryCount,
    resetRetryCount,
    loadFromLocalStorage,
    scores,
  } = useScorecardStore();

  // Save function that calls the API
  const saveScores = useCallback(async (dirtyScores: ScoreEntry[]) => {
    if (!isMountedRef.current || dirtyScores.length === 0) return;

    setSaveStatus('saving');

    const scoreUpdates: ScoreUpdate[] = dirtyScores.map((entry) => ({
      scoreId: entry.scoreId,
      strokes: entry.current.strokes,
      putts: entry.current.putts,
      fairway_hit: entry.current.fairway_hit,
      green_in_regulation: entry.current.green_in_regulation,
    }));

    try {
      const response = await fetch(`/api/rounds/${roundId}/scores`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: scoreUpdates }),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      const data = await response.json();

      if (!isMountedRef.current) return;

      // Mark as saved with the server timestamp
      const savedAt = data.saved_at ? new Date(data.saved_at) : new Date();
      markAsSaved(savedAt);
      resetRetryCount();
    } catch (error) {
      if (!isMountedRef.current) return;

      console.error('Auto-save error:', error);

      // Check if we're offline
      if (!navigator.onLine) {
        setSaveStatus('offline', 'No internet connection');
        return;
      }

      // Increment retry count and schedule retry if under max
      incrementRetryCount();

      if (retryCount < maxRetries) {
        setSaveStatus('error', `Save failed. Retrying in ${retryDelayMs / 1000}s...`);

        retryTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            const currentDirty = getDirtyScores();
            if (currentDirty.length > 0) {
              saveScores(currentDirty);
            }
          }
        }, retryDelayMs);
      } else {
        setSaveStatus('error', 'Save failed. Changes saved locally.');
      }
    }
  }, [roundId, markAsSaved, setSaveStatus, retryCount, incrementRetryCount, resetRetryCount, getDirtyScores, maxRetries, retryDelayMs]);

  // Debounced save trigger
  const triggerSave = useCallback(() => {
    if (!enabled) return;

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear any pending retry
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      const dirtyScores = getDirtyScores();
      if (dirtyScores.length > 0) {
        saveScores(dirtyScores);
      }
    }, debounceMs);
  }, [enabled, debounceMs, getDirtyScores, saveScores]);

  // Watch for dirty state changes and trigger save
  useEffect(() => {
    if (isDirty && enabled) {
      triggerSave();
    }
  }, [isDirty, enabled, triggerSave, scores]); // Include scores to detect changes

  // Restore from localStorage on mount
  useEffect(() => {
    if (!enabled) return;

    const localData = loadFromLocalStorage();
    if (localData && localData.scores) {
      // Check if localStorage has newer data than what we have
      // This would indicate unsaved changes from a previous session
      const hasUnsavedChanges = Object.values(localData.scores).some(
        (entry) => entry.isDirty
      );

      if (hasUnsavedChanges) {
        console.log('Found unsaved changes in localStorage, will sync on next change');
        setSaveStatus('offline', 'Restoring unsaved changes...');

        // Trigger a save after a short delay to sync localStorage data
        setTimeout(() => {
          const dirtyScores = getDirtyScores();
          if (dirtyScores.length > 0) {
            saveScores(dirtyScores);
          }
        }, 1000);
      }
    }
  }, [enabled, loadFromLocalStorage, setSaveStatus, getDirtyScores, saveScores]);

  // Handle online/offline events
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      console.log('Back online, checking for unsaved changes...');
      const dirtyScores = getDirtyScores();
      if (dirtyScores.length > 0) {
        resetRetryCount();
        saveScores(dirtyScores);
      }
    };

    const handleOffline = () => {
      setSaveStatus('offline', 'No internet connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, getDirtyScores, saveScores, setSaveStatus, resetRetryCount]);

  // Save before page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const dirtyScores = getDirtyScores();
      if (dirtyScores.length > 0) {
        // Try a synchronous save using sendBeacon
        const scoreUpdates: ScoreUpdate[] = dirtyScores.map((entry) => ({
          scoreId: entry.scoreId,
          strokes: entry.current.strokes,
          putts: entry.current.putts,
          fairway_hit: entry.current.fairway_hit,
          green_in_regulation: entry.current.green_in_regulation,
        }));

        const blob = new Blob([JSON.stringify({ scores: scoreUpdates })], {
          type: 'application/json',
        });

        navigator.sendBeacon(`/api/rounds/${roundId}/scores`, blob);

        // Show browser warning
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, roundId, getDirtyScores]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // Manual save function for immediate save
  const saveNow = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const dirtyScores = getDirtyScores();
    if (dirtyScores.length > 0) {
      saveScores(dirtyScores);
    }
  }, [getDirtyScores, saveScores]);

  return { saveNow, triggerSave };
}
