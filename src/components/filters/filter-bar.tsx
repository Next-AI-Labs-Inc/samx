'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import DollarAmountFilter from './dollar-amount-filter';
import AgencyFilterModal from './agency-filter-modal';
import { SearchSuggestions } from '@/components/search/search-suggestions';
import { 
  Search, 
  Filter, 
  X, 
  DollarSign,
  Building2,
  Calendar,
  RotateCcw,
  Settings2,
  Bookmark,
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  List
} from 'lucide-react';
// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
import {
  selectCurrentFilters,
  selectActiveSearch,
  selectAvailableAgencies,
  selectActiveFilterCount,
  setActiveSearch,
  updateFilters,
  clearFilters,
  removeFilter,
  addAgencyFilter,
  removeAgencyFilter,
  setAvailableAgencies
} from '@/lib/store/search-slice';
import { selectAwardAmountRange } from '@/lib/store';
import { getSearchSummary } from '@/lib/utils/search-utils';

interface FilterBarProps {
  totalResults?: number;
  totalUnfilteredResults?: number;
  onFiltersChange?: (filters: any) => void;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  totalResults = 0,
  totalUnfilteredResults = 0,
  onFiltersChange,
  className = ""
}) => {
  const dispatch = useDispatch();
  const currentFilters = useSelector(selectCurrentFilters);
  const activeSearch = useSelector(selectActiveSearch);
  const availableAgencies = useSelector(selectAvailableAgencies);
  const filterCount = useSelector(selectActiveFilterCount);
  const awardAmountRange = useSelector(selectAwardAmountRange);

  const [searchInput, setSearchInput] = useState(activeSearch);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [pageSize, setPageSize] = useState(100);
  const [showPageSizeSettings, setShowPageSizeSettings] = useState(false);
  const [awardFilterEnabled, setAwardFilterEnabled] = useState(false);
  const [searchMode, setSearchMode] = useState<'exact' | 'semantic'>('exact');
  
  // Remove auto-search on typing - only search on Enter or button click
  // const debouncedSearch = useDebounce(searchInput, 500);

  // Manual search trigger function
  const handleSearch = () => {
    console.log('📊 FilterBar: Manual search triggered with:', searchInput);
    setIsSearching(true);
    dispatch(setActiveSearch(searchInput));
    dispatch(updateFilters({ searchMode }));
    // Reset searching state after a delay
    setTimeout(() => setIsSearching(false), 1000);
  };

  // Sync with external activeSearch changes (but not when user is typing)
  React.useEffect(() => {
    if (activeSearch !== searchInput && document.activeElement !== document.querySelector('input[type="text"]')) {
      setSearchInput(activeSearch);
    }
  }, [activeSearch]);

  // Dynamic dollar amount range from actual data
  const defaultMin = awardAmountRange?.min || 0;
  const defaultMax = awardAmountRange?.max || 100000000;
  const dollarRange: [number, number] = [
    currentFilters.minAwardAmount || defaultMin,
    currentFilters.maxAwardAmount || defaultMax
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('📊 FilterBar: Enter key pressed, triggering search');
      handleSearch();
    }
  };

  const handleDollarAmountChange = (value: [number, number]) => {
    if (!awardFilterEnabled) return;
    
    const updatedFilters = {
      minAwardAmount: value[0] > defaultMin ? value[0] : undefined,
      maxAwardAmount: value[1] < defaultMax ? value[1] : undefined
    };
    dispatch(updateFilters(updatedFilters));
  };

  const handleAwardFilterToggle = (enabled: boolean) => {
    setAwardFilterEnabled(enabled);
    if (!enabled) {
      // Clear award amount filters when disabled
      dispatch(updateFilters({
        minAwardAmount: undefined,
        maxAwardAmount: undefined
      }));
    }
  };

  const handleAgencyFilterApply = (agencies: string[]) => {
    const updatedFilters = {
      agencies: agencies.length > 0 ? agencies : undefined
    };
    dispatch(updateFilters(updatedFilters));
  };

  const handleRemoveAgency = (agency: string) => {
    dispatch(removeAgencyFilter(agency));
  };

  const handleClearSearch = () => {
    setSearchInput('');
    dispatch(setActiveSearch(''));
  };
  
  // Add a suggestion as OR to current search
  const addSuggestionToSearch = (suggestion: string) => {
    console.log('📊 FilterBar: addSuggestionToSearch called with:', suggestion);
    console.log('📊 FilterBar: Current searchInput:', searchInput);
    
    const currentTerms = searchInput.trim() ? searchInput.split(' OR ').map(t => t.trim()) : [];
    console.log('📊 FilterBar: Current terms:', currentTerms);
    
    if (!currentTerms.includes(suggestion)) {
      const newSearch = currentTerms.length > 0 
        ? `${currentTerms.join(' OR ')} OR ${suggestion}`
        : suggestion;
      console.log('📊 FilterBar: Setting new search input:', newSearch);
      setSearchInput(newSearch);
    } else {
      console.log('📊 FilterBar: Suggestion already exists in search terms');
    }
  };

  const handleClearAllFilters = () => {
    setSearchInput('');
    dispatch(setActiveSearch(''));
    dispatch(clearFilters());
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      setSearchName(`Search: ${new Date().toLocaleDateString()}`);
    }
    
    const searchToSave = {
      name: searchName.trim() || `Search: ${new Date().toLocaleDateString()}`,
      keywords: activeSearch || undefined,
      agencies: currentFilters.agencies,
      minAwardAmount: currentFilters.minAwardAmount,
      maxAwardAmount: currentFilters.maxAwardAmount,
      status: currentFilters.status,
      isActive: true
    };
    
    // TODO: When user auth is implemented, save per user
    // For now, save to localStorage as fallback
    const savedSearches = JSON.parse(localStorage.getItem('samx-saved-searches') || '[]');
    const newSearch = {
      ...searchToSave,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'default-user' // Placeholder for future user system
    };
    
    savedSearches.push(newSearch);
    localStorage.setItem('samx-saved-searches', JSON.stringify(savedSearches));
    
    setShowSaveSearch(false);
    setSearchName('');
    
    // Show success message
    console.log('✅ Search saved successfully:', newSearch.name);
  };

  const handlePageSizeChange = (newSize: number[]) => {
    const size = newSize[0];
    setPageSize(size);
    // TODO: Trigger API call with new page size
    // For now, we'll need to integrate this with the dashboard
    console.log('📊 Page size changed to:', size);
  };

  const selectedAgencies = currentFilters.agencies || [];
  const hasActiveFilters = filterCount > 0 || searchInput.trim().length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Main Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search all contract fields${searchMode === 'semantic' ? ' (with related terms)' : ''} - Press Enter to search`}
                value={searchInput}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-20"
              />
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex space-x-1">
                {searchInput.trim() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSearch}
                  disabled={!searchInput.trim()}
                  className="h-6 w-6 p-0 text-blue-600"
                  title="Search (or press Enter)"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Minimalistic Filter Toggle */}
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4" />
              {filterCount > 0 && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                  {filterCount}
                </Badge>
              )}
            </Button>

            {/* Save Search - Show when there are active filters/search */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={() => setShowSaveSearch(true)}
                size="sm"
                title="Save this search"
              >
                <BookmarkPlus className="h-4 w-4" />
              </Button>
            )}

            {/* Clear All - Only show when expanded or filters active */}
            {hasActiveFilters && showAdvancedFilters && (
              <Button
                variant="ghost"
                onClick={handleClearAllFilters}
                size="sm"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Search Suggestions - only show when typing, not after search */}
          {searchInput.trim() && searchInput !== activeSearch && (
            <>
              {console.log('📊 FilterBar: About to render SearchSuggestions with query:', searchInput)}
              <SearchSuggestions
                query={searchInput}
                onAddSuggestion={(term) => {
                  console.log('📊 FilterBar: SearchSuggestions called onAddSuggestion with term:', term);
                  addSuggestionToSearch(term);
                }}
              />
              {console.log('📊 FilterBar: Finished rendering SearchSuggestions')}
            </>
          )}
          
          {/* Searching indicator */}
          {isSearching && (
            <div className="mt-3 px-4 pb-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Searching contracts...</span>
              </div>
            </div>
          )}
          
          {/* Search prompt when user has unsearched text */}
          {!isSearching && searchInput.trim() && searchInput !== activeSearch && (
            <div className="mt-3 px-4 pb-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>🔍 Press Enter or click search to find contracts</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearch}
                  className="h-6 text-xs"
                >
                  Search
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {searchInput.trim() && (
            <Badge variant="default" className="flex items-center space-x-1">
              <Search className="h-3 w-3" />
              <span>"{searchInput.trim()}"</span>
              {searchMode === 'semantic' && (
                <span className="text-xs opacity-75">(semantic)</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {selectedAgencies.map(agency => (
            <Badge key={agency} variant="secondary" className="flex items-center space-x-1">
              <Building2 className="h-3 w-3" />
              <span>{agency}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveAgency(agency)}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {(currentFilters.minAwardAmount || currentFilters.maxAwardAmount) && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <DollarSign className="h-3 w-3" />
              <span>
                ${(currentFilters.minAwardAmount || defaultMin).toLocaleString()} - 
                ${(currentFilters.maxAwardAmount || defaultMax).toLocaleString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  dispatch(removeFilter('minAwardAmount'));
                  dispatch(removeFilter('maxAwardAmount'));
                }}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Dollar Amount Filter */}
              <DollarAmountFilter
                value={dollarRange}
                enabled={awardFilterEnabled}
                onValueChange={handleDollarAmountChange}
                onEnabledChange={handleAwardFilterToggle}
                minValue={defaultMin}
                maxValue={defaultMax}
              />

              {/* Agency Filter */}
              <Card className="cursor-pointer" onClick={() => setShowAgencyModal(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Agencies</span>
                    </div>
                    <Badge variant="outline">
                      {selectedAgencies.length || 'All'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAgencies.length === 0 
                      ? 'All agencies included'
                      : `${selectedAgencies.length} selected`
                    }
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAgencyModal(true);
                    }}
                  >
                    <Settings2 className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </CardContent>
              </Card>

              {/* Search Mode Toggle */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4" />
                      <span className="text-sm font-medium">Search Mode</span>
                    </div>
                    <Badge variant={searchMode === 'semantic' ? 'default' : 'outline'}>
                      {searchMode}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="exact-search"
                        name="searchMode"
                        value="exact"
                        checked={searchMode === 'exact'}
                        onChange={() => setSearchMode('exact')}
                        className="h-4 w-4"
                      />
                      <label htmlFor="exact-search" className="text-sm">
                        Exact Match
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="semantic-search"
                        name="searchMode"
                        value="semantic"
                        checked={searchMode === 'semantic'}
                        onChange={() => setSearchMode('semantic')}
                        className="h-4 w-4"
                      />
                      <label htmlFor="semantic-search" className="text-sm">
                        Semantic Search
                      </label>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {searchMode === 'exact' 
                      ? 'Search for exact word matches in all contract fields' 
                      : 'Expand search with related terms and synonyms (e.g., "IT" finds "Information Technology")'}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {totalResults >= 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="space-y-1">
            <span>{getSearchSummary(totalResults, searchInput, filterCount)}</span>
            {totalUnfilteredResults > 0 && totalResults !== totalUnfilteredResults && (
              <div className="text-xs">
                Found {totalResults.toLocaleString()} of {totalUnfilteredResults.toLocaleString()} total contracts
                ({Math.round((totalResults/totalUnfilteredResults)*100)}% match)
                {filterCount > 0 && ` • ${filterCount} filter${filterCount !== 1 ? 's' : ''} active`}
              </div>
            )}
          </div>
          {totalResults > 0 && searchInput.trim() && (
            <span>Sorted by relevance</span>
          )}
        </div>
      )}

      {/* Agency Filter Modal */}
      <AgencyFilterModal
        isOpen={showAgencyModal}
        onClose={() => setShowAgencyModal(false)}
        availableAgencies={availableAgencies}
        selectedAgencies={selectedAgencies}
        onSelectionChange={() => {}} // Handled in onApply
        onApply={handleAgencyFilterApply}
      />

      {/* Save Search Modal */}
      <Dialog open={showSaveSearch} onOpenChange={setShowSaveSearch}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Bookmark className="h-5 w-5" />
              <span>Save Search</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Name</label>
              <Input
                type="text"
                placeholder={`Search: ${new Date().toLocaleDateString()}`}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">What will be saved:</label>
              <div className="text-xs text-muted-foreground space-y-1">
                {activeSearch && (
                  <div className="flex items-center space-x-2">
                    <Search className="h-3 w-3" />
                    <span>Search: "{activeSearch}"</span>
                  </div>
                )}
                {selectedAgencies.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-3 w-3" />
                    <span>Agencies: {selectedAgencies.length} selected</span>
                  </div>
                )}
                {(currentFilters.minAwardAmount || currentFilters.maxAwardAmount) && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-3 w-3" />
                    <span>Award range: ${(currentFilters.minAwardAmount || defaultMin).toLocaleString()} - ${(currentFilters.maxAwardAmount || defaultMax).toLocaleString()}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  ℹ️ Future: Will be saved per user when authentication is added
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveSearch(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch}>
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilterBar;