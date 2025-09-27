import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ContractFilters, SavedSearch } from '../types/contract';

// Async thunks for saved searches
export const fetchSavedSearches = createAsyncThunk(
  'search/fetchSavedSearches',
  async () => {
    const response = await fetch('/api/searches');
    if (!response.ok) throw new Error('Failed to fetch saved searches');
    return await response.json();
  }
);

export const createSavedSearch = createAsyncThunk(
  'search/createSavedSearch',
  async (search: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await fetch('/api/searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(search)
    });
    if (!response.ok) throw new Error('Failed to create saved search');
    return await response.json();
  }
);

export const deleteSavedSearch = createAsyncThunk(
  'search/deleteSavedSearch',
  async (id: string) => {
    const response = await fetch(`/api/searches/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete saved search');
    return id;
  }
);

// Search slice state interface
interface SearchState {
  // Current search state
  currentFilters: ContractFilters;
  activeSearch: string; // Current search query
  isAdvancedSearch: boolean;
  
  // Search history
  searchHistory: string[];
  
  // Saved searches
  savedSearches: SavedSearch[];
  isLoadingSavedSearches: boolean;
  savingSearch: boolean;
  savedSearchError: string | null;
  
  // Filter options (populated from database)
  availableAgencies: string[];
  availableNaicsCodes: { code: string; description: string }[];
  
  // UI state
  showFilters: boolean;
  filtersCollapsed: {
    agencies: boolean;
    naics: boolean;
    dates: boolean;
    status: boolean;
  };
}

const initialState: SearchState = {
  currentFilters: {},
  activeSearch: '',
  isAdvancedSearch: false,
  searchHistory: [],
  savedSearches: [],
  isLoadingSavedSearches: false,
  savingSearch: false,
  savedSearchError: null,
  availableAgencies: [],
  availableNaicsCodes: [],
  showFilters: false,
  filtersCollapsed: {
    agencies: true,
    naics: true,
    dates: true,
    status: true
  }
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // Search actions
    setActiveSearch: (state, action: PayloadAction<string>) => {
      state.activeSearch = action.payload;
      
      // Keep keywords in filters in sync with activeSearch
      if (action.payload.trim()) {
        state.currentFilters.keywords = action.payload;
      } else {
        const { keywords, ...rest } = state.currentFilters;
        state.currentFilters = rest;
      }
      
      // Add to search history if not empty and not already present
      if (action.payload.trim() && !state.searchHistory.includes(action.payload)) {
        state.searchHistory.unshift(action.payload);
        // Keep only last 10 searches
        if (state.searchHistory.length > 10) {
          state.searchHistory = state.searchHistory.slice(0, 10);
        }
      }
    },
    
    clearActiveSearch: (state) => {
      state.activeSearch = '';
      // Only remove keywords, keep other filters
      const { keywords, ...rest } = state.currentFilters;
      state.currentFilters = rest;
    },
    
    setAdvancedSearch: (state, action: PayloadAction<boolean>) => {
      state.isAdvancedSearch = action.payload;
    },
    
    // Filter actions
    updateFilters: (state, action: PayloadAction<Partial<ContractFilters>>) => {
      state.currentFilters = {
        ...state.currentFilters,
        ...action.payload
      };
    },
    
    clearFilters: (state) => {
      state.currentFilters = {};
      state.activeSearch = '';
    },
    
    removeFilter: (state, action: PayloadAction<keyof ContractFilters>) => {
      const { [action.payload]: removed, ...rest } = state.currentFilters;
      state.currentFilters = rest;
    },
    
    setKeywordFilter: (state, action: PayloadAction<string>) => {
      if (action.payload.trim()) {
        state.currentFilters.keywords = action.payload;
      } else {
        const { keywords, ...rest } = state.currentFilters;
        state.currentFilters = rest;
      }
    },
    
    addAgencyFilter: (state, action: PayloadAction<string>) => {
      const agencies = state.currentFilters.agencies || [];
      if (!agencies.includes(action.payload)) {
        state.currentFilters.agencies = [...agencies, action.payload];
      }
    },
    
    removeAgencyFilter: (state, action: PayloadAction<string>) => {
      const agencies = state.currentFilters.agencies || [];
      state.currentFilters.agencies = agencies.filter(agency => agency !== action.payload);
      if (state.currentFilters.agencies.length === 0) {
        const { agencies: removed, ...rest } = state.currentFilters;
        state.currentFilters = rest;
      }
    },
    
    addNaicsFilter: (state, action: PayloadAction<string>) => {
      const naics = state.currentFilters.naicsCodes || [];
      if (!naics.includes(action.payload)) {
        state.currentFilters.naicsCodes = [...naics, action.payload];
      }
    },
    
    removeNaicsFilter: (state, action: PayloadAction<string>) => {
      const naics = state.currentFilters.naicsCodes || [];
      state.currentFilters.naicsCodes = naics.filter(code => code !== action.payload);
      if (state.currentFilters.naicsCodes.length === 0) {
        const { naicsCodes: removed, ...rest } = state.currentFilters;
        state.currentFilters = rest;
      }
    },
    
    setDateRangeFilter: (state, action: PayloadAction<{ minPostedDate?: string; maxPostedDate?: string; minDueDate?: string; maxDueDate?: string }>) => {
      Object.assign(state.currentFilters, action.payload);
    },
    
    // UI actions
    toggleFilters: (state) => {
      state.showFilters = !state.showFilters;
    },
    
    setShowFilters: (state, action: PayloadAction<boolean>) => {
      state.showFilters = action.payload;
    },
    
    toggleFilterSection: (state, action: PayloadAction<keyof typeof initialState.filtersCollapsed>) => {
      state.filtersCollapsed[action.payload] = !state.filtersCollapsed[action.payload];
    },
    
    // Available options
    setAvailableAgencies: (state, action: PayloadAction<string[]>) => {
      state.availableAgencies = action.payload;
    },
    
    setAvailableNaicsCodes: (state, action: PayloadAction<{ code: string; description: string }[]>) => {
      state.availableNaicsCodes = action.payload;
    },
    
    // Search history
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    
    removeFromSearchHistory: (state, action: PayloadAction<string>) => {
      state.searchHistory = state.searchHistory.filter(search => search !== action.payload);
    },
    
    // Load saved search
    loadSavedSearch: (state, action: PayloadAction<SavedSearch>) => {
      const search = action.payload;
      state.currentFilters = {
        keywords: search.keywords,
        naicsCodes: search.naicsCodes,
        agencies: search.agencies,
        minPostedDate: search.minPostedDate,
        maxPostedDate: search.maxPostedDate,
        minDueDate: search.minDueDate,
        maxDueDate: search.maxDueDate
      };
      state.activeSearch = search.keywords || '';
    },
    
    // Error handling
    clearSavedSearchError: (state) => {
      state.savedSearchError = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch saved searches
    builder
      .addCase(fetchSavedSearches.pending, (state) => {
        state.isLoadingSavedSearches = true;
        state.savedSearchError = null;
      })
      .addCase(fetchSavedSearches.fulfilled, (state, action) => {
        state.isLoadingSavedSearches = false;
        state.savedSearches = action.payload;
      })
      .addCase(fetchSavedSearches.rejected, (state, action) => {
        state.isLoadingSavedSearches = false;
        state.savedSearchError = action.error.message || 'Failed to fetch saved searches';
      });

    // Create saved search
    builder
      .addCase(createSavedSearch.pending, (state) => {
        state.savingSearch = true;
        state.savedSearchError = null;
      })
      .addCase(createSavedSearch.fulfilled, (state, action) => {
        state.savingSearch = false;
        state.savedSearches.unshift(action.payload);
      })
      .addCase(createSavedSearch.rejected, (state, action) => {
        state.savingSearch = false;
        state.savedSearchError = action.error.message || 'Failed to save search';
      });

    // Delete saved search
    builder
      .addCase(deleteSavedSearch.fulfilled, (state, action) => {
        state.savedSearches = state.savedSearches.filter(search => search.id !== action.payload);
      })
      .addCase(deleteSavedSearch.rejected, (state, action) => {
        state.savedSearchError = action.error.message || 'Failed to delete saved search';
      });
  }
});

// Export actions
export const {
  setActiveSearch,
  clearActiveSearch,
  setAdvancedSearch,
  updateFilters,
  clearFilters,
  removeFilter,
  setKeywordFilter,
  addAgencyFilter,
  removeAgencyFilter,
  addNaicsFilter,
  removeNaicsFilter,
  setDateRangeFilter,
  toggleFilters,
  setShowFilters,
  toggleFilterSection,
  setAvailableAgencies,
  setAvailableNaicsCodes,
  clearSearchHistory,
  removeFromSearchHistory,
  loadSavedSearch,
  clearSavedSearchError
} = searchSlice.actions;

// Selectors
export const selectCurrentFilters = (state: { search: SearchState }) => state.search.currentFilters;
export const selectActiveSearch = (state: { search: SearchState }) => state.search.activeSearch;
export const selectIsAdvancedSearch = (state: { search: SearchState }) => state.search.isAdvancedSearch;
export const selectSearchHistory = (state: { search: SearchState }) => state.search.searchHistory;
export const selectSavedSearches = (state: { search: SearchState }) => state.search.savedSearches;
export const selectIsLoadingSavedSearches = (state: { search: SearchState }) => state.search.isLoadingSavedSearches;
export const selectSavingSearch = (state: { search: SearchState }) => state.search.savingSearch;
export const selectSavedSearchError = (state: { search: SearchState }) => state.search.savedSearchError;
export const selectAvailableAgencies = (state: { search: SearchState }) => state.search.availableAgencies;
export const selectAvailableNaicsCodes = (state: { search: SearchState }) => state.search.availableNaicsCodes;
export const selectShowFilters = (state: { search: SearchState }) => state.search.showFilters;
export const selectFiltersCollapsed = (state: { search: SearchState }) => state.search.filtersCollapsed;

// Computed selectors
export const selectActiveFilterCount = (state: { search: SearchState }) => {
  const filters = state.search.currentFilters;
  let count = 0;
  
  if (filters.keywords?.trim()) count++;
  if (filters.agencies?.length) count++;
  if (filters.naicsCodes?.length) count++;
  if (filters.minPostedDate) count++;
  if (filters.maxPostedDate) count++;
  if (filters.minDueDate) count++;
  if (filters.maxDueDate) count++;
  if (filters.minAwardAmount !== undefined || filters.maxAwardAmount !== undefined) count++;
  if (filters.status && filters.status !== 'active') count++; // Only count non-default status as a filter
  
  return count;
};

export const selectHasActiveFilters = (state: { search: SearchState }) => {
  return selectActiveFilterCount(state) > 0;
};

export default searchSlice.reducer;