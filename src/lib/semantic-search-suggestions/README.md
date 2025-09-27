# Semantic Search Suggestions

An intelligent search suggestion system that uses semantic similarity to find related terms from your actual data, not predefined mappings.

## What It Does

Instead of guessing what terms might be related to a user's search, this module:

1. **Indexes all your data** using semantic embeddings (considers ALL fields, not just title/description)
2. **When user searches**, finds items semantically similar to their query  
3. **Extracts actual terms** from those similar items
4. **Returns suggestions** with proper word boundary matching (e.g., "LLM" won't match "TLLM")

## Key Features

- ✅ **Data-driven suggestions** - learns from YOUR actual data
- ✅ **All field indexing** - uses complete item data, not just title/description  
- ✅ **Word boundary matching** - "LLM" only matches whole words
- ✅ **Multiple embedding providers** - OpenAI, local models, or mock for testing
- ✅ **Configurable parameters** - similarity thresholds, suggestion limits, etc.
- ✅ **TypeScript support** - fully typed with clear interfaces
- ✅ **Production ready** - error handling, logging, performance optimized

## Installation

```bash
npm install
# Add to your project - currently part of your codebase
```

## Quick Start

```typescript
import { 
  SemanticSearchSuggestions, 
  OpenAIEmbeddingProvider 
} from './semantic-search-suggestions'

// 1. Setup with embedding provider
const suggestionEngine = new SemanticSearchSuggestions({
  embeddingProvider: new OpenAIEmbeddingProvider('your-openai-api-key'),
  minSimilarityScore: 0.7,    // How similar items need to be
  maxSuggestions: 8,          // Max suggestions to return
  minTermFrequency: 2         // Min frequency for terms to suggest
})

// 2. Index your data once (when data changes)
await suggestionEngine.indexData(contracts, {
  textFields: ['title', 'description', 'agency', 'office', 'naicsDescription'], 
  idField: 'id'
})

// 3. Get suggestions for any search term
const suggestions = await suggestionEngine.getSuggestions('web development')

console.log(suggestions)
// [
//   { term: 'information systems', frequency: 23, confidence: 0.85, isPhrase: true },
//   { term: 'software development services', frequency: 12, confidence: 0.72, isPhrase: true },
//   { term: 'web portal', frequency: 8, confidence: 0.64, isPhrase: true }
// ]
```

## Usage Examples

### Government Contracts
```typescript
// Index contracts with all relevant fields
await suggestionEngine.indexData(contracts, {
  textFields: [
    'title', 'description', 'agency', 'office', 
    'naicsDescription', 'setAsideDescription', 'placeOfPerformance'
  ],
  idField: 'id'
})

// User searches "AI" → get government terminology
const suggestions = await suggestionEngine.getSuggestions('AI')
// Returns: ['data analytics', 'decision support systems', 'information services']
```

### E-commerce Products
```typescript
await suggestionEngine.indexData(products, {
  textFields: ['name', 'description', 'category', 'brand', 'features'],
  idField: 'productId'
})

// User searches "laptop" → get related terms from your catalog
const suggestions = await suggestionEngine.getSuggestions('laptop')
// Returns: ['notebook computer', 'portable workstation', 'ultrabook']
```

### Legal Documents
```typescript
await suggestionEngine.indexData(documents, {
  textFields: ['title', 'content', 'practiceArea', 'jurisdiction'],
  idField: 'documentId'
})

const suggestions = await suggestionEngine.getSuggestions('contract dispute')
// Returns: ['breach of agreement', 'contractual violation', 'performance failure']
```

## Embedding Providers

### OpenAI (Recommended for production)
```typescript
import { OpenAIEmbeddingProvider } from './embedding-providers'

const provider = new OpenAIEmbeddingProvider(
  'your-api-key',
  'text-embedding-ada-002',  // model (optional)
  1536                       // dimension (optional)
)
```

### Mock Provider (For development/testing)
```typescript
import { MockEmbeddingProvider } from './embedding-providers'

const provider = new MockEmbeddingProvider(384) // dimension
```

### Local Model (For self-hosted)
```typescript
import { LocalEmbeddingProvider } from './embedding-providers'

const provider = new LocalEmbeddingProvider(
  'http://localhost:8000/embed', // your local model endpoint
  384                            // dimension
)
```

### Batch Provider (For performance)
```typescript
import { BatchEmbeddingProvider, OpenAIEmbeddingProvider } from './embedding-providers'

const baseProvider = new OpenAIEmbeddingProvider('api-key')
const provider = new BatchEmbeddingProvider(baseProvider, 10) // batch size
```

## Configuration Options

```typescript
interface SuggestionEngineConfig {
  embeddingProvider: EmbeddingProvider    // Required
  minSimilarityScore?: number            // 0-1, default: 0.7
  maxSuggestions?: number                // default: 8  
  minTermFrequency?: number              // default: 2
  phraseLengthRange?: [number, number]   // default: [1, 5]
}
```

### Fine-tuning Parameters

- **`minSimilarityScore`**: Higher = more strict similarity (0.8+ for very similar items)
- **`maxSuggestions`**: How many suggestions to return max
- **`minTermFrequency`**: Terms must appear in this many similar items to be suggested
- **`phraseLengthRange`**: [min, max] words in suggested phrases

## Advanced Usage

### Custom Text Extraction
```typescript
await suggestionEngine.indexData(contracts, {
  idField: 'id',
  textExtractor: (contract) => {
    // Custom logic for extracting searchable text
    return `${contract.title} ${contract.description} ${contract.requirements}`
  }
})
```

### Working with OR Queries
```typescript
// In your UI component
const [searchTerms, setSearchTerms] = useState(['web development'])

// Add suggestion to search
const addSuggestion = (suggestion: SearchSuggestion) => {
  setSearchTerms(prev => [...prev, suggestion.term])
}

// Search with OR logic
const searchQuery = searchTerms.join(' OR ')
// "web development OR information systems OR software development"
```

### Performance Monitoring
```typescript
// Get indexing statistics
const stats = suggestionEngine.getIndexStats()
console.log(`Indexed ${stats.totalItems} items`)
console.log(`Average text length: ${stats.avgTextLength} chars`)
console.log(`Embedding dimension: ${stats.embeddingDimension}`)

// Find items containing specific terms (debugging)
const itemsWithTerm = suggestionEngine.findItemsContaining('software')
console.log(`Found ${itemsWithTerm.length} items containing "software"`)
```

## API Reference

### `SemanticSearchSuggestions`

#### Constructor
```typescript
new SemanticSearchSuggestions(config: SuggestionEngineConfig)
```

#### Methods
```typescript
// Index your data (call when data changes)
async indexData<T>(items: T[], config: IndexingConfig): Promise<void>

// Get suggestions for search term
async getSuggestions(query: string): Promise<SearchSuggestion[]>

// Get indexing statistics
getIndexStats(): { totalItems: number, avgTextLength: number, embeddingDimension: number }

// Clear all indexed data
clearIndex(): void

// Find items containing term (debugging)
findItemsContaining(searchTerm: string): IndexedItem[]
```

## Performance Considerations

### Indexing
- **One-time cost** when data changes
- ~2-10ms per item for embedding creation
- For 10k items: ~2-5 minutes indexing time
- Consider indexing in background/startup

### Querying  
- **Real-time** suggestions in ~50-200ms
- Similarity calculation is fast (cosine similarity)
- Phrase extraction scales with number of similar items found

### Memory Usage
- ~1.5KB per item for embeddings (1536 dimension)
- 42k items ≈ 63MB in memory
- Consider persisting embeddings to database for large datasets

## Error Handling

```typescript
try {
  const suggestions = await suggestionEngine.getSuggestions('search term')
} catch (error) {
  if (error.message.includes('No data indexed')) {
    // Handle not indexed yet
  } else {
    // Handle other errors (API failures, etc.)
  }
}
```

## Integration Example (React)

```typescript
// Hook for search suggestions
const useSuggestions = (query: string) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) return

    let cancelled = false
    setLoading(true)

    suggestionEngine.getSuggestions(query)
      .then(results => {
        if (!cancelled) {
          setSuggestions(results)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    return () => { cancelled = true }
  }, [query])

  return { suggestions, loading }
}

// Component
const SearchWithSuggestions = () => {
  const [query, setQuery] = useState('')
  const [searchTerms, setSearchTerms] = useState<string[]>([])
  const { suggestions } = useSuggestions(query)

  return (
    <div>
      <input 
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      
      {/* Current search terms */}
      <div>
        {searchTerms.map(term => (
          <span key={term}>"{term}" OR </span>
        ))}
      </div>

      {/* Suggestions */}
      <div>
        {suggestions.map(suggestion => (
          <button
            key={suggestion.term}
            onClick={() => {
              setSearchTerms(prev => [...prev, suggestion.term])
              setQuery('')
            }}
          >
            + {suggestion.term} ({suggestion.frequency} items)
          </button>
        ))}
      </div>
    </div>
  )
}
```

## License

MIT - Feel free to use in your projects or open source this module!