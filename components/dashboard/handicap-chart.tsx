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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-golf-text mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <svg className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <p>Not enough data to display chart</p>
            <p className="text-sm">Play more rounds to see trends</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: new Date(point.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  }));

  const minValue = Math.floor(Math.min(...data.map((d) => d.value)) - 1);
  const maxValue = Math.ceil(Math.max(...data.map((d) => d.value)) + 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-golf-text mb-4">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[minValue, maxValue]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-golf-text">{data.value.toFixed(1)}</p>
                      <p className="text-sm text-gray-500">{data.fullDate}</p>
                      <p className="text-xs text-gray-400">{data.courseName}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#059669"
              strokeWidth={2}
              dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#059669' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function HandicapChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
      <div style={{ height }} className="bg-gray-100 rounded"></div>
    </div>
  );
}
