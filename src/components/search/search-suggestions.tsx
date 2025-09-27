'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Suggestion {
  term: string;
  frequency: number;
}

interface SearchSuggestionsProps {
  query: string;
  onAddSuggestion: (term: string) => void;
}

export function SearchSuggestions({ query, onAddSuggestion }: SearchSuggestionsProps) {
  console.log('🔍 SearchSuggestions: Rendered with query:', query);
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🔍 SearchSuggestions: useEffect triggered with query:', query);
    
    async function fetchSuggestions() {
      console.log('🔍 SearchSuggestions: fetchSuggestions called with query:', query);
      
      if (!query.trim() || query.length < 2) {
        console.log('🔍 SearchSuggestions: Query too short, clearing suggestions. Query:', query, 'Length:', query.length);
        setSuggestions([]);
        return;
      }

      try {
        console.log('🔍 SearchSuggestions: Starting fetch for query:', query);
        setLoading(true);
        
        const url = `/api/suggestions?q=${encodeURIComponent(query)}`;
        console.log('🔍 SearchSuggestions: Fetching URL:', url);
        
        const response = await fetch(url);
        console.log('🔍 SearchSuggestions: Fetch response status:', response.status, 'OK:', response.ok);
        
        const data = await response.json();
        console.log('🔍 SearchSuggestions: API response data:', data);
        
        const suggestionsResult = data.suggestions || [];
        console.log('🔍 SearchSuggestions: Setting suggestions:', suggestionsResult, 'Count:', suggestionsResult.length);
        
        setSuggestions(suggestionsResult);
      } catch (error) {
        console.error('🔍 SearchSuggestions: ERROR fetching suggestions:', error);
        console.error('🔍 SearchSuggestions: Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack'
        });
        setSuggestions([]);
      } finally {
        console.log('🔍 SearchSuggestions: Setting loading to false');
        setLoading(false);
      }
    }

    const timeoutId = setTimeout(fetchSuggestions, 500);
    console.log('🔍 SearchSuggestions: Set timeout with ID:', timeoutId);
    
    return () => {
      console.log('🔍 SearchSuggestions: Clearing timeout:', timeoutId);
      clearTimeout(timeoutId);
    };
  }, [query]);

  console.log('🔍 SearchSuggestions: Current state - suggestions:', suggestions.length, 'loading:', loading, 'query:', query.trim());

  if (!suggestions.length || !query.trim()) {
    console.log('🔍 SearchSuggestions: NOT RENDERING - suggestions length:', suggestions.length, 'query trimmed:', query.trim());
    return null;
  }

  console.log('🔍 SearchSuggestions: RENDERING suggestions UI with', suggestions.length, 'suggestions');

  return (
    <div className="mt-3 flex flex-wrap gap-2 px-4 pb-4">
      <span className="text-xs text-muted-foreground self-center">💡 Try adding:</span>
      {suggestions.map((suggestion, index) => {
        console.log('🔍 SearchSuggestions: Rendering suggestion', index + 1, ':', suggestion);
        return (
          <Button
            key={suggestion.term}
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('🔍 SearchSuggestions: Clicked suggestion:', suggestion.term);
              onAddSuggestion(suggestion.term);
            }}
            className="h-6 px-2 text-xs hover:bg-blue-50 border-blue-200"
          >
            <span className="text-blue-600 mr-1">+</span>
            {suggestion.term}
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {suggestion.frequency}
            </Badge>
          </Button>
        );
      })}
      {loading && (
        <span className="text-xs text-muted-foreground self-center">Loading...</span>
      )}
    </div>
  );
}
