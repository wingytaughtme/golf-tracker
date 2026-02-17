'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ScoreInput from './score-input';
import { useScorecardStore } from '@/stores/scorecard-store';

interface ScoreCellProps {
  value: number | null;
  par: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
  isInteractive?: boolean;
  roundPlayerId?: string;
  holeNumber?: number;
  playerName?: string;
  className?: string;
  isCurrentHole?: boolean;
  showDetailedStats?: boolean;
}

export default function ScoreCell({
  value,
  par,
  isTotal = false,
  isSubtotal = false,
  isInteractive = false,
  roundPlayerId,
  holeNumber,
  playerName,
  className = '',
  isCurrentHole = false,
  showDetailedStats = false,
}: ScoreCellProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputPosition, setInputPosition] = useState({ top: 0, left: 0 });
  const cellRef = useRef<HTMLDivElement>(null);

  const {
    focusedCell,
    setFocusedCell,
    navigateToCell,
    updateScore,
    getScore,
  } = useScorecardStore();

  // Get detailed stats for this cell
  const scoreEntry = roundPlayerId && holeNumber ? getScore(roundPlayerId, holeNumber) : null;
  const putts = scoreEntry?.current.putts ?? null;
  const fairwayHit = scoreEntry?.current.fairway_hit ?? null;
  const gir = scoreEntry?.current.green_in_regulation ?? null;
  const hasDetailedStats = putts !== null || fairwayHit !== null || gir !== null;

  // Check if this cell is focused
  const isFocused = isInteractive &&
    focusedCell?.roundPlayerId === roundPlayerId &&
    focusedCell?.holeNumber === holeNumber;

  // Focus the DOM element when store says this cell is focused
  useEffect(() => {
    if (isFocused && cellRef.current) {
      cellRef.current.focus();
    }
  }, [isFocused]);

  const handleClick = () => {
    if (!isInteractive || isTotal || isSubtotal) return;

    // Set focused cell in store
    if (roundPlayerId && holeNumber) {
      setFocusedCell({ roundPlayerId, holeNumber });
    }

    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      setInputPosition({
        top: rect.bottom,
        left: rect.left + rect.width / 2,
      });
    }
    setShowInput(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isInteractive || isTotal || isSubtotal) return;

    // Arrow key navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
      navigateToCell(direction);
      return;
    }

    // Number keys for quick score entry (1-9)
    if (/^[1-9]$/.test(e.key) && roundPlayerId && holeNumber) {
      e.preventDefault();
      const score = parseInt(e.key, 10);
      updateScore(roundPlayerId, holeNumber, score);
      return;
    }

    // Enter or Space to open input dialog
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
      return;
    }

    // Tab navigation (let default behavior work but track focus)
    if (e.key === 'Tab' && roundPlayerId && holeNumber) {
      // Clear focus in store - let DOM handle tab
      setFocusedCell(null);
    }

    // Backspace/Delete to clear score
    if ((e.key === 'Backspace' || e.key === 'Delete') && roundPlayerId && holeNumber) {
      e.preventDefault();
      updateScore(roundPlayerId, holeNumber, null);
    }
  }, [isInteractive, isTotal, isSubtotal, navigateToCell, roundPlayerId, holeNumber, updateScore, setFocusedCell]);

  // Handle focus from DOM (e.g., tab navigation)
  const handleFocus = () => {
    if (isInteractive && roundPlayerId && holeNumber && !isTotal && !isSubtotal) {
      setFocusedCell({ roundPlayerId, holeNumber });
    }
  };

  // Calculate diff for styling
  const diff = value !== null ? value - par : null;

  // Get score styling based on relation to par - Birdie Book theme
  // Traditional golf scoring: Circles for under par, Squares for over par
  // Colors: Hunter Green (#355E3B) for good, Champagne Gold (#F7E7CE) for bad
  const getScoreStyle = () => {
    if (value === null) {
      return {
        bg: isCurrentHole ? 'bg-secondary/10' : 'bg-transparent',
        text: 'text-muted',
        label: null,
        shape: 'none' as const,
        border: '',
      };
    }

    if (isTotal) {
      return {
        bg: 'bg-cream-400',
        text: 'text-charcoal font-bold',
        label: null,
        shape: 'none' as const,
        border: '',
      };
    }

    if (isSubtotal) {
      return {
        bg: 'bg-cream-300',
        text: 'text-charcoal font-semibold',
        label: null,
        shape: 'none' as const,
        border: '',
      };
    }

    // Score-based styling with traditional golf shapes
    // Under par = Circle (rounded-full), Over par = Square (rounded-sm)
    // Eagle = Double ring (green), Triple+ = Double ring (burgundy)
    // Colors: Hunter Green (#355E3B), Champagne Gold (#F7E7CE), Deep Burgundy (#8C3A3A)
    if (diff !== null) {
      if (diff <= -2) {
        // Eagle or better - Green circle with "double ring" effect
        // Green fill + White gap + Green ring (like a "double birdie")
        return {
          bg: 'bg-[#355E3B]',
          text: 'text-white font-bold',
          label: 'Eagle',
          shape: 'circle' as const,
          border: 'border-2 border-white ring-2 ring-[#355E3B]',
        };
      } else if (diff === -1) {
        // Birdie - Green circle (solid, no border)
        return {
          bg: 'bg-[#355E3B]',
          text: 'text-white font-bold',
          label: 'Birdie',
          shape: 'circle' as const,
          border: '',
        };
      } else if (diff === 0) {
        // Par - No shape, transparent background
        return {
          bg: isCurrentHole ? 'bg-[#B59A58]/20' : 'bg-transparent',
          text: 'text-[#2C3E2D] font-bold',
          label: 'Par',
          shape: 'none' as const,
          border: '',
        };
      } else if (diff === 1) {
        // Bogey - Gold square (solid, no border)
        return {
          bg: 'bg-[#E8D9B5]',
          text: 'text-[#2C3E2D] font-bold',
          label: 'Bogey',
          shape: 'square' as const,
          border: '',
        };
      } else if (diff === 2) {
        // Double Bogey - Deep Burgundy square (solid, no border)
        return {
          bg: 'bg-[#8C3A3A]',
          text: 'text-white font-bold',
          label: 'Double',
          shape: 'square' as const,
          border: '',
        };
      } else {
        // Triple+ (diff >= 3) - Deep Burgundy square with "double ring" effect
        // Burgundy fill + White gap + Burgundy ring
        return {
          bg: 'bg-[#8C3A3A]',
          text: 'text-white font-bold',
          label: 'Triple+',
          shape: 'square' as const,
          border: 'border-2 border-white ring-2 ring-[#8C3A3A]',
        };
      }
    }

    return {
      bg: 'bg-transparent',
      text: 'text-muted',
      label: null,
      shape: 'none' as const,
      border: '',
    };
  };

  const style = getScoreStyle();

  const interactiveClasses = isInteractive && !isTotal && !isSubtotal
    ? 'cursor-pointer hover:ring-2 hover:ring-secondary hover:ring-offset-1 active:scale-95 focus:outline-none'
    : '';

  const focusClasses = isFocused
    ? 'ring-2 ring-secondary ring-offset-2 z-10'
    : '';

  const currentHoleClasses = isCurrentHole && !isFocused && !isTotal && !isSubtotal
    ? 'ring-2 ring-secondary/50 ring-offset-1'
    : '';

  // Get shape class based on score type
  const getShapeClass = () => {
    switch (style.shape) {
      case 'circle':
        return 'rounded-full';
      case 'square':
        return 'rounded-sm';
      default:
        return '';
    }
  };

  // Show fairway stat only for par 4s and 5s
  const showFairwayStat = par > 3;

  return (
    <>
      <div className="relative flex flex-col items-center">
        {/* Score Cell - Shape based on score type */}
        <div
          ref={cellRef}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className={`
            flex items-center justify-center
            w-[30px] h-[30px]
            ${getShapeClass()}
            transition-all duration-200 ease-out
            ${style.bg}
            ${style.text}
            ${style.border}
            ${interactiveClasses}
            ${focusClasses}
            ${currentHoleClasses}
            ${className}
          `.trim()}
          role={isInteractive ? 'button' : undefined}
          tabIndex={isInteractive && !isTotal && !isSubtotal ? 0 : undefined}
          aria-label={
            isInteractive && playerName && holeNumber
              ? `${playerName}, hole ${holeNumber}, ${value !== null ? `score ${value}` : 'no score'}`
              : undefined
          }
        >
          {/* Score Number - Larger font for player scores */}
          <span className="text-base font-mono font-bold leading-none">
            {value !== null ? value : '-'}
          </span>
        </div>

        {/* Detailed Stats Indicators */}
        {showDetailedStats && hasDetailedStats && !isTotal && !isSubtotal && (
          <div className="flex items-center gap-0.5 mt-0.5 h-3">
            {putts !== null && (
              <span className="text-[9px] font-medium text-blue-600 bg-blue-50 rounded px-0.5" title={`${putts} putt${putts !== 1 ? 's' : ''}`}>
                {putts}P
              </span>
            )}
            {showFairwayStat && fairwayHit !== null && (
              <span
                className={`text-[9px] rounded px-0.5 ${fairwayHit ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}
                title={fairwayHit ? 'Fairway hit' : 'Fairway missed'}
              >
                F{fairwayHit ? '✓' : '✗'}
              </span>
            )}
            {gir !== null && (
              <span
                className={`text-[9px] rounded px-0.5 ${gir ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}
                title={gir ? 'Green in regulation' : 'Missed GIR'}
              >
                G{gir ? '✓' : '✗'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Score Input Popover */}
      {showInput && isInteractive && roundPlayerId && holeNumber && playerName && (
        <ScoreInput
          roundPlayerId={roundPlayerId}
          holeNumber={holeNumber}
          par={par}
          playerName={playerName}
          onClose={() => setShowInput(false)}
          position={inputPosition}
          showDetailedStats={showDetailedStats}
        />
      )}
    </>
  );
}
