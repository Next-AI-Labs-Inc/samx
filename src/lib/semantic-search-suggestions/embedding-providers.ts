/**
 * Embedding Provider Implementations
 * 
 * Different providers for creating text embeddings
 */

import { EmbeddingProvider } from './types'

/**
 * OpenAI Embedding Provider
 * Uses OpenAI's text-embedding-ada-002 model
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string
  private model: string
  private dimension: number

  constructor(
    apiKey: string, 
    model: string = 'text-embedding-ada-002',
    dimension: number = 1536
  ) {
    this.apiKey = apiKey
    this.model = model
    this.dimension = dimension
  }

  async createEmbedding(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
      return new Array(this.dimension).fill(0)
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text.trim(),
          model: this.model,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.data[0].embedding
    } catch (error) {
      console.error('OpenAI embedding error:', error)
      throw new Error(`Failed to create embedding: ${error}`)
    }
  }

  getDimension(): number {
    return this.dimension
  }
}

/**
 * Mock Embedding Provider for testing
 * Creates simple hash-based embeddings for development
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  private dimension: number

  constructor(dimension: number = 384) {
    this.dimension = dimension
  }

  async createEmbedding(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
      return new Array(this.dimension).fill(0)
    }

    // Create a simple hash-based embedding for testing
    const words = text.toLowerCase().trim().split(/\s+/)
    const embedding = new Array(this.dimension).fill(0)

    words.forEach((word, wordIndex) => {
      // Simple hash function
      let hash = 0
      for (let i = 0; i < word.length; i++) {
        const char = word.charCodeAt(i)
        hash = ((hash << 5) - hash + char) & 0xffffffff
      }

      // Distribute hash across embedding dimensions
      for (let i = 0; i < this.dimension; i++) {
        const index = (hash + wordIndex * 7 + i * 13) % this.dimension
        embedding[Math.abs(index)] += Math.sin(hash + i) * 0.1
      }
    })

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude)
    }

    return embedding
  }

  getDimension(): number {
    return this.dimension
  }
}

/**
 * Local Embedding Provider (placeholder for local models)
 * For use with local embedding models like Sentence Transformers
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  private dimension: number
  private modelEndpoint: string

  constructor(modelEndpoint: string, dimension: number = 384) {
    this.modelEndpoint = modelEndpoint
    this.dimension = dimension
  }

  async createEmbedding(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
      return new Array(this.dimension).fill(0)
    }

    try {
      const response = await fetch(this.modelEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Local model error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.embedding
    } catch (error) {
      console.error('Local embedding error:', error)
      throw new Error(`Failed to create embedding: ${error}`)
    }
  }

  getDimension(): number {
    return this.dimension
  }
}

/**
 * Batch Embedding Provider wrapper
 * Optimizes multiple embedding calls
 */
export class BatchEmbeddingProvider implements EmbeddingProvider {
  private provider: EmbeddingProvider
  private batchSize: number
  private cache: Map<string, number[]>

  constructor(provider: EmbeddingProvider, batchSize: number = 10) {
    this.provider = provider
    this.batchSize = batchSize
    this.cache = new Map()
  }

  async createEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = text.trim().toLowerCase()
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const embedding = await this.provider.createEmbedding(text)
    this.cache.set(cacheKey, embedding)
    return embedding
  }

  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const results: number[][] = []
    
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize)
      const batchResults = await Promise.all(
        batch.map(text => this.createEmbedding(text))
      )
      results.push(...batchResults)
    }

    return results
  }

  getDimension(): number {
    return this.provider.getDimension()
  }

  clearCache(): void {
    this.cache.clear()
  }
}