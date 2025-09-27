import { NextRequest, NextResponse } from 'next/server';

// Cache for term frequency analysis - only build once
let termFrequencyCache: Map<string, number> | null = null;
let contractTextsCache: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Mock contract data for testing suggestions when database is empty
const mockContracts = [
  {
    title: 'IT Support Services',
    description: 'Comprehensive IT support including software development, database management, and cloud services',
    agency: 'Department of Defense'
  },
  {
    title: 'Data Analytics Platform',
    description: 'Advanced data analytics and business intelligence solutions for government agencies',
    agency: 'General Services Administration'
  },
  {
    title: 'Cloud Infrastructure Services',
    description: 'Cloud computing infrastructure, migration services, and ongoing cloud management',
    agency: 'Department of Homeland Security'
  },
  {
    title: 'Software Development Contract',
    description: 'Custom software development, web applications, and mobile app development services',
    agency: 'Department of Veterans Affairs'
  },
  {
    title: 'Cybersecurity Consulting',
    description: 'Information security assessment, penetration testing, and cybersecurity consulting services',
    agency: 'Department of Defense'
  },
  {
    title: 'Database Management Services',
    description: 'Database design, implementation, maintenance, and data migration services',
    agency: 'Department of Health and Human Services'
  }
];

// Common stop words to filter out
const STOP_WORDS = new Set([
  'this', 'will', 'with', 'shall', 'government', 'must', 'the', 'and', 'for', 'are', 'that', 'have', 'been', 'may', 'any', 'all', 'such', 'other', 'than', 'from', 'not', 'can', 'more', 'also', 'including', 'required', 'provide', 'services', 'work', 'contract', 'contractor', 'under'
]);

async function buildOrRefreshCache() {
  const now = Date.now();
  
  // Check if cache is still valid
  if (termFrequencyCache && contractTextsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('🚀 API /suggestions: Using cached term analysis');
    return;
  }
  
  console.log('🚀 API /suggestions: Building/refreshing term frequency cache');
  
  let contracts = [];
  
  try {
    console.log('🚀 API /suggestions: Loading contracts from database for cache');
    const { SqliteContractRepository } = await import('@/lib/repositories/sqlite-contract-repository');
    const repository = new SqliteContractRepository();
    contracts = await repository.getAllContracts();
    console.log('🚀 API /suggestions: Loaded', contracts.length, 'contracts for cache');
  } catch (error) {
    console.log('🚀 API /suggestions: Database error, using mock data for cache');
    contracts = mockContracts;
  }
  
  if (contracts.length === 0) {
    contracts = mockContracts;
  }
  
  // Build global term frequency and contract texts cache
  const globalTermCounts = new Map<string, number>();
  const contractTexts: string[] = [];
  
  contracts.forEach(contract => {
    const text = `${contract.title} ${contract.description} ${contract.agency}`.toLowerCase();
    contractTexts.push(text);
    
    const words = text.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
    words.forEach(word => {
      globalTermCounts.set(word, (globalTermCounts.get(word) || 0) + 1);
    });
  });
  
  termFrequencyCache = globalTermCounts;
  contractTextsCache = contractTexts;
  cacheTimestamp = now;
  
  console.log('🚀 API /suggestions: Cache built with', globalTermCounts.size, 'unique terms from', contracts.length, 'contracts');
}

export async function GET(request: NextRequest) {
  console.log('🚀 API /suggestions: Request received');
  console.log('🚀 API /suggestions: Request URL:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    console.log('🚀 API /suggestions: Extracted query parameter:', query);
    
    if (!query || query.trim().length < 2) {
      console.log('🚀 API /suggestions: Query too short or empty, returning empty suggestions');
      return NextResponse.json({ suggestions: [] });
    }
    
    console.log('🚀 API /suggestions: Processing query with OR support:', query);
    
    // Ensure cache is built
    await buildOrRefreshCache();
    
    if (!termFrequencyCache || !contractTextsCache) {
      throw new Error('Failed to build cache');
    }
    
    // Parse OR query: "web OR web development OR llms"
    const queryTerms = query.toLowerCase()
      .split(' or ')
      .map(term => term.trim().replace(/"/g, '')) // Remove quotes
      .filter(term => term.length > 0);
      
    console.log('🚀 API /suggestions: Parsed OR terms:', queryTerms);
    
    // Find contracts that match ANY of the OR terms
    const matchingContractIndices = new Set<number>();
    const termCounts = new Map<string, number>();
    
    contractTextsCache.forEach((contractText, index) => {
      const matchesAnyTerm = queryTerms.some(term => contractText.includes(term));
      
      if (matchesAnyTerm) {
        matchingContractIndices.add(index);
        
        // Extract terms from this matching contract
        const words = contractText.split(/\s+/).filter(w => 
          w.length > 3 && 
          !STOP_WORDS.has(w) && 
          !queryTerms.includes(w) // Don't suggest the search terms themselves
        );
        
        words.forEach(word => {
          termCounts.set(word, (termCounts.get(word) || 0) + 1);
        });
      }
    });
    
    console.log('🚀 API /suggestions: Found', matchingContractIndices.size, 'contracts matching OR query');
    console.log('🚀 API /suggestions: Extracted', termCounts.size, 'relevant terms');
    
    // Get top suggestions, filtered by relevance
    const suggestions = Array.from(termCounts.entries())
      .filter(([_, count]) => count >= 2) // Require at least 2 occurrences
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([term, frequency]) => ({ term, frequency }));

    console.log('🚀 API /suggestions: Final suggestions:', suggestions);
    console.log('🚀 API /suggestions: Returning', suggestions.length, 'suggestions');

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('🚀 API /suggestions: Suggestions error:', error);
    return NextResponse.json({ 
      suggestions: [],
      error: 'Failed to fetch suggestions',
      debug: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
