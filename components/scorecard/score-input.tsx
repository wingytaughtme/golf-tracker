'use client';

import { useEffect, useRef, useState } from 'react';
import { useScorecardStore } from '@/stores/scorecard-store';

interface ScoreInputProps {
  roundPlayerId: string;
  holeNumber: number;
  par: number;
  playerName: string;
  onClose: () => void;
  position: { top: number; left: number };
  showDetailedStats?: boolean;
}

type TabType = 'score' | 'details';

export default function ScoreInput({
  roundPlayerId,
  holeNumber,
  par,
  playerName,
  onClose,
  position,
  showDetailedStats = false,
}: ScoreInputProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { getScore, updateScore, updatePutts, updateFairwayHit, updateGIR, clearScore } = useScorecardStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('score');

  // Trigger entrance animation
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const scoreEntry = getScore(roundPlayerId, holeNumber);
  const currentScore = scoreEntry?.current.strokes ?? null;
  const currentPutts = scoreEntry?.current.putts ?? null;
  const currentFairwayHit = scoreEntry?.current.fairway_hit ?? null;
  const currentGIR = scoreEntry?.current.green_in_regulation ?? null;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const animateScore = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleNumberClick = (num: number) => {
    updateScore(roundPlayerId, holeNumber, num);
    animateScore();
  };

  const handleIncrement = () => {
    const newScore = (currentScore ?? par) + 1;
    if (newScore <= 15) {
      updateScore(roundPlayerId, holeNumber, newScore);
      animateScore();
    }
  };

  const handleDecrement = () => {
    const newScore = (currentScore ?? par) - 1;
    if (newScore >= 1) {
      updateScore(roundPlayerId, holeNumber, newScore);
      animateScore();
    }
  };

  const handleClear = () => {
    clearScore(roundPlayerId, holeNumber);
    animateScore();
  };

  const handlePuttsChange = (putts: number | null) => {
    updatePutts(roundPlayerId, holeNumber, putts);
  };

  const handleFairwayHitChange = (hit: boolean | null) => {
    updateFairwayHit(roundPlayerId, holeNumber, hit);
  };

  const handleGIRChange = (gir: boolean | null) => {
    updateGIR(roundPlayerId, holeNumber, gir);
  };

  const getScoreDisplay = () => {
    if (currentScore === null) return '-';
    return currentScore;
  };

  const getScoreToPar = () => {
    if (currentScore === null) return null;
    const diff = currentScore - par;
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : diff.toString();
  };

  const getScoreColorClass = () => {
    if (currentScore === null) return 'text-muted';
    const diff = currentScore - par;
    if (diff <= -2) return 'text-score-eagle'; // Eagle+
    if (diff === -1) return 'text-score-birdie'; // Birdie
    if (diff === 0) return 'text-charcoal'; // Par
    if (diff === 1) return 'text-score-bogey'; // Bogey
    return 'text-score-double'; // Double+
  };

  // Calculate position to keep popover in viewport
  const getPopoverStyle = () => {
    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
    };

    // Try to position below and centered on the cell
    let top = position.top + 10;
    let left = position.left - 100; // Center the 220px popover

    // Keep within viewport bounds
    if (typeof window !== 'undefined') {
      const popoverWidth = 220;
      const popoverHeight = showDetailedStats ? 420 : 320;

      if (left < 10) left = 10;
      if (left + popoverWidth > window.innerWidth - 10) {
        left = window.innerWidth - popoverWidth - 10;
      }

      if (top + popoverHeight > window.innerHeight - 10) {
        top = position.top - popoverHeight - 10;
      }
    }

    style.top = `${top}px`;
    style.left = `${left}px`;

    return style;
  };

  // Check if fairway stat is applicable (not for par 3s)
  const showFairwayStat = par > 3;

  // Count how many details are filled in
  const detailsCount = [
    currentPutts !== null,
    showFairwayStat && currentFairwayHit !== null,
    currentGIR !== null,
  ].filter(Boolean).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Popover */}
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="score-input-title"
        style={getPopoverStyle()}
        className={`bg-card rounded-xl shadow-2xl border border-card-border w-[220px] overflow-hidden z-50 transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
        }`}
      >
        {/* Header */}
        <div className="bg-primary text-white px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-primary-200">Hole {holeNumber}</p>
              <p id="score-input-title" className="font-semibold truncate">{playerName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-primary-200">Par {par}</p>
            </div>
          </div>
        </div>

        {/* Tabs - only show when detailed stats enabled */}
        {showDetailedStats && (
          <div className="flex border-b border-card-border" role="tablist" aria-label="Score input tabs">
            <button
              onClick={() => setActiveTab('score')}
              role="tab"
              aria-selected={activeTab === 'score'}
              aria-controls="score-tab-panel"
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary ${
                activeTab === 'score'
                  ? 'text-secondary-700 border-b-2 border-secondary bg-secondary/10'
                  : 'text-muted hover:text-charcoal'
              }`}
            >
              Score
            </button>
            <button
              onClick={() => setActiveTab('details')}
              role="tab"
              aria-selected={activeTab === 'details'}
              aria-controls="details-tab-panel"
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary ${
                activeTab === 'details'
                  ? 'text-secondary-700 border-b-2 border-secondary bg-secondary/10'
                  : 'text-muted hover:text-charcoal'
              }`}
            >
              Details
              {detailsCount > 0 && (
                <span className="absolute top-1 right-2 h-4 w-4 rounded-full bg-secondary text-secondary-900 text-xs flex items-center justify-center" aria-label={`${detailsCount} details filled`}>
                  {detailsCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Score Tab Content */}
        {activeTab === 'score' && (
          <>
            {/* Current Score Display */}
            <div className="bg-cream-300 px-4 py-4 text-center border-b border-card-border">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleDecrement}
                  disabled={currentScore !== null && currentScore <= 1}
                  aria-label="Decrease score"
                  className="w-10 h-10 rounded-full bg-cream-400 hover:bg-cream-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xl font-bold transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                >
                  -
                </button>
                <div className={`text-center transition-transform duration-200 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
                  <span className={`text-5xl font-bold font-mono transition-colors duration-200 ${getScoreColorClass()}`}>
                    {getScoreDisplay()}
                  </span>
                  {currentScore !== null && (
                    <p className={`text-sm font-semibold mt-1 transition-colors duration-200 ${getScoreColorClass()}`}>
                      {getScoreToPar()}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleIncrement}
                  disabled={currentScore !== null && currentScore >= 15}
                  aria-label="Increase score"
                  className="w-10 h-10 rounded-full bg-cream-400 hover:bg-cream-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xl font-bold transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
                >
                  +
                </button>
              </div>
            </div>

            {/* Number Grid */}
            <div className="p-3" role="group" aria-label="Score selection">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    aria-pressed={currentScore === num}
                    aria-label={`Score ${num}`}
                    className={`
                      h-12 rounded-lg font-bold text-lg transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2
                      ${currentScore === num
                        ? 'bg-primary text-white ring-2 ring-secondary ring-offset-2 shadow-md'
                        : 'bg-cream-300 hover:bg-cream-400 hover:shadow-sm text-charcoal'
                      }
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Extra numbers row */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[10, 11, 12].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    aria-pressed={currentScore === num}
                    aria-label={`Score ${num}`}
                    className={`
                      h-10 rounded-lg font-bold text-sm transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2
                      ${currentScore === num
                        ? 'bg-primary text-white ring-2 ring-secondary ring-offset-2 shadow-md'
                        : 'bg-cream-300 hover:bg-cream-400 hover:shadow-sm text-charcoal'
                      }
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Details Tab Content */}
        {showDetailedStats && activeTab === 'details' && (
          <div className="p-4 space-y-4">
            {/* Putts */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Putts
              </label>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePuttsChange(num)}
                    className={`
                      flex-1 h-10 rounded-lg font-semibold text-sm transition-all duration-150 active:scale-95
                      ${currentPutts === num
                        ? 'bg-secondary text-secondary-900 ring-2 ring-secondary ring-offset-1'
                        : 'bg-cream-300 hover:bg-cream-400 text-charcoal'
                      }
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {currentPutts !== null && (
                <button
                  onClick={() => handlePuttsChange(null)}
                  className="mt-1 text-xs text-muted hover:text-charcoal"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Fairway Hit - only show for par 4s and 5s */}
            {showFairwayStat && (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Fairway Hit
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFairwayHitChange(true)}
                    className={`
                      flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-center gap-1.5
                      ${currentFairwayHit === true
                        ? 'bg-score-birdie text-white ring-2 ring-score-birdie ring-offset-1'
                        : 'bg-cream-300 hover:bg-cream-400 text-charcoal'
                      }
                    `}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Yes
                  </button>
                  <button
                    onClick={() => handleFairwayHitChange(false)}
                    className={`
                      flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-center gap-1.5
                      ${currentFairwayHit === false
                        ? 'bg-score-triple text-white ring-2 ring-score-triple ring-offset-1'
                        : 'bg-cream-300 hover:bg-cream-400 text-charcoal'
                      }
                    `}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    No
                  </button>
                </div>
                {currentFairwayHit !== null && (
                  <button
                    onClick={() => handleFairwayHitChange(null)}
                    className="mt-1 text-xs text-muted hover:text-charcoal"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Green in Regulation */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Green in Regulation
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGIRChange(true)}
                  className={`
                    flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-center gap-1.5
                    ${currentGIR === true
                      ? 'bg-score-birdie text-white ring-2 ring-score-birdie ring-offset-1'
                      : 'bg-cream-300 hover:bg-cream-400 text-charcoal'
                    }
                  `}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Yes
                </button>
                <button
                  onClick={() => handleGIRChange(false)}
                  className={`
                    flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-center gap-1.5
                    ${currentGIR === false
                      ? 'bg-score-triple text-white ring-2 ring-score-triple ring-offset-1'
                      : 'bg-cream-300 hover:bg-cream-400 text-charcoal'
                    }
                  `}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  No
                </button>
              </div>
              {currentGIR !== null && (
                <button
                  onClick={() => handleGIRChange(null)}
                  className="mt-1 text-xs text-muted hover:text-charcoal"
                >
                  Clear
                </button>
              )}
            </div>

            {/* GIR hint */}
            <p className="text-xs text-muted">
              GIR: On the green in {par - 2} stroke{par - 2 !== 1 ? 's' : ''} or less
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={handleClear}
            className="flex-1 py-2.5 text-sm font-medium text-muted bg-cream-300 rounded-lg hover:bg-cream-400 transition-all duration-150 active:scale-95"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 transition-all duration-150 active:scale-95 shadow-sm hover:shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
