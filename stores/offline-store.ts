import { create } from 'zustand';

interface PendingChange {
  id: string;
  roundId: string;
  scoreId: string;
  data: {
    strokes: number | null;
    putts: number | null;
    fairway_hit: boolean | null;
    green_in_regulation: boolean | null;
  };
  timestamp: number;
  retries: number;
}

interface OfflineState {
  // Connection status
  isOnline: boolean;
  lastOnlineAt: Date | null;

  // Sync status
  isSyncing: boolean;
  lastSyncAt: Date | null;
  lastSyncError: string | null;

  // Pending changes queue
  pendingChanges: PendingChange[];

  // Actions
  setOnlineStatus: (online: boolean) => void;
  addPendingChange: (change: Omit<PendingChange, 'id' | 'timestamp' | 'retries'>) => void;
  removePendingChange: (id: string) => void;
  clearPendingChanges: (roundId?: string) => void;
  incrementRetries: (id: string) => void;

  setSyncing: (syncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  markSynced: () => void;

  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;

  // Computed
  getPendingCount: () => number;
  getPendingForRound: (roundId: string) => PendingChange[];
  hasPendingChanges: () => boolean;
}

const STORAGE_KEY = 'golf-tracker-offline-queue';
const MAX_RETRIES = 5;

export const useOfflineStore = create<OfflineState>((set, get) => ({
  // Initial state
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastOnlineAt: null,
  isSyncing: false,
  lastSyncAt: null,
  lastSyncError: null,
  pendingChanges: [],

  // Set online status
  setOnlineStatus: (online) => {
    const wasOffline = !get().isOnline;
    set({
      isOnline: online,
      lastOnlineAt: online ? new Date() : get().lastOnlineAt,
    });

    // If we just came back online and have pending changes, they'll be synced
    if (online && wasOffline) {
      console.log('[Offline] Back online, pending changes will sync');
    }
  },

  // Add a pending change to the queue
  addPendingChange: (change) => {
    const newChange: PendingChange = {
      ...change,
      id: `${change.roundId}-${change.scoreId}-${Date.now()}`,
      timestamp: Date.now(),
      retries: 0,
    };

    set((state) => {
      // Replace existing change for same score (latest wins)
      const filtered = state.pendingChanges.filter(
        (c) => c.scoreId !== change.scoreId
      );
      return { pendingChanges: [...filtered, newChange] };
    });

    // Save to storage
    get().saveToStorage();
  },

  // Remove a pending change (after successful sync)
  removePendingChange: (id) => {
    set((state) => ({
      pendingChanges: state.pendingChanges.filter((c) => c.id !== id),
    }));
    get().saveToStorage();
  },

  // Clear all pending changes (optionally for a specific round)
  clearPendingChanges: (roundId) => {
    set((state) => ({
      pendingChanges: roundId
        ? state.pendingChanges.filter((c) => c.roundId !== roundId)
        : [],
    }));
    get().saveToStorage();
  },

  // Increment retry count for a change
  incrementRetries: (id) => {
    set((state) => ({
      pendingChanges: state.pendingChanges.map((c) =>
        c.id === id ? { ...c, retries: c.retries + 1 } : c
      ).filter((c) => c.retries < MAX_RETRIES), // Remove if max retries exceeded
    }));
    get().saveToStorage();
  },

  // Sync status
  setSyncing: (syncing) => set({ isSyncing: syncing }),

  setSyncError: (error) => set({ lastSyncError: error }),

  markSynced: () => set({
    lastSyncAt: new Date(),
    lastSyncError: null,
  }),

  // Load from localStorage
  loadFromStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          pendingChanges: data.pendingChanges || [],
          lastSyncAt: data.lastSyncAt ? new Date(data.lastSyncAt) : null,
        });
      }
    } catch (error) {
      console.error('[Offline] Failed to load from storage:', error);
    }
  },

  // Save to localStorage
  saveToStorage: () => {
    if (typeof window === 'undefined') return;

    try {
      const { pendingChanges, lastSyncAt } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        pendingChanges,
        lastSyncAt: lastSyncAt?.toISOString(),
      }));
    } catch (error) {
      console.error('[Offline] Failed to save to storage:', error);
    }
  },

  // Get count of pending changes
  getPendingCount: () => get().pendingChanges.length,

  // Get pending changes for a specific round
  getPendingForRound: (roundId) =>
    get().pendingChanges.filter((c) => c.roundId === roundId),

  // Check if there are any pending changes
  hasPendingChanges: () => get().pendingChanges.length > 0,
}));

// Initialize store from localStorage on load
if (typeof window !== 'undefined') {
  useOfflineStore.getState().loadFromStorage();
}
