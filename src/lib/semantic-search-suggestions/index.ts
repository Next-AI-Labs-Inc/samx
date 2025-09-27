/**
 * Semantic Search Suggestions Module
 * 
 * An intelligent search suggestion system that uses semantic similarity to find
 * related terms from your actual data, not predefined mappings.
 * 
 * How it works:
 * 1. Creates embeddings for all your data items using all fields
 * 2. When user searches, finds semantically similar items
 * 3. Extracts common terms/phrases from those similar items
 * 4. Returns suggestions based on actual data patterns
 * 
 * @example
 * ```typescript
 * const suggestionEngine = new SemanticSearchSuggestions({
 *   embeddingProvider: new OpenAIEmbeddingProvider(apiKey),
 *   minSimilarityScore: 0.7,
 *   maxSuggestions: 5
 * })
 * 
 * // Index your data once
 * await suggestionEngine.indexData(contracts, {
 *   textFields: ['title', 'description', 'agency', 'office'],
 *   idField: 'id'
 * })
 * 
 * // Get suggestions for any query
 * const suggestions = await suggestionEngine.getSuggestions('web development')
 * // Returns: [{ term: 'information systems', frequency: 23, confidence: 0.85 }, ...]
 * ```
 */

export * from './semantic-search-suggestions'
export * from './types'
export * from './embedding-providers'
export * from './utils'