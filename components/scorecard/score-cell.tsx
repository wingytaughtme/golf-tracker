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
}: ScoreCellProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputPosition, setInputPosition] = useState({ top: 0, left: 0 });
  const cellRef = useRef<HTMLDivElement>(null);

  const {
    focusedCell,
    setFocusedCell,
    navigateToCell,
    updateScore,
  } = useScorecardStore();

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

  // Determine score styling based on relation to par
  const getScoreStyle = () => {
    if (value === null) {
      return isCurrentHole ? 'bg-amber-50 text-gray-400' : 'bg-gray-50 text-gray-400';
    }

    if (isTotal) {
      return 'bg-gray-900 text-white font-bold';
    }

    if (isSubtotal) {
      return 'bg-gray-200 text-gray-900 font-bold';
    }

    const diff = value - par;

    if (diff <= -2) {
      // Eagle or better - gold/yellow circle
      return 'bg-amber-400 text-amber-900 rounded-full shadow-sm';
    } else if (diff === -1) {
      // Birdie - green circle
      return 'bg-green-500 text-white rounded-full shadow-sm';
    } else if (diff === 0) {
      // Par - neutral
      return isCurrentHole ? 'bg-amber-50 text-gray-800' : 'bg-white text-gray-800';
    } else if (diff === 1) {
      // Bogey - square with single border
      return 'bg-red-50 text-red-700 border-2 border-red-400';
    } else if (diff === 2) {
      // Double bogey - square with double border effect
      return 'bg-red-100 text-red-800 border-2 border-red-500 ring-2 ring-red-500 ring-offset-1';
    } else {
      // Triple bogey or worse - filled dark
      return 'bg-red-700 text-white';
    }
  };

  const baseClasses = `
    w-8 h-8 flex items-center justify-center
    font-mono text-sm font-semibold
    transition-all duration-200 ease-out
  `;

  const interactiveClasses = isInteractive && !isTotal && !isSubtotal
    ? 'cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-1 active:scale-95'
    : '';

  const focusClasses = isFocused
    ? 'ring-2 ring-primary ring-offset-2 z-10'
    : '';

  const currentHoleClasses = isCurrentHole && !isFocused && !isTotal && !isSubtotal
    ? 'ring-2 ring-amber-300 ring-offset-1'
    : '';

  return (
    <>
      <div
        ref={cellRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className={`
          ${baseClasses}
          ${getScoreStyle()}
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
        {value !== null ? value : '-'}
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
        />
      )}
    </>
  );
}
