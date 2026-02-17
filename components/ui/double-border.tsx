'use client';

import { ReactNode } from 'react';

interface DoubleBorderProps {
  children: ReactNode;
  className?: string;
  /** Color of both borders - defaults to gold (#B59A58) */
  borderColor?: string;
  /** Color of the gap between borders - defaults to cream (#FDFBF7) */
  gapColor?: string;
  /** Width of the gap between borders in pixels - defaults to 4 */
  gapWidth?: number;
  /** Whether the outer container should handle overflow-x-auto - defaults to true */
  scrollable?: boolean;
  /** Whether to apply rounded corners - defaults to true. Set to false when inside a parent with its own border-radius */
  rounded?: boolean;
  /** Apply rounded corners only to bottom - useful when top is handled by parent container */
  roundedBottom?: boolean;
}

/**
 * DoubleBorder - Decorative double border frame
 *
 * Creates a premium "double border" effect commonly used in golf scorecards
 * and traditional design elements. Consists of:
 * - Outer border: 1px solid gold
 * - Gap: Cream-colored spacing
 * - Inner border: 1px solid gold
 *
 * Usage:
 * ```tsx
 * <DoubleBorder>
 *   <YourContent />
 * </DoubleBorder>
 * ```
 *
 * CSS Structure (for reference):
 * ```css
 * // Outer container
 * border: 1px solid #B59A58;
 * padding: 4px;
 * background-color: #FDFBF7;
 * border-radius: 8px;
 *
 * // Inner container
 * border: 1px solid #B59A58;
 * background-color: #FDFBF7;
 * border-radius: 4px;
 * ```
 */
export default function DoubleBorder({
  children,
  className = '',
  borderColor = '#B59A58',
  gapColor = '#FDFBF7',
  gapWidth = 4,
  scrollable = true,
  rounded = true,
  roundedBottom = false,
}: DoubleBorderProps) {
  // Determine corner rounding classes
  let outerRounded = '';
  let innerRounded = '';

  if (roundedBottom) {
    outerRounded = 'rounded-b-lg';
    innerRounded = 'rounded-b';
  } else if (rounded) {
    outerRounded = 'rounded-lg';
    innerRounded = 'rounded';
  }

  return (
    <div
      className={`${outerRounded} ${scrollable ? 'overflow-x-auto' : ''}`}
      style={{
        padding: `${gapWidth}px`,
        border: `1px solid ${borderColor}`,
        backgroundColor: gapColor,
      }}
    >
      <div
        className={`${innerRounded} ${className}`}
        style={{
          border: `1px solid ${borderColor}`,
          backgroundColor: gapColor,
        }}
      >
        {children}
      </div>
    </div>
  );
}
