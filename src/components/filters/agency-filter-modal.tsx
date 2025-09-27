'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Building2, 
  CheckSquare, 
  Square, 
  RotateCcw 
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

interface AgencyFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableAgencies: string[];
  selectedAgencies: string[];
  onSelectionChange: (agencies: string[]) => void;
  onApply: (agencies: string[]) => void;
}

const AgencyFilterModal: React.FC<AgencyFilterModalProps> = ({
  isOpen,
  onClose,
  availableAgencies,
  selectedAgencies,
  onSelectionChange,
  onApply
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedAgencies, setLocalSelectedAgencies] = useState<string[]>(selectedAgencies);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setLocalSelectedAgencies(selectedAgencies);
  }, [selectedAgencies, isOpen]);

  const filteredAgencies = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return [...availableAgencies].sort();
    }
    
    return availableAgencies
      .filter(agency => 
        agency.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      .sort();
  }, [availableAgencies, debouncedSearchQuery]);

  const handleAgencyToggle = (agency: string) => {
    setLocalSelectedAgencies(prev => {
      const isSelected = prev.includes(agency);
      if (isSelected) {
        return prev.filter(a => a !== agency);
      } else {
        return [...prev, agency];
      }
    });
  };

  const handleSelectAll = () => {
    setLocalSelectedAgencies([...filteredAgencies]);
  };

  const handleSelectNone = () => {
    setLocalSelectedAgencies([]);
  };

  const handleSelectVisible = () => {
    const currentVisible = new Set(filteredAgencies);
    const updatedSelection = [
      // Keep existing selections that aren't in current filtered view
      ...localSelectedAgencies.filter(agency => !currentVisible.has(agency)),
      // Add all currently filtered agencies
      ...filteredAgencies
    ];
    setLocalSelectedAgencies(updatedSelection);
  };

  const handleDeselectVisible = () => {
    const currentVisible = new Set(filteredAgencies);
    setLocalSelectedAgencies(prev => 
      prev.filter(agency => !currentVisible.has(agency))
    );
  };

  const handleReset = () => {
    setLocalSelectedAgencies([]);
    setSearchQuery('');
  };

  const handleApply = () => {
    onSelectionChange(localSelectedAgencies);
    onApply(localSelectedAgencies);
    onClose();
  };

  const handleCancel = () => {
    setLocalSelectedAgencies(selectedAgencies);
    setSearchQuery('');
    onClose();
  };

  const visibleSelectedCount = filteredAgencies.filter(agency => 
    localSelectedAgencies.includes(agency)
  ).length;

  const allVisibleSelected = filteredAgencies.length > 0 && 
    visibleSelectedCount === filteredAgencies.length;
  const someVisibleSelected = visibleSelectedCount > 0 && 
    visibleSelectedCount < filteredAgencies.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Filter by Agency</span>
            {localSelectedAgencies.length > 0 && (
              <Badge variant="secondary">
                {localSelectedAgencies.length} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search agencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={allVisibleSelected ? handleDeselectVisible : handleSelectVisible}
                className="h-8"
              >
                {allVisibleSelected ? (
                  <CheckSquare className="h-4 w-4 mr-1" />
                ) : (
                  <Square className="h-4 w-4 mr-1" />
                )}
                {allVisibleSelected ? 'Deselect Visible' : 'Select Visible'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8"
              >
                Select All ({availableAgencies.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectNone}
                className="h-8"
              >
                Select None
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>

          {/* Results Info */}
          <div className="text-sm text-muted-foreground">
            {debouncedSearchQuery.trim() ? (
              <>Showing {filteredAgencies.length} of {availableAgencies.length} agencies</>
            ) : (
              <>{availableAgencies.length} agencies available</>
            )}
            {localSelectedAgencies.length > 0 && (
              <> • {localSelectedAgencies.length} selected</>
            )}
          </div>

          {/* Agency List */}
          <div className="flex-1 overflow-y-auto border rounded-md">
            <div className="p-2 space-y-1">
              {filteredAgencies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {debouncedSearchQuery.trim() ? (
                    <>No agencies found matching "{debouncedSearchQuery}"</>
                  ) : (
                    <>No agencies available</>
                  )}
                </div>
              ) : (
                filteredAgencies.map((agency) => {
                  const isSelected = localSelectedAgencies.includes(agency);
                  return (
                    <div
                      key={agency}
                      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                        isSelected ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleAgencyToggle(agency)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleAgencyToggle(agency)}
                        className="pointer-events-none"
                      />
                      <span className="text-sm flex-1 select-none">
                        {agency}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {localSelectedAgencies.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {localSelectedAgencies.length} agencies will be applied
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgencyFilterModal;