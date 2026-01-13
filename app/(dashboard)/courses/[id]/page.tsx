'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TeeSelector from '@/components/courses/tee-selector';
import HoleTable from '@/components/courses/hole-table';

interface Hole {
  id: string;
  hole_number: number;
  par: number;
  distance: number;
  handicap_index: number;
}

interface TeeSet {
  id: string;
  name: string;
  color: string;
  course_rating: number;
  slope_rating: number;
  total_yardage: number | null;
  gender: string | null;
  holes: Hole[];
  totals: {
    front: { par: number; yardage: number };
    back: { par: number; yardage: number };
    total: { par: number; yardage: number };
  };
}

interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
  zip_code: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  num_holes: number;
  course_type: string | null;
  rounds_played: number;
  source: string | null;
  created_by: string | null;
  tee_sets: TeeSet[];
}

const courseTypeBadgeColors: Record<string, string> = {
  public: 'bg-blue-100 text-blue-800',
  private: 'bg-purple-100 text-purple-800',
  resort: 'bg-amber-100 text-amber-800',
  municipal: 'bg-green-100 text-green-800',
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [selectedTeeId, setSelectedTeeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Course not found');
          }
          throw new Error('Failed to fetch course');
        }
        const data = await response.json();
        setCourse(data);
        // Select first tee set by default
        if (data.tee_sets.length > 0) {
          setSelectedTeeId(data.tee_sets[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCourse();
  }, [courseId]);

  // Fetch favorite status
  useEffect(() => {
    async function fetchFavoriteStatus() {
      try {
        const response = await fetch(`/api/user/favorites/${courseId}`);
        if (response.ok) {
          const data = await response.json();
          setIsFavorite(data.isFavorite);
        }
      } catch {
        // Silently fail - user might not be logged in
      }
    }

    fetchFavoriteStatus();
  }, [courseId]);

  const handleToggleFavorite = async () => {
    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    setFavoriteError(null);

    // Optimistic update
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      const method = previousState ? 'DELETE' : 'POST';
      const response = await fetch(`/api/user/favorites/${courseId}`, {
        method,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update favorite');
      }
    } catch (err) {
      // Revert on error
      setIsFavorite(previousState);
      setFavoriteError(err instanceof Error ? err.message : 'Failed to update favorite');

      // Clear error after 3 seconds
      setTimeout(() => setFavoriteError(null), 3000);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course || deleteConfirmText !== course.name) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete course');
      }

      // Redirect to courses list after successful deletion
      router.push('/courses');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedTeeSet = course?.tee_sets.find((t) => t.id === selectedTeeId);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-64"></div>
          <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-64"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href="/courses"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Courses
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg
            className="h-12 w-12 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-red-800 mb-2">{error}</h2>
          <p className="text-red-600">Please try again or go back to the courses list.</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/courses"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Courses
      </Link>

      {/* Course Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-display font-bold text-golf-text">
                  {course.name}
                </h1>
                {course.course_type && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      courseTypeBadgeColors[course.course_type] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {course.course_type}
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                {course.address && `${course.address}, `}
                {course.city}, {course.state}
                {course.zip_code && ` ${course.zip_code}`}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                {course.source === 'user_created' && (
                  <>
                    <Link
                      href={`/courses/${course.id}/edit`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 transition-all"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-600 transition-all"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </>
                )}
                <button
                  onClick={handleToggleFavorite}
                  disabled={isTogglingFavorite}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    isTogglingFavorite ? 'opacity-50 cursor-wait' : ''
                  } ${
                    isFavorite
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg
                    className={`h-5 w-5 ${isTogglingFavorite ? 'animate-pulse' : ''}`}
                    fill={isFavorite ? 'currentColor' : 'none'}
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
                  {isFavorite ? 'Favorited' : 'Add to Favorites'}
                </button>
              </div>
              {favoriteError && (
                <p className="text-red-500 text-xs">{favoriteError}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
            {course.phone && (
              <a
                href={`tel:${course.phone}`}
                className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {course.phone}
              </a>
            )}
            {course.website && (
              <a
                href={course.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Visit Website
              </a>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
              {course.num_holes} holes
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {course.rounds_played} rounds tracked
            </div>
          </div>
        </div>
      </div>

      {/* Tee Selection and Scorecard */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Tee Selector */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <TeeSelector
              teeSets={course.tee_sets}
              selectedTeeId={selectedTeeId}
              onSelect={setSelectedTeeId}
            />
          </div>

          {/* Start Round Button */}
          <Link
            href={`/rounds/new?course=${course.id}${selectedTeeId ? `&tee=${selectedTeeId}` : ''}`}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-600 text-white font-medium rounded-xl transition-colors shadow-sm"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Start Round Here
          </Link>
        </div>

        {/* Hole Table */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-golf-text">Scorecard</h2>
              {selectedTeeSet && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{selectedTeeSet.name}</span> Tees &middot;{' '}
                  Rating {selectedTeeSet.course_rating.toString()} / Slope{' '}
                  {selectedTeeSet.slope_rating}
                </div>
              )}
            </div>
            {selectedTeeSet ? (
              <HoleTable
                holes={selectedTeeSet.holes}
                totals={selectedTeeSet.totals}
                teeColor={selectedTeeSet.color}
              />
            ) : (
              <div className="text-gray-500 text-center py-8">
                Select a tee set to view the scorecard.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
                setDeleteError(null);
              }
            }}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Course</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-3">
                This will permanently delete <strong>{course.name}</strong> and all associated data
                (holes, tee sets, ratings, yardages).
              </p>
              <p className="text-sm text-gray-700 mb-3">
                To confirm, type the course name below:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={course.name}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                disabled={isDeleting}
              />
            </div>

            {deleteError && (
              <div className="mb-4 rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-700">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                disabled={deleteConfirmText !== course.name || isDeleting}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
