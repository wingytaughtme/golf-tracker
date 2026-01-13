'use client';

import { useState, useEffect } from 'react';

interface Nine {
  id: string;
  name: string;
  nine_type: 'front' | 'back' | 'named';
  display_order: number;
  total_par: number;
  holes: {
    id: string;
    hole_number: number;
    par: number;
  }[];
}

interface NineSelectorProps {
  courseId: string;
  selectedNineIds: string[];
  onChange: (nineIds: string[], nines: Nine[]) => void;
  maxNines?: number; // Default to 2 for 18-hole rounds
  minNines?: number; // Default to 1
}

export default function NineSelector({
  courseId,
  selectedNineIds,
  onChange,
  maxNines = 2,
  minNines = 1,
}: NineSelectorProps) {
  const [nines, setNines] = useState<Nine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNines() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) throw new Error('Failed to fetch course');

        const data = await response.json();
        const courseNines: Nine[] = data.nines || [];
        setNines(courseNines);

        // Auto-select nines based on course configuration
        if (courseNines.length === 1) {
          // 9-hole course: auto-select the only nine
          onChange([courseNines[0].id], [courseNines[0]]);
        } else if (courseNines.length === 2 && selectedNineIds.length === 0) {
          // 18-hole course: default to both nines in order
          const sorted = [...courseNines].sort((a, b) => a.display_order - b.display_order);
          onChange(sorted.map(n => n.id), sorted);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load nines');
      } finally {
        setIsLoading(false);
      }
    }

    if (courseId) {
      fetchNines();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleNineToggle = (nine: Nine) => {
    const isSelected = selectedNineIds.includes(nine.id);
    let newIds: string[];

    if (isSelected) {
      // Don't allow deselecting if at minimum
      if (selectedNineIds.length <= minNines) return;
      newIds = selectedNineIds.filter(id => id !== nine.id);
    } else {
      // Don't allow selecting more than max
      if (selectedNineIds.length >= maxNines) {
        // Replace the oldest selection
        newIds = [...selectedNineIds.slice(1), nine.id];
      } else {
        newIds = [...selectedNineIds, nine.id];
      }
    }

    // Get the nine objects in the right order
    const selectedNines = newIds
      .map(id => nines.find(n => n.id === id))
      .filter((n): n is Nine => n !== undefined);

    onChange(newIds, selectedNines);
  };

  const moveNineUp = (index: number) => {
    if (index === 0) return;
    const newIds = [...selectedNineIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    const selectedNines = newIds
      .map(id => nines.find(n => n.id === id))
      .filter((n): n is Nine => n !== undefined);
    onChange(newIds, selectedNines);
  };

  const moveNineDown = (index: number) => {
    if (index === selectedNineIds.length - 1) return;
    const newIds = [...selectedNineIds];
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    const selectedNines = newIds
      .map(id => nines.find(n => n.id === id))
      .filter((n): n is Nine => n !== undefined);
    onChange(newIds, selectedNines);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  // If only one nine, show a simplified view
  if (nines.length === 1) {
    const nine = nines[0];
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold">9</span>
          </div>
          <div>
            <p className="font-medium text-golf-text">{nine.name}</p>
            <p className="text-sm text-gray-500">Par {nine.total_par}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">This is a 9-hole course</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Available Nines */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Select {minNines === maxNines ? minNines : `${minNines}-${maxNines}`} nine(s) to play
        </p>

        <div className="grid gap-2">
          {nines.map((nine) => {
            const isSelected = selectedNineIds.includes(nine.id);
            const playOrder = selectedNineIds.indexOf(nine.id);

            return (
              <button
                key={nine.id}
                onClick={() => handleNineToggle(nine)}
                className={`flex items-center gap-4 p-4 border rounded-lg text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {/* Selection indicator with order number */}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isSelected ? playOrder + 1 : ''}
                </div>

                {/* Nine info */}
                <div className="flex-1">
                  <p className="font-medium text-golf-text">{nine.name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                    <span>Par {nine.total_par}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">
                      {nine.nine_type === 'front' ? 'Front 9' :
                       nine.nine_type === 'back' ? 'Back 9' :
                       'Named 9'}
                    </span>
                  </div>
                </div>

                {/* Checkmark */}
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Order */}
      {selectedNineIds.length > 1 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Play Order</p>
          <p className="text-xs text-gray-500 mb-3">Drag or use arrows to reorder which nine you play first</p>

          <div className="space-y-2">
            {selectedNineIds.map((nineId, index) => {
              const nine = nines.find(n => n.id === nineId);
              if (!nine) return null;

              return (
                <div
                  key={nineId}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-semibold text-gray-400 w-6">
                    {index + 1}.
                  </span>
                  <span className="flex-1 font-medium text-golf-text">{nine.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveNineUp(index);
                      }}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveNineDown(index);
                      }}
                      disabled={index === selectedNineIds.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export type { Nine };
