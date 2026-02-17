'use client';

interface Hole {
  id: string;
  hole_number: number;
  par: number;
  distance: number;
  handicap_index: number;
}

interface Totals {
  front: { par: number; yardage: number };
  back: { par: number; yardage: number };
  total: { par: number; yardage: number };
}

interface HoleTableProps {
  holes: Hole[];
  totals: Totals;
  teeColor?: string;
  courseRating?: number;
  slopeRating?: number;
}

export default function HoleTable({ holes, totals, courseRating, slopeRating }: HoleTableProps) {
  const frontNine = holes.filter((h) => h.hole_number <= 9);
  const backNine = holes.filter((h) => h.hole_number > 9);

  if (holes.length === 0) {
    return (
      <div className="text-muted text-center py-8">
        No hole data available for this tee set.
      </div>
    );
  }

  // Render hole number as gold circle badge (matching Birdie Book scorecard style)
  const renderHoleNumber = (num: number) => (
    <span className="w-7 h-7 flex items-center justify-center bg-[#D3B57E] text-[#2C3E2D] text-xs font-bold rounded-full mx-auto">
      {num}
    </span>
  );

  return (
    <div className="bg-cream rounded-xl shadow-lg overflow-hidden">
      {/* Decorative double border wrapper (matching Birdie Book scorecard style) */}
      <div className="rounded-lg p-[4px] border border-[#B59A58]" style={{ backgroundColor: '#FDFBF7' }}>
        <div className="rounded border border-[#B59A58] bg-[#FDFBF7] overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              {/* Hole Numbers Row */}
              <tr className="bg-cream-200 border-b border-card-border">
                <th className="px-3 py-2 text-left font-semibold text-muted text-xs uppercase tracking-wide border-r border-card-border/50 w-20">
                  Hole
                </th>
                {frontNine.map((hole) => (
                  <th
                    key={hole.id}
                    className="px-2 py-2 text-center min-w-[40px] border-r border-card-border/50"
                  >
                    {renderHoleNumber(hole.hole_number)}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-bold text-charcoal bg-cream-300/70 border-r border-card-border/50 min-w-[44px]">
                  OUT
                </th>
                {backNine.map((hole) => (
                  <th
                    key={hole.id}
                    className="px-2 py-2 text-center min-w-[40px] border-r border-card-border/50"
                  >
                    {renderHoleNumber(hole.hole_number)}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-bold text-charcoal bg-cream-300/70 border-r border-card-border/50 min-w-[44px]">
                  IN
                </th>
                <th className="px-3 py-2 text-center font-bold text-charcoal bg-cream-300/70 min-w-[48px]">
                  TOT
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Yardage Row */}
              <tr className="bg-card border-b border-card-border">
                <td className="px-3 py-2 font-semibold text-muted text-xs uppercase tracking-wide border-r border-card-border/50">
                  Yards
                </td>
                {frontNine.map((hole) => (
                  <td
                    key={hole.id}
                    className="px-2 py-2 text-center font-mono text-sm border-r border-card-border/50"
                  >
                    {hole.distance}
                  </td>
                ))}
                <td className="px-3 py-2 text-center font-mono font-semibold bg-cream-300/70 border-r border-card-border/50">
                  {totals.front.yardage.toLocaleString()}
                </td>
                {backNine.map((hole) => (
                  <td
                    key={hole.id}
                    className="px-2 py-2 text-center font-mono text-sm border-r border-card-border/50"
                  >
                    {hole.distance}
                  </td>
                ))}
                <td className="px-3 py-2 text-center font-mono font-semibold bg-cream-300/70 border-r border-card-border/50">
                  {totals.back.yardage.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-center font-mono font-bold bg-cream-300/70">
                  {totals.total.yardage.toLocaleString()}
                </td>
              </tr>

              {/* Handicap Row */}
              <tr className="bg-cream-200 border-b border-card-border">
                <td className="px-3 py-2 font-semibold text-muted text-xs uppercase tracking-wide border-r border-card-border/50">
                  Hdcp
                </td>
                {frontNine.map((hole) => (
                  <td
                    key={hole.id}
                    className="px-2 py-2 text-center text-muted text-xs border-r border-card-border/50"
                  >
                    {hole.handicap_index}
                  </td>
                ))}
                <td className="px-3 py-2 text-center bg-cream-300/70 border-r border-card-border/50 text-muted">
                  —
                </td>
                {backNine.map((hole) => (
                  <td
                    key={hole.id}
                    className="px-2 py-2 text-center text-muted text-xs border-r border-card-border/50"
                  >
                    {hole.handicap_index}
                  </td>
                ))}
                <td className="px-3 py-2 text-center bg-cream-300/70 border-r border-card-border/50 text-muted">
                  —
                </td>
                <td className="px-3 py-2 text-center bg-cream-300/70 text-muted">—</td>
              </tr>

              {/* Par Row */}
              <tr className="bg-cream-300">
                <td className="px-3 py-2 font-semibold text-charcoal text-xs uppercase tracking-wide border-r border-card-border/50">
                  Par
                </td>
                {frontNine.map((hole) => (
                  <td
                    key={hole.id}
                    className="px-2 py-2 text-center font-semibold text-charcoal border-r border-card-border/50"
                  >
                    {hole.par}
                  </td>
                ))}
                <td className="px-3 py-2 text-center font-bold text-charcoal bg-cream-300/70 border-r border-card-border/50">
                  {totals.front.par}
                </td>
                {backNine.map((hole) => (
                  <td
                    key={hole.id}
                    className="px-2 py-2 text-center font-semibold text-charcoal border-r border-card-border/50"
                  >
                    {hole.par}
                  </td>
                ))}
                <td className="px-3 py-2 text-center font-bold text-charcoal bg-cream-300/70 border-r border-card-border/50">
                  {totals.back.par}
                </td>
                <td className="px-3 py-2 text-center font-bold text-charcoal bg-cream-300/70">
                  {totals.total.par}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Row */}
      <div className="bg-cream-300 px-4 py-3 border-t border-card-border">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-muted">Total Par:</span>
              <span className="ml-2 font-bold text-charcoal">{totals.total.par}</span>
            </div>
            <div>
              <span className="text-muted">Total Yards:</span>
              <span className="ml-2 font-bold text-charcoal">{totals.total.yardage.toLocaleString()}</span>
            </div>
            {courseRating && slopeRating && (
              <div>
                <span className="text-muted">Rating/Slope:</span>
                <span className="ml-2 font-bold text-charcoal">{courseRating} / {slopeRating}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-cream-200 border-t border-card-border">
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <div className="flex items-center gap-1">
            <span className="font-medium">Hdcp</span> = Hole Handicap (difficulty ranking)
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">OUT</span> = Front 9 total
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">IN</span> = Back 9 total
          </div>
        </div>
      </div>
    </div>
  );
}
