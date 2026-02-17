import CourseCreationWizard from '@/components/courses/course-creation-wizard';
import Link from 'next/link';

export default function NewCoursePage() {
  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/courses"
            className="text-sm text-muted hover:text-secondary"
          >
            ← Back to Courses
          </Link>
          <h1 className="mt-2 text-2xl font-serif font-bold text-charcoal">
            Create New Course
          </h1>
          <p className="mt-1 text-sm text-muted">
            Add a custom course with your own scorecard data.
          </p>
        </div>

        <CourseCreationWizard />
      </div>
    </div>
  );
}
