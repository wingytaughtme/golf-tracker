'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScorecardStore } from '@/stores/scorecard-store';

interface ScorecardControlsProps {
  roundId: string;
  onSaveNow: () => void;
  totalHoles: number;
  holesCompleted: number;
  front9Completed: number;
  back9Completed: number;
}

export default function ScorecardControls({
  roundId,
  onSaveNow,
  totalHoles,
  holesCompleted,
  front9Completed,
  back9Completed,
}: ScorecardControlsProps) {
  const router = useRouter();
  const { isDirty, isSaving } = useScorecardStore();

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'complete' | 'abandon' | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedNine, setSelectedNine] = useState<'front' | 'back' | 'full'>('full');

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const allHolesComplete = holesCompleted >= totalHoles;
  const front9Complete = front9Completed >= 9;
  const back9Complete = back9Completed >= 9;
  const canComplete = allHolesComplete || front9Complete || back9Complete;

  // Set default selection based on what's complete
  useEffect(() => {
    if (allHolesComplete) {
      setSelectedNine('full');
    } else if (front9Complete && !back9Complete) {
      setSelectedNine('front');
    } else if (back9Complete && !front9Complete) {
      setSelectedNine('back');
    }
  }, [allHolesComplete, front9Complete, back9Complete]);

  const handleSaveAndExit = async () => {
    if (isDirty) {
      onSaveNow();
      // Wait a moment for save to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    router.push('/dashboard');
  };

  const handleCompleteRound = async () => {
    if (!isOnline) {
      setError('You appear to be offline. Please check your connection and try again.');
      return;
    }

    setIsCompleting(true);
    setError(null);
    setLastAction('complete');

    try {
      // Save any pending changes first
      if (isDirty) {
        onSaveNow();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const response = await fetch(`/api/rounds/${roundId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nineHoleMode: selectedNine !== 'full' ? selectedNine : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete round');
      }

      // Navigate to summary page
      router.push(`/rounds/${roundId}/summary`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete round';
      setError(errorMessage);
      setIsCompleting(false);
    }
  };

  const handleAbandonRound = async () => {
    if (!isOnline) {
      setError('You appear to be offline. Please check your connection and try again.');
      return;
    }

    setIsAbandoning(true);
    setError(null);
    setLastAction('abandon');

    try {
      const response = await fetch(`/api/rounds/${roundId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'abandoned' }),
      });

      if (!response.ok) {
        throw new Error('Failed to abandon round');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to abandon round');
      setIsAbandoning(false);
    }
  };

  const handleRetry = () => {
    if (lastAction === 'complete') {
      handleCompleteRound();
    } else if (lastAction === 'abandon') {
      handleAbandonRound();
    }
  };

  const dismissError = () => {
    setError(null);
    setLastAction(null);
  };

  return (
    <>
      {/* Control Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0 shadow-lg transition-all duration-200">
        {/* Offline Warning */}
        {!isOnline && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">You&apos;re offline</p>
              <p className="text-xs text-amber-600">Your scores are saved locally and will sync when you&apos;re back online.</p>
            </div>
          </div>
        )}

        {/* Error with Retry */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleRetry}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={dismissError}
                    className="px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-800 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {/* Left side - Save & Exit */}
          <button
            onClick={handleSaveAndExit}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            <span className="hidden sm:inline">Save & Exit</span>
            <span className="sm:hidden">Exit</span>
          </button>

          {/* Right side - Complete / Abandon */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbandonDialog(true)}
              className="px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <span className="hidden sm:inline">Abandon Round</span>
              <span className="sm:hidden">Abandon</span>
            </button>

            <button
              onClick={() => setShowCompleteDialog(true)}
              disabled={!canComplete}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">Complete Round</span>
              <span className="sm:hidden">Complete</span>
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        {!allHolesComplete && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            <span>Front 9: {front9Completed}/9</span>
            <span className="mx-2">•</span>
            <span>Back 9: {back9Completed}/9</span>
            {canComplete && !allHolesComplete && (
              <span className="ml-2 text-green-600 font-medium">
                ({front9Complete ? 'Front' : 'Back'} 9 ready!)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Complete Round Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
            onClick={() => !isCompleting && setShowCompleteDialog(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Complete Round?
            </h3>
            <p className="text-gray-600 mb-4">
              This will finalize your round and calculate your handicap differential.
              You won&apos;t be able to edit scores after completing.
            </p>

            {/* 9-hole options when not all 18 are complete */}
            {!allHolesComplete && (front9Complete || back9Complete) && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Submit as:</p>
                <div className="space-y-2">
                  {front9Complete && (
                    <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedNine === 'front' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="nineHole"
                        checked={selectedNine === 'front'}
                        onChange={() => setSelectedNine('front')}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">Front 9 only</span>
                        <span className="text-sm text-gray-500 ml-2">({front9Completed} holes)</span>
                      </div>
                      {selectedNine === 'front' && (
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  )}
                  {back9Complete && (
                    <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedNine === 'back' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="nineHole"
                        checked={selectedNine === 'back'}
                        onChange={() => setSelectedNine('back')}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">Back 9 only</span>
                        <span className="text-sm text-gray-500 ml-2">({back9Completed} holes)</span>
                      </div>
                      {selectedNine === 'back' && (
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  9-hole rounds count toward your handicap. Two 9-hole rounds can combine into an 18-hole score.
                </p>
              </div>
            )}

            {/* Show completion status for 18-hole rounds */}
            {allHolesComplete && (
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700">All holes completed:</span>
                  <span className="font-semibold text-green-700">{holesCompleted} / {totalHoles}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteDialog(false)}
                disabled={isCompleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteRound}
                disabled={isCompleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCompleting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Completing...
                  </>
                ) : (
                  selectedNine === 'full' ? 'Complete 18 Holes' : `Complete ${selectedNine === 'front' ? 'Front' : 'Back'} 9`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abandon Round Dialog */}
      {showAbandonDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
            onClick={() => !isAbandoning && setShowAbandonDialog(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Abandon Round?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to abandon this round? Your scores will be saved
              but the round won&apos;t count toward your handicap.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-amber-800">
                  This action cannot be undone. Consider completing the round if you&apos;ve played most holes.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAbandonDialog(false)}
                disabled={isAbandoning}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Keep Playing
              </button>
              <button
                onClick={handleAbandonRound}
                disabled={isAbandoning}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAbandoning ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Abandoning...
                  </>
                ) : (
                  'Abandon Round'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
