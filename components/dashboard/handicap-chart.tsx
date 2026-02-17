'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendDataPoint {
  date: string;
  value: number;
  roundId: string;
  courseName: string;
}

interface HandicapChartProps {
  data: TrendDataPoint[];
  title?: string;
  height?: number;
}

export function HandicapChart({ data, title = 'Handicap Trend', height = 300 }: HandicapChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-charcoal font-serif mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-muted">
          <div className="text-center">
            <svg className="h-12 w-12 mx-auto mb-3 text-cream-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <p>Not enough data to display chart</p>
            <p className="text-sm">Play more rounds to see trends</p>
          </div>
        </div>
      </div>
    );
  }

  // Consolidate same-day entries - keep only the last entry for each date
  // (represents the final handicap after all rounds that day)
  const consolidatedData = new Map<string, TrendDataPoint>();
  for (const point of data) {
    const dateKey = new Date(point.date).toISOString().split('T')[0];
    consolidatedData.set(dateKey, point); // Later entries overwrite earlier ones
  }

  // Convert to array and sort by date
  const sortedData = Array.from(consolidatedData.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Add timestamp for proper time scaling
  const chartData = sortedData.map((point) => ({
    ...point,
    timestamp: new Date(point.date).getTime(),
    dateLabel: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: new Date(point.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  }));

  const minValue = Math.floor(Math.min(...chartData.map((d) => d.value)) - 1);
  const maxValue = Math.ceil(Math.max(...chartData.map((d) => d.value)) + 1);

  // Format tick labels
  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-charcoal font-serif mb-4">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0D8C8" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12, fill: '#5D5D5D' }}
              tickLine={{ stroke: '#E0D8C8' }}
              axisLine={{ stroke: '#E0D8C8' }}
            />
            <YAxis
              domain={[minValue, maxValue]}
              tick={{ fontSize: 12, fill: '#5D5D5D' }}
              tickLine={{ stroke: '#E0D8C8' }}
              axisLine={{ stroke: '#E0D8C8' }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-card-border rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-charcoal">{data.value.toFixed(1)}</p>
                      <p className="text-sm text-muted">{data.fullDate}</p>
                      <p className="text-xs text-muted">{data.courseName}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1E4D3B"
              strokeWidth={2}
              dot={{ fill: '#D4AF6A', strokeWidth: 2, r: 4, stroke: '#1E4D3B' }}
              activeDot={{ r: 6, fill: '#D4AF6A', stroke: '#1E4D3B' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function HandicapChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-6 bg-cream-300 rounded w-40 mb-4"></div>
      <div style={{ height }} className="bg-cream-200 rounded"></div>
    </div>
  );
}
