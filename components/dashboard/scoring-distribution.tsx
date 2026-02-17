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
  eagles: '#355E3B',    // Hunter Green (Birdie Book theme - same as birdie)
  birdies: '#355E3B',   // Hunter Green (Birdie Book theme)
  pars: '#E0D8C8',      // beige (theme score-par)
  bogeys: '#E8D9B5',    // Champagne Gold (Birdie Book theme)
  doubleBogeys: '#8C3A3A', // Deep Burgundy (Birdie Book theme)
  triplePlus: '#8C3A3A',   // Deep Burgundy (Birdie Book theme - same as double)
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
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-charcoal font-serif mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-muted">
          <div className="text-center">
            <svg className="h-12 w-12 mx-auto mb-3 text-cream-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-charcoal font-serif mb-4">{title}</h3>

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
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-card border border-card-border rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-charcoal">{item.name}</p>
                      <p className="text-sm text-muted">{item.value} holes</p>
                      <p className="text-sm text-muted">{item.percentage.toFixed(1)}%</p>
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
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4 pt-4 border-t border-card-border">
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
                <p className="text-xs font-medium text-muted">{label}</p>
                <p className="text-sm font-semibold text-charcoal">{count}</p>
                <p className="text-xs text-muted">{pct.toFixed(1)}%</p>
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
    <div className="card p-6 animate-pulse">
      <div className="h-6 bg-cream-300 rounded w-48 mb-4"></div>
      <div style={{ height }} className="bg-cream-200 rounded"></div>
      <div className="grid grid-cols-6 gap-3 mt-4 pt-4 border-t border-card-border">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="w-3 h-3 bg-cream-300 rounded-full mx-auto mb-1"></div>
            <div className="h-3 bg-cream-300 rounded w-12 mx-auto mb-1"></div>
            <div className="h-4 bg-cream-300 rounded w-8 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
