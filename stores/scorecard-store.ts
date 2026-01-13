import { create } from 'zustand';

interface ScoreData {
  strokes: number | null;
  putts: number | null;
  fairway_hit: boolean | null;
  green_in_regulation: boolean | null;
}

interface ScoreEntry {
  scoreId: string;
  roundPlayerId: string;
  holeId: string;
  holeNumber: number;
  par: number;
  original: ScoreData;
  current: ScoreData;
  isDirty: boolean;
}

interface ActiveCell {
  roundPlayerId: string;
  holeNumber: number;
  scoreId: string;
}

interface FocusedCell {
  roundPlayerId: string;
  holeNumber: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface ScorecardStore {
  // State
  roundId: string | null;
  scores: Record<string, ScoreEntry>; // Key: `${roundPlayerId}-${holeNumber}`
  activeCell: ActiveCell | null;
  focusedCell: FocusedCell | null;
  currentHole: number;
  playerOrder: string[]; // Array of roundPlayerIds in display order
  isDirty: boolean;
  isSaving: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  lastSaved: Date | null;
  lastModified: Date | null;
  retryCount: number;
  totalHoles: number;

  // Actions
  initializeScores: (roundId: string, scores: Array<{
    id: string;
    roundPlayerId: string;
    holeId: string;
    holeNumber: number;
    par: number;
    strokes: number | null;
    putts: number | null;
    fairway_hit: boolean | null;
    green_in_regulation: boolean | null;
  }>, playerOrder?: string[]) => void;

  setActiveCell: (cell: ActiveCell | null) => void;
  setFocusedCell: (cell: FocusedCell | null) => void;
  setCurrentHole: (hole: number) => void;
  calculateCurrentHole: () => number;
  setPlayerOrder: (order: string[]) => void;
  movePlayer: (fromIndex: number, toIndex: number) => void;

  updateScore: (roundPlayerId: string, holeNumber: number, strokes: number | null) => void;
  updatePutts: (roundPlayerId: string, holeNumber: number, putts: number | null) => void;
  updateFairwayHit: (roundPlayerId: string, holeNumber: number, hit: boolean | null) => void;
  updateGIR: (roundPlayerId: string, holeNumber: number, gir: boolean | null) => void;
  clearScore: (roundPlayerId: string, holeNumber: number) => void;

  getScore: (roundPlayerId: string, holeNumber: number) => ScoreEntry | undefined;
  getDirtyScores: () => ScoreEntry[];
  getPlayerScoreToPar: (roundPlayerId: string, throughHole?: number) => number | null;
  getPlayerFrontNineToPar: (roundPlayerId: string) => number | null;
  getPlayerBackNineToPar: (roundPlayerId: string) => number | null;

  // Navigation
  navigateToCell: (direction: 'up' | 'down' | 'left' | 'right') => FocusedCell | null;
  navigateToNextHole: () => FocusedCell | null;
  navigateToPrevHole: () => FocusedCell | null;
  navigateToNextPlayer: () => FocusedCell | null;
  navigateToPrevPlayer: () => FocusedCell | null;

  markAsSaved: (savedAt?: Date) => void;
  setSaving: (saving: boolean) => void;
  setSaveStatus: (status: SaveStatus, error?: string) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
  resetStore: () => void;

  // localStorage methods
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => { scores: Record<string, ScoreEntry>; lastModified: Date; playerOrder?: string[] } | null;
  clearLocalStorage: () => void;
  getLocalStorageKey: () => string;
  savePlayerOrder: () => void;
  loadPlayerOrder: () => string[] | null;
}

const getScoreKey = (roundPlayerId: string, holeNumber: number) =>
  `${roundPlayerId}-${holeNumber}`;

const LOCAL_STORAGE_PREFIX = 'golf-tracker-scorecard-';
const PLAYER_ORDER_PREFIX = 'golf-tracker-player-order-';

export const useScorecardStore = create<ScorecardStore>((set, get) => ({
  // Initial state
  roundId: null,
  scores: {},
  activeCell: null,
  focusedCell: null,
  currentHole: 1,
  playerOrder: [],
  isDirty: false,
  isSaving: false,
  saveStatus: 'idle',
  saveError: null,
  lastSaved: null,
  lastModified: null,
  retryCount: 0,
  totalHoles: 18,

  // Actions
  initializeScores: (roundId, scoresList, initialPlayerOrder) => {
    const scores: Record<string, ScoreEntry> = {};
    const playerIds = new Set<string>();
    let maxHole = 0;

    for (const score of scoresList) {
      const key = getScoreKey(score.roundPlayerId, score.holeNumber);
      playerIds.add(score.roundPlayerId);
      maxHole = Math.max(maxHole, score.holeNumber);

      const scoreData: ScoreData = {
        strokes: score.strokes,
        putts: score.putts,
        fairway_hit: score.fairway_hit,
        green_in_regulation: score.green_in_regulation,
      };

      scores[key] = {
        scoreId: score.id,
        roundPlayerId: score.roundPlayerId,
        holeId: score.holeId,
        holeNumber: score.holeNumber,
        par: score.par,
        original: { ...scoreData },
        current: { ...scoreData },
        isDirty: false,
      };
    }

    // Load saved player order or use provided/default
    const savedOrder = get().loadPlayerOrder();
    const playerOrder = initialPlayerOrder || savedOrder || Array.from(playerIds);

    set({
      roundId,
      scores,
      playerOrder,
      totalHoles: maxHole || 18,
      isDirty: false,
      lastSaved: null,
      lastModified: null,
      saveStatus: 'idle',
      saveError: null,
      retryCount: 0,
      focusedCell: null,
    });

    // Calculate initial current hole
    const currentHole = get().calculateCurrentHole();
    set({ currentHole });
  },

  setActiveCell: (cell) => {
    set({ activeCell: cell });
  },

  setFocusedCell: (cell) => {
    set({ focusedCell: cell });
  },

  setCurrentHole: (hole) => {
    set({ currentHole: hole });
  },

  calculateCurrentHole: () => {
    const { scores, playerOrder, totalHoles } = get();

    // Find the first hole where not all players have scores
    for (let hole = 1; hole <= totalHoles; hole++) {
      const allPlayersHaveScore = playerOrder.every((playerId) => {
        const entry = scores[getScoreKey(playerId, hole)];
        return entry && entry.current.strokes !== null;
      });

      if (!allPlayersHaveScore) {
        return hole;
      }
    }

    // All holes complete
    return totalHoles;
  },

  setPlayerOrder: (order) => {
    set({ playerOrder: order });
    get().savePlayerOrder();
  },

  movePlayer: (fromIndex, toIndex) => {
    const { playerOrder } = get();
    const newOrder = [...playerOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    set({ playerOrder: newOrder });
    get().savePlayerOrder();
  },

  updateScore: (roundPlayerId, holeNumber, strokes) => {
    const key = getScoreKey(roundPlayerId, holeNumber);
    const { scores, saveToLocalStorage, calculateCurrentHole } = get();
    const entry = scores[key];

    if (!entry) return;

    const newCurrent = { ...entry.current, strokes };
    const isDirty =
      newCurrent.strokes !== entry.original.strokes ||
      newCurrent.putts !== entry.original.putts ||
      newCurrent.fairway_hit !== entry.original.fairway_hit ||
      newCurrent.green_in_regulation !== entry.original.green_in_regulation;

    const now = new Date();

    set({
      scores: {
        ...scores,
        [key]: {
          ...entry,
          current: newCurrent,
          isDirty,
        },
      },
      isDirty: true,
      lastModified: now,
      saveStatus: 'idle',
    });

    // Update current hole after score change
    const newCurrentHole = calculateCurrentHole();
    set({ currentHole: newCurrentHole });

    // Save to localStorage after state update
    setTimeout(() => saveToLocalStorage(), 0);
  },

  updatePutts: (roundPlayerId, holeNumber, putts) => {
    const key = getScoreKey(roundPlayerId, holeNumber);
    const { scores, saveToLocalStorage } = get();
    const entry = scores[key];

    if (!entry) return;

    const newCurrent = { ...entry.current, putts };
    const isDirty =
      newCurrent.strokes !== entry.original.strokes ||
      newCurrent.putts !== entry.original.putts ||
      newCurrent.fairway_hit !== entry.original.fairway_hit ||
      newCurrent.green_in_regulation !== entry.original.green_in_regulation;

    set({
      scores: {
        ...scores,
        [key]: {
          ...entry,
          current: newCurrent,
          isDirty,
        },
      },
      isDirty: true,
      lastModified: new Date(),
      saveStatus: 'idle',
    });

    setTimeout(() => saveToLocalStorage(), 0);
  },

  updateFairwayHit: (roundPlayerId, holeNumber, hit) => {
    const key = getScoreKey(roundPlayerId, holeNumber);
    const { scores, saveToLocalStorage } = get();
    const entry = scores[key];

    if (!entry) return;

    const newCurrent = { ...entry.current, fairway_hit: hit };
    const isDirty =
      newCurrent.strokes !== entry.original.strokes ||
      newCurrent.putts !== entry.original.putts ||
      newCurrent.fairway_hit !== entry.original.fairway_hit ||
      newCurrent.green_in_regulation !== entry.original.green_in_regulation;

    set({
      scores: {
        ...scores,
        [key]: {
          ...entry,
          current: newCurrent,
          isDirty,
        },
      },
      isDirty: true,
      lastModified: new Date(),
      saveStatus: 'idle',
    });

    setTimeout(() => saveToLocalStorage(), 0);
  },

  updateGIR: (roundPlayerId, holeNumber, gir) => {
    const key = getScoreKey(roundPlayerId, holeNumber);
    const { scores, saveToLocalStorage } = get();
    const entry = scores[key];

    if (!entry) return;

    const newCurrent = { ...entry.current, green_in_regulation: gir };
    const isDirty =
      newCurrent.strokes !== entry.original.strokes ||
      newCurrent.putts !== entry.original.putts ||
      newCurrent.fairway_hit !== entry.original.fairway_hit ||
      newCurrent.green_in_regulation !== entry.original.green_in_regulation;

    set({
      scores: {
        ...scores,
        [key]: {
          ...entry,
          current: newCurrent,
          isDirty,
        },
      },
      isDirty: true,
      lastModified: new Date(),
      saveStatus: 'idle',
    });

    setTimeout(() => saveToLocalStorage(), 0);
  },

  clearScore: (roundPlayerId, holeNumber) => {
    const key = getScoreKey(roundPlayerId, holeNumber);
    const { scores, saveToLocalStorage, calculateCurrentHole } = get();
    const entry = scores[key];

    if (!entry) return;

    const newCurrent: ScoreData = {
      strokes: null,
      putts: null,
      fairway_hit: null,
      green_in_regulation: null,
    };

    const isDirty =
      entry.original.strokes !== null ||
      entry.original.putts !== null ||
      entry.original.fairway_hit !== null ||
      entry.original.green_in_regulation !== null;

    set({
      scores: {
        ...scores,
        [key]: {
          ...entry,
          current: newCurrent,
          isDirty,
        },
      },
      isDirty: true,
      lastModified: new Date(),
      saveStatus: 'idle',
    });

    // Update current hole after clearing
    const newCurrentHole = calculateCurrentHole();
    set({ currentHole: newCurrentHole });

    setTimeout(() => saveToLocalStorage(), 0);
  },

  getScore: (roundPlayerId, holeNumber) => {
    const key = getScoreKey(roundPlayerId, holeNumber);
    return get().scores[key];
  },

  getDirtyScores: () => {
    const { scores } = get();
    return Object.values(scores).filter((entry) => entry.isDirty);
  },

  getPlayerScoreToPar: (roundPlayerId, throughHole) => {
    const { scores, totalHoles } = get();
    const maxHole = throughHole || totalHoles;
    let totalStrokes = 0;
    let totalPar = 0;
    let hasScores = false;

    for (let hole = 1; hole <= maxHole; hole++) {
      const entry = scores[getScoreKey(roundPlayerId, hole)];
      if (entry && entry.current.strokes !== null) {
        totalStrokes += entry.current.strokes;
        totalPar += entry.par;
        hasScores = true;
      }
    }

    return hasScores ? totalStrokes - totalPar : null;
  },

  getPlayerFrontNineToPar: (roundPlayerId) => {
    const { scores } = get();
    let totalStrokes = 0;
    let totalPar = 0;
    let hasScores = false;

    for (let hole = 1; hole <= 9; hole++) {
      const entry = scores[getScoreKey(roundPlayerId, hole)];
      if (entry && entry.current.strokes !== null) {
        totalStrokes += entry.current.strokes;
        totalPar += entry.par;
        hasScores = true;
      }
    }

    return hasScores ? totalStrokes - totalPar : null;
  },

  getPlayerBackNineToPar: (roundPlayerId) => {
    const { scores } = get();
    let totalStrokes = 0;
    let totalPar = 0;
    let hasScores = false;

    for (let hole = 10; hole <= 18; hole++) {
      const entry = scores[getScoreKey(roundPlayerId, hole)];
      if (entry && entry.current.strokes !== null) {
        totalStrokes += entry.current.strokes;
        totalPar += entry.par;
        hasScores = true;
      }
    }

    return hasScores ? totalStrokes - totalPar : null;
  },

  // Navigation helpers
  navigateToCell: (direction) => {
    const { focusedCell, playerOrder, totalHoles } = get();
    if (!focusedCell || playerOrder.length === 0) return null;

    const playerIndex = playerOrder.indexOf(focusedCell.roundPlayerId);
    if (playerIndex === -1) return null;

    let newHole = focusedCell.holeNumber;
    let newPlayerIndex = playerIndex;

    switch (direction) {
      case 'left':
        newHole = Math.max(1, focusedCell.holeNumber - 1);
        break;
      case 'right':
        newHole = Math.min(totalHoles, focusedCell.holeNumber + 1);
        break;
      case 'up':
        newPlayerIndex = Math.max(0, playerIndex - 1);
        break;
      case 'down':
        newPlayerIndex = Math.min(playerOrder.length - 1, playerIndex + 1);
        break;
    }

    const newCell = {
      roundPlayerId: playerOrder[newPlayerIndex],
      holeNumber: newHole,
    };

    set({ focusedCell: newCell });
    return newCell;
  },

  navigateToNextHole: () => {
    const { focusedCell, totalHoles } = get();
    if (!focusedCell) return null;

    const newHole = Math.min(totalHoles, focusedCell.holeNumber + 1);
    const newCell = { ...focusedCell, holeNumber: newHole };
    set({ focusedCell: newCell });
    return newCell;
  },

  navigateToPrevHole: () => {
    const { focusedCell } = get();
    if (!focusedCell) return null;

    const newHole = Math.max(1, focusedCell.holeNumber - 1);
    const newCell = { ...focusedCell, holeNumber: newHole };
    set({ focusedCell: newCell });
    return newCell;
  },

  navigateToNextPlayer: () => {
    const { focusedCell, playerOrder } = get();
    if (!focusedCell || playerOrder.length === 0) return null;

    const currentIndex = playerOrder.indexOf(focusedCell.roundPlayerId);
    const nextIndex = (currentIndex + 1) % playerOrder.length;
    const newCell = { ...focusedCell, roundPlayerId: playerOrder[nextIndex] };
    set({ focusedCell: newCell });
    return newCell;
  },

  navigateToPrevPlayer: () => {
    const { focusedCell, playerOrder } = get();
    if (!focusedCell || playerOrder.length === 0) return null;

    const currentIndex = playerOrder.indexOf(focusedCell.roundPlayerId);
    const prevIndex = currentIndex === 0 ? playerOrder.length - 1 : currentIndex - 1;
    const newCell = { ...focusedCell, roundPlayerId: playerOrder[prevIndex] };
    set({ focusedCell: newCell });
    return newCell;
  },

  markAsSaved: (savedAt) => {
    const { scores, clearLocalStorage } = get();
    const updatedScores: Record<string, ScoreEntry> = {};

    for (const [key, entry] of Object.entries(scores)) {
      updatedScores[key] = {
        ...entry,
        original: { ...entry.current },
        isDirty: false,
      };
    }

    set({
      scores: updatedScores,
      isDirty: false,
      lastSaved: savedAt || new Date(),
      saveStatus: 'saved',
      saveError: null,
      retryCount: 0,
    });

    clearLocalStorage();
  },

  setSaving: (saving) => {
    set({
      isSaving: saving,
      saveStatus: saving ? 'saving' : get().saveStatus,
    });
  },

  setSaveStatus: (status, error) => {
    set({
      saveStatus: status,
      saveError: error || null,
      isSaving: status === 'saving',
    });
  },

  incrementRetryCount: () => {
    set((state) => ({ retryCount: state.retryCount + 1 }));
  },

  resetRetryCount: () => {
    set({ retryCount: 0 });
  },

  resetStore: () => {
    const { clearLocalStorage } = get();
    clearLocalStorage();

    set({
      roundId: null,
      scores: {},
      activeCell: null,
      focusedCell: null,
      currentHole: 1,
      playerOrder: [],
      isDirty: false,
      isSaving: false,
      saveStatus: 'idle',
      saveError: null,
      lastSaved: null,
      lastModified: null,
      retryCount: 0,
      totalHoles: 18,
    });
  },

  // localStorage methods
  getLocalStorageKey: () => {
    const { roundId } = get();
    return `${LOCAL_STORAGE_PREFIX}${roundId}`;
  },

  saveToLocalStorage: () => {
    const { roundId, scores, lastModified, playerOrder, getLocalStorageKey } = get();
    if (!roundId || typeof window === 'undefined') return;

    try {
      const data = {
        roundId,
        scores,
        playerOrder,
        lastModified: lastModified?.toISOString(),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  loadFromLocalStorage: () => {
    const { roundId, getLocalStorageKey } = get();
    if (!roundId || typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(getLocalStorageKey());
      if (!stored) return null;

      const data = JSON.parse(stored);
      if (data.roundId !== roundId) return null;

      return {
        scores: data.scores,
        lastModified: new Date(data.lastModified),
        playerOrder: data.playerOrder,
      };
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  },

  clearLocalStorage: () => {
    const { getLocalStorageKey } = get();
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(getLocalStorageKey());
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },

  savePlayerOrder: () => {
    const { roundId, playerOrder } = get();
    if (!roundId || typeof window === 'undefined') return;

    try {
      localStorage.setItem(`${PLAYER_ORDER_PREFIX}${roundId}`, JSON.stringify(playerOrder));
    } catch (error) {
      console.error('Failed to save player order:', error);
    }
  },

  loadPlayerOrder: () => {
    const { roundId } = get();
    if (!roundId || typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`${PLAYER_ORDER_PREFIX}${roundId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load player order:', error);
      return null;
    }
  },
}));

// Helper function to format score to par
export function formatScoreToPar(scoreToPar: number | null): string {
  if (scoreToPar === null) return '-';
  if (scoreToPar === 0) return 'E';
  return scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar.toString();
}

// Export types for use in hooks
export type { ScoreEntry, ScoreData, SaveStatus, FocusedCell };
