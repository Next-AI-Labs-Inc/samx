import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';

import contractsReducer from './contracts-slice';
import searchReducer from './search-slice';
import syncReducer from './sync-slice';
import settingsReducer from './settings-slice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  // Only persist certain parts of the state
  whitelist: ['search', 'settings'], // Persist search history, saved searches, filters, and settings
  blacklist: ['contracts', 'sync'] // Don't persist contract data or sync status (these should be fetched fresh)
};

// Search persist config (more granular control)
const searchPersistConfig = {
  key: 'search',
  storage,
  // Only persist certain search state
  whitelist: ['searchHistory', 'savedSearches', 'syncSettings', 'filtersCollapsed'],
  blacklist: ['isLoadingSavedSearches', 'savingSearch', 'savedSearchError']
};

// Root reducer
const rootReducer = combineReducers({
  contracts: contractsReducer,
  search: persistReducer(searchPersistConfig, searchReducer),
  sync: syncReducer,
  settings: settingsReducer
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'persist/FLUSH'
        ]
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

// Create persistor
export const persistor = persistStore(store);

// Types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks (to be used in components)
export { useDispatch, useSelector } from 'react-redux';

// Re-export all actions and selectors for convenience
// Contracts - Actions
export {
  setViewMode,
  setSortBy,
  setCurrentPage,
  clearSelectedContract,
  clearSearchResults,
  clearError as clearContractsError,
  addContract,
  removeContract,
  updateContract,
  fetchContracts,
  fetchRecentContracts,
  searchContractsByKeywords,
  fetchContractById
} from './contracts-slice';

// Contracts - Selectors
export {
  selectContracts,
  selectSelectedContract,
  selectRecentContracts,
  selectSearchResults,
  selectIsLoading,
  selectIsSearching,
  selectIsLoadingRecent,
  selectError,
  selectSearchError,
  selectViewMode,
  selectSorting,
  selectPagination,
  selectTotalFilteredContracts,
  selectTotalUnfilteredContracts,
  selectHasMore,
  selectAwardAmountRange
} from './contracts-slice';

// Search
export * from './search-slice';

// Sync
export * from './sync-slice';

// Settings
export {
  updateSetting,
  updateSettings,
  resetSettings,
  reloadSettings,
  setError as setSettingsError,
  clearError as clearSettingsError,
  selectSettings,
  selectSettingsLoading,
  selectSettingsError,
  selectDefaultContractStatus,
  selectContractsPerPage,
  selectDefaultSort,
  selectTheme,
  selectCompactView,
  selectShowAdvancedFilters
} from './settings-slice';
