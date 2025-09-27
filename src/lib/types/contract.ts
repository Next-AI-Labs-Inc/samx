// Core contract interface matching SAM.gov API response
export interface Contract {
  id: string;
  solicitationNumber: string;
  title: string;
  description?: string;
  agency?: string;
  office?: string;
  naicsCode?: string;
  naicsDescription?: string;
  postedDate?: string;
  responseDueDate?: string;
  archiveDate?: string;
  contractAwardDate?: string;
  awardAmount?: string;
  setAsideCode?: string;
  setAsideDescription?: string;
  placeOfPerformance?: string;
  contactInfo?: string;
  samUrl?: string;
  status: 'active' | 'archived' | 'awarded' | 'cancelled';
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

// Saved search configuration
export interface SavedSearch {
  id: string;
  name: string;
  keywords?: string;
  naicsCodes?: string[]; // Will be stored as JSON string in SQLite
  agencies?: string[]; // Will be stored as JSON string in SQLite
  minPostedDate?: string;
  maxPostedDate?: string;
  minDueDate?: string;
  maxDueDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Search alert record
export interface SearchAlert {
  id: string;
  savedSearchId: string;
  contractId: string;
  alertedAt: string;
}

// Sync status tracking
export interface SyncStatus {
  id: number;
  syncType: 'full' | 'incremental';
  status: 'running' | 'completed' | 'failed';
  contractsProcessed: number;
  contractsAdded: number;
  contractsUpdated: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  nextSyncAt?: string;
}

// Search filters for querying contracts
export interface ContractFilters {
  keywords?: string;
  searchMode?: 'exact' | 'semantic'; // Search mode: exact matching or semantic expansion
  negativeKeywords?: string; // Keywords to exclude (comma or space separated)
  naicsCodes?: string[];
  agencies?: string[];
  minPostedDate?: string;
  maxPostedDate?: string;
  minDueDate?: string;
  maxDueDate?: string;
  minAwardAmount?: number;
  maxAwardAmount?: number;
  status?: Contract['status'];
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
}

// Search results with pagination
export interface ContractSearchResult {
  contracts: Contract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// SAM.gov API response structure (simplified)
export interface SamApiResponse {
  opportunitiesData?: SamOpportunity[];
  totalRecords?: number;
}

export interface SamOpportunity {
  noticeId?: string;
  solicitationNumber?: string;
  title?: string;
  description?: string;
  organizationHierarchy?: {
    agency?: {
      name?: string;
    };
    office?: {
      name?: string;
    };
  };
  naicsCode?: string;
  classificationCode?: string;
  activeDate?: string;
  archiveDate?: string;
  awardDate?: string;
  responseDeadLine?: string;
  award?: {
    amount?: string;
  };
  pointOfContact?: Array<{
    type?: string;
    email?: string;
    phone?: string;
    fullName?: string;
  }>;
  placeOfPerformance?: {
    city?: {
      name?: string;
    };
    state?: {
      name?: string;
    };
    country?: {
      name?: string;
    };
  };
  typeOfSetAsideDescription?: string;
  typeOfSetAside?: string;
  uiLink?: string;
}

// Database row interfaces (snake_case for SQLite)
export interface ContractRow {
  id: string;
  solicitation_number: string;
  title: string;
  description?: string;
  agency?: string;
  office?: string;
  naics_code?: string;
  naics_description?: string;
  posted_date?: string;
  response_due_date?: string;
  archive_date?: string;
  contract_award_date?: string;
  award_amount?: string;
  set_aside_code?: string;
  set_aside_description?: string;
  place_of_performance?: string;
  contact_info?: string;
  sam_url?: string;
  status: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface SavedSearchRow {
  id: string;
  name: string;
  keywords?: string;
  naics_codes?: string; // JSON string
  agencies?: string; // JSON string
  min_posted_date?: string;
  max_posted_date?: string;
  min_due_date?: string;
  max_due_date?: string;
  is_active: number; // SQLite boolean
  created_at: string;
  updated_at: string;
}