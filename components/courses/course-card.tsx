'use client';

import Link from 'next/link';
import { useState } from 'react';

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    city: string;
    state: string;
    num_holes: number;
    course_type: string | null;
    tee_set_count: number;
  };
  isFavorite?: boolean;
  onFavoriteChange?: (courseId: string, isFavorite: boolean) => void;
}

const courseTypeBadgeColors: Record<string, string> = {
  public: 'bg-secondary/20 text-secondary-700',
  private: 'bg-primary/10 text-primary',
  resort: 'bg-score-bogey/20 text-score-bogey',
  municipal: 'bg-score-birdie/20 text-score-birdie',
};

export default function CourseCard({ course, isFavorite = false, onFavoriteChange }: CourseCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isToggling) return;

    setIsToggling(true);
    setError(null);

    // Optimistic update
    const previousState = favorite;
    setFavorite(!favorite);

    try {
      const method = previousState ? 'DELETE' : 'POST';
      const response = await fetch(`/api/user/favorites/${course.id}`, {
        method,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update favorite');
      }

      // Notify parent of successful change
      if (onFavoriteChange) {
        onFavoriteChange(course.id, !previousState);
      }
    } catch (err) {
      // Revert on error
      setFavorite(previousState);
      setError(err instanceof Error ? err.message : 'Failed to update favorite');

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="card hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-charcoal truncate">{course.name}</h3>
            <p className="text-muted text-sm mt-1">
              {course.city}, {course.state}
            </p>
          </div>
          <button
            onClick={handleFavoriteClick}
            disabled={isToggling}
            className={`flex-shrink-0 p-2 rounded-full transition-colors ${
              isToggling ? 'opacity-50 cursor-wait' : ''
            } ${
              favorite
                ? 'text-secondary hover:bg-secondary/10'
                : 'text-muted hover:bg-cream-300 hover:text-charcoal'
            }`}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            title={error || (favorite ? 'Remove from favorites' : 'Add to favorites')}
          >
            <svg
              className={`h-5 w-5 ${isToggling ? 'animate-pulse' : ''}`}
              fill={favorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {error && (
          <p className="text-score-triple text-xs mt-2">{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {course.course_type && (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                courseTypeBadgeColors[course.course_type] || 'bg-cream-300 text-charcoal'
              }`}
            >
              {course.course_type}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cream-300 text-muted">
            {course.num_holes} holes
          </span>
          {course.tee_set_count > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cream-300 text-muted">
              {course.tee_set_count} tee{course.tee_set_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-card-border">
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            View Details
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
