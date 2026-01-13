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
  const getRowStyles = () => {
    switch (type) {
      case 'hole':
        return 'bg-gray-900 text-white font-bold';
      case 'hdcp':
        return 'bg-gray-100 text-gray-600 text-xs';
      case 'yards':
        return 'bg-blue-50 text-blue-900';
      case 'par':
        return 'bg-green-50 text-green-900 font-semibold';
      case 'player':
        return 'bg-white hover:bg-gray-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getCellStyles = (isTotal: boolean = false) => {
    // Use larger touch targets in compact mode
    const size = compactMode ? 'w-9 h-11 min-w-[36px]' : 'w-10 h-10';
    const base = `${size} flex items-center justify-center font-mono text-sm border-r border-gray-200 last:border-r-0`;

    if (isTotal) {
      switch (type) {
        case 'hole':
          return `${base} bg-gray-800 font-bold`;
        case 'par':
          return `${base} bg-green-100 font-bold`;
        case 'yards':
          return `${base} bg-blue-100 font-bold`;
        case 'player':
          return `${base} bg-gray-100 font-bold`;
        default:
          return `${base} bg-gray-200 font-bold`;
      }
    }

    return base;
  };

  const getGrandTotalStyles = () => {
    const size = compactMode ? 'w-11 h-11 min-w-[44px]' : 'w-12 h-10';
    const base = `${size} flex items-center justify-center font-mono text-sm font-bold`;

    switch (type) {
      case 'hole':
        return `${base} bg-gray-900 text-white`;
      case 'par':
        return `${base} bg-green-200 text-green-900`;
      case 'yards':
        return `${base} bg-blue-200 text-blue-900`;
      case 'player':
        return `${base} bg-gray-200 text-gray-900`;
      default:
        return `${base} bg-gray-300`;
    }
  };

  const getLabelStyles = () => {
    const width = compactMode ? 'w-20 min-w-[80px]' : 'w-24 min-w-[96px]';
    const height = type === 'player' ? 'min-h-10' : (compactMode ? 'h-11' : 'h-10');
    const base = `${width} ${height} flex items-center px-2 font-semibold text-sm border-r border-gray-300 flex-shrink-0`;

    switch (type) {
      case 'hole':
        return `${base} bg-gray-900 text-white`;
      case 'hdcp':
        return `${base} bg-gray-100 text-gray-600 text-xs font-normal`;
      case 'yards':
        return `${base} bg-blue-50 text-blue-900`;
      case 'par':
        return `${base} bg-green-50 text-green-900`;
      case 'player':
        return `${base} bg-white text-gray-900 py-1.5 leading-tight`;
      default:
        return `${base} bg-gray-50`;
    }
  };

  // For player names, allow wrapping instead of truncating
  const displayLabel = label;

  return (
    <div className={`flex ${getRowStyles()} border-b border-gray-200 ${className}`}>
      {/* Label Column */}
      <div
        className={`${getLabelStyles()} ${labelClassName}`}
        title={label}
      >
        <span className={type === 'player' ? 'break-words line-clamp-2' : ''}>
          {displayLabel}
        </span>
      </div>

      {/* Front Nine */}
      {frontNine && frontNine.map((cell, index) => (
        <div key={`front-${index}`} className={getCellStyles()}>
          {cell}
        </div>
      ))}

      {/* OUT (Front Nine Total) */}
      {frontTotal !== undefined && (
        <div className={getCellStyles(true)}>
          {frontTotal}
        </div>
      )}

      {/* Back Nine */}
      {backNine && backNine.map((cell, index) => (
        <div key={`back-${index}`} className={getCellStyles()}>
          {cell}
        </div>
      ))}

      {/* IN (Back Nine Total) */}
      {backTotal !== undefined && (
        <div className={getCellStyles(true)}>
          {backTotal}
        </div>
      )}

      {/* TOT (Grand Total) */}
      {grandTotal !== undefined && (
        <div className={getGrandTotalStyles()}>
          {grandTotal}
        </div>
      )}
    </div>
  );
}
