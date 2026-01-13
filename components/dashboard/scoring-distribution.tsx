'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ScoringDistribution {
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  triplePlus: number;
  total: number;
  percentages: {
    eagles: number;
    birdies: number;
    pars: number;
    bogeys: number;
    doubleBogeys: number;
    triplePlus: number;
  };
}

interface ScoringDistributionChartProps {
  data: ScoringDistribution;
  title?: string;
  height?: number;
  showPercentages?: boolean;
}

const COLORS = {
  eagles: '#eab308',    // gold
  birdies: '#22c55e',   // green
  pars: '#3b82f6',      // blue
  bogeys: '#f97316',    // orange
  doubleBogeys: '#ef4444', // red
  triplePlus: '#7c3aed',   // purple
};

const LABELS = {
  eagles: 'Eagles',
  birdies: 'Birdies',
  pars: 'Pars',
  bogeys: 'Bogeys',
  doubleBogeys: 'Double+',
  triplePlus: 'Triple+',
};

export function ScoringDistributionChart({
  data,
  title = 'Scoring Distribution',
  height = 300,
  showPercentages = true
}: ScoringDistributionChartProps) {
  if (!data || data.total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-golf-text mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <svg className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No scoring data available</p>
            <p className="text-sm">Complete rounds to see your scoring distribution</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Eagles', value: data.eagles, percentage: data.percentages.eagles, color: COLORS.eagles },
    { name: 'Birdies', value: data.birdies, percentage: data.percentages.birdies, color: COLORS.birdies },
    { name: 'Pars', value: data.pars, percentage: data.percentages.pars, color: COLORS.pars },
    { name: 'Bogeys', value: data.bogeys, percentage: data.percentages.bogeys, color: COLORS.bogeys },
    { name: 'Double+', value: data.doubleBogeys, percentage: data.percentages.doubleBogeys, color: COLORS.doubleBogeys },
    { name: 'Triple+', value: data.triplePlus, percentage: data.percentages.triplePlus, color: COLORS.triplePlus },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-golf-text mb-4">{title}</h3>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-golf-text">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.value} holes</p>
                      <p className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with counts */}
      {showPercentages && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-100">
          {Object.entries(LABELS).map(([key, label]) => {
            const count = data[key as keyof typeof data] as number;
            const pct = data.percentages[key as keyof typeof data.percentages];
            if (count === 0) return null;
            return (
              <div key={key} className="text-center">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1"
                  style={{ backgroundColor: COLORS[key as keyof typeof COLORS] }}
                />
                <p className="text-xs font-medium text-gray-600">{label}</p>
                <p className="text-sm font-semibold text-golf-text">{count}</p>
                <p className="text-xs text-gray-400">{pct.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ScoringDistributionSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
      <div style={{ height }} className="bg-gray-100 rounded"></div>
      <div className="grid grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-100">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="w-3 h-3 bg-gray-200 rounded-full mx-auto mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
