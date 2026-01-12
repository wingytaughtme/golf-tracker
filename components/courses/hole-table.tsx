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
}

export default function HoleTable({ holes, totals, teeColor = 'blue' }: HoleTableProps) {
  const frontNine = holes.filter((h) => h.hole_number <= 9);
  const backNine = holes.filter((h) => h.hole_number > 9);

  if (holes.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No hole data available for this tee set.
      </div>
    );
  }

  const headerBgClass = 'bg-gray-800 text-white';
  const totalRowClass = 'bg-gray-100 font-semibold';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className={headerBgClass}>
            <th className="px-2 py-2 text-left font-semibold border-r border-gray-700">Hole</th>
            {frontNine.map((hole) => (
              <th
                key={hole.id}
                className="px-2 py-2 text-center font-semibold min-w-[40px] border-r border-gray-700"
              >
                {hole.hole_number}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-bold bg-gray-700 border-r border-gray-600">
              OUT
            </th>
            {backNine.map((hole) => (
              <th
                key={hole.id}
                className="px-2 py-2 text-center font-semibold min-w-[40px] border-r border-gray-700"
              >
                {hole.hole_number}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-bold bg-gray-700 border-r border-gray-600">
              IN
            </th>
            <th className="px-3 py-2 text-center font-bold bg-gray-900">TOT</th>
          </tr>
        </thead>
        <tbody>
          {/* Yardage Row */}
          <tr className="bg-white border-b border-gray-200">
            <td className="px-2 py-2 font-medium text-gray-700 border-r border-gray-200">
              Yards
            </td>
            {frontNine.map((hole, idx) => (
              <td
                key={hole.id}
                className={`px-2 py-2 text-center border-r border-gray-200 ${
                  idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                {hole.distance}
              </td>
            ))}
            <td className={`px-3 py-2 text-center font-semibold ${totalRowClass} border-r border-gray-300`}>
              {totals.front.yardage.toLocaleString()}
            </td>
            {backNine.map((hole, idx) => (
              <td
                key={hole.id}
                className={`px-2 py-2 text-center border-r border-gray-200 ${
                  idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                {hole.distance}
              </td>
            ))}
            <td className={`px-3 py-2 text-center font-semibold ${totalRowClass} border-r border-gray-300`}>
              {totals.back.yardage.toLocaleString()}
            </td>
            <td className={`px-3 py-2 text-center font-bold ${totalRowClass}`}>
              {totals.total.yardage.toLocaleString()}
            </td>
          </tr>

          {/* Handicap Row */}
          <tr className="bg-white border-b border-gray-200">
            <td className="px-2 py-2 font-medium text-gray-700 border-r border-gray-200">
              Hdcp
            </td>
            {frontNine.map((hole, idx) => (
              <td
                key={hole.id}
                className={`px-2 py-2 text-center border-r border-gray-200 ${
                  idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                {hole.handicap_index}
              </td>
            ))}
            <td className="px-3 py-2 text-center bg-gray-100 border-r border-gray-300">—</td>
            {backNine.map((hole, idx) => (
              <td
                key={hole.id}
                className={`px-2 py-2 text-center border-r border-gray-200 ${
                  idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                {hole.handicap_index}
              </td>
            ))}
            <td className="px-3 py-2 text-center bg-gray-100 border-r border-gray-300">—</td>
            <td className="px-3 py-2 text-center bg-gray-100">—</td>
          </tr>

          {/* Par Row */}
          <tr className="bg-green-50 border-b-2 border-gray-300">
            <td className="px-2 py-2 font-semibold text-green-800 border-r border-gray-200">
              Par
            </td>
            {frontNine.map((hole, idx) => (
              <td
                key={hole.id}
                className={`px-2 py-2 text-center font-medium text-green-800 border-r border-gray-200 ${
                  idx % 2 === 0 ? 'bg-green-100' : 'bg-green-50'
                }`}
              >
                {hole.par}
              </td>
            ))}
            <td className="px-3 py-2 text-center font-bold text-green-900 bg-green-200 border-r border-gray-300">
              {totals.front.par}
            </td>
            {backNine.map((hole, idx) => (
              <td
                key={hole.id}
                className={`px-2 py-2 text-center font-medium text-green-800 border-r border-gray-200 ${
                  idx % 2 === 0 ? 'bg-green-100' : 'bg-green-50'
                }`}
              >
                {hole.par}
              </td>
            ))}
            <td className="px-3 py-2 text-center font-bold text-green-900 bg-green-200 border-r border-gray-300">
              {totals.back.par}
            </td>
            <td className="px-3 py-2 text-center font-bold text-green-900 bg-green-300">
              {totals.total.par}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
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
  );
}
