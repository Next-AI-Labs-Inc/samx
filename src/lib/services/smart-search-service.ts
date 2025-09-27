import { getDatabase } from '@/lib/db/connection';

export interface SearchResult {
  contracts: any[];
  totalCount: number;
  searchTermsUsed: string[];
  searchType: 'phrase' | 'semantic' | 'exact';
}

export class SmartSearchService {
  
  /**
   * Smart search that handles phrases, semantic meaning, and scoring
   */
  static async search(
    searchTerm: string, 
    options: {
      limit?: number;
      offset?: number;
      searchMode?: 'auto' | 'exact' | 'semantic';
    } = {}
  ): Promise<SearchResult> {
    const { limit = 20, offset = 0, searchMode = 'auto' } = options;
    const db = getDatabase();
    
    console.log('🔎 SmartSearchService: Searching for:', searchTerm);
    
    if (!searchTerm.trim()) {
      return {
        contracts: [],
        totalCount: 0,
        searchTermsUsed: [],
        searchType: 'exact'
      };
    }

    // Check if this is an OR query first
    if (searchTerm.toLowerCase().includes(' or ')) {
      console.log('🔎 SmartSearchService: Detected OR query, using OR search');
      return this.orSearch(searchTerm, limit, offset, searchMode);
    }

    // Determine best search strategy for single terms
    const strategy = this.determineSearchStrategy(searchTerm, searchMode);
    console.log('🔎 SmartSearchService: Using strategy:', strategy.type);
    
    switch (strategy.type) {
      case 'phrase':
        return this.phraseSearch(searchTerm, strategy.query, limit, offset);
      case 'semantic': 
        return this.semanticSearch(searchTerm, strategy.terms, limit, offset);
      case 'exact':
      default:
        return this.exactSearch(searchTerm, limit, offset);
    }
  }

  /**
   * Determine the best search strategy based on the query
   */
  private static determineSearchStrategy(searchTerm: string, mode: string) {
    const term = searchTerm.toLowerCase().trim();
    
    // Force exact mode
    if (mode === 'exact') {
      return { type: 'exact' as const, query: term };
    }

    // Multi-word phrases that should be searched together
    const commonPhrases = [
      'web development', 'software development', 'mobile development', 
      'data science', 'machine learning', 'artificial intelligence',
      'cloud computing', 'cyber security', 'information technology',
      'project management', 'quality assurance', 'user experience',
      'database administration', 'network security', 'help desk',
      'software engineering', 'systems analyst', 'business analyst',
      'technical writing', 'graphic design', 'digital marketing'
    ];

    // Check if it's a known phrase
    for (const phrase of commonPhrases) {
      if (term.includes(phrase) || phrase.includes(term)) {
        return { 
          type: 'phrase' as const, 
          query: `"${phrase}"`,
          originalPhrase: phrase
        };
      }
    }

    // Multi-word terms should use semantic search
    if (term.includes(' ') && term.split(' ').length > 1) {
      return {
        type: 'semantic' as const,
        terms: this.expandSemanticTerms(term)
      };
    }

    // Single word - use exact
    return { type: 'exact' as const, query: term };
  }

  /**
   * Phrase search using FTS5 for exact phrase matching
   */
  private static async phraseSearch(originalTerm: string, ftsQuery: string, limit: number, offset: number): Promise<SearchResult> {
    const db = getDatabase();
    
    try {
      // Use FTS5 for phrase search
      const ftsResults = db.prepare(`
        SELECT c.*, 
               rank,
               snippet(contracts_fts, 1, '<mark>', '</mark>', '...', 32) as snippet
        FROM contracts_fts 
        JOIN contracts c ON c.rowid = contracts_fts.rowid
        WHERE contracts_fts MATCH ?
        ORDER BY rank
        LIMIT ? OFFSET ?
      `).all(ftsQuery, limit, offset);

      // Get total count
      const countResult = db.prepare(`
        SELECT COUNT(*) as total
        FROM contracts_fts
        WHERE contracts_fts MATCH ?
      `).get(ftsQuery) as { total: number };

      return {
        contracts: ftsResults,
        totalCount: countResult.total,
        searchTermsUsed: [originalTerm],
        searchType: 'phrase'
      };
    } catch (error) {
      console.error('FTS5 search failed, falling back to exact:', error);
      return this.exactSearch(originalTerm, limit, offset);
    }
  }

  /**
   * Semantic search with expanded terms and relevance scoring
   */
  private static async semanticSearch(originalTerm: string, expandedTerms: string[], limit: number, offset: number): Promise<SearchResult> {
    const db = getDatabase();
    
    // Create weighted search query
    // Primary term gets highest weight, related terms get lower weights
    const searchTerms = [originalTerm, ...expandedTerms];
    
    // Build a complex query that scores results
    const searchConditions = searchTerms.map((term, index) => {
      const weight = index === 0 ? 3 : 1; // Original term gets 3x weight
      return `
        CASE 
          WHEN LOWER(title) LIKE '%${term}%' THEN ${weight * 10}
          WHEN LOWER(description) LIKE '%${term}%' THEN ${weight * 5}
          WHEN LOWER(naics_description) LIKE '%${term}%' THEN ${weight * 3}
          ELSE 0
        END
      `;
    }).join(' + ');

    const query = `
      SELECT *, (${searchConditions}) as relevance_score
      FROM contracts 
      WHERE (${searchTerms.map(term => 
        `(LOWER(title) LIKE '%${term}%' OR 
          LOWER(description) LIKE '%${term}%' OR 
          LOWER(naics_description) LIKE '%${term}%' OR
          LOWER(agency) LIKE '%${term}%' OR
          LOWER(office) LIKE '%${term}%')`
      ).join(' OR ')})
      AND relevance_score > 0
      ORDER BY relevance_score DESC, posted_date DESC
      LIMIT ? OFFSET ?
    `;

    const results = db.prepare(query).all(limit, offset);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM contracts 
      WHERE (${searchTerms.map(term => 
        `(LOWER(title) LIKE '%${term}%' OR 
          LOWER(description) LIKE '%${term}%' OR 
          LOWER(naics_description) LIKE '%${term}%')`
      ).join(' OR ')})
    `;
    
    const countResult = db.prepare(countQuery).get() as { total: number };

    return {
      contracts: results,
      totalCount: countResult.total,
      searchTermsUsed: searchTerms,
      searchType: 'semantic'
    };
  }

  /**
   * Exact search for simple terms
   */
  private static async exactSearch(searchTerm: string, limit: number, offset: number): Promise<SearchResult> {
    const db = getDatabase();
    const term = searchTerm.toLowerCase();

    const query = `
      SELECT *, 
             CASE 
               WHEN LOWER(title) LIKE '%${term}%' THEN 10
               WHEN LOWER(description) LIKE '%${term}%' THEN 5
               WHEN LOWER(naics_description) LIKE '%${term}%' THEN 3
               ELSE 1
             END as relevance_score
      FROM contracts 
      WHERE (
        LOWER(title) LIKE '%${term}%' OR 
        LOWER(description) LIKE '%${term}%' OR 
        LOWER(naics_description) LIKE '%${term}%' OR
        LOWER(agency) LIKE '%${term}%' OR
        LOWER(office) LIKE '%${term}%' OR
        LOWER(solicitation_number) LIKE '%${term}%'
      )
      ORDER BY relevance_score DESC, posted_date DESC
      LIMIT ? OFFSET ?
    `;

    const results = db.prepare(query).all(limit, offset);
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM contracts 
      WHERE (
        LOWER(title) LIKE '%${term}%' OR 
        LOWER(description) LIKE '%${term}%' OR 
        LOWER(naics_description) LIKE '%${term}%' OR
        LOWER(agency) LIKE '%${term}%' OR
        LOWER(office) LIKE '%${term}%' OR
        LOWER(solicitation_number) LIKE '%${term}%'
      )
    `;
    
    const countResult = db.prepare(countQuery).get() as { total: number };

    return {
      contracts: results,
      totalCount: countResult.total,
      searchTermsUsed: [searchTerm],
      searchType: 'exact'
    };
  }

  /**
   * OR search for queries like "web OR web development OR llms"
   */
  private static async orSearch(searchTerm: string, limit: number, offset: number, searchMode: string): Promise<SearchResult> {
    const db = getDatabase();
    
    console.log('🔎 SmartSearchService: Processing OR query:', searchTerm);
    
    // Parse OR terms: "web OR web development OR llms" -> ["web", "web development", "llms"]
    const orTerms = searchTerm
      .split(/\s+or\s+/i) // Case insensitive split on ' OR ' or ' or '
      .map(term => term.trim().replace(/"/g, '').toLowerCase()) // Remove quotes and normalize
      .filter(term => term.length > 0);
      
    console.log('🔎 SmartSearchService: Parsed OR terms:', orTerms);
    
    if (orTerms.length <= 1) {
      // Fallback to regular search if no OR found
      return this.exactSearch(searchTerm, limit, offset);
    }
    
    // Build SQL query that matches ANY of the OR terms
    const termConditions = orTerms.map(term => {
      return `(
        LOWER(title) LIKE '%${term}%' OR 
        LOWER(description) LIKE '%${term}%' OR 
        LOWER(naics_description) LIKE '%${term}%' OR
        LOWER(agency) LIKE '%${term}%' OR
        LOWER(office) LIKE '%${term}%' OR
        LOWER(solicitation_number) LIKE '%${term}%'
      )`;
    }).join(' OR ');
    
    // Build relevance scoring for OR terms
    const scoreConditions = orTerms.map(term => {
      return `
        CASE 
          WHEN LOWER(title) LIKE '%${term}%' THEN 10
          WHEN LOWER(description) LIKE '%${term}%' THEN 5
          WHEN LOWER(naics_description) LIKE '%${term}%' THEN 3
          WHEN LOWER(agency) LIKE '%${term}%' THEN 2
          WHEN LOWER(office) LIKE '%${term}%' THEN 1
          ELSE 0
        END
      `;
    }).join(' + ');
    
    const query = `
      SELECT *, (${scoreConditions}) as relevance_score
      FROM contracts 
      WHERE (${termConditions})
      AND (${scoreConditions}) > 0
      ORDER BY relevance_score DESC, posted_date DESC
      LIMIT ? OFFSET ?
    `;
    
    console.log('🔎 SmartSearchService: Executing OR query with', orTerms.length, 'terms');
    
    const results = db.prepare(query).all(limit, offset);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM contracts 
      WHERE (${termConditions})
    `;
    
    const countResult = db.prepare(countQuery).get() as { total: number };
    
    console.log('🔎 SmartSearchService: OR search found', countResult.total, 'total results');
    
    return {
      contracts: results,
      totalCount: countResult.total,
      searchTermsUsed: orTerms,
      searchType: 'exact' as const
    };
  }

  /**
   * Expand search terms with related concepts
   */
  private static expandSemanticTerms(searchTerm: string): string[] {
    const term = searchTerm.toLowerCase();
    const expansions: Record<string, string[]> = {
      // Web Development
      'web development': ['website development', 'web application', 'frontend', 'backend', 'full stack', 'html', 'css', 'javascript', 'react', 'angular', 'vue'],
      'web dev': ['web development', 'website development', 'web application'],
      'website': ['web development', 'web application', 'frontend', 'ui/ux'],
      
      // Software Development  
      'software development': ['programming', 'coding', 'software engineering', 'application development', 'custom software'],
      'programming': ['software development', 'coding', 'software engineering'],
      'coding': ['programming', 'software development', 'development'],
      'app development': ['application development', 'software development', 'mobile development'],
      
      // Technology Terms
      'ai': ['artificial intelligence', 'machine learning', 'deep learning', 'neural networks'],
      'ml': ['machine learning', 'artificial intelligence', 'data science'],
      'cloud': ['cloud computing', 'aws', 'azure', 'gcp', 'cloud services'],
      'database': ['data management', 'sql', 'nosql', 'data storage'],
      
      // IT Services
      'it support': ['technical support', 'help desk', 'information technology'],
      'cybersecurity': ['cyber security', 'information security', 'network security'],
      'data science': ['analytics', 'big data', 'machine learning', 'statistics'],
      
      // Project Management
      'project management': ['pm', 'agile', 'scrum', 'program management'],
      'agile': ['scrum', 'project management', 'software development'],
    };

    const results = new Set<string>();
    
    // Add original term
    results.add(term);
    
    // Find direct matches
    if (expansions[term]) {
      expansions[term].forEach(t => results.add(t));
    }
    
    // Find partial matches (if search term contains or is contained in expansion keys)
    Object.entries(expansions).forEach(([key, values]) => {
      if (term.includes(key) || key.includes(term)) {
        values.forEach(v => results.add(v));
      }
    });

    return Array.from(results);
  }
}