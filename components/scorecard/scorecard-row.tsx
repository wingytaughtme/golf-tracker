'use client';

import { ReactNode } from 'react';

type RowType = 'hole' | 'hdcp' | 'yards' | 'par' | 'player' | 'header';

interface ScorecardRowProps {
  type: RowType;
  label: string;
  frontNine?: (string | number | ReactNode)[];
  frontTotal?: string | number | ReactNode;
  backNine?: (string | number | ReactNode)[];
  backTotal?: string | number | ReactNode;
  grandTotal?: string | number | ReactNode;
  className?: string;
  labelClassName?: string;
  compactMode?: boolean;
}

export default function ScorecardRow({
  type,
  label,
  frontNine,
  frontTotal,
  backNine,
  backTotal,
  grandTotal,
  className = '',
  labelClassName = '',
  compactMode = false,
}: ScorecardRowProps) {
  // Birdie Book theme - consistent cream background for all rows
  const getRowStyles = () => {
    switch (type) {
      case 'hole':
        return 'bg-cream-200';
      case 'hdcp':
        return 'bg-cream-200';
      case 'yards':
        return 'bg-cream-200';
      case 'par':
        return 'bg-cream-200';
      case 'player':
        return 'bg-cream-200';
      default:
        return 'bg-cream-200';
    }
  };

  const getCellStyles = (isTotal: boolean = false) => {
    const size = compactMode ? 'w-10 h-12 min-w-[40px]' : 'w-12 h-12 min-w-[48px]';
    const base = `${size} flex items-center justify-center font-mono text-sm border-r border-card-border/50 last:border-r-0 overflow-hidden`;

    if (isTotal) {
      // OUT/IN columns - slightly highlighted
      return `${base} bg-cream-300/70 font-bold`;
    }

    return base;
  };

  const getGrandTotalStyles = () => {
    const size = compactMode ? 'w-14 h-12 min-w-[56px]' : 'w-16 h-12 min-w-[64px]';
    const base = `${size} flex items-center justify-center font-mono text-sm font-bold`;

    // TOTAL column - same background as OUT/IN columns
    return `${base} bg-cream-300/70`;
  };

  const getLabelStyles = () => {
    // flex-1 allows the label column to grow and fill remaining space
    const width = compactMode ? 'min-w-[80px] flex-1' : 'min-w-[96px] flex-1';
    const height = type === 'player' ? 'min-h-12' : 'h-12';
    const base = `${width} ${height} flex items-center px-3 font-mono font-semibold text-sm border-r border-card-border bg-cream-200`;

    switch (type) {
      case 'hole':
        return `${base} text-charcoal`;
      case 'hdcp':
        return `${base} text-charcoal`;
      case 'yards':
        return `${base} text-charcoal`;
      case 'par':
        return `${base} text-charcoal`;
      case 'player':
        return `${base} text-charcoal py-1.5 leading-tight`;
      default:
        return `${base}`;
    }
  };

  // Render hole number as green circle badge
  const renderHoleNumber = (num: string | number | ReactNode) => {
    if (type !== 'hole') return num;

    // If it's already a ReactNode (not a plain number), just return it
    if (typeof num !== 'number' && typeof num !== 'string') return num;

    return (
      <span className="w-7 h-7 flex items-center justify-center bg-[#D3B57E] text-[#2C3E2D] text-xs font-bold rounded-full">
        {num}
      </span>
    );
  };

  // Render OUT/IN/TOTAL labels for hole row
  const renderTotalLabel = (content: string | number | ReactNode, isGrand: boolean = false) => {
    if (type !== 'hole') return content;

    if (typeof content === 'string' && ['OUT', 'IN', 'TOT', 'TOTAL'].includes(content)) {
      return (
        <span className={`font-bold text-charcoal ${isGrand ? 'text-sm' : 'text-xs'}`}>
          {content}
        </span>
      );
    }

    return content;
  };

  return (
    <div className={`flex ${getRowStyles()} border-b border-card-border ${className}`}>
      {/* Label Column */}
      <div
        className={`${getLabelStyles()} ${labelClassName}`}
        title={label}
      >
        <span className={type === 'player' ? 'break-words line-clamp-2 uppercase text-xs' : 'uppercase tracking-wide text-xs'}>
          {label}
        </span>
      </div>

      {/* Front Nine */}
      {frontNine && frontNine.map((cell, index) => (
        <div key={`front-${index}`} className={getCellStyles()}>
          {renderHoleNumber(cell)}
        </div>
      ))}

      {/* OUT (Front Nine Total) */}
      {frontTotal !== undefined && (
        <div className={getCellStyles(true)}>
          {renderTotalLabel(frontTotal)}
        </div>
      )}

      {/* Back Nine */}
      {backNine && backNine.map((cell, index) => (
        <div key={`back-${index}`} className={getCellStyles()}>
          {renderHoleNumber(cell)}
        </div>
      ))}

      {/* IN (Back Nine Total) */}
      {backTotal !== undefined && (
        <div className={getCellStyles(true)}>
          {renderTotalLabel(backTotal)}
        </div>
      )}

      {/* TOT (Grand Total) */}
      {grandTotal !== undefined && (
        <div className={getGrandTotalStyles()}>
          {renderTotalLabel(grandTotal, true)}
        </div>
      )}
    </div>
  );
}
