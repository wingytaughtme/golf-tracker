'use client';

interface ScorecardHeaderProps {
  courseName: string;
  courseLocation: string;
  datePlayed: string;
  teeSetName: string;
  teeSetColor: string;
  courseRating: number;
  slopeRating: number;
  weather?: string | null;
  temperature?: number | null;
}

export default function ScorecardHeader({
  courseName,
  courseLocation,
  datePlayed,
  teeSetName,
  teeSetColor,
  courseRating,
  slopeRating,
  weather,
  temperature,
}: ScorecardHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTeeColorClass = (color: string): string => {
    const colors: Record<string, string> = {
      black: 'bg-gray-900',
      blue: 'bg-blue-600',
      white: 'bg-white border-2 border-gray-400',
      gold: 'bg-amber-400',
      yellow: 'bg-yellow-400',
      red: 'bg-red-600',
      green: 'bg-green-600',
    };
    return colors[color.toLowerCase()] || 'bg-gray-400';
  };

  return (
    <div className="bg-gradient-to-r from-green-800 to-green-700 text-white p-4 rounded-t-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Course Info */}
        <div>
          <h2 className="text-xl font-bold font-display">{courseName}</h2>
          <p className="text-green-200 text-sm">{courseLocation}</p>
        </div>

        {/* Date & Weather */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatDate(datePlayed)}</span>
          </div>

          {weather && (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
              <span>{weather}</span>
              {temperature && <span>({temperature}°F)</span>}
            </div>
          )}
        </div>

        {/* Tee Info */}
        <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2">
          <div className={`w-4 h-4 rounded-full ${getTeeColorClass(teeSetColor)}`} />
          <div>
            <p className="font-semibold">{teeSetName} Tees</p>
            <p className="text-xs text-green-200">
              Rating: {courseRating.toFixed(1)} / Slope: {slopeRating}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
