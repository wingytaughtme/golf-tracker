'use client';

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
  });

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    setState((prev) => ({ ...prev, isSupported: true }));

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[SW] Service worker registered:', registration.scope);

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New version available');
                setState((prev) => ({ ...prev, isUpdateAvailable: true }));
              }
            });
          }
        });

        // Check for waiting service worker on page load
        if (registration.waiting) {
          setState((prev) => ({ ...prev, isUpdateAvailable: true }));
        }
      } catch (error) {
        console.error('[SW] Registration failed:', error);
      }
    };

    // Wait for page load
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  // Update service worker
  const update = useCallback(() => {
    const { registration } = state;
    if (!registration?.waiting) return;

    // Tell waiting service worker to skip waiting
    registration.waiting.postMessage('skipWaiting');

    // Reload page when new service worker takes over
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, [state]);

  // Cache a round for offline use
  const cacheRound = useCallback((roundId: string) => {
    if (!state.registration?.active) return;

    state.registration.active.postMessage({
      type: 'CACHE_ROUND',
      roundId,
    });
  }, [state.registration]);

  return {
    ...state,
    update,
    cacheRound,
  };
}
