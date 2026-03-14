'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import RoundSetupWizard from '@/components/rounds/round-setup-wizard';
import Link from 'next/link';

interface SideGameConfig {
  game_type: 'skins' | 'nassau' | 'match_play';
  config: { bet_amount: number; gross_net: 'gross' | 'net'; carryover?: boolean; press_threshold?: number; player_a_id?: string; player_b_id?: string };
}

interface WizardData {
  course: { id: string; name: string; city: string; state: string; num_holes: number; course_type?: string | null; tee_set_count: number } | null;
  teeSet: { id: string; name: string; color: string; course_rating: number; slope_rating: number; total_yardage: number | null; gender: string | null } | null;
  nineIds: string[];
  nines: { id: string; name: string; nine_type: 'front' | 'back' | 'named'; display_order: number; total_par: number; holes: { id: string; hole_number: number; par: number }[] }[];
  players: { player_id: string; name: string; playing_handicap: string; is_user: boolean }[];
  sideGames: SideGameConfig[];
  datePlayed: string;
  roundType: 'casual' | 'tournament' | 'practice';
  weather: string;
  temperature: string;
  notes: string;
}

export default function NewRoundPage() {
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('course') || undefined;
  const preselectedTeeId = searchParams.get('tee') || undefined;
  const isQuickStart = searchParams.get('quickstart') === 'true';
  const isEdit = searchParams.get('edit') === 'true';

  const [initialConfig, setInitialConfig] = useState<WizardData | undefined>(undefined);
  const [isLoadingConfig, setIsLoadingConfig] = useState(isQuickStart);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!isQuickStart) return;

    async function loadQuickStartConfig() {
      try {
        const prefsRes = await fetch('/api/user/preferences');
        if (!prefsRes.ok) throw new Error('Failed to load preferences');
        const prefsData = await prefsRes.json();
        const config = prefsData.preferences?.last_round_config;
        if (!config) throw new Error('No saved round configuration found');

        // Validate by fetching course and player data
        const [courseRes, playersRes] = await Promise.all([
          fetch(`/api/courses/${config.course_id}`),
          fetch('/api/players'),
        ]);

        if (!courseRes.ok) throw new Error('Saved course no longer exists');
        const courseData = await courseRes.json();

        const teeSet = courseData.tee_sets?.find((t: { id: string }) => t.id === config.tee_set_id);
        if (!teeSet) throw new Error('Saved tee set no longer exists');

        // Get nines
        const nines = courseData.nines?.filter((n: { id: string }) => config.nine_ids.includes(n.id)) || [];
        if (nines.length === 0) throw new Error('Saved nines no longer exist');

        // Build player list
        const playersData = await playersRes.json();
        const allPlayers = [
          ...(playersData.own_player ? [{ ...playersData.own_player, is_user: true }] : []),
          ...(playersData.guest_players || []).map((p: { id: string; name: string; current_handicap?: number | null }) => ({ ...p, is_user: false })),
        ];

        const validPlayers = config.player_ids
          .map((id: string) => {
            const p = allPlayers.find((pl: { id: string }) => pl.id === id);
            if (!p) return null;
            return {
              player_id: p.id,
              name: p.name,
              playing_handicap: p.current_handicap?.toString() || '',
              is_user: p.is_user,
            };
          })
          .filter(Boolean);

        if (validPlayers.length === 0) throw new Error('No valid players found from saved config');

        setInitialConfig({
          course: {
            id: courseData.id,
            name: courseData.name,
            city: courseData.city,
            state: courseData.state,
            num_holes: courseData.num_holes,
            course_type: courseData.course_type,
            tee_set_count: courseData.tee_sets?.length || 0,
          },
          teeSet: {
            id: teeSet.id,
            name: teeSet.name,
            color: teeSet.color,
            course_rating: Number(teeSet.course_rating),
            slope_rating: teeSet.slope_rating,
            total_yardage: teeSet.total_yardage,
            gender: teeSet.gender,
          },
          nineIds: config.nine_ids,
          nines: nines.map((n: { id: string; name: string; nine_type: 'front' | 'back' | 'named'; display_order: number; total_par?: number; holes?: { id: string; hole_number: number; par: number }[] }) => ({
            id: n.id,
            name: n.name,
            nine_type: n.nine_type,
            display_order: n.display_order,
            total_par: n.total_par || 0,
            holes: n.holes || [],
          })),
          players: validPlayers,
          sideGames: [],
          datePlayed: new Date().toISOString().split('T')[0],
          roundType: config.round_type || 'casual',
          weather: '',
          temperature: '',
          notes: '',
        });
      } catch (err) {
        setConfigError(err instanceof Error ? err.message : 'Failed to load quick start config');
      } finally {
        setIsLoadingConfig(false);
      }
    }

    loadQuickStartConfig();
  }, [isQuickStart]);

  if (isLoadingConfig) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-charcoal">Start New Round</h1>
          <p className="text-muted mt-1">Loading your quick start configuration...</p>
        </div>
        <div className="card p-6 animate-pulse">
          <div className="h-48 bg-cream-400 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/rounds"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal mb-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rounds
        </Link>
        <h1 className="text-2xl font-serif font-bold text-charcoal">Start New Round</h1>
        <p className="text-muted mt-1">
          {initialConfig ? 'Quick start with your saved setup' : 'Set up your round in a few simple steps'}
        </p>
      </div>

      {/* Config Error */}
      {configError && (
        <div className="bg-status-error border border-status-error-text/30 rounded-lg p-4 mb-6">
          <p className="text-status-error-text text-sm">{configError}</p>
          <p className="text-status-error-text/70 text-xs mt-1">Starting fresh wizard instead.</p>
        </div>
      )}

      {/* Wizard */}
      <RoundSetupWizard
        preselectedCourseId={preselectedCourseId}
        preselectedTeeId={preselectedTeeId}
        initialConfig={initialConfig}
        startAtConfirmation={isQuickStart && !isEdit && !!initialConfig}
      />
    </div>
  );
}
