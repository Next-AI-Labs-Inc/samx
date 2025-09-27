/**
 * Semantic Search Suggestions Engine
 * 
 * Core class that provides intelligent search suggestions based on semantic similarity
 * to actual data in your dataset, not predefined mappings.
 */

import { 
  EmbeddingProvider, 
  IndexingConfig, 
  SuggestionEngineConfig,
  IndexedItem,
  SearchSuggestion,
  SimilarityResult
} from './types'

import { 
  cosineSimilarity,
  createWordBoundaryRegex,
  extractAllText,
  extractPhrases,
  countTermFrequencies,
  normalizeText
} from './utils'

export class SemanticSearchSuggestions {
  private embeddingProvider: EmbeddingProvider
  private indexedItems: IndexedItem[] = []
  private config: Required<SuggestionEngineConfig>

  constructor(config: SuggestionEngineConfig) {
    this.embeddingProvider = config.embeddingProvider
    this.config = {
      embeddingProvider: config.embeddingProvider,
      minSimilarityScore: config.minSimilarityScore ?? 0.7,
      maxSuggestions: config.maxSuggestions ?? 8,
      minTermFrequency: config.minTermFrequency ?? 2,
      phraseLengthRange: config.phraseLengthRange ?? [1, 5]
    }
  }

  /**
   * Index your data for semantic search
   * Call this once when your data changes
   */
  async indexData<T>(items: T[], config: IndexingConfig): Promise<void> {
    console.log(`🔄 Indexing ${items.length} items for semantic search...`)
    const startTime = Date.now()

    this.indexedItems = []
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const id = item[config.idField as keyof T] as string
      
      if (!id) {
        console.warn(`Item at index ${i} missing ID field '${config.idField}', skipping`)
        continue
      }

      try {
        // Extract text from all relevant fields
        const text = config.textExtractor 
          ? config.textExtractor(item)
          : extractAllText(item, config.textFields)

        if (!text || !text.trim()) {
          console.warn(`No text content found for item ${id}, skipping`)
          continue
        }

        // Create embedding for the combined text
        const embedding = await this.embeddingProvider.createEmbedding(text)

        this.indexedItems.push({
          id,
          data: item,
          text: text.trim(),
          embedding
        })

        // Progress logging for large datasets
        if (items.length > 100 && (i + 1) % 100 === 0) {
          console.log(`  Indexed ${i + 1}/${items.length} items`)
        }
      } catch (error) {
        console.error(`Error indexing item ${id}:`, error)
      }
    }

    const duration = Date.now() - startTime
    console.log(`✅ Indexed ${this.indexedItems.length} items in ${duration}ms`)
  }

  /**
   * Get search suggestions for a query based on semantic similarity
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query || !query.trim()) {
      return []
    }

    if (this.indexedItems.length === 0) {
      throw new Error('No data indexed. Call indexData() first.')
    }

    console.log(`🔍 Getting suggestions for: "${query}"`)
    const startTime = Date.now()

    try {
      // Create embedding for the query
      const queryEmbedding = await this.embeddingProvider.createEmbedding(query.trim())

      // Find semantically similar items
      const similarItems = this.findSimilarItems(queryEmbedding)
      
      if (similarItems.length === 0) {
        console.log(`No similar items found for "${query}"`)
        return []
      }

      console.log(`Found ${similarItems.length} similar items`)

      // Extract and analyze terms from similar items
      const suggestions = this.extractSuggestionsFromSimilarItems(
        similarItems, 
        query.trim()
      )

      const duration = Date.now() - startTime
      console.log(`✅ Generated ${suggestions.length} suggestions in ${duration}ms`)

      return suggestions
    } catch (error) {
      console.error('Error generating suggestions:', error)
      return []
    }
  }

  /**
   * Find items similar to the query embedding
   */
  private findSimilarItems(queryEmbedding: number[]): SimilarityResult[] {
    const similarities: SimilarityResult[] = []

    for (const item of this.indexedItems) {
      try {
        const similarity = cosineSimilarity(queryEmbedding, item.embedding)
        
        if (similarity >= this.config.minSimilarityScore) {
          similarities.push({
            item,
            score: similarity
          })
        }
      } catch (error) {
        console.error(`Error calculating similarity for item ${item.id}:`, error)
      }
    }

    // Sort by similarity score (highest first)
    return similarities.sort((a, b) => b.score - a.score)
  }

  /**
   * Extract suggestions from similar items
   */
  private extractSuggestionsFromSimilarItems(
    similarItems: SimilarityResult[],
    originalQuery: string
  ): SearchSuggestion[] {
    // Collect all phrases from similar items
    const allPhrases: string[] = []
    const itemsByPhrase = new Map<string, Set<string>>()

    similarItems.forEach(({ item }) => {
      const phrases = extractPhrases(item.text, this.config.phraseLengthRange)
      
      phrases.forEach(phrase => {
        // Skip phrases that are too similar to original query
        if (!this.isPhraseTooSimilarToQuery(phrase, originalQuery)) {
          allPhrases.push(phrase)
          
          // Track which items contain each phrase
          if (!itemsByPhrase.has(phrase)) {
            itemsByPhrase.set(phrase, new Set())
          }
          itemsByPhrase.get(phrase)!.add(item.id)
        }
      })
    })

    // Count frequencies and create suggestions
    const termFrequencies = countTermFrequencies(allPhrases, this.config.minTermFrequency)
    
    const suggestions: SearchSuggestion[] = termFrequencies
      .slice(0, this.config.maxSuggestions)
      .map(({ term, frequency }) => {
        const sampleItemIds = Array.from(itemsByPhrase.get(term) || []).slice(0, 3)
        
        // Calculate confidence based on frequency and similarity
        const maxFrequency = Math.max(...termFrequencies.map(t => t.frequency))
        const confidence = Math.min(0.95, frequency / maxFrequency)

        return {
          term,
          frequency,
          confidence,
          sampleItemIds,
          isPhrase: term.includes(' ')
        }
      })

    return suggestions
  }

  /**
   * Check if a phrase is too similar to the original query to be useful
   */
  private isPhraseTooSimilarToQuery(phrase: string, query: string): boolean {
    const normalizedPhrase = normalizeText(phrase)
    const normalizedQuery = normalizeText(query)

    // Skip if phrase contains the exact query
    if (normalizedPhrase.includes(normalizedQuery) || normalizedQuery.includes(normalizedPhrase)) {
      return true
    }

    // Skip if phrase is just the query with minor variations
    const queryWords = new Set(normalizedQuery.split(' '))
    const phraseWords = new Set(normalizedPhrase.split(' '))
    
    // Calculate word overlap
    const overlap = [...queryWords].filter(word => phraseWords.has(word)).length
    const overlapRatio = overlap / Math.max(queryWords.size, phraseWords.size)
    
    // Skip if too much overlap (likely just variations of the same term)
    return overlapRatio > 0.8
  }

  /**
   * Get statistics about the indexed data
   */
  getIndexStats(): {
    totalItems: number
    avgTextLength: number
    embeddingDimension: number
  } {
    if (this.indexedItems.length === 0) {
      return {
        totalItems: 0,
        avgTextLength: 0,
        embeddingDimension: this.embeddingProvider.getDimension()
      }
    }

    const totalTextLength = this.indexedItems.reduce((sum, item) => sum + item.text.length, 0)
    const avgTextLength = Math.round(totalTextLength / this.indexedItems.length)

    return {
      totalItems: this.indexedItems.length,
      avgTextLength,
      embeddingDimension: this.embeddingProvider.getDimension()
    }
  }

  /**
   * Clear all indexed data
   */
  clearIndex(): void {
    this.indexedItems = []
    console.log('🗑️ Cleared search index')
  }

  /**
   * Find items by exact text search (for debugging)
   */
  findItemsContaining(searchTerm: string): IndexedItem[] {
    const regex = createWordBoundaryRegex(searchTerm)
    return this.indexedItems.filter(item => regex.test(item.text))
  }
}