'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import CourseCard from '@/components/courses/course-card';

interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
  num_holes: number;
  course_type: string | null;
  tee_set_count: number;
}

interface CoursesResponse {
  data: Course[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const US_STATES = [
  { value: '', label: 'All States' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

const COURSE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'resort', label: 'Resort' },
  { value: 'municipal', label: 'Municipal' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [courseType, setCourseType] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const debouncedSearch = useDebounce(search, 300);

  // Fetch user's favorites
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const response = await fetch('/api/user/favorites');
        if (response.ok) {
          const data = await response.json();
          setFavoriteIds(new Set(data.data.map((c: Course) => c.id)));
        }
      } catch {
        // Silently fail - user might not be logged in
      }
    }

    fetchFavorites();
  }, []);

  const fetchCourses = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);

    const offset = reset ? 0 : pagination.offset;
    const params = new URLSearchParams();

    if (debouncedSearch) params.set('search', debouncedSearch);
    if (state) params.set('state', state);
    if (courseType) params.set('course_type', courseType);
    params.set('limit', '20');
    params.set('offset', offset.toString());

    try {
      const response = await fetch(`/api/courses?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data: CoursesResponse = await response.json();

      if (reset) {
        setCourses(data.data);
      } else {
        setCourses((prev) => [...prev, ...data.data]);
      }

      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, state, courseType, pagination.offset]);

  // Fetch when filters change
  useEffect(() => {
    fetchCourses(true);
  }, [debouncedSearch, state, courseType]);

  const handleLoadMore = () => {
    setPagination((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  useEffect(() => {
    if (pagination.offset > 0) {
      fetchCourses(false);
    }
  }, [pagination.offset]);

  const handleFavoriteChange = (courseId: string, isFavorite: boolean) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) {
        next.add(courseId);
      } else {
        next.delete(courseId);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setState('');
    setCourseType('');
  };

  const hasActiveFilters = search || state || courseType;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Courses</h1>
          <p className="text-muted mt-1">Find and browse golf courses</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/courses/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Course
          </Link>
          <Link
            href="/courses/favorites"
            className="btn-outline inline-flex items-center gap-2"
          >
            <svg
              className="h-4 w-4 text-secondary"
              fill="currentColor"
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
            My Favorites
            {favoriteIds.size > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-secondary/20 text-secondary rounded-full">
                {favoriteIds.size}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col gap-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search courses by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-charcoal transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="input"
              >
                {US_STATES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                className="input"
              >
                {COURSE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 text-sm font-medium text-muted hover:text-charcoal hover:bg-cream-400 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mt-4 pt-4 border-t border-card-border">
            <p className="text-sm text-muted">
              {pagination.total === 0
                ? 'No courses found'
                : `Showing ${courses.length} of ${pagination.total} course${pagination.total !== 1 ? 's' : ''}`}
            </p>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-status-error border border-status-error-text/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-status-error-text flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-status-error-text">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && courses.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="card p-5 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="h-5 bg-cream-400 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-cream-400 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-8 bg-cream-400 rounded-full"></div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-6 bg-cream-400 rounded-full w-16"></div>
                <div className="h-6 bg-cream-400 rounded-full w-20"></div>
              </div>
              <div className="mt-4 pt-4 border-t border-card-border">
                <div className="h-10 bg-cream-400 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results State */}
      {!isLoading && courses.length === 0 && !error && (
        <div className="card p-12 text-center">
          <div className="h-16 w-16 bg-cream-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
              />
            </svg>
          </div>
          <h3 className="text-lg font-serif font-medium text-charcoal mb-2">No courses found</h3>
          <p className="text-muted mb-4">
            {hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'No courses are available at this time'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-secondary hover:text-secondary-600 font-medium transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results Grid */}
      {courses.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isFavorite={favoriteIds.has(course.id)}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  `Load More (${pagination.total - courses.length} remaining)`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
