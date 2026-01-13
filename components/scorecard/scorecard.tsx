'use client';

import { useEffect, useState } from 'react';
import ScorecardHeader from './scorecard-header';
import ScorecardGrid from './scorecard-grid';
import { useScorecardStore } from '@/stores/scorecard-store';
import { useAutoSave } from '@/lib/hooks/use-auto-save';

interface Hole {
  id: string;
  hole_number: number;
  par: number;
  distance: number;
  handicap_index: number;
}

interface Score {
  id: string;
  strokes: number | null;
  putts: number | null;
  fairway_hit: boolean | null;
  green_in_regulation: boolean | null;
  hole: {
    hole_number: number;
    par: number;
  };
}

interface RoundPlayer {
  id: string;
  playing_handicap: number | null;
  gross_score: number | null;
  player: {
    id: string;
    name: string;
  };
  scores: Score[];
}

interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface TeeSet {
  id: string;
  name: string;
  color: string;
  course_rating: number;
  slope_rating: number;
  total_yardage: number | null;
}

interface ScorecardProps {
  roundId: string;
  course: Course;
  teeSet: TeeSet;
  holes: Hole[];
  roundPlayers: RoundPlayer[];
  datePlayed: string;
  weather?: string | null;
  temperature?: number | null;
  isEditable?: boolean;
}

export default function Scorecard({
  roundId,
  course,
  teeSet,
  holes,
  roundPlayers,
  datePlayed,
  weather,
  temperature,
  isEditable = false,
}: ScorecardProps) {
  const {
    isDirty,
    saveStatus,
    saveError,
    lastSaved,
    loadFromLocalStorage,
    scores,
  } = useScorecardStore();

  const [gridMode, setGridMode] = useState(false);

  // Use auto-save hook when editable
  const { saveNow } = useAutoSave({
    roundId,
    debounceMs: 2000,
    maxRetries: 3,
    enabled: isEditable,
  });

  // Check for localStorage backup on mount
  useEffect(() => {
    if (!isEditable) return;

    const localData = loadFromLocalStorage();
    if (localData) {
      // Check if there are unsaved changes from a previous session
      const hasUnsaved = Object.values(localData.scores).some((s) => s.isDirty);
      if (hasUnsaved) {
        console.log('Found unsaved changes from previous session');
      }
    }
  }, [isEditable, loadFromLocalStorage]);

  const formatLastSaved = () => {
    if (!lastSaved) return null;

    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins === 1) {
      return '1 min ago';
    } else if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else {
      return lastSaved.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-gray-600">Saving...</span>
          </>
        );

      case 'saved':
        return (
          <>
            <svg
              className="h-4 w-4 text-green-500"
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
            <span className="text-green-600">Saved {formatLastSaved()}</span>
          </>
        );

      case 'error':
        return (
          <>
            <svg
              className="h-4 w-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-600">{saveError || 'Save failed'}</span>
            <button
              onClick={saveNow}
              className="ml-2 text-xs text-primary hover:text-primary-600 font-medium"
            >
              Retry
            </button>
          </>
        );

      case 'offline':
        return (
          <>
            <svg
              className="h-4 w-4 text-amber-500"
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
            <span className="text-amber-600">Offline - changes saved locally</span>
          </>
        );

      case 'idle':
      default:
        if (isDirty) {
          return (
            <>
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-600">Unsaved changes</span>
            </>
          );
        }
        if (lastSaved) {
          return (
            <>
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-gray-500">Saved {formatLastSaved()}</span>
            </>
          );
        }
        return (
          <>
            <div className="h-2 w-2 rounded-full bg-gray-300" />
            <span className="text-gray-500">Tap a cell to enter score</span>
          </>
        );
    }
  };

  // Force re-render when scores change (for save status updates)
  const scoreKeys = Object.keys(scores);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with course info */}
      <ScorecardHeader
        courseName={course.name}
        courseLocation={`${course.city}, ${course.state}`}
        datePlayed={datePlayed}
        teeSetName={teeSet.name}
        teeSetColor={teeSet.color}
        courseRating={Number(teeSet.course_rating)}
        slopeRating={teeSet.slope_rating}
        weather={weather}
        temperature={temperature}
      />

      {/* Save Status Bar (only in edit mode) */}
      {isEditable && (
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {renderSaveStatus()}
          </div>

          <div className="flex items-center gap-2">
            {/* Grid Mode Toggle */}
            <button
              onClick={() => setGridMode(!gridMode)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                flex items-center gap-1.5
                ${gridMode
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">{gridMode ? 'Grid Mode' : 'Quick Entry'}</span>
            </button>

            {/* Manual save button */}
            {isDirty && (
              <button
                onClick={saveNow}
                disabled={saveStatus === 'saving'}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                Save Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid Mode Instructions */}
      {isEditable && gridMode && (
        <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 text-sm text-blue-700">
          <span className="font-medium">Quick Entry Mode:</span>
          {' '}Type numbers directly, use Tab/Enter or Arrow keys to navigate. Changes save automatically.
        </div>
      )}

      {/* Scorecard Grid */}
      <ScorecardGrid
        roundId={roundId}
        holes={holes}
        roundPlayers={roundPlayers}
        teeSetName={teeSet.name}
        isEditable={isEditable}
        gridMode={gridMode}
        onGridModeChange={setGridMode}
      />

      {/* Legend */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <span className="font-semibold">Score Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 font-bold text-xs shadow-sm">2</div>
            <span>Eagle+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">3</div>
            <span>Birdie</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-white flex items-center justify-center font-bold text-xs text-gray-800">4</div>
            <span>Par</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-red-50 border-2 border-red-400 flex items-center justify-center font-bold text-xs text-red-700">5</div>
            <span>Bogey</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-red-100 border-2 border-red-500 ring-2 ring-red-500 ring-offset-1 flex items-center justify-center font-bold text-xs text-red-800">6</div>
            <span>Double</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-red-700 flex items-center justify-center font-bold text-xs text-white">7</div>
            <span>Triple+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export sub-components for flexibility
export { ScorecardHeader, ScorecardGrid };
export { default as ScorecardRow } from './scorecard-row';
export { default as ScoreCell } from './score-cell';
export { default as ScoreInput } from './score-input';
