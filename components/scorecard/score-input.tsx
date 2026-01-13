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
}

export default function ScoreInput({
  roundPlayerId,
  holeNumber,
  par,
  playerName,
  onClose,
  position,
}: ScoreInputProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { getScore, updateScore, clearScore, navigateToNextHole } = useScorecardStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const scoreEntry = getScore(roundPlayerId, holeNumber);
  const currentScore = scoreEntry?.current.strokes ?? null;

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
    if (currentScore === null) return 'text-gray-400';
    const diff = currentScore - par;
    if (diff <= -2) return 'text-amber-500'; // Eagle+
    if (diff === -1) return 'text-green-500'; // Birdie
    if (diff === 0) return 'text-gray-700'; // Par
    if (diff === 1) return 'text-red-400'; // Bogey
    return 'text-red-600'; // Double+
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
      const popoverHeight = 320;

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
        style={getPopoverStyle()}
        className={`bg-white rounded-xl shadow-2xl border border-gray-200 w-[220px] overflow-hidden z-50 transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
        }`}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400">Hole {holeNumber}</p>
              <p className="font-semibold truncate">{playerName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Par {par}</p>
            </div>
          </div>
        </div>

        {/* Current Score Display */}
        <div className="bg-gray-50 px-4 py-4 text-center border-b border-gray-200">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleDecrement}
              disabled={currentScore !== null && currentScore <= 1}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xl font-bold transition-all active:scale-90"
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
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xl font-bold transition-all active:scale-90"
            >
              +
            </button>
          </div>
        </div>

        {/* Number Grid */}
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className={`
                  h-12 rounded-lg font-bold text-lg transition-all duration-150 active:scale-95
                  ${currentScore === num
                    ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 shadow-md'
                    : 'bg-gray-100 hover:bg-gray-200 hover:shadow-sm text-gray-800'
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
                className={`
                  h-10 rounded-lg font-bold text-sm transition-all duration-150 active:scale-95
                  ${currentScore === num
                    ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 shadow-md'
                    : 'bg-gray-100 hover:bg-gray-200 hover:shadow-sm text-gray-800'
                  }
                `}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={handleClear}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-150 active:scale-95"
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
