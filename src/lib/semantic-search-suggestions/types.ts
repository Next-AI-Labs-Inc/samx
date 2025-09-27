/**
 * Core Types for Semantic Search Suggestions
 */

/**
 * Configuration for embedding provider
 */
export interface EmbeddingProvider {
  /** Create embedding vector for given text */
  createEmbedding(text: string): Promise<number[]>
  /** The dimension size of embeddings this provider creates */
  getDimension(): number
}

/**
 * Configuration for indexing data
 */
export interface IndexingConfig {
  /** Field names to include in embeddings (all fields by default) */
  textFields?: string[]
  /** Field name that contains unique identifier */
  idField: string
  /** Custom text extractor function (overrides textFields) */
  textExtractor?: (item: any) => string
}

/**
 * Configuration for the suggestion engine
 */
export interface SuggestionEngineConfig {
  /** Provider for creating embeddings */
  embeddingProvider: EmbeddingProvider
  /** Minimum similarity score to consider items related (0-1, default: 0.7) */
  minSimilarityScore?: number
  /** Maximum number of suggestions to return (default: 8) */
  maxSuggestions?: number
  /** Minimum frequency for a term to be suggested (default: 2) */
  minTermFrequency?: number
  /** Length range for suggested phrases [min, max] (default: [1, 5]) */
  phraseLengthRange?: [number, number]
}

/**
 * A data item with its embedding
 */
export interface IndexedItem {
  /** Unique identifier */
  id: string
  /** Original data item */
  data: any
  /** Text used for embedding */
  text: string
  /** Embedding vector */
  embedding: number[]
}

/**
 * A search suggestion with metadata
 */
export interface SearchSuggestion {
  /** The suggested search term/phrase */
  term: string
  /** How many items contain this term */
  frequency: number
  /** Confidence score (0-1) based on similarity */
  confidence: number
  /** Sample item IDs that contain this term */
  sampleItemIds: string[]
  /** Whether this is a phrase (multiple words) */
  isPhrase: boolean
}

/**
 * Result from similarity search
 */
export interface SimilarityResult {
  /** The similar item */
  item: IndexedItem
  /** Similarity score (0-1) */
  score: number
}