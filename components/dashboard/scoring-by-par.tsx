'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface ScoringByPar {
  par: number;
  holesPlayed: number;
  totalStrokes: number;
  average: number;
  averageVsPar: number;
}

interface ScoringByParChartProps {
  data: ScoringByPar[];
  title?: string;
  height?: number;
}

export function ScoringByParChart({
  data,
  title = 'Scoring by Par',
  height = 250
}: ScoringByParChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-charcoal font-serif mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-muted">
          <div className="text-center">
            <svg className="h-12 w-12 mx-auto mb-3 text-cream-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No scoring data available</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: `Par ${item.par}`,
    par: item.par,
    average: item.average,
    averageVsPar: item.averageVsPar,
    holesPlayed: item.holesPlayed,
  }));

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-charcoal font-serif mb-4">{title}</h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {data.map((item) => (
          <div key={item.par} className="text-center p-3 bg-cream-200 rounded-lg">
            <p className="text-sm text-muted mb-1">Par {item.par}s</p>
            <p className="text-xl font-bold text-charcoal">{item.average.toFixed(2)}</p>
            <p className={`text-sm font-medium ${
              item.averageVsPar < 0 ? 'text-score-birdie' :
              item.averageVsPar === 0 ? 'text-muted' :
              'text-score-triple'
            }`}>
              {item.averageVsPar > 0 ? '+' : ''}{item.averageVsPar.toFixed(2)}
            </p>
            <p className="text-xs text-muted mt-1">{item.holesPlayed} holes</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0D8C8" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#5D5D5D' }}
              tickLine={{ stroke: '#E0D8C8' }}
              axisLine={{ stroke: '#E0D8C8' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#5D5D5D' }}
              tickLine={{ stroke: '#E0D8C8' }}
              axisLine={{ stroke: '#E0D8C8' }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-card border border-card-border rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-charcoal">{item.name}</p>
                      <p className="text-sm text-muted">Average: {item.average.toFixed(2)}</p>
                      <p className={`text-sm ${
                        item.averageVsPar < 0 ? 'text-score-birdie' :
                        item.averageVsPar === 0 ? 'text-muted' :
                        'text-score-triple'
                      }`}>
                        {item.averageVsPar > 0 ? '+' : ''}{item.averageVsPar.toFixed(2)} vs par
                      </p>
                      <p className="text-xs text-muted">{item.holesPlayed} holes played</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#E0D8C8" strokeDasharray="3 3" />
            <Bar dataKey="averageVsPar" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.averageVsPar < 0 ? '#355E3B' : entry.averageVsPar === 0 ? '#E0D8C8' : '#8C3A3A'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ScoringByParSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-6 bg-cream-300 rounded w-32 mb-4"></div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="text-center p-3 bg-cream-200 rounded-lg">
            <div className="h-4 bg-cream-300 rounded w-16 mx-auto mb-2"></div>
            <div className="h-6 bg-cream-300 rounded w-12 mx-auto mb-1"></div>
            <div className="h-4 bg-cream-300 rounded w-10 mx-auto"></div>
          </div>
        ))}
      </div>
      <div className="h-48 bg-cream-200 rounded"></div>
    </div>
  );
}
