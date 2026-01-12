'use client';

import { useState, useEffect } from 'react';

interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
}

export interface PlayerFormData {
  name: string;
  email: string;
  ghin_number: string;
  handicap: string;
  home_course_id: string;
}

interface PlayerFormProps {
  initialData?: Partial<PlayerFormData>;
  onSubmit: (data: PlayerFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  error?: string | null;
}

export default function PlayerForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  isLoading = false,
  error,
}: PlayerFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [ghinNumber, setGhinNumber] = useState(initialData?.ghin_number || '');
  const [handicap, setHandicap] = useState(initialData?.handicap || '');
  const [homeCourseId, setHomeCourseId] = useState(initialData?.home_course_id || '');

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch('/api/courses?limit=100');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.data);
        }
      } catch {
        // Silently fail - courses are optional
      } finally {
        setIsLoadingCourses(false);
      }
    }

    fetchCourses();
  }, []);

  const validate = (): boolean => {
    if (!name.trim()) {
      setValidationError('Name is required');
      return false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }

    if (handicap) {
      const hcp = parseFloat(handicap);
      if (isNaN(hcp) || hcp < -10 || hcp > 54) {
        setValidationError('Handicap must be between -10 and 54');
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      name: name.trim(),
      email: email.trim(),
      ghin_number: ghinNumber.trim(),
      handicap: handicap,
      home_course_id: homeCourseId,
    });
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="player-name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="player-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          placeholder="John Smith"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="player-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="email"
          id="player-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          placeholder="john@example.com"
        />
      </div>

      {/* GHIN Number */}
      <div>
        <label htmlFor="player-ghin" className="block text-sm font-medium text-gray-700 mb-1">
          GHIN Number <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          id="player-ghin"
          value={ghinNumber}
          onChange={(e) => setGhinNumber(e.target.value)}
          className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          placeholder="1234567"
        />
      </div>

      {/* Handicap */}
      <div>
        <label htmlFor="player-handicap" className="block text-sm font-medium text-gray-700 mb-1">
          Handicap Index <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="number"
          id="player-handicap"
          value={handicap}
          onChange={(e) => setHandicap(e.target.value)}
          step="0.1"
          min="-10"
          max="54"
          className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          placeholder="12.5"
        />
      </div>

      {/* Home Course */}
      <div>
        <label htmlFor="player-home-course" className="block text-sm font-medium text-gray-700 mb-1">
          Home Course <span className="text-gray-400">(optional)</span>
        </label>
        <select
          id="player-home-course"
          value={homeCourseId}
          onChange={(e) => setHomeCourseId(e.target.value)}
          disabled={isLoadingCourses}
          className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-500"
        >
          <option value="">
            {isLoadingCourses ? 'Loading courses...' : 'Select a home course'}
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} - {course.city}, {course.state}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {displayError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{displayError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="flex-1 px-4 py-2.5 text-white bg-primary rounded-lg hover:bg-primary-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
