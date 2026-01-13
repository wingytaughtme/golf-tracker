'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  StatsCard,
  StatsCardSkeleton,
  HandicapChart,
  HandicapChartSkeleton,
  ScoringDistributionChart,
  ScoringDistributionSkeleton,
  RecentRounds,
  RecentRoundsSkeleton,
  CourseBreakdown,
  CourseBreakdownSkeleton,
  ScoringByParChart,
  ScoringByParSkeleton,
} from '@/components/dashboard';

interface Player {
  id: string;
  name: string;
  email?: string | null;
  ghin_number?: string | null;
  current_handicap?: number | string | null;
  rounds_played: number;
  is_user: boolean;
  created_at: string;
  home_course?: {
    id: string;
    name: string;
    city: string;
    state: string;
  } | null;
  handicap_history?: {
    handicap_index: number | string;
    effective_date: string;
  }[];
  stats?: {
    avg_score: number | null;
    best_score: number | null;
  };
  recent_rounds?: {
    id: string;
    date_played: string;
    course: {
      id: string;
      name: string;
      city: string;
      state: string;
    };
    tee_set: {
      name: string;
      color: string;
    };
    gross_score: number | null;
    net_score: number | string | null;
    status: string;
  }[];
}

interface PlayerStats {
  playerId: string;
  playerName: string;
  type: string;
  data: {
    overall: {
      totalRounds: number;
      completedRounds: number;
      averageGrossScore: number | null;
      bestRound: {
        grossScore: number;
        courseName: string;
        datePlayed: string;
        roundId: string;
      } | null;
      worstRound: {
        grossScore: number;
        courseName: string;
        datePlayed: string;
        roundId: string;
      } | null;
      currentHandicap: number | null;
      averageScoreVsPar: number | null;
      totalHolesPlayed: number;
    };
    scoring: {
      scoringByPar: {
        par: number;
        holesPlayed: number;
        totalStrokes: number;
        average: number;
        averageVsPar: number;
      }[];
      distribution: {
        eagles: number;
        birdies: number;
        pars: number;
        bogeys: number;
        doubleBogeys: number;
        triplePlus: number;
        total: number;
        percentages: {
          eagles: number;
          birdies: number;
          pars: number;
          bogeys: number;
          doubleBogeys: number;
          triplePlus: number;
        };
      };
    };
    detailed: {
      fairways: {
        hit: number;
        total: number;
        percentage: number | null;
      } | null;
      greensInRegulation: {
        hit: number;
        total: number;
        percentage: number | null;
      } | null;
      putting: {
        totalPutts: number;
        roundsWithPuttData: number;
        averagePuttsPerRound: number | null;
        averagePuttsPerHole: number | null;
      } | null;
      scrambling: {
        successful: number;
        attempts: number;
        percentage: number | null;
      } | null;
      penalties: {
        total: number;
        averagePerRound: number | null;
      };
      sandShots: {
        total: number;
        averagePerRound: number | null;
      };
    };
    trends: {
      handicap: {
        date: string;
        value: number;
        roundId: string;
        courseName: string;
      }[];
      scoringAverage: {
        date: string;
        value: number;
        roundId: string;
        courseName: string;
      }[];
      scoreToPar: {
        date: string;
        value: number;
        roundId: string;
        courseName: string;
      }[];
    };
    courses: {
      totalCourses: number;
      courseStats: {
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
      }[];
    };
  };
}

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'scoring'>('courses');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGhin, setEditGhin] = useState('');
  const [editHandicap, setEditHandicap] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayer();
    fetchStats();
  }, [playerId]);

  async function fetchPlayer() {
    try {
      const response = await fetch(`/api/players/${playerId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Player not found');
        }
        if (response.status === 401) {
          throw new Error('Please log in to view this player');
        }
        throw new Error('Failed to fetch player');
      }
      const data = await response.json();
      setPlayer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch(`/api/players/${playerId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }

  function openEditModal() {
    if (!player) return;
    setEditName(player.name);
    setEditEmail(player.email || '');
    setEditGhin(player.ghin_number || '');
    setEditHandicap(player.current_handicap?.toString() || '');
    setFormError(null);
    setShowEditModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim() || null,
          ghin_number: editGhin.trim() || null,
          handicap: editHandicap ? parseFloat(editHandicap) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update player');
      }

      const updatedPlayer = await response.json();
      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              ...updatedPlayer,
            }
          : null
      );
      setShowEditModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update player');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!player || player.is_user) return;

    if (!confirm(`Are you sure you want to delete ${player.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete player');
      }

      router.push('/players');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete player');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex gap-4">
            <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/players" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Players
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-red-800 mb-2">{error}</h2>
          <p className="text-red-600">Please try again or go back to the players list.</p>
        </div>
      </div>
    );
  }

  if (!player) return null;

  const memberSince = new Date(player.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/players" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Players
      </Link>

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div
              className={`flex-shrink-0 h-20 w-20 rounded-full flex items-center justify-center text-3xl font-bold ${
                player.is_user ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-display font-bold text-golf-text">{player.name}</h1>
                    {player.is_user && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        You
                      </span>
                    )}
                  </div>

                  {/* Handicap prominently displayed */}
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-bold text-primary">
                      {stats?.data.overall.currentHandicap !== null && stats?.data.overall.currentHandicap !== undefined
                        ? stats.data.overall.currentHandicap.toFixed(1)
                        : player.current_handicap !== null && player.current_handicap !== undefined
                        ? Number(player.current_handicap).toFixed(1)
                        : '—'}
                    </span>
                    <span className="text-gray-500">Handicap Index</span>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                    <span>{stats?.data.overall.completedRounds ?? player.rounds_played} rounds played</span>
                    <span>Member since {memberSince}</span>
                    {player.ghin_number && <span>GHIN: {player.ghin_number}</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={openEditModal}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Profile
                  </button>
                  {!player.is_user && (
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Average Score"
              value={stats?.data.overall.averageGrossScore?.toFixed(1) ?? null}
              subtitle={stats?.data.overall.averageScoreVsPar != null
                ? `${stats.data.overall.averageScoreVsPar > 0 ? '+' : ''}${stats.data.overall.averageScoreVsPar.toFixed(1)} vs par`
                : undefined}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            <StatsCard
              title="Best Round"
              value={stats?.data.overall.bestRound?.grossScore ?? null}
              subtitle={stats?.data.overall.bestRound?.courseName}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
            />
            <StatsCard
              title="Fairways Hit"
              value={stats?.data.detailed.fairways?.percentage !== null
                ? `${stats?.data.detailed.fairways?.percentage}%`
                : null}
              subtitle={stats?.data.detailed.fairways
                ? `${stats.data.detailed.fairways.hit}/${stats.data.detailed.fairways.total}`
                : 'Not tracked'}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            <StatsCard
              title="GIR %"
              value={stats?.data.detailed.greensInRegulation?.percentage !== null
                ? `${stats?.data.detailed.greensInRegulation?.percentage}%`
                : null}
              subtitle={stats?.data.detailed.greensInRegulation
                ? `${stats.data.detailed.greensInRegulation.hit}/${stats.data.detailed.greensInRegulation.total}`
                : 'Not tracked'}
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {statsLoading ? (
          <>
            <HandicapChartSkeleton />
            <ScoringDistributionSkeleton />
          </>
        ) : (
          <>
            <HandicapChart
              data={stats?.data.trends.handicap ?? []}
              title="Handicap Trend"
            />
            <ScoringDistributionChart
              data={stats?.data.scoring.distribution ?? {
                eagles: 0,
                birdies: 0,
                pars: 0,
                bogeys: 0,
                doubleBogeys: 0,
                triplePlus: 0,
                total: 0,
                percentages: { eagles: 0, birdies: 0, pars: 0, bogeys: 0, doubleBogeys: 0, triplePlus: 0 }
              }}
              title="Scoring Distribution"
            />
          </>
        )}
      </div>

      {/* Recent Rounds */}
      {statsLoading ? (
        <RecentRoundsSkeleton />
      ) : (
        <RecentRounds
          rounds={(player.recent_rounds ?? []).map(r => ({
            ...r,
            par: 72, // Default par, would need to come from API
          }))}
          playerId={playerId}
          title="Recent Rounds"
        />
      )}

      {/* Tabs Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'courses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Course Breakdown
            </button>
            <button
              onClick={() => setActiveTab('scoring')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'scoring'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Scoring by Par
            </button>
          </nav>
        </div>

        <div className="p-6">
          {statsLoading ? (
            activeTab === 'courses' ? <CourseBreakdownSkeleton /> : <ScoringByParSkeleton />
          ) : activeTab === 'courses' ? (
            <CourseBreakdown
              courses={stats?.data.courses.courseStats ?? []}
            />
          ) : (
            <ScoringByParChart
              data={stats?.data.scoring.scoringByPar ?? []}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-golf-text">Edit Player</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="edit-email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="edit-ghin" className="block text-sm font-medium text-gray-700 mb-1">
                    GHIN Number
                  </label>
                  <input
                    type="text"
                    id="edit-ghin"
                    value={editGhin}
                    onChange={(e) => setEditGhin(e.target.value)}
                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="edit-handicap" className="block text-sm font-medium text-gray-700 mb-1">
                    Handicap Index
                  </label>
                  <input
                    type="number"
                    id="edit-handicap"
                    value={editHandicap}
                    onChange={(e) => setEditHandicap(e.target.value)}
                    step="0.1"
                    min="-10"
                    max="54"
                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{formError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !editName.trim()}
                    className="flex-1 px-4 py-2.5 text-white bg-primary rounded-lg hover:bg-primary-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
