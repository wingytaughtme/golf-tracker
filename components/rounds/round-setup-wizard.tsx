'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PlayerSelector from '@/components/players/player-selector';

interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
  num_holes: number;
  course_type?: string | null;
  tee_set_count: number;
}

interface TeeSet {
  id: string;
  name: string;
  color: string;
  course_rating: number;
  slope_rating: number;
  total_yardage: number | null;
  gender: string | null;
}

interface Player {
  id: string;
  name: string;
  current_handicap?: number | string | null;
  is_user: boolean;
}

interface PlayerWithHandicap {
  player_id: string;
  name: string;
  playing_handicap: string;
  is_user: boolean;
}

interface WizardData {
  course: Course | null;
  teeSet: TeeSet | null;
  players: PlayerWithHandicap[];
  datePlayed: string;
  roundType: 'casual' | 'tournament' | 'practice';
  weather: string;
  temperature: string;
  notes: string;
}

const STEPS = [
  { id: 1, name: 'Course', description: 'Select a course' },
  { id: 2, name: 'Tees', description: 'Choose tee set' },
  { id: 3, name: 'Players', description: 'Add players' },
  { id: 4, name: 'Details', description: 'Round details' },
];

export default function RoundSetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wizardData, setWizardData] = useState<WizardData>({
    course: null,
    teeSet: null,
    players: [],
    datePlayed: new Date().toISOString().split('T')[0],
    roundType: 'casual',
    weather: '',
    temperature: '',
    notes: '',
  });

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return wizardData.course !== null;
      case 2:
        return wizardData.teeSet !== null;
      case 3:
        return wizardData.players.length > 0;
      case 4:
        return wizardData.datePlayed !== '';
      default:
        return false;
    }
  }, [currentStep, wizardData]);

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!wizardData.course || !wizardData.teeSet || wizardData.players.length === 0) {
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: wizardData.course.id,
          tee_set_id: wizardData.teeSet.id,
          date_played: wizardData.datePlayed,
          round_type: wizardData.roundType,
          weather: wizardData.weather || null,
          temperature: wizardData.temperature ? parseInt(wizardData.temperature) : null,
          notes: wizardData.notes || null,
          players: wizardData.players.map((p) => ({
            player_id: p.player_id,
            playing_handicap: p.playing_handicap ? parseFloat(p.playing_handicap) : null,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create round');
      }

      const round = await response.json();
      router.push(`/rounds/${round.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create round');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {currentStep === 1 && (
          <CourseSelectionStep
            selectedCourse={wizardData.course}
            onSelect={(course) => {
              setWizardData({ ...wizardData, course, teeSet: null });
              setCurrentStep(2);
            }}
          />
        )}

        {currentStep === 2 && wizardData.course && (
          <TeeSelectionStep
            course={wizardData.course}
            selectedTeeSet={wizardData.teeSet}
            onSelect={(teeSet) => {
              setWizardData({ ...wizardData, teeSet });
              setCurrentStep(3);
            }}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <PlayerSelectionStep
            players={wizardData.players}
            onChange={(players) => setWizardData({ ...wizardData, players })}
          />
        )}

        {currentStep === 4 && (
          <RoundDetailsStep
            data={wizardData}
            onChange={(updates) => setWizardData({ ...wizardData, ...updates })}
          />
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {currentStep < 4 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !canProceed()}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Starting Round...' : 'Start Round'}
          </button>
        )}
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ steps, currentStep }: { steps: typeof STEPS; currentStep: number }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li key={step.id} className={`relative ${index !== steps.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  step.id < currentStep
                    ? 'bg-primary border-primary'
                    : step.id === currentStep
                    ? 'border-primary bg-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {step.id < currentStep ? (
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span
                    className={`text-sm font-medium ${
                      step.id === currentStep ? 'text-primary' : 'text-gray-500'
                    }`}
                  >
                    {step.id}
                  </span>
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p
                  className={`text-sm font-medium ${
                    step.id <= currentStep ? 'text-primary' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </p>
              </div>
              {index !== steps.length - 1 && (
                <div
                  className={`ml-4 flex-1 h-0.5 ${
                    step.id < currentStep ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Step 1: Course Selection
function CourseSelectionStep({
  selectedCourse,
  onSelect,
}: {
  selectedCourse: Course | null;
  onSelect: (course: Course) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [favorites, setFavorites] = useState<Course[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);

  // Fetch favorites on mount
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const response = await fetch('/api/user/favorites');
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.data || []);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoadingFavorites(false);
      }
    }

    async function fetchRecentCourses() {
      try {
        const response = await fetch('/api/rounds?limit=5');
        if (response.ok) {
          const data = await response.json();
          const uniqueCourses = new Map<string, Course>();
          data.data?.forEach((round: { course: Course }) => {
            if (!uniqueCourses.has(round.course.id)) {
              uniqueCourses.set(round.course.id, {
                ...round.course,
                tee_set_count: 0,
                num_holes: 18,
              });
            }
          });
          setRecentCourses(Array.from(uniqueCourses.values()).slice(0, 3));
        }
      } catch {
        // Silently fail
      }
    }

    fetchFavorites();
    fetchRecentCourses();
  }, []);

  // Search courses
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/courses?search=${encodeURIComponent(searchQuery)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data || []);
        }
      } catch {
        // Silently fail
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-golf-text mb-2">Select a Course</h2>
        <p className="text-gray-500 text-sm">Search for a course or select from your favorites</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search courses..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500">Search Results</h3>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {searchResults.map((course) => (
              <CourseListItem
                key={course.id}
                course={course}
                selected={selectedCourse?.id === course.id}
                onClick={() => onSelect(course)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Courses */}
      {!searchQuery && recentCourses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500">Recent Courses</h3>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {recentCourses.map((course) => (
              <CourseListItem
                key={course.id}
                course={course}
                selected={selectedCourse?.id === course.id}
                onClick={() => onSelect(course)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Favorite Courses */}
      {!searchQuery && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500">Favorite Courses</h3>
          {isLoadingFavorites ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {favorites.map((course) => (
                <CourseListItem
                  key={course.id}
                  course={course}
                  selected={selectedCourse?.id === course.id}
                  onClick={() => onSelect(course)}
                  isFavorite
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">No favorite courses yet</p>
              <p className="text-gray-400 text-xs mt-1">Use search to find a course</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CourseListItem({
  course,
  selected,
  onClick,
  isFavorite,
}: {
  course: Course;
  selected: boolean;
  onClick: () => void;
  isFavorite?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors ${
        selected ? 'bg-primary/5' : ''
      }`}
    >
      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center ${
          isFavorite ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
        }`}
      >
        {isFavorite ? (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-golf-text truncate">{course.name}</p>
        <p className="text-sm text-gray-500">
          {course.city}, {course.state}
        </p>
      </div>
      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// Step 2: Tee Selection
function TeeSelectionStep({
  course,
  selectedTeeSet,
  onSelect,
  onBack,
}: {
  course: Course;
  selectedTeeSet: TeeSet | null;
  onSelect: (teeSet: TeeSet) => void;
  onBack: () => void;
}) {
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeeSets() {
      try {
        const response = await fetch(`/api/courses/${course.id}`);
        if (!response.ok) throw new Error('Failed to fetch course details');
        const data = await response.json();
        setTeeSets(data.tee_sets || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tee sets');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeeSets();
  }, [course.id]);

  const getTeeColor = (color: string): string => {
    const colors: Record<string, string> = {
      black: 'bg-gray-900',
      blue: 'bg-blue-600',
      white: 'bg-white border-2 border-gray-300',
      gold: 'bg-amber-400',
      red: 'bg-red-600',
      green: 'bg-green-600',
    };
    return colors[color.toLowerCase()] || 'bg-gray-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Change course
        </button>
        <h2 className="text-lg font-semibold text-golf-text">{course.name}</h2>
        <p className="text-gray-500 text-sm">
          {course.city}, {course.state}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Select Tee Set</h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        ) : teeSets.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No tee sets available for this course</p>
          </div>
        ) : (
          <div className="space-y-2">
            {teeSets.map((teeSet) => (
              <button
                key={teeSet.id}
                onClick={() => onSelect(teeSet)}
                className={`w-full flex items-center gap-4 p-4 border rounded-lg text-left transition-all ${
                  selectedTeeSet?.id === teeSet.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`h-6 w-6 rounded-full ${getTeeColor(teeSet.color)}`} />
                <div className="flex-1">
                  <p className="font-medium text-golf-text">{teeSet.name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>{teeSet.total_yardage?.toLocaleString()} yds</span>
                    <span>Rating: {Number(teeSet.course_rating).toFixed(1)}</span>
                    <span>Slope: {teeSet.slope_rating}</span>
                    {teeSet.gender && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{teeSet.gender}</span>
                    )}
                  </div>
                </div>
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    selectedTeeSet?.id === teeSet.id ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}
                >
                  {selectedTeeSet?.id === teeSet.id && (
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Step 3: Player Selection
function PlayerSelectionStep({
  players,
  onChange,
}: {
  players: PlayerWithHandicap[];
  onChange: (players: PlayerWithHandicap[]) => void;
}) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(players.map((p) => p.player_id));

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch('/api/players');
        if (response.ok) {
          const data = await response.json();
          const combined = [
            ...(data.own_player ? [{ ...data.own_player, is_user: true }] : []),
            ...(data.guest_players || []).map((p: Player) => ({ ...p, is_user: false })),
          ];
          setAllPlayers(combined);

          // Initialize with current user if no players selected
          if (players.length === 0 && data.own_player) {
            const ownPlayer: PlayerWithHandicap = {
              player_id: data.own_player.id,
              name: data.own_player.name,
              playing_handicap: data.own_player.current_handicap?.toString() || '',
              is_user: true,
            };
            onChange([ownPlayer]);
            setSelectedIds([data.own_player.id]);
          }
        }
      } catch {
        // Silently fail
      }
    }

    fetchPlayers();
  }, []);

  const handlePlayerToggle = (playerIds: string[]) => {
    setSelectedIds(playerIds);

    const updatedPlayers: PlayerWithHandicap[] = playerIds.map((id) => {
      const existing = players.find((p) => p.player_id === id);
      if (existing) return existing;

      const player = allPlayers.find((p) => p.id === id);
      return {
        player_id: id,
        name: player?.name || '',
        playing_handicap: player?.current_handicap?.toString() || '',
        is_user: player?.is_user || false,
      };
    });

    onChange(updatedPlayers);
  };

  const handleHandicapChange = (playerId: string, handicap: string) => {
    const updated = players.map((p) =>
      p.player_id === playerId ? { ...p, playing_handicap: handicap } : p
    );
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-golf-text mb-2">Select Players</h2>
        <p className="text-gray-500 text-sm">Choose who&apos;s playing in this round (max 4)</p>
      </div>

      <PlayerSelector
        selectedPlayerIds={selectedIds}
        onChange={handlePlayerToggle}
        maxPlayers={4}
        requireCurrentUser={true}
      />

      {/* Playing Handicaps */}
      {players.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Playing Handicaps</h3>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.player_id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    player.is_user ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 font-medium text-golf-text">{player.name}</span>
                <input
                  type="number"
                  value={player.playing_handicap}
                  onChange={(e) => handleHandicapChange(player.player_id, e.target.value)}
                  placeholder="HCP"
                  step="0.1"
                  min="-10"
                  max="54"
                  className="w-20 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Step 4: Round Details
function RoundDetailsStep({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-golf-text mb-2">Round Details</h2>
        <p className="text-gray-500 text-sm">Add any additional details for your round</p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Course</span>
          <span className="font-medium text-golf-text">{data.course?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tees</span>
          <span className="font-medium text-golf-text">{data.teeSet?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Players</span>
          <span className="font-medium text-golf-text">
            {data.players.map((p) => p.name).join(', ')}
          </span>
        </div>
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date-played" className="block text-sm font-medium text-gray-700 mb-1">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="date-played"
          value={data.datePlayed}
          onChange={(e) => onChange({ datePlayed: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Round Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Round Type</label>
        <div className="flex gap-3">
          {(['casual', 'tournament', 'practice'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onChange({ roundType: type })}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                data.roundType === type
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Weather */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Weather <span className="text-gray-400">(optional)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {['Sunny', 'Cloudy', 'Rainy', 'Windy'].map((weather) => (
            <button
              key={weather}
              onClick={() => onChange({ weather: data.weather === weather ? '' : weather })}
              className={`py-1.5 px-3 rounded-full border text-sm transition-colors ${
                data.weather === weather
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {weather}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div>
        <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
          Temperature <span className="text-gray-400">(optional)</span>
        </label>
        <div className="relative w-32">
          <input
            type="number"
            id="temperature"
            value={data.temperature}
            onChange={(e) => onChange({ temperature: e.target.value })}
            placeholder="72"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            F
          </span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Any notes about this round..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
      </div>
    </div>
  );
}
