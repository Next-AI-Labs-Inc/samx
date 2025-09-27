/**
 * Utility Functions for Semantic Search Suggestions
 */

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
  return magnitude ? dotProduct / magnitude : 0
}

/**
 * Create a word boundary regex for exact word matching
 * Prevents "LLM" from matching "TLLM" in words
 */
export function createWordBoundaryRegex(term: string): RegExp {
  // Escape special regex characters
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // Create word boundary pattern (case insensitive)
  return new RegExp(`\\b${escapedTerm}\\b`, 'gi')
}

/**
 * Extract all text fields from an object and combine them
 */
export function extractAllText(item: any, textFields?: string[]): string {
  if (!item) return ''

  // If specific fields are specified, use only those
  if (textFields) {
    return textFields
      .map(field => item[field])
      .filter(value => value && typeof value === 'string')
      .map(value => value.toString().trim())
      .join(' ')
  }

  // Otherwise, extract all string fields
  const allText: string[] = []
  
  function extractStrings(obj: any, depth = 0) {
    if (depth > 3) return // Prevent infinite recursion
    
    if (typeof obj === 'string' && obj.trim()) {
      allText.push(obj.trim())
    } else if (Array.isArray(obj)) {
      obj.forEach(item => extractStrings(item, depth + 1))
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => extractStrings(value, depth + 1))
    }
  }
  
  extractStrings(item)
  return allText.join(' ')
}

/**
 * Extract meaningful phrases from text
 * Returns n-grams of different lengths, filtered for quality
 */
export function extractPhrases(
  text: string, 
  lengthRange: [number, number] = [1, 5]
): string[] {
  if (!text) return []

  // Clean and normalize text
  const cleanText = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  if (!cleanText) return []

  const words = cleanText.split(' ').filter(word => word.length > 1)
  const phrases: string[] = []
  const [minLength, maxLength] = lengthRange

  // Extract n-grams of different lengths
  for (let length = minLength; length <= Math.min(maxLength, words.length); length++) {
    for (let i = 0; i <= words.length - length; i++) {
      const phrase = words.slice(i, i + length).join(' ')
      
      // Filter out low-quality phrases
      if (isQualityPhrase(phrase)) {
        phrases.push(phrase)
      }
    }
  }

  return [...new Set(phrases)] // Remove duplicates
}

/**
 * Determine if a phrase is worth suggesting
 */
function isQualityPhrase(phrase: string): boolean {
  // Skip very short phrases
  if (phrase.length < 2) return false
  
  // Skip common stop words when they're alone
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ])
  
  const words = phrase.split(' ')
  
  // Single word stop words
  if (words.length === 1 && stopWords.has(phrase)) {
    return false
  }
  
  // Skip phrases that are mostly stop words
  const stopWordRatio = words.filter(word => stopWords.has(word)).length / words.length
  if (stopWordRatio > 0.6) {
    return false
  }
  
  // Skip phrases with too many numbers or special characters
  if (/^\d+$/.test(phrase)) return false
  if (phrase.length < 3) return false
  
  return true
}

/**
 * Count term frequencies and return sorted results
 */
export function countTermFrequencies(
  phrases: string[], 
  minFrequency: number = 2
): Array<{ term: string; frequency: number }> {
  const counts = new Map<string, number>()
  
  phrases.forEach(phrase => {
    counts.set(phrase, (counts.get(phrase) || 0) + 1)
  })
  
  return Array.from(counts.entries())
    .filter(([_, count]) => count >= minFrequency)
    .map(([term, frequency]) => ({ term, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
}

/**
 * Normalize text for consistent processing
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}