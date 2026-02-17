'use client';

interface ScorecardHeaderProps {
  courseName?: string; // Deprecated - now shown in page header
  courseLocation?: string; // Deprecated - now shown in page header
  datePlayed: string;
  teeSetName: string;
  teeSetColor?: string; // Displayed as a small colored dot indicator
  courseRating: number;
  slopeRating: number;
  weather?: string | null;
  temperature?: number | null;
}

export default function ScorecardHeader({
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

  return (
    <div className="bg-gradient-to-r from-primary to-primary-600 text-white px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Date & Weather */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
              <span>{weather}</span>
              {temperature !== null && temperature !== undefined && (
                <span>({temperature}°F)</span>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Tee Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#B59A58] bg-white/5 flex-shrink-0">
            {/* Golf Tee Icon */}
            <svg
              className="w-4 h-5 text-[#D4AF6A] flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L12 4C12 4 10 5 10 8C10 11 12 12 12 12C12 12 14 11 14 8C14 5 12 4 12 4L12 2Z" />
              <path d="M11 12L11 20L10 22L14 22L13 20L13 12" />
            </svg>

            {/* Tee Name & Rating */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                {teeSetColor && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/30 flex-shrink-0"
                    style={{ backgroundColor: teeSetColor }}
                    aria-label={`${teeSetName} tee color`}
                  />
                )}
                <span className="text-white font-bold text-sm leading-tight">
                  {teeSetName} Tees
                </span>
              </div>
              <span className="text-[#D4AF6A] text-xs leading-tight">
                Rating: {courseRating.toFixed(1)} | Slope: {slopeRating}
              </span>
            </div>
        </div>
      </div>
    </div>
  );
}
