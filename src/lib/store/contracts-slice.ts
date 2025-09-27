import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Contract, ContractSearchResult, ContractFilters, PaginationParams } from '../types/contract';

// Async thunks for contract operations
export const fetchContracts = createAsyncThunk(
  'contracts/fetchContracts',
  async (params: { filters: ContractFilters; pagination: PaginationParams }) => {
    const response = await fetch('/api/contracts/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error('Failed to fetch contracts');
    return await response.json();
  }
);

export const fetchRecentContracts = createAsyncThunk(
  'contracts/fetchRecentContracts',
  async (params: { limit?: number; offset?: number; filters?: ContractFilters } = {}) => {
    const { limit = 20, offset = 0, filters = {} } = params;
    
    const searchParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    // Add filter parameters
    if (filters.keywords) {
      searchParams.set('search', filters.keywords);
    }
    
    if (filters.searchMode) {
      searchParams.set('searchMode', filters.searchMode);
    }
    
    if (filters.agencies && filters.agencies.length > 0) {
      // Use pipe delimiter to avoid issues with commas in agency names
      searchParams.set('agencies', filters.agencies.join('|'));
    }
    
    if (filters.minAwardAmount !== undefined) {
      searchParams.set('minAwardAmount', filters.minAwardAmount.toString());
    }
    
    if (filters.maxAwardAmount !== undefined) {
      searchParams.set('maxAwardAmount', filters.maxAwardAmount.toString());
    }
    
    if (filters.status) {
      searchParams.set('status', filters.status);
    }
    
    const response = await fetch(`/api/contracts/recent?${searchParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch recent contracts');
    return await response.json();
  }
);

export const searchContractsByKeywords = createAsyncThunk(
  'contracts/searchByKeywords',
  async (params: { keywords: string; pagination: PaginationParams }) => {
    const response = await fetch('/api/contracts/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters: { keywords: params.keywords }, pagination: params.pagination })
    });
    if (!response.ok) throw new Error('Failed to search contracts');
    return await response.json();
  }
);

export const fetchContractById = createAsyncThunk(
  'contracts/fetchById',
  async (id: string) => {
    const response = await fetch(`/api/contracts/${id}`);
    if (!response.ok) throw new Error('Failed to fetch contract');
    return await response.json();
  }
);

// Contract slice state interface
interface ContractsState {
  // Contract data
  contracts: Contract[];
  selectedContract: Contract | null;
  searchResults: ContractSearchResult | null;
  recentContracts: Contract[];
  
  // Pagination and search state
  currentPage: number;
  totalPages: number;
  totalContracts: number;
  totalFilteredContracts: number; // Total matching current filters
  totalUnfilteredContracts: number; // Total contracts before any filtering
  hasMore: boolean;
  awardAmountRange: { min: number; max: number } | null;
  
  // Loading states
  isLoading: boolean;
  isSearching: boolean;
  isLoadingSelected: boolean;
  isLoadingRecent: boolean;
  
  // Error states
  error: string | null;
  searchError: string | null;
  
  // UI state
  viewMode: 'list' | 'grid';
  sortBy: 'posted_date' | 'title' | 'agency' | 'due_date';
  sortOrder: 'asc' | 'desc';
}

const initialState: ContractsState = {
  contracts: [],
  selectedContract: null,
  searchResults: null,
  recentContracts: [],
  currentPage: 1,
  totalPages: 0,
  totalContracts: 0,
  totalFilteredContracts: 0,
  totalUnfilteredContracts: 0,
  hasMore: false,
  awardAmountRange: null,
  isLoading: false,
  isSearching: false,
  isLoadingSelected: false,
  isLoadingRecent: false,
  error: null,
  searchError: null,
  viewMode: 'list',
  sortBy: 'posted_date',
  sortOrder: 'desc'
};

const contractsSlice = createSlice({
  name: 'contracts',
  initialState,
  reducers: {
    // UI actions
    setViewMode: (state, action: PayloadAction<'list' | 'grid'>) => {
      state.viewMode = action.payload;
    },
    setSortBy: (state, action: PayloadAction<{ sortBy: typeof initialState.sortBy; sortOrder: typeof initialState.sortOrder }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    
    // Data actions
    clearSelectedContract: (state) => {
      state.selectedContract = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
      state.searchError = null;
    },
    clearError: (state) => {
      state.error = null;
      state.searchError = null;
    },
    
    // Contract updates (for real-time sync)
    addContract: (state, action: PayloadAction<Contract>) => {
      const existingIndex = state.contracts.findIndex(c => c.id === action.payload.id);
      if (existingIndex >= 0) {
        state.contracts[existingIndex] = action.payload;
      } else {
        state.contracts.unshift(action.payload);
      }
    },
    removeContract: (state, action: PayloadAction<string>) => {
      state.contracts = state.contracts.filter(c => c.id !== action.payload);
    },
    updateContract: (state, action: PayloadAction<Contract>) => {
      const index = state.contracts.findIndex(c => c.id === action.payload.id);
      if (index >= 0) {
        state.contracts[index] = action.payload;
      }
      if (state.selectedContract?.id === action.payload.id) {
        state.selectedContract = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch contracts
    builder
      .addCase(fetchContracts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
        state.contracts = action.payload.contracts;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.totalContracts = action.payload.total;
      })
      .addCase(fetchContracts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch contracts';
      });

    // Fetch recent contracts
    builder
      .addCase(fetchRecentContracts.pending, (state) => {
        state.isLoadingRecent = true;
      })
      .addCase(fetchRecentContracts.fulfilled, (state, action) => {
        state.isLoadingRecent = false;
        // Handle new API response format
        if (action.payload.contracts) {
          state.recentContracts = action.payload.contracts;
          state.totalFilteredContracts = action.payload.totalCount || 0;
          state.totalUnfilteredContracts = action.payload.totalUnfilteredCount || 0;
          state.hasMore = action.payload.hasMore || false;
          state.awardAmountRange = action.payload.awardAmountRange || null;
        } else {
          // Legacy format (array of contracts)
          state.recentContracts = action.payload;
          state.totalFilteredContracts = action.payload.length;
          state.totalUnfilteredContracts = action.payload.length;
          state.hasMore = false;
          state.awardAmountRange = null;
        }
      })
      .addCase(fetchRecentContracts.rejected, (state, action) => {
        state.isLoadingRecent = false;
        state.error = action.error.message || 'Failed to fetch recent contracts';
      });

    // Search by keywords
    builder
      .addCase(searchContractsByKeywords.pending, (state) => {
        state.isSearching = true;
        state.searchError = null;
      })
      .addCase(searchContractsByKeywords.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
        state.contracts = action.payload.contracts;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.totalContracts = action.payload.total;
      })
      .addCase(searchContractsByKeywords.rejected, (state, action) => {
        state.isSearching = false;
        state.searchError = action.error.message || 'Search failed';
      });

    // Fetch contract by ID
    builder
      .addCase(fetchContractById.pending, (state) => {
        state.isLoadingSelected = true;
      })
      .addCase(fetchContractById.fulfilled, (state, action) => {
        state.isLoadingSelected = false;
        state.selectedContract = action.payload;
      })
      .addCase(fetchContractById.rejected, (state, action) => {
        state.isLoadingSelected = false;
        state.error = action.error.message || 'Failed to fetch contract';
      });
  }
});

// Export actions
export const {
  setViewMode,
  setSortBy,
  setCurrentPage,
  clearSelectedContract,
  clearSearchResults,
  clearError,
  addContract,
  removeContract,
  updateContract
} = contractsSlice.actions;

// Selectors
export const selectContracts = (state: { contracts: ContractsState }) => state.contracts.contracts;
export const selectSelectedContract = (state: { contracts: ContractsState }) => state.contracts.selectedContract;
export const selectRecentContracts = (state: { contracts: ContractsState }) => state.contracts.recentContracts;
export const selectSearchResults = (state: { contracts: ContractsState }) => state.contracts.searchResults;
export const selectIsLoading = (state: { contracts: ContractsState }) => state.contracts.isLoading;
export const selectIsSearching = (state: { contracts: ContractsState }) => state.contracts.isSearching;
export const selectIsLoadingRecent = (state: { contracts: ContractsState }) => state.contracts.isLoadingRecent;
export const selectError = (state: { contracts: ContractsState }) => state.contracts.error;
export const selectSearchError = (state: { contracts: ContractsState }) => state.contracts.searchError;
export const selectViewMode = (state: { contracts: ContractsState }) => state.contracts.viewMode;
export const selectSorting = (state: { contracts: ContractsState }) => ({ 
  sortBy: state.contracts.sortBy, 
  sortOrder: state.contracts.sortOrder 
});
export const selectPagination = (state: { contracts: ContractsState }) => ({
  currentPage: state.contracts.currentPage,
  totalPages: state.contracts.totalPages,
  totalContracts: state.contracts.totalContracts
});
export const selectTotalFilteredContracts = (state: { contracts: ContractsState }) => state.contracts.totalFilteredContracts;
export const selectTotalUnfilteredContracts = (state: { contracts: ContractsState }) => state.contracts.totalUnfilteredContracts;
export const selectHasMore = (state: { contracts: ContractsState }) => state.contracts.hasMore;
export const selectAwardAmountRange = (state: { contracts: ContractsState }) => state.contracts.awardAmountRange;

export default contractsSlice.reducer;