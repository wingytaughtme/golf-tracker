'use client';

interface StatsCardProps {
  title: string;
  value: string | number | null;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon, trend, className = '' }: StatsCardProps) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="text-2xl font-bold text-charcoal mt-1">
            {value !== null && value !== undefined ? value : '—'}
          </p>
          {subtitle && (
            <p className="text-sm text-muted mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend.isPositive ? 'text-score-birdie' : 'text-score-triple'
            }`}>
              <svg
                className={`w-4 h-4 ${trend.isPositive ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{Math.abs(trend.value).toFixed(1)}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-2 bg-secondary/20 rounded-lg text-secondary-700">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatsCardSkeletonProps {
  className?: string;
}

export function StatsCardSkeleton({ className = '' }: StatsCardSkeletonProps) {
  return (
    <div className={`card p-5 animate-pulse ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 bg-cream-300 rounded w-20 mb-2"></div>
          <div className="h-8 bg-cream-300 rounded w-16"></div>
        </div>
        <div className="h-10 w-10 bg-cream-300 rounded-lg"></div>
      </div>
    </div>
  );
}
