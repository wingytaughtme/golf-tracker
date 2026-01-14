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
  display_number?: number;
  nine_index?: number;
  nine_name?: string;
}

interface Score {
  id: string;
  strokes: number | null;
  putts: number | null;
  fairway_hit: boolean | null;
  green_in_regulation: boolean | null;
  hole: {
    id: string;
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
  showDetailedStats?: boolean;
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
  showDetailedStats = false,
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
            <span className="text-muted">Saving...</span>
          </>
        );

      case 'saved':
        return (
          <>
            <svg
              className="h-4 w-4 text-score-birdie"
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
            <span className="text-score-birdie">Saved {formatLastSaved()}</span>
          </>
        );

      case 'error':
        return (
          <>
            <svg
              className="h-4 w-4 text-score-triple"
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
            <span className="text-score-triple">{saveError || 'Save failed'}</span>
            <button
              onClick={saveNow}
              className="ml-2 text-xs text-secondary hover:text-secondary-600 font-medium"
            >
              Retry
            </button>
          </>
        );

      case 'offline':
        return (
          <>
            <svg
              className="h-4 w-4 text-score-bogey"
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
            <span className="text-score-bogey">Offline - changes saved locally</span>
          </>
        );

      case 'idle':
      default:
        if (isDirty) {
          return (
            <>
              <div className="h-2 w-2 rounded-full bg-score-bogey animate-pulse" />
              <span className="text-score-bogey">Unsaved changes</span>
            </>
          );
        }
        if (lastSaved) {
          return (
            <>
              <div className="h-2 w-2 rounded-full bg-score-birdie" />
              <span className="text-muted">Saved {formatLastSaved()}</span>
            </>
          );
        }
        return (
          <>
            <div className="h-2 w-2 rounded-full bg-cream-400" />
            <span className="text-muted">Tap a cell to enter score</span>
          </>
        );
    }
  };

  // Force re-render when scores change (for save status updates)
  const _scoreKeys = Object.keys(scores);
  void _scoreKeys; // Intentional: triggers re-render

  // Calculate player totals and stats for summary cards
  const getPlayerStats = (roundPlayer: RoundPlayer) => {
    const playerScores = roundPlayer.scores || [];
    const completedScores = playerScores.filter(s => s.strokes !== null);
    const grossScore = completedScores.reduce((sum, s) => sum + (s.strokes || 0), 0);
    const totalPar = completedScores.reduce((sum, s) => sum + (s.hole?.par || 0), 0);
    const vsPar = grossScore - totalPar;

    return {
      grossScore: completedScores.length > 0 ? grossScore : null,
      vsPar: completedScores.length > 0 ? vsPar : null,
      playingHandicap: roundPlayer.playing_handicap,
      netScore: roundPlayer.playing_handicap && completedScores.length > 0
        ? grossScore - Math.round(roundPlayer.playing_handicap)
        : null,
    };
  };

  return (
    <div className="bg-cream rounded-xl shadow-lg overflow-hidden">
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
        <div className="bg-cream-300 px-4 py-2 border-b border-card-border flex items-center justify-between">
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
                  : 'text-muted bg-card border border-card-border hover:bg-cream-200'
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
        <div className="bg-secondary/10 px-4 py-2 border-b border-secondary/20 text-sm text-secondary-700">
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
        showDetailedStats={showDetailedStats}
      />

      {/* Player Summary Cards */}
      {!isEditable && roundPlayers.length > 0 && (
        <div className="px-4 py-4 bg-cream-200 border-t border-card-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roundPlayers.map((roundPlayer) => {
              const stats = getPlayerStats(roundPlayer);
              const initials = roundPlayer.player.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={roundPlayer.id}
                  className="bg-card rounded-lg border-2 border-secondary/30 p-3 flex items-center gap-3"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-charcoal font-bold text-lg flex-shrink-0">
                    {initials}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal truncate">{roundPlayer.player.name}</p>
                    {stats.playingHandicap !== null && (
                      <p className="text-xs text-muted">HCP: {Number(stats.playingHandicap).toFixed(1)}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted">Gross</p>
                      <p className="text-lg font-bold text-charcoal">
                        {stats.grossScore ?? '-'}
                      </p>
                    </div>
                    {stats.netScore !== null && (
                      <div>
                        <p className="text-xs text-muted">Net</p>
                        <p className="text-lg font-bold text-charcoal">
                          {stats.netScore}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted">vs Par</p>
                      <p className={`text-lg font-bold ${
                        stats.vsPar === null ? 'text-muted' :
                        stats.vsPar === 0 ? 'text-charcoal' :
                        stats.vsPar < 0 ? 'text-score-birdie' : 'text-score-bogey'
                      }`}>
                        {stats.vsPar === null ? '-' :
                         stats.vsPar === 0 ? 'E' :
                         stats.vsPar > 0 ? `+${stats.vsPar}` : stats.vsPar}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score Summary Row */}
      <div className="bg-cream-300 px-4 py-3 border-t border-card-border">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-muted">Total Par:</span>
              <span className="ml-2 font-bold text-charcoal">{holes.reduce((sum, h) => sum + h.par, 0)}</span>
            </div>
            <div>
              <span className="text-muted">Total Yards:</span>
              <span className="ml-2 font-bold text-charcoal">{holes.reduce((sum, h) => sum + h.distance, 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted">Rating/Slope:</span>
              <span className="ml-2 font-bold text-charcoal">{teeSet.course_rating} / {teeSet.slope_rating}</span>
            </div>
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
