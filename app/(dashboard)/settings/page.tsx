'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Preferences {
  track_detailed_stats: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<Preferences>({
    track_detailed_stats: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  const handleToggleDetailedStats = async () => {
    const newValue = !preferences.track_detailed_stats;
    setPreferences((prev) => ({ ...prev, track_detailed_stats: newValue }));
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_detailed_stats: newValue }),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Settings saved' });
        setTimeout(() => setSaveMessage(null), 2000);
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      setPreferences((prev) => ({ ...prev, track_detailed_stats: !newValue }));
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-golf-text">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your preferences</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-golf-text">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your preferences</p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            saveMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Account Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-golf-text mb-4">Account</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-golf-text">Email</p>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-golf-text">Name</p>
              <p className="text-sm text-gray-500">{session?.user?.name || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scorecard Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-golf-text mb-4">Scorecard Settings</h2>
        <div className="space-y-6">
          {/* Detailed Stats Toggle */}
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <p id="detailed-stats-label" className="font-medium text-golf-text">Track Detailed Statistics</p>
              <p id="detailed-stats-description" className="text-sm text-gray-500 mt-1">
                Record putts, fairways hit, and greens in regulation for each hole.
                When enabled, the score input will show additional fields for tracking these stats.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" strokeWidth={2} />
                  </svg>
                  Putts
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Fairways Hit
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  Greens in Regulation
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleDetailedStats}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                preferences.track_detailed_stats ? 'bg-primary' : 'bg-gray-200'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              role="switch"
              aria-checked={preferences.track_detailed_stats}
              aria-labelledby="detailed-stats-label"
              aria-describedby="detailed-stats-description"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.track_detailed_stats ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Detailed Statistics</h3>
            <p className="mt-1 text-sm text-blue-700">
              Tracking detailed stats helps you identify areas for improvement. After enabling,
              tap on any score cell to see additional input options. Your stats will be shown
              as indicators on the scorecard and included in round summaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
