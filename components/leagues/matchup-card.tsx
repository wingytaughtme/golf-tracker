'use client';

interface MatchupCardProps {
  playerA: string;
  playerB: string | null;
  scoreA?: number | null;
  scoreB?: number | null;
  status: string;
  compact?: boolean;
}

export default function MatchupCard({
  playerA,
  playerB,
  scoreA,
  scoreB,
  status,
  compact = false,
}: MatchupCardProps) {
  const isCompleted = status === 'completed';
  const isBye = !playerB || status === 'bye';

  const getWinner = (): 'a' | 'b' | 'tie' | null => {
    if (!isCompleted || scoreA == null || scoreB == null) return null;
    if (scoreA < scoreB) return 'a'; // lower is better in golf
    if (scoreB < scoreA) return 'b';
    return 'tie';
  };

  const winner = getWinner();

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-cream-300">
        <span className={`text-sm ${winner === 'a' ? 'font-semibold text-secondary-700' : 'text-charcoal'}`}>
          {playerA}
        </span>
        {isBye ? (
          <span className="text-xs text-muted px-2">BYE</span>
        ) : (
          <>
            {isCompleted ? (
              <span className="text-xs text-muted px-2">
                {scoreA} - {scoreB}
              </span>
            ) : (
              <span className="text-xs text-muted px-2">vs</span>
            )}
            <span className={`text-sm ${winner === 'b' ? 'font-semibold text-secondary-700' : 'text-charcoal'}`}>
              {playerB}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Player A */}
        <div className="flex-1 text-left">
          <p className={`text-sm font-medium ${
            winner === 'a' ? 'text-secondary-700' : 'text-charcoal'
          }`}>
            {playerA}
            {winner === 'a' && (
              <svg className="inline-block ml-1 h-4 w-4 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            )}
          </p>
          {isCompleted && scoreA != null && (
            <p className="text-lg font-semibold text-charcoal mt-1">{scoreA}</p>
          )}
        </div>

        {/* Center divider */}
        <div className="flex flex-col items-center px-3">
          {isBye ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cream-300 text-muted">
              BYE
            </span>
          ) : isCompleted ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary-700">
              Final
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cream-300 text-muted">
              vs
            </span>
          )}
        </div>

        {/* Player B */}
        {!isBye && (
          <div className="flex-1 text-right">
            <p className={`text-sm font-medium ${
              winner === 'b' ? 'text-secondary-700' : 'text-charcoal'
            }`}>
              {winner === 'b' && (
                <svg className="inline-block mr-1 h-4 w-4 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              )}
              {playerB}
            </p>
            {isCompleted && scoreB != null && (
              <p className="text-lg font-semibold text-charcoal mt-1">{scoreB}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
