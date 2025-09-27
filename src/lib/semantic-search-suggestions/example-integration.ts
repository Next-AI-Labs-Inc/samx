/**
 * Example: Integration with Your Contracts API
 * 
 * Shows how to integrate the semantic search suggestions module
 * with your existing contracts API for intelligent search suggestions
 */

import React from 'react'
import { Contract } from '@/lib/types/contract'
import { SqliteContractRepository } from '@/lib/repositories/sqlite-contract-repository'
import { 
  SemanticSearchSuggestions, 
  OpenAIEmbeddingProvider,
  MockEmbeddingProvider 
} from './index'

// Initialize the suggestion engine (singleton pattern)
let suggestionEngine: SemanticSearchSuggestions | null = null

export async function initializeSuggestionEngine(useOpenAI: boolean = false): Promise<SemanticSearchSuggestions> {
  if (suggestionEngine) {
    return suggestionEngine
  }

  console.log('🚀 Initializing semantic search suggestions...')

  // Choose embedding provider
  const embeddingProvider = useOpenAI
    ? new OpenAIEmbeddingProvider(process.env.OPENAI_API_KEY!)
    : new MockEmbeddingProvider() // Use mock for development

  suggestionEngine = new SemanticSearchSuggestions({
    embeddingProvider,
    minSimilarityScore: 0.7,    // Adjust based on your data
    maxSuggestions: 8,
    minTermFrequency: 2,
    phraseLengthRange: [1, 4]   // Government contracts tend to be wordy
  })

  // Index all contracts
  await indexAllContracts()

  return suggestionEngine
}

async function indexAllContracts(): Promise<void> {
  if (!suggestionEngine) {
    throw new Error('Suggestion engine not initialized')
  }

  const contractRepository = new SqliteContractRepository()
  const contracts = await contractRepository.getAllContracts()

  console.log(`📊 Indexing ${contracts.length} contracts...`)

  await suggestionEngine.indexData(contracts, {
    // Include ALL relevant fields for comprehensive semantic understanding
    textFields: [
      'title',
      'description', 
      'agency',
      'office',
      'naicsDescription',
      'setAsideDescription',
      'placeOfPerformance',
      'contactInfo'
    ],
    idField: 'id'
  })

  const stats = suggestionEngine.getIndexStats()
  console.log(`✅ Indexed ${stats.totalItems} contracts`)
  console.log(`   Average text length: ${stats.avgTextLength} characters`)
  console.log(`   Embedding dimension: ${stats.embeddingDimension}`)
}

/**
 * Get search suggestions for a query
 */
export async function getSearchSuggestions(query: string) {
  if (!suggestionEngine) {
    await initializeSuggestionEngine()
  }

  if (!query || !query.trim()) {
    return []
  }

  try {
    const suggestions = await suggestionEngine!.getSuggestions(query)
    
    console.log(`🔍 Generated ${suggestions.length} suggestions for "${query}":`)
    suggestions.forEach(s => {
      console.log(`  • "${s.term}" (${s.frequency} contracts, confidence: ${s.confidence.toFixed(2)})`)
    })

    return suggestions
  } catch (error) {
    console.error('Error getting search suggestions:', error)
    return []
  }
}

/**
 * Enhanced contracts API endpoint with semantic suggestions
 */
export async function getContractsWithSuggestions(params: {
  search?: string
  limit?: number
  offset?: number
  // ... other existing params
}) {
  const contractRepository = new SqliteContractRepository()
  
  // Get regular search results
  const searchResult = await contractRepository.searchContracts(
    {
      keywords: params.search
    },
    {
      page: Math.floor((params.offset || 0) / (params.limit || 25)) + 1,
      limit: params.limit || 25
    }
  )
  const contracts = searchResult.contracts

  // Get semantic suggestions if there's a search term
  let suggestions: any[] = []
  if (params.search) {
    suggestions = await getSearchSuggestions(params.search)
  }

  return {
    contracts,
    suggestions: suggestions.map(s => ({
      term: s.term,
      frequency: s.frequency,
      confidence: s.confidence,
      isPhrase: s.isPhrase
    })),
    searchInfo: {
      originalQuery: params.search,
      suggestionsAvailable: suggestions.length > 0
    }
  }
}

/**
 * React Hook Example for UI Integration
 */
export function useSearchSuggestions(query: string, debounceMs: number = 300) {
  const [suggestions, setSuggestions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  
  React.useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await getSearchSuggestions(query)
        setSuggestions(results)
      } catch (error) {
        console.error('Error loading suggestions:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  return { suggestions, loading }
}

/**
 * Example: Re-index when contracts are updated
 */
export async function onContractsUpdated() {
  console.log('📥 Contracts updated, re-indexing for semantic search...')
  
  if (suggestionEngine) {
    await indexAllContracts()
    console.log('✅ Re-indexing complete')
  }
}

/**
 * Example: Development/Testing utilities
 */
export async function testSuggestionEngine() {
  await initializeSuggestionEngine(false) // Use mock provider
  
  const testQueries = [
    'web development',
    'AI',
    'software',
    'consulting',
    'data analytics',
    'cybersecurity'
  ]

  console.log('🧪 Testing suggestion engine with sample queries...')
  
  for (const query of testQueries) {
    console.log(`\n--- Testing: "${query}" ---`)
    const suggestions = await getSearchSuggestions(query)
    
    if (suggestions.length === 0) {
      console.log('  No suggestions found')
    } else {
      suggestions.forEach((s, i) => {
        console.log(`  ${i+1}. "${s.term}" (${s.frequency} contracts)`)
      })
    }
  }
}

// Export the suggestion engine instance for direct access if needed
export { suggestionEngine }