import { NextRequest, NextResponse } from 'next/server';
import { Contract } from '@/lib/types/contract';
import { SqliteContractRepository } from '@/lib/repositories/sqlite-contract-repository';
import { SmartSearchService } from '@/lib/services/smart-search-service';

// Generate consistent timestamps for mock data
const mockTimestamp = new Date().toISOString();

// Mock data for initial UI testing
const mockContracts: Contract[] = [
  {
    id: '1',
    solicitationNumber: 'W912HZ-25-R-0001',
    title: 'IT Support Services for Federal Agency',
    description: 'The Department of Defense requires comprehensive IT support services including network maintenance, cybersecurity monitoring, and technical help desk support for a 3-year base period with two optional years.',
    agency: 'Department of Defense',
    office: 'Army Corps of Engineers',
    naicsCode: '541511',
    naicsDescription: 'Custom Computer Programming Services',
    postedDate: '2024-01-15T10:00:00Z',
    responseDueDate: '2024-02-15T17:00:00Z',
    placeOfPerformance: 'Washington, DC, United States',
    setAsideDescription: 'Small Business Set-Aside',
    samUrl: 'https://sam.gov/opp/example1',
    status: 'active',
    lastUpdated: mockTimestamp,
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp
  },
  {
    id: '2',
    solicitationNumber: 'GS-35F-0123G',
    title: 'Cloud Infrastructure Services',
    description: 'GSA seeks qualified vendors to provide cloud infrastructure services including AWS, Azure, and Google Cloud platform management, migration services, and ongoing support.',
    agency: 'General Services Administration',
    office: 'Federal Acquisition Service',
    naicsCode: '518210',
    naicsDescription: 'Data Processing, Hosting, and Related Services',
    postedDate: '2024-01-12T14:30:00Z',
    responseDueDate: '2024-02-20T15:00:00Z',
    placeOfPerformance: 'Multiple Locations',
    awardAmount: '$5,000,000',
    setAsideDescription: '8(a) Small Business',
    samUrl: 'https://sam.gov/opp/example2',
    status: 'active',
    lastUpdated: mockTimestamp,
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp
  },
  {
    id: '3',
    solicitationNumber: 'VA-261-25-R-0089',
    title: 'Medical Equipment Maintenance',
    description: 'Department of Veterans Affairs requires preventive and corrective maintenance services for medical imaging equipment across multiple VA medical centers nationwide.',
    agency: 'Department of Veterans Affairs',
    office: 'Veterans Health Administration',
    naicsCode: '811219',
    naicsDescription: 'Other Electronic and Precision Equipment Repair',
    postedDate: '2024-01-10T09:15:00Z',
    responseDueDate: '2024-02-25T16:00:00Z',
    placeOfPerformance: 'Nationwide',
    setAsideDescription: 'SDVOSB Set-Aside',
    samUrl: 'https://sam.gov/opp/example3',
    status: 'active',
    lastUpdated: mockTimestamp,
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp
  }
];

// Semantic search expansion - maps search terms to related concepts
function expandSemanticSearch(searchTerm: string): string[] {
  const expansions: Record<string, string[]> = {
    // AI & Machine Learning (Core Domain)
    'ai': ['artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural networks', 'llm', 'large language model', 'chatbot', 'automation', 'intelligent', 'cognitive', 'nlp', 'natural language processing'],
    'llm': ['large language model', 'language model', 'ai', 'artificial intelligence', 'gpt', 'transformer', 'chatbot', 'conversational ai', 'nlp', 'text generation'],
    'gpt': ['generative pre-trained transformer', 'large language model', 'llm', 'ai', 'chatbot', 'text generation'],
    'chatbot': ['conversational ai', 'virtual assistant', 'ai assistant', 'chat agent', 'automated chat', 'llm'],
    'nlp': ['natural language processing', 'text analysis', 'language understanding', 'ai', 'machine learning'],
    'ml': ['machine learning', 'artificial intelligence', 'ai', 'predictive analytics', 'data science', 'algorithms'],
    'automation': ['ai', 'machine learning', 'robotic process automation', 'rpa', 'workflow automation', 'intelligent automation'],
    'neural': ['neural networks', 'deep learning', 'ai', 'machine learning', 'artificial neural networks'],
    'transformer': ['transformer model', 'attention mechanism', 'llm', 'gpt', 'bert', 'neural networks'],
    
    // Agentic & Advanced AI
    'agentic': ['autonomous agents', 'ai agents', 'intelligent agents', 'agent-based systems', 'multi-agent'],
    'agent': ['ai agent', 'intelligent agent', 'autonomous agent', 'software agent', 'agentic'],
    'autonomous': ['self-driving', 'independent', 'automated', 'agentic', 'ai-powered'],
    'reasoning': ['logical reasoning', 'ai reasoning', 'cognitive reasoning', 'inference', 'decision making'],
    'prompt': ['prompt engineering', 'prompt design', 'ai prompting', 'llm prompts', 'conversational design'],
    'rag': ['retrieval augmented generation', 'knowledge retrieval', 'ai retrieval', 'context retrieval'],
    'embedding': ['vector embeddings', 'text embeddings', 'semantic embeddings', 'vector search'],
    
    // Coaching & Development (Core Domain)
    'coaching': ['mentoring', 'guidance', 'development', 'leadership coaching', 'executive coaching', 'life coaching', 'career coaching', 'professional development'],
    'mentor': ['coaching', 'mentoring', 'guidance', 'advisor', 'counselor', 'development'],
    'counseling': ['therapy', 'psychological services', 'mental health', 'counselor', 'therapist', 'guidance counseling'],
    'therapy': ['counseling', 'psychological treatment', 'mental health services', 'therapeutic services'],
    'personal': ['individual', 'self-development', 'personal growth', 'self-improvement', 'life skills'],
    'development': ['growth', 'improvement', 'training', 'advancement', 'progression', 'enhancement', 'capacity building'],
    'leadership': ['management', 'executive', 'supervision', 'team leadership', 'organizational leadership'],
    'executive': ['leadership', 'c-suite', 'senior management', 'strategic leadership', 'business leadership'],
    
    // Soft Skills & Human Development
    'soft skills': ['interpersonal skills', 'communication skills', 'emotional intelligence', 'social skills', 'people skills'],
    'communication': ['interpersonal', 'presentation', 'public speaking', 'written communication', 'verbal communication'],
    'emotional': ['emotional intelligence', 'eq', 'self-awareness', 'empathy', 'social awareness'],
    'resilience': ['adaptability', 'stress management', 'coping skills', 'mental toughness', 'psychological resilience'],
    'mindfulness': ['meditation', 'awareness', 'mindful practice', 'stress reduction', 'mental wellness'],
    'wellness': ['well-being', 'mental health', 'employee wellness', 'workplace wellness', 'health promotion'],
    'burnout': ['stress management', 'work-life balance', 'employee wellness', 'mental health', 'resilience'],
    'engagement': ['employee engagement', 'motivation', 'involvement', 'participation', 'commitment'],
    
    // Technology & Development
    'software': ['application', 'system', 'platform', 'tool', 'program', 'digital', 'technology', 'code'],
    'code': ['programming', 'software development', 'coding', 'development', 'software engineering'],
    'programming': ['coding', 'software development', 'development', 'software engineering', 'code'],
    'it': ['information technology', 'computer', 'tech', 'digital', 'system', 'network'],
    'tech': ['technology', 'information technology', 'it', 'digital', 'computer', 'technical'],
    'cyber': ['cybersecurity', 'security', 'information assurance', 'network security', 'digital security'],
    'cloud': ['aws', 'azure', 'gcp', 'hosting', 'saas', 'paas', 'iaas', 'computing', 'cloud computing'],
    'api': ['application programming interface', 'web service', 'integration', 'software interface'],
    'data': ['analytics', 'big data', 'data science', 'database', 'information'],
    
    // Professional Services
    'consulting': ['advisory', 'professional services', 'expertise', 'guidance', 'consultation'],
    'advisory': ['consulting', 'guidance', 'expert advice', 'consultation', 'recommendations'],
    'training': ['education', 'instruction', 'learning', 'development', 'course', 'workshop', 'curriculum'],
    'workshop': ['training', 'seminar', 'course', 'learning session', 'educational event'],
    'curriculum': ['training program', 'educational content', 'course design', 'learning materials'],
    'facilitation': ['workshop facilitation', 'meeting facilitation', 'group facilitation', 'process facilitation'],
    'support': ['assistance', 'help', 'service', 'technical support', 'customer support'],
    'management': ['administration', 'oversight', 'coordination', 'leadership', 'supervision'],
    
    // Human Resources & Organizational
    'hr': ['human resources', 'personnel', 'people operations', 'human capital', 'workforce'],
    'talent': ['human capital', 'workforce', 'personnel', 'employee development', 'talent management'],
    'performance': ['performance management', 'evaluation', 'assessment', 'review', 'appraisal'],
    'assessment': ['evaluation', 'testing', 'measurement', 'analysis', 'review'],
    'organizational': ['corporate', 'enterprise', 'institutional', 'company-wide', 'organization'],
    'culture': ['organizational culture', 'workplace culture', 'company culture', 'cultural change'],
    'change': ['transformation', 'organizational change', 'change management', 'transition'],
    
    // Healthcare & Wellness
    'medical': ['health', 'healthcare', 'clinical', 'patient', 'hospital'],
    'health': ['healthcare', 'medical', 'wellness', 'well-being', 'health services'],
    'mental health': ['psychological services', 'counseling', 'therapy', 'behavioral health', 'wellness'],
    'behavioral': ['psychological', 'mental health', 'behavior modification', 'behavioral science'],
    
    // Security & Defense
    'security': ['protection', 'safety', 'defense', 'surveillance', 'cybersecurity'],
    'defense': ['military', 'army', 'navy', 'air force', 'dod', 'security'],
    
    // Research & Innovation
    'research': ['r&d', 'study', 'analysis', 'investigation', 'innovation', 'academic research'],
    'innovation': ['research', 'development', 'invention', 'creative solutions', 'breakthrough'],
    'analysis': ['research', 'study', 'evaluation', 'assessment', 'data analysis'],
    
    // Government Agencies
    'dod': ['department of defense', 'defense', 'military'],
    'va': ['veterans affairs', 'veterans administration', 'veteran services'],
    'dhs': ['homeland security', 'department of homeland security', 'security'],
    'gsa': ['general services administration', 'government services'],
    'nasa': ['space', 'aerospace', 'space exploration'],
    'nih': ['national institutes of health', 'health research', 'medical research'],
    'doe': ['department of energy', 'energy', 'renewable energy'],
    'epa': ['environmental protection agency', 'environment', 'environmental'],
  };
  
  const terms = [searchTerm]; // Always include original term
  
  // Add expansions for exact matches
  if (expansions[searchTerm]) {
    terms.push(...expansions[searchTerm]);
  }
  
  // Check if search term is contained in any key and add those expansions
  Object.entries(expansions).forEach(([key, values]) => {
    if (key.includes(searchTerm) || searchTerm.includes(key)) {
      terms.push(key, ...values);
    }
  });
  
  // Remove duplicates and return
  return [...new Set(terms)];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Extract filter parameters
    const search = searchParams.get('search') || '';
    const searchMode = searchParams.get('searchMode') || 'exact'; // 'exact' or 'semantic'
    const minAwardAmount = searchParams.get('minAwardAmount') ? parseFloat(searchParams.get('minAwardAmount')!) : undefined;
    const maxAwardAmount = searchParams.get('maxAwardAmount') ? parseFloat(searchParams.get('maxAwardAmount')!) : undefined;
    // Handle agencies parameter - use | delimiter to avoid issues with commas in agency names
    const agenciesParam = searchParams.get('agencies');
    const agencies = agenciesParam ? agenciesParam.split('|').map(a => a.trim()).filter(Boolean) : [];
    const status = searchParams.get('status') || 'active'; // Default to active contracts only
    
    console.log('🔍 API Filter Parameters:', {
      search,
      searchMode,
      minAwardAmount,
      maxAwardAmount,
      agencies,
      status,
      limit,
      offset
    });
    
    // Initialize SQLite repository
    const contractRepository = new SqliteContractRepository();
    
    // Get contracts from SQLite database
    const contractCount = await contractRepository.getContractCount();
    
    console.log(`💾 SQLite Database Status:`);
    console.log(`  - Total contracts: ${contractCount}`);
    
    // Use smart search if there's a search term
    if (search && contractCount > 0) {
      console.log('🎆 Using smart search on real database!');
      const searchResult = await SmartSearchService.search(search, {
        limit,
        offset,
        searchMode: searchMode as 'auto' | 'exact' | 'semantic'
      });
      
      console.log(`🔍 Smart Search Results:`);
      console.log(`  - Search type: ${searchResult.searchType}`);
      console.log(`  - Terms used: ${searchResult.searchTermsUsed.join(', ')}`);
      console.log(`  - Results found: ${searchResult.totalCount}`);
      
      // Apply additional filters to search results if needed
      let filteredContracts = searchResult.contracts;
      
      // Apply agency filter (OR logic - match ANY selected agency)
      if (agencies.length > 0) {
        console.log('🏢 Applying agency filter (OR logic) for agencies:', agencies);
        const beforeAgencyFilter = filteredContracts.length;
        
        filteredContracts = filteredContracts.filter(contract => {
          const hasNoAgencySelected = agencies.includes('(No Agency)');
          const contractHasAgency = contract.agency && contract.agency.trim();
          
          // Match contracts with no agency if "(No Agency)" is selected
          if (!contractHasAgency && hasNoAgencySelected) {
            return true;
          }
          
          // Match contracts where agency is in selected list (OR logic)
          // Handle both exact matches and partial matches for malformed agency names
          if (contractHasAgency && contract.agency) {
            const contractAgency = contract.agency.toLowerCase();
            const isMatch = agencies.some(selectedAgency => {
              const selectedLower = selectedAgency.toLowerCase();
              // Exact match
              if (contractAgency === selectedLower) return true;
              // Partial match for malformed names (e.g. "INTERIOR, DEPARTMENT OF THE" contains "INTERIOR")
              if (contractAgency.includes(selectedLower) || selectedLower.includes(contractAgency)) return true;
              return false;
            });
            
            if (isMatch) {
              console.log('🏢 Agency match found:', { contractAgency: contract.agency, selectedAgencies: agencies });
              return true;
            }
          }
          
          return false;
        });
        
        console.log('🏢 Agency filter results:', {
          before: beforeAgencyFilter,
          after: filteredContracts.length,
          selectedAgencies: agencies
        });
      }
      
      // Apply award amount filter
      if (minAwardAmount !== undefined || maxAwardAmount !== undefined) {
        filteredContracts = filteredContracts.filter(contract => {
          const awardAmount = parseFloat(contract.awardAmount?.replace(/[^\d.-]/g, '') || '0');
          
          if (minAwardAmount !== undefined && awardAmount < minAwardAmount) {
            return false;
          }
          
          if (maxAwardAmount !== undefined && awardAmount > maxAwardAmount) {
            return false;
          }
          
          return true;
        });
      }
      
      const totalCount = filteredContracts.length;
      
      return NextResponse.json({
        contracts: filteredContracts,
        totalCount,
        totalUnfilteredCount: searchResult.totalCount,
        hasMore: offset + limit < totalCount,
        searchInfo: {
          searchType: searchResult.searchType,
          termsUsed: searchResult.searchTermsUsed,
          originalTerm: search
        },
        filters: {
          search,
          searchMode,
          minAwardAmount,
          maxAwardAmount,
          agencies,
          status,
          limit,
          offset
        }
      });
    }
    
    // Fallback to old logic for non-search queries
    let contracts: Contract[];
    let filteredContracts: Contract[];
    let totalCount: number;
    
    if (contractCount > 0) {
      console.log('🎆 Using REAL contracts from SQLite database!');
      const allContracts = await contractRepository.getAllContracts();
      contracts = allContracts;
    } else {
      console.log('🧪 Using mock data (import CSV or sync to get real data)');
      contracts = mockContracts;
    }
    
    // Apply server-side filtering
    filteredContracts = contracts.filter(contract => {
      // Status filter - default to active only
      if (status && contract.status !== status) {
        return false;
      }
      
      // Search filter - check ALL relevant fields
      if (search) {
        const searchLower = search.toLowerCase();
        
        // Text fields to search
        const searchableFields = [
          contract.title,
          contract.description,
          contract.solicitationNumber,
          contract.agency,
          contract.office,
          contract.naicsCode,
          contract.naicsDescription,
          contract.setAsideCode,
          contract.setAsideDescription,
          contract.placeOfPerformance,
          contract.contactInfo,
          contract.awardAmount
        ];
        
        let hasMatch = false;
        
        if (searchMode === 'semantic') {
          // Semantic search: expand search terms with synonyms and related concepts
          const semanticTerms = expandSemanticSearch(searchLower);
          hasMatch = searchableFields.some(field => {
            if (!field) return false;
            const fieldLower = field.toString().toLowerCase();
            return semanticTerms.some(term => fieldLower.includes(term));
          });
        } else {
          // Exact search: direct string matching
          hasMatch = searchableFields.some(field => 
            field && field.toString().toLowerCase().includes(searchLower)
          );
        }
        
        if (!hasMatch) {
          return false;
        }
      }
      
      // Agency filter (OR logic - match ANY selected agency)
      if (agencies.length > 0) {
        const hasNoAgencySelected = agencies.includes('(No Agency)');
        const contractHasAgency = contract.agency && contract.agency.trim();
        
        // Match contracts with no agency if "(No Agency)" is selected
        if (!contractHasAgency && hasNoAgencySelected) {
          // Contract has no agency and user selected "No Agency" - include it
          return true; // Continue to next filters
        }
        
        // Match contracts where agency is in selected list (OR logic)  
        // Handle both exact matches and partial matches for malformed agency names
        if (contractHasAgency && contract.agency) {
          const contractAgency = contract.agency.toLowerCase();
          const isMatch = agencies.some(selectedAgency => {
            const selectedLower = selectedAgency.toLowerCase();
            // Exact match
            if (contractAgency === selectedLower) return true;
            // Partial match for malformed names
            if (contractAgency.includes(selectedLower) || selectedLower.includes(contractAgency)) return true;
            return false;
          });
          
          if (isMatch) {
            return true; // Continue to next filters
          }
        }
        
        // Contract doesn't match any selected agency - exclude it
        return false;
      }
      
      // Award amount filter
      if (minAwardAmount !== undefined || maxAwardAmount !== undefined) {
        const awardAmount = parseFloat(contract.awardAmount?.replace(/[^\d.-]/g, '') || '0');
        
        if (minAwardAmount !== undefined && awardAmount < minAwardAmount) {
          return false;
        }
        
        if (maxAwardAmount !== undefined && awardAmount > maxAwardAmount) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort filtered contracts by most recent (posted date desc, then created date desc)
    filteredContracts.sort((a, b) => {
      // First sort by posted date (newest first)
      if (a.postedDate && b.postedDate) {
        const dateComparison = new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        if (dateComparison !== 0) {
          return dateComparison;
        }
      }
      
      // Then sort by created date (newest first)
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      
      return 0;
    });
    
    totalCount = filteredContracts.length;
    
    // Apply pagination
    const paginatedContracts = filteredContracts.slice(offset, offset + limit);
    
    console.log(`📊 Filtering Results:`);
    console.log(`  - Total contracts: ${contracts.length}`);
    console.log(`  - Filtered contracts: ${totalCount}`);
    console.log(`  - Returned contracts: ${paginatedContracts.length}`);
    
    // Get award amount range from full dataset for filter UI
    const awardAmounts = contracts
      .map(contract => parseFloat(contract.awardAmount?.replace(/[^\d.-]/g, '') || '0'))
      .filter(amount => amount > 0);
    
    const minAward = awardAmounts.length > 0 ? Math.min(...awardAmounts) : 0;
    const maxAward = awardAmounts.length > 0 ? Math.max(...awardAmounts) : 100000000;
    
    return NextResponse.json({
      contracts: paginatedContracts,
      totalCount, // Filtered count
      totalUnfilteredCount: contracts.length, // Total count before filtering
      hasMore: offset + limit < totalCount,
      awardAmountRange: { min: minAward, max: maxAward },
      filters: {
        search,
        minAwardAmount,
        maxAwardAmount,
        agencies,
        status,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('Error fetching recent contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent contracts', details: error.message },
      { status: 500 }
    );
  }
}