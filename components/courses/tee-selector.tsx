'use client';

interface TeeSet {
  id: string;
  name: string;
  color: string;
  course_rating: number;
  slope_rating: number;
  total_yardage: number | null;
  gender: string | null;
}

interface TeeSelectorProps {
  teeSets: TeeSet[];
  selectedTeeId: string;
  onSelect: (teeId: string) => void;
}

const colorMap: Record<string, string> = {
  black: 'bg-gray-900',
  blue: 'bg-blue-600',
  white: 'bg-white border-2 border-gray-300',
  gold: 'bg-yellow-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-600',
  green: 'bg-green-600',
  silver: 'bg-gray-400',
  orange: 'bg-orange-500',
  purple: 'bg-purple-600',
};

function getTeeColor(color: string): string {
  const normalized = color.toLowerCase();
  return colorMap[normalized] || 'bg-gray-500';
}

export default function TeeSelector({ teeSets, selectedTeeId, onSelect }: TeeSelectorProps) {
  if (teeSets.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No tee sets available for this course.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Select Tees</h3>
      <div className="grid gap-2">
        {teeSets.map((tee) => {
          const isSelected = tee.id === selectedTeeId;
          return (
            <button
              key={tee.id}
              onClick={() => onSelect(tee.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Color indicator */}
                <div
                  className={`w-5 h-5 rounded-full ${getTeeColor(tee.color)} flex-shrink-0`}
                  title={tee.color}
                />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        isSelected ? 'text-primary' : 'text-golf-text'
                      }`}
                    >
                      {tee.name}
                    </span>
                    {tee.gender && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {tee.gender}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {tee.course_rating.toString()} / {tee.slope_rating}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-medium ${
                    isSelected ? 'text-primary' : 'text-golf-text'
                  }`}
                >
                  {tee.total_yardage?.toLocaleString() || '—'} yds
                </div>
                {isSelected && (
                  <svg
                    className="w-5 h-5 text-primary ml-auto mt-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
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
  );
}
