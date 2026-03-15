'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Round {
  id: string;
  date_played: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  round_type: 'casual' | 'tournament' | 'practice';
  weather?: string | null;
  course: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
  tee_set: {
    id: string;
    name: string;
    color: string;
  };
  total_par: number;
  is_nine_hole?: boolean;
  round_players: {
    id: string;
    player: {
      id: string;
      name: string;
    };
    gross_score?: number | null;
    net_score?: number | string | null;
  }[];
  player_count: number;
  player_names: string[];
  user_score?: number | null;
  score_vs_par?: number | null;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface Course {
  id: string;
  name: string;
}

export default function RoundsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rounds, setRounds] = useState<Round[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: 20, offset: 0, hasMore: false });
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [courseFilter, setCourseFilter] = useState<string>(searchParams.get('course_id') || '');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [startDate, setStartDate] = useState<string>(searchParams.get('start_date') || '');
  const [endDate, setEndDate] = useState<string>(searchParams.get('end_date') || '');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort_by') || 'date');
  const [sortOrder, setSortOrder] = useState<string>(searchParams.get('sort_order') || 'desc');
  const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get('page') || '1'));

  const limit = 15;

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch courses for filter dropdown
  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch('/api/courses?limit=100');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      }
    }
    fetchCourses();
  }, []);

  const fetchRounds = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (courseFilter) params.set('course_id', courseFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      params.set('sort_by', sortBy);
      params.set('sort_order', sortOrder);
      params.set('limit', limit.toString());
      params.set('offset', ((currentPage - 1) * limit).toString());

      const response = await fetch(`/api/rounds?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view rounds');
        }
        throw new Error('Failed to fetch rounds');
      }
      const data = await response.json();
      setRounds(data.data || []);
      setPagination(data.pagination || { total: 0, limit, offset: 0, hasMore: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, courseFilter, debouncedSearch, startDate, endDate, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (courseFilter) params.set('course_id', courseFilter);
    if (searchQuery) params.set('search', searchQuery);
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (sortBy !== 'date') params.set('sort_by', sortBy);
    if (sortOrder !== 'desc') params.set('sort_order', sortOrder);
    if (currentPage > 1) params.set('page', currentPage.toString());

    const queryString = params.toString();
    router.replace(queryString ? `/rounds?${queryString}` : '/rounds', { scroll: false });
  }, [statusFilter, courseFilter, searchQuery, startDate, endDate, sortBy, sortOrder, currentPage, router]);

  async function handleDelete(roundId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this round? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(roundId);
    try {
      const response = await fetch(`/api/rounds/${roundId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete round');
      }

      setRounds((prev) => prev.filter((r) => r.id !== roundId));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete round');
    } finally {
      setIsDeleting(null);
    }
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  }

  function clearFilters() {
    setStatusFilter('');
    setCourseFilter('');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  }

  const hasActiveFilters = statusFilter || courseFilter || searchQuery || startDate || endDate;
  const totalPages = Math.ceil(pagination.total / limit);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      in_progress: 'badge-warning',
      completed: 'badge-success',
      abandoned: 'badge',
    };
    const labels: Record<string, string> = {
      in_progress: 'In Progress',
      completed: 'Completed',
      abandoned: 'Abandoned',
    };
    return (
      <span className={styles[status]}>
        {labels[status]}
      </span>
    );
  };

  const getTeeColor = (colorName: string): string => {
    const colors: Record<string, string> = {
      black: '#1f2937',
      blue: '#3b82f6',
      white: '#e5e7eb',
      gold: '#eab308',
      yellow: '#facc15',
      red: '#ef4444',
      green: '#22c55e',
    };
    return colors[colorName.toLowerCase()] || '#9ca3af';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Count in-progress rounds
  const inProgressCount = rounds.filter(r => r.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Round History</h1>
          <p className="text-muted mt-1">
            {pagination.total} round{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/rounds/new"
          className="btn-primary inline-flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Round
        </Link>
      </div>

      {/* In Progress Alert */}
      {!statusFilter && inProgressCount > 0 && (
        <div className="bg-status-warning border border-secondary rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 bg-secondary/20 rounded-lg">
              <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-charcoal font-medium">
                You have {inProgressCount} round{inProgressCount !== 1 ? 's' : ''} in progress
              </p>
              <p className="text-muted text-sm">Continue scoring or complete your rounds</p>
            </div>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className="btn-accent text-sm"
            >
              View
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="label">Search Course</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by course name..."
                className="input pl-10"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="input"
            >
              <option value="">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          {/* Course */}
          <div>
            <label className="label">Course</label>
            <select
              value={courseFilter}
              onChange={(e) => { setCourseFilter(e.target.value); setCurrentPage(1); }}
              className="input"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="label">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="input"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="label">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="input"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-card-border flex items-center justify-between">
            <p className="text-sm text-muted">
              Showing {rounds.length} of {pagination.total} results
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-secondary hover:text-secondary-600 font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-status-error border border-status-error-text/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-status-error-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-status-error-text">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="card overflow-hidden">
          <div className="animate-pulse">
            <div className="border-b border-card-border p-4 bg-primary">
              <div className="grid grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-secondary/30 rounded" />
                ))}
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border-b border-card-border">
                <div className="grid grid-cols-6 gap-4">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="h-4 bg-cream-400 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rounds Table */}
      {!isLoading && !error && (
        <>
          {rounds.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th
                        className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          {sortBy === 'date' && (
                            <svg className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort('course')}
                      >
                        <div className="flex items-center gap-1">
                          Course
                          {sortBy === 'course' && (
                            <svg className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider">Tees</th>
                      <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider">Score / Par</th>
                      <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider">Players</th>
                      <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {rounds.map((round) => (
                      <tr
                        key={round.id}
                        className="hover:bg-cream-300 cursor-pointer transition-colors"
                        onClick={() => router.push(`/rounds/${round.id}`)}
                      >
                        <td className="py-4 px-4">
                          <span className="text-sm text-charcoal">{formatDate(round.date_played)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/courses/${round.course.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-medium text-charcoal hover:text-secondary transition-colors"
                          >
                            {round.course.name}
                          </Link>
                          <p className="text-xs text-muted">{round.course.city}, {round.course.state}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-card-border"
                              style={{ backgroundColor: getTeeColor(round.tee_set.color) }}
                            />
                            {round.tee_set.name}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {round.user_score ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {round.is_nine_hole && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-secondary/15 text-secondary-700 rounded">9H</span>
                              )}
                              <div>
                                <span className="text-sm font-semibold text-charcoal">{round.user_score}</span>
                                <span className="text-sm text-muted"> / {round.total_par}</span>
                                {round.score_vs_par != null && (
                                  <span className={`ml-2 text-sm font-medium ${
                                    round.score_vs_par < 0 ? 'text-score-birdie' :
                                    round.score_vs_par === 0 ? 'text-muted' :
                                    'text-score-bogey'
                                  }`}>
                                    ({round.score_vs_par > 0 ? '+' : ''}{round.score_vs_par})
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center -space-x-2">
                            {round.player_names.slice(0, 3).map((name, i) => (
                              <div
                                key={i}
                                className="w-7 h-7 rounded-full bg-cream-400 border-2 border-card flex items-center justify-center text-xs font-medium text-muted"
                                title={name}
                              >
                                {name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {round.player_names.length > 3 && (
                              <div className="w-7 h-7 rounded-full bg-secondary/20 border-2 border-card flex items-center justify-center text-xs font-medium text-muted">
                                +{round.player_names.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {getStatusBadge(round.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/rounds/${round.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-muted hover:text-secondary hover:bg-secondary/10 rounded transition-colors"
                              title="View round"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            {round.status !== 'completed' && (
                              <button
                                onClick={(e) => handleDelete(round.id, e)}
                                disabled={isDeleting === round.id}
                                className="p-1.5 text-muted hover:text-status-error-text hover:bg-status-error rounded transition-colors disabled:opacity-50"
                                title="Delete round"
                              >
                                {isDeleting === round.id ? (
                                  <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-card-border px-4 py-3 flex items-center justify-between">
                  <p className="text-sm text-muted">
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.total)} of {pagination.total} rounds
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-charcoal bg-cream-400 rounded-lg hover:bg-cream-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-primary text-secondary'
                                : 'text-charcoal hover:bg-cream-400'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1.5 text-sm font-medium text-charcoal bg-cream-400 rounded-lg hover:bg-cream-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <div className="h-16 w-16 bg-cream-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              {hasActiveFilters ? (
                <>
                  <h3 className="text-charcoal font-serif font-medium mb-2">No rounds match your filters</h3>
                  <p className="text-muted text-sm mb-4">Try adjusting your search or filter criteria</p>
                  <button
                    onClick={clearFilters}
                    className="btn-outline inline-flex items-center gap-2"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-charcoal font-serif font-medium mb-2">No rounds yet</h3>
                  <p className="text-muted text-sm mb-4">Start tracking your golf rounds today</p>
                  <Link
                    href="/rounds/new"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Start Your First Round
                  </Link>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
