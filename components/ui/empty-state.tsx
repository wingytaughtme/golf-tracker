'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12 px-6', className)}>
      {icon && (
        <div className="h-16 w-16 bg-cream-300 rounded-full flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-charcoal mb-2">{title}</h3>
      {description && (
        <p className="text-muted max-w-sm mx-auto mb-6">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="btn-primary inline-flex items-center gap-2"
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="btn-primary inline-flex items-center gap-2"
              >
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="btn-outline inline-flex items-center gap-2"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className="btn-outline inline-flex items-center gap-2"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty states for common scenarios

export function EmptyRounds() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      }
      title="No rounds yet"
      description="Start tracking your golf game by creating your first round."
      action={{
        label: 'Start Your First Round',
        href: '/rounds/new',
      }}
    />
  );
}

export function EmptyFavorites() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      }
      title="No favorite courses"
      description="Save your favorite courses for quick access when starting a new round."
      action={{
        label: 'Browse Courses',
        href: '/courses',
      }}
    />
  );
}

export function EmptyPlayers() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      title="No players added"
      description="Add players to track their rounds and compare scores."
      action={{
        label: 'Add Player',
        href: '/players/new',
      }}
    />
  );
}

export function EmptyStats() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
      title="No stats available"
      description="Complete some rounds to start tracking your statistics."
      action={{
        label: 'Start a Round',
        href: '/rounds/new',
      }}
    />
  );
}

export function EmptySearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No results found"
      description={query ? `No matches for "${query}". Try a different search.` : 'No matches found for your search.'}
    />
  );
}

export function EmptyCourses() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      }
      title="No courses found"
      description="Create a custom course to get started."
      action={{
        label: 'Create Course',
        href: '/courses/new',
      }}
    />
  );
}

export function EmptyMyCourses() {
  return (
    <EmptyState
      icon={
        <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      }
      title="No custom courses yet"
      description="Create your own course with custom hole configurations."
      action={{
        label: 'Create Your First Course',
        href: '/courses/new',
      }}
    />
  );
}
