import CourseCreationWizard from '@/components/courses/course-creation-wizard';
import Link from 'next/link';

export default function NewCoursePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/courses"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Courses
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Create New Course
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Add a custom course with your own scorecard data.
          </p>
        </div>

        <CourseCreationWizard />
      </div>
    </div>
  );
}
