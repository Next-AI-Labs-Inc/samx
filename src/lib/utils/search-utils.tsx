import React from 'react';

/**
 * Enhanced search utility functions for contract filtering and highlighting
 */

export interface SearchMatch {
  field: string;
  text: string;
  highlighted: React.ReactNode;
}

/**
 * Normalizes search text by removing extra spaces and converting to lowercase
 */
export function normalizeSearchText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Splits search query into individual keywords and creates search patterns
 */
export function createSearchPatterns(query: string): RegExp[] {
  if (!query?.trim()) return [];
  
  const normalizedQuery = normalizeSearchText(query);
  const keywords = normalizedQuery.split(' ').filter(keyword => keyword.length > 0);
  
  return keywords.map(keyword => 
    new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  );
}

/**
 * Checks if text contains any of the search patterns
 */
export function matchesSearchPatterns(text: string, patterns: RegExp[]): boolean {
  if (patterns.length === 0 || !text) return true;
  
  const normalizedText = normalizeSearchText(text);
  return patterns.some(pattern => pattern.test(normalizedText));
}

/**
 * Highlights search terms in text with proper React elements
 * Now handles OR queries properly by parsing them first
 */
export function highlightSearchTerms(
  text: string, 
  searchQuery: string,
  className: string = "bg-yellow-200 dark:bg-yellow-800"
): React.ReactNode {
  if (!searchQuery?.trim() || !text) return text;
  
  // Handle OR queries by extracting individual terms
  let terms: string[];
  if (searchQuery.toLowerCase().includes(' or ')) {
    // Parse OR terms: "web development OR apps OR information" -> ["web development", "apps", "information"]
    terms = searchQuery
      .split(/\s+or\s+/i)
      .map(term => term.trim().replace(/"/g, ''))
      .filter(term => term.length > 0);
  } else {
    // Regular space-separated terms
    terms = searchQuery.trim().split(/\s+/).filter(term => term.length > 0);
  }
  
  if (terms.length === 0) return text;
  
  // Create patterns from the extracted terms
  const patterns = terms.map(term => 
    new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  );
  
  // Combine all patterns into a single regex for highlighting
  const combinedPattern = new RegExp(
    patterns.map(p => p.source).join('|'), 
    'gi'
  );
  
  const parts = text.split(combinedPattern);
  const matches = text.match(combinedPattern) || [];
  
  return parts.map((part, index) => {
    if (index < matches.length) {
      return (
        <React.Fragment key={index}>
          {part}
          <mark className={className}>{matches[index]}</mark>
        </React.Fragment>
      );
    }
    return part;
  });
}

/**
 * Calculates search relevance score for a contract
 */
export function calculateRelevanceScore(
  contract: {
    title: string;
    description?: string;
    agency?: string;
    naicsDescription?: string;
    solicitationNumber: string;
  },
  searchQuery: string
): number {
  if (!searchQuery?.trim()) return 0;
  
  const patterns = createSearchPatterns(searchQuery);
  if (patterns.length === 0) return 0;
  
  let score = 0;
  const weights = {
    title: 10,
    solicitationNumber: 8,
    description: 5,
    agency: 3,
    naicsDescription: 2
  };
  
  // Calculate matches for each field
  Object.entries(weights).forEach(([field, weight]) => {
    const text = contract[field as keyof typeof contract] || '';
    if (text) {
      const matches = patterns.filter(pattern => pattern.test(text)).length;
      score += matches * weight;
    }
  });
  
  return score;
}

/**
 * Enhanced search function that searches across multiple fields
 */
export function searchContracts<T extends {
  title: string;
  description?: string;
  agency?: string;
  naicsDescription?: string;
  solicitationNumber: string;
}>(
  contracts: T[],
  searchQuery: string,
  options: {
    sortByRelevance?: boolean;
    minScore?: number;
  } = {}
): T[] {
  if (!searchQuery?.trim()) return contracts;
  
  const { sortByRelevance = true, minScore = 1 } = options;
  const patterns = createSearchPatterns(searchQuery);
  
  if (patterns.length === 0) return contracts;
  
  // Filter and score contracts
  const scoredContracts = contracts
    .map(contract => ({
      contract,
      score: calculateRelevanceScore(contract, searchQuery)
    }))
    .filter(({ score }) => score >= minScore);
  
  // Sort by relevance if requested
  if (sortByRelevance) {
    scoredContracts.sort((a, b) => b.score - a.score);
  }
  
  return scoredContracts.map(({ contract }) => contract);
}

/**
 * Gets search result summary
 */
export function getSearchSummary(
  totalResults: number,
  searchQuery: string,
  appliedFilters: number = 0
): string {
  const parts = [];
  
  if (searchQuery?.trim()) {
    parts.push(`"${searchQuery.trim()}"`);
  }
  
  if (appliedFilters > 0) {
    parts.push(`${appliedFilters} filter${appliedFilters > 1 ? 's' : ''}`);
  }
  
  const searchText = parts.length > 0 ? ` for ${parts.join(' with ')}` : '';
  
  return `${totalResults.toLocaleString()} contract${totalResults !== 1 ? 's' : ''} found${searchText}`;
}