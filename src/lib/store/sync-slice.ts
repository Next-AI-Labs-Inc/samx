import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SyncStatus } from '../types/contract';

// Async thunks for sync operations
export const fetchSyncStatus = createAsyncThunk(
  'sync/fetchSyncStatus',
  async () => {
    const response = await fetch('/api/sync');
    if (!response.ok) throw new Error('Failed to fetch sync status');
    const data = await response.json();
    return data.latestSync;
  }
);

export const fetchSyncHistory = createAsyncThunk(
  'sync/fetchSyncHistory',
  async (limit: number = 10) => {
    const response = await fetch(`/api/sync/history?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch sync history');
    return await response.json();
  }
);

// Manual sync trigger
export const triggerManualSync = createAsyncThunk(
  'sync/triggerManualSync',
  async () => {
    const response = await fetch('/api/sync', { method: 'POST' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sync failed');
    }
    return await response.json();
  }
);

// Sync slice state interface
interface SyncState {
  // Current sync status
  currentSync: SyncStatus | null;
  syncHistory: SyncStatus[];
  
  // Loading states
  isLoadingSyncStatus: boolean;
  isLoadingSyncHistory: boolean;
  isTriggeringSync: boolean;
  
  // Error states
  syncError: string | null;
  
  // Real-time sync state
  isSyncing: boolean;
  syncProgress: {
    processed: number;
    total: number;
    currentOperation: string;
  } | null;
  
  // Last sync information
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  
  // Statistics
  syncStats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncDuration: number; // in milliseconds
    totalContractsAdded: number;
    totalContractsUpdated: number;
  };
  
  // Settings
  syncSettings: {
    autoSync: boolean;
    syncInterval: number; // in hours
    maxContractsPerSync: number;
    enableNotifications: boolean;
  };
}

const initialState: SyncState = {
  currentSync: null,
  syncHistory: [],
  isLoadingSyncStatus: false,
  isLoadingSyncHistory: false,
  isTriggeringSync: false,
  syncError: null,
  isSyncing: false,
  syncProgress: null,
  lastSyncAt: null,
  nextSyncAt: null,
  syncStats: {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageSyncDuration: 0,
    totalContractsAdded: 0,
    totalContractsUpdated: 0
  },
  syncSettings: {
    autoSync: true,
    syncInterval: 1, // 1 hour
    maxContractsPerSync: 1000,
    enableNotifications: true
  }
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    // Real-time sync updates
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
      if (!action.payload) {
        state.syncProgress = null;
      }
    },
    
    setSyncProgress: (state, action: PayloadAction<{ processed: number; total: number; currentOperation: string }>) => {
      state.syncProgress = action.payload;
    },
    
    updateSyncProgress: (state, action: PayloadAction<Partial<typeof initialState.syncProgress>>) => {
      if (state.syncProgress) {
        Object.assign(state.syncProgress, action.payload);
      }
    },
    
    // Sync status updates
    updateCurrentSync: (state, action: PayloadAction<Partial<SyncStatus>>) => {
      if (state.currentSync) {
        Object.assign(state.currentSync, action.payload);
      }
    },
    
    setSyncCompleted: (state, action: PayloadAction<SyncStatus>) => {
      state.isSyncing = false;
      state.syncProgress = null;
      state.currentSync = action.payload;
      state.lastSyncAt = action.payload.completedAt || action.payload.startedAt;
      
      // Update sync history
      const existingIndex = state.syncHistory.findIndex(sync => sync.id === action.payload.id);
      if (existingIndex >= 0) {
        state.syncHistory[existingIndex] = action.payload;
      } else {
        state.syncHistory.unshift(action.payload);
        // Keep only last 20 sync records
        if (state.syncHistory.length > 20) {
          state.syncHistory = state.syncHistory.slice(0, 20);
        }
      }
      
      // Update statistics
      state.syncStats.totalSyncs += 1;
      if (action.payload.status === 'completed') {
        state.syncStats.successfulSyncs += 1;
        state.syncStats.totalContractsAdded += action.payload.contractsAdded;
        state.syncStats.totalContractsUpdated += action.payload.contractsUpdated;
      } else if (action.payload.status === 'failed') {
        state.syncStats.failedSyncs += 1;
      }
      
      // Calculate average sync duration
      if (action.payload.completedAt) {
        const duration = new Date(action.payload.completedAt).getTime() - new Date(action.payload.startedAt).getTime();
        state.syncStats.averageSyncDuration = 
          (state.syncStats.averageSyncDuration * (state.syncStats.totalSyncs - 1) + duration) / state.syncStats.totalSyncs;
      }
    },
    
    setSyncFailed: (state, action: PayloadAction<{ id: number; error: string }>) => {
      state.isSyncing = false;
      state.syncProgress = null;
      state.syncError = action.payload.error;
      
      if (state.currentSync?.id === action.payload.id) {
        state.currentSync.status = 'failed';
        state.currentSync.errorMessage = action.payload.error;
        state.currentSync.completedAt = new Date().toISOString();
      }
    },
    
    // Schedule information
    setNextSyncAt: (state, action: PayloadAction<string>) => {
      state.nextSyncAt = action.payload;
    },
    
    // Settings
    updateSyncSettings: (state, action: PayloadAction<Partial<typeof initialState.syncSettings>>) => {
      Object.assign(state.syncSettings, action.payload);
    },
    
    toggleAutoSync: (state) => {
      state.syncSettings.autoSync = !state.syncSettings.autoSync;
    },
    
    setSyncInterval: (state, action: PayloadAction<number>) => {
      state.syncSettings.syncInterval = action.payload;
    },
    
    // Error handling
    clearSyncError: (state) => {
      state.syncError = null;
    },
    
    // Statistics reset
    resetSyncStats: (state) => {
      state.syncStats = initialState.syncStats;
    }
  },
  extraReducers: (builder) => {
    // Fetch sync status
    builder
      .addCase(fetchSyncStatus.pending, (state) => {
        state.isLoadingSyncStatus = true;
        state.syncError = null;
      })
      .addCase(fetchSyncStatus.fulfilled, (state, action) => {
        state.isLoadingSyncStatus = false;
        state.currentSync = action.payload;
        if (action.payload) {
          state.lastSyncAt = action.payload.completedAt || action.payload.startedAt;
          state.nextSyncAt = action.payload.nextSyncAt || null;
        }
      })
      .addCase(fetchSyncStatus.rejected, (state, action) => {
        state.isLoadingSyncStatus = false;
        state.syncError = action.error.message || 'Failed to fetch sync status';
      });

    // Fetch sync history
    builder
      .addCase(fetchSyncHistory.pending, (state) => {
        state.isLoadingSyncHistory = true;
      })
      .addCase(fetchSyncHistory.fulfilled, (state, action) => {
        state.isLoadingSyncHistory = false;
        state.syncHistory = action.payload;
        
        // Calculate statistics from history
        const completed = action.payload.filter((sync: SyncStatus) => sync.status === 'completed');
        const failed = action.payload.filter((sync: SyncStatus) => sync.status === 'failed');
        
        state.syncStats.totalSyncs = action.payload.length;
        state.syncStats.successfulSyncs = completed.length;
        state.syncStats.failedSyncs = failed.length;
        state.syncStats.totalContractsAdded = completed.reduce((sum: number, sync: SyncStatus) => sum + sync.contractsAdded, 0);
        state.syncStats.totalContractsUpdated = completed.reduce((sum: number, sync: SyncStatus) => sum + sync.contractsUpdated, 0);
        
        // Calculate average duration
        const durations = completed
          .filter((sync: SyncStatus) => sync.completedAt)
          .map((sync: SyncStatus) => new Date(sync.completedAt!).getTime() - new Date(sync.startedAt).getTime());
        
        if (durations.length > 0) {
          state.syncStats.averageSyncDuration = durations.reduce((sum: number, dur: number) => sum + dur, 0) / durations.length;
        }
      })
      .addCase(fetchSyncHistory.rejected, (state, action) => {
        state.isLoadingSyncHistory = false;
        state.syncError = action.error.message || 'Failed to fetch sync history';
      });

    // Trigger manual sync
    builder
      .addCase(triggerManualSync.pending, (state) => {
        state.isTriggeringSync = true;
        state.syncError = null;
      })
      .addCase(triggerManualSync.fulfilled, (state) => {
        state.isTriggeringSync = false;
        // Sync will be tracked through real-time updates
      })
      .addCase(triggerManualSync.rejected, (state, action) => {
        state.isTriggeringSync = false;
        state.syncError = action.error.message || 'Failed to trigger sync';
      });
  }
});

// Export actions
export const {
  setSyncing,
  setSyncProgress,
  updateSyncProgress,
  updateCurrentSync,
  setSyncCompleted,
  setSyncFailed,
  setNextSyncAt,
  updateSyncSettings,
  toggleAutoSync,
  setSyncInterval,
  clearSyncError,
  resetSyncStats
} = syncSlice.actions;

// Selectors
export const selectCurrentSync = (state: { sync: SyncState }) => state.sync.currentSync;
export const selectSyncHistory = (state: { sync: SyncState }) => state.sync.syncHistory;
export const selectIsSyncing = (state: { sync: SyncState }) => state.sync.isSyncing;
export const selectSyncProgress = (state: { sync: SyncState }) => state.sync.syncProgress;
export const selectIsLoadingSyncStatus = (state: { sync: SyncState }) => state.sync.isLoadingSyncStatus;
export const selectIsLoadingSyncHistory = (state: { sync: SyncState }) => state.sync.isLoadingSyncHistory;
export const selectIsTriggeringSync = (state: { sync: SyncState }) => state.sync.isTriggeringSync;
export const selectSyncError = (state: { sync: SyncState }) => state.sync.syncError;
export const selectLastSyncAt = (state: { sync: SyncState }) => state.sync.lastSyncAt;
export const selectNextSyncAt = (state: { sync: SyncState }) => state.sync.nextSyncAt;
export const selectSyncStats = (state: { sync: SyncState }) => state.sync.syncStats;
export const selectSyncSettings = (state: { sync: SyncState }) => state.sync.syncSettings;

// Computed selectors
export const selectSyncStatus = (state: { sync: SyncState }) => {
  if (state.sync.isSyncing) return 'syncing';
  if (state.sync.currentSync?.status === 'failed') return 'failed';
  if (state.sync.currentSync?.status === 'completed') return 'completed';
  return 'idle';
};

export const selectTimeSinceLastSync = (state: { sync: SyncState }) => {
  if (!state.sync.lastSyncAt) return null;
  return Date.now() - new Date(state.sync.lastSyncAt).getTime();
};

export const selectTimeToNextSync = (state: { sync: SyncState }) => {
  if (!state.sync.nextSyncAt) return null;
  return new Date(state.sync.nextSyncAt).getTime() - Date.now();
};

export const selectSyncHealthScore = (state: { sync: SyncState }) => {
  const stats = state.sync.syncStats;
  if (stats.totalSyncs === 0) return 100;
  return Math.round((stats.successfulSyncs / stats.totalSyncs) * 100);
};

export default syncSlice.reducer;