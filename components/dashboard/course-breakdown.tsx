'use client';

import Link from 'next/link';

interface CourseStats {
  courseId: string;
  courseName: string;
  city: string;
  state: string;
  timesPlayed: number;
  bestScore: number | null;
  worstScore: number | null;
  averageScore: number | null;
  averageVsPar: number | null;
  lastPlayed: string | null;
}

interface CourseBreakdownProps {
  courses: CourseStats[];
  title?: string;
  maxCourses?: number;
}

export function CourseBreakdown({
  courses,
  title = 'Course Breakdown',
  maxCourses = 5
}: CourseBreakdownProps) {
  const displayCourses = courses.slice(0, maxCourses);

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-charcoal font-serif mb-4">{title}</h3>

      {displayCourses.length > 0 ? (
        <div className="space-y-4">
          {displayCourses.map((course) => (
            <div
              key={course.courseId}
              className="p-4 bg-cream-200 rounded-lg hover:bg-cream-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <Link
                    href={`/courses/${course.courseId}`}
                    className="font-medium text-charcoal hover:text-secondary-700 transition-colors"
                  >
                    {course.courseName}
                  </Link>
                  <p className="text-sm text-muted">
                    {course.city}, {course.state}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted">Rounds</p>
                    <p className="font-semibold text-charcoal">{course.timesPlayed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted">Best</p>
                    <p className="font-semibold text-score-birdie">
                      {course.bestScore ?? '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted">Avg</p>
                    <p className="font-semibold text-charcoal">
                      {course.averageScore?.toFixed(1) ?? '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted">Avg +/-</p>
                    <p className={`font-semibold ${
                      course.averageVsPar === null ? 'text-muted' :
                      course.averageVsPar < 0 ? 'text-score-birdie' :
                      course.averageVsPar === 0 ? 'text-muted' :
                      'text-score-triple'
                    }`}>
                      {course.averageVsPar !== null
                        ? `${course.averageVsPar > 0 ? '+' : ''}${course.averageVsPar.toFixed(1)}`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {course.lastPlayed && (
                <p className="text-xs text-muted mt-2">
                  Last played: {new Date(course.lastPlayed).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted">
          <svg className="h-12 w-12 mx-auto mb-3 text-cream-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>No courses played yet</p>
          <p className="text-sm">Complete rounds to see course statistics</p>
        </div>
      )}
    </div>
  );
}

export function CourseBreakdownSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-6 bg-cream-300 rounded w-40 mb-4"></div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 bg-cream-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-5 bg-cream-300 rounded w-32 mb-2"></div>
                <div className="h-4 bg-cream-300 rounded w-24"></div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="h-3 bg-cream-300 rounded w-12 mb-1"></div>
                  <div className="h-5 bg-cream-300 rounded w-8"></div>
                </div>
                <div className="text-center">
                  <div className="h-3 bg-cream-300 rounded w-12 mb-1"></div>
                  <div className="h-5 bg-cream-300 rounded w-8"></div>
                </div>
                <div className="text-center">
                  <div className="h-3 bg-cream-300 rounded w-12 mb-1"></div>
                  <div className="h-5 bg-cream-300 rounded w-8"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
