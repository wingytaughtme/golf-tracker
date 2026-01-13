'use client';

import { useRef, useEffect, useCallback } from 'react';

interface GridScoreCellProps {
  value: number | null;
  par: number;
  roundPlayerId: string;
  holeNumber: number;
  isFocused: boolean;
  onValueChange: (value: number | null) => void;
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right' | 'next' | 'prev') => void;
  onFocus: () => void;
}

export default function GridScoreCell({
  value,
  par,
  isFocused,
  onValueChange,
  onNavigate,
  onFocus,
}: GridScoreCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when this cell becomes focused
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isFocused]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Arrow key navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onNavigate('up');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      onNavigate('down');
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onNavigate('left');
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onNavigate('right');
      return;
    }

    // Tab navigation
    if (e.key === 'Tab') {
      e.preventDefault();
      onNavigate(e.shiftKey ? 'prev' : 'next');
      return;
    }

    // Enter moves to next cell
    if (e.key === 'Enter') {
      e.preventDefault();
      onNavigate('next');
      return;
    }

    // Escape clears the field
    if (e.key === 'Escape') {
      e.preventDefault();
      onValueChange(null);
      return;
    }

    // Backspace/Delete clears if empty or at start
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (!inputRef.current?.value || inputRef.current.selectionStart === 0) {
        e.preventDefault();
        onValueChange(null);
      }
      return;
    }

    // Number keys for score entry
    if (/^[0-9]$/.test(e.key)) {
      const currentValue = inputRef.current?.value || '';
      const isFullySelected = inputRef.current?.selectionStart === 0 &&
        inputRef.current?.selectionEnd === currentValue.length;

      // If current value is "1" and not fully selected, handle second digit
      if (currentValue === '1' && !isFullySelected) {
        e.preventDefault();
        const secondDigit = parseInt(e.key, 10);
        // Valid second digits: 0-5 (makes 10-15)
        if (secondDigit <= 5) {
          const newValue = 10 + secondDigit;
          onValueChange(newValue);
          setTimeout(() => onNavigate('next'), 50);
        }
        // If 6-9, ignore (can't have scores 16-19)
        return;
      }

      // Starting fresh (empty or fully selected)
      if (!currentValue || isFullySelected) {
        e.preventDefault();
        const digit = parseInt(e.key, 10);

        // 0 is not a valid score by itself
        if (digit === 0) {
          return;
        }

        onValueChange(digit);

        // If typed 2-9, auto-advance (single digit scores)
        // If typed 1, DON'T advance - wait for potential second digit
        if (digit >= 2) {
          setTimeout(() => onNavigate('next'), 50);
        }
        return;
      }

      return;
    }

    // Block non-numeric input (except control keys)
    if (!['Backspace', 'Delete', 'Tab'].includes(e.key)) {
      e.preventDefault();
    }
  }, [onNavigate, onValueChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onValueChange(null);
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 1 && num <= 15) {
        onValueChange(num);
      }
    }
  };

  const handleFocus = () => {
    onFocus();
    inputRef.current?.select();
  };

  // Get background color based on score vs par
  const getBackgroundColor = () => {
    if (value === null) return 'bg-gray-50';
    const diff = value - par;
    if (diff <= -2) return 'bg-amber-100'; // Eagle+
    if (diff === -1) return 'bg-green-100'; // Birdie
    if (diff === 0) return 'bg-white'; // Par
    if (diff === 1) return 'bg-red-50'; // Bogey
    if (diff === 2) return 'bg-red-100'; // Double
    return 'bg-red-200'; // Triple+
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value ?? ''}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      className={`
        w-8 h-8 text-center font-mono text-sm font-semibold
        border border-gray-300 rounded
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
        transition-colors duration-150
        ${getBackgroundColor()}
        ${isFocused ? 'ring-2 ring-primary border-primary' : ''}
      `}
      maxLength={2}
    />
  );
}
