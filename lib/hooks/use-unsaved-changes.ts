'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  message?: string;
  enabled?: boolean;
}

export function useUnsavedChanges({
  isDirty,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  enabled = true,
}: UseUnsavedChangesOptions) {
  const router = useRouter();

  // Handle browser back/forward and tab close
  useEffect(() => {
    if (!enabled || !isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message, enabled]);

  // Confirm navigation helper
  const confirmNavigation = useCallback(
    (onConfirm: () => void) => {
      if (!isDirty || !enabled) {
        onConfirm();
        return;
      }

      if (window.confirm(message)) {
        onConfirm();
      }
    },
    [isDirty, message, enabled]
  );

  // Safe navigate that checks for unsaved changes
  const safeNavigate = useCallback(
    (path: string) => {
      confirmNavigation(() => router.push(path));
    },
    [confirmNavigation, router]
  );

  return {
    confirmNavigation,
    safeNavigate,
  };
}
