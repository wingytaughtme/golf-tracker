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
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-golf-text mt-1">
            {value !== null && value !== undefined ? value : '—'}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
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
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg text-primary">
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
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}
