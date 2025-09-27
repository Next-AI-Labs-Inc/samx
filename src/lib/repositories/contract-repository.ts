import { 
  Contract, 
  ContractFilters, 
  PaginationParams, 
  ContractSearchResult,
  SavedSearch,
  SearchAlert,
  SyncStatus
} from '../types/contract';

// Repository interface for contract operations
export interface ContractRepository {
  // Contract CRUD operations
  createContract(contract: Omit<Contract, 'createdAt' | 'updatedAt'>): Promise<Contract>;
  getContractById(id: string): Promise<Contract | null>;
  getContractBySolicitation(solicitationNumber: string): Promise<Contract | null>;
  updateContract(id: string, updates: Partial<Contract>): Promise<Contract | null>;
  deleteContract(id: string): Promise<boolean>;
  
  // Contract search and listing
  searchContracts(filters: ContractFilters, pagination: PaginationParams): Promise<ContractSearchResult>;
  searchContractsByKeywords(keywords: string, pagination: PaginationParams): Promise<ContractSearchResult>;
  getRecentContracts(limit?: number): Promise<Contract[]>;
  getContractsByAgency(agency: string, pagination: PaginationParams): Promise<ContractSearchResult>;
  getContractsByNaics(naicsCode: string, pagination: PaginationParams): Promise<ContractSearchResult>;
  
  // Batch operations
  createMultipleContracts(contracts: Omit<Contract, 'createdAt' | 'updatedAt'>[]): Promise<Contract[]>;
  updateMultipleContracts(updates: Array<{ id: string; updates: Partial<Contract> }>): Promise<Contract[]>;
  
  // Saved searches
  createSavedSearch(search: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedSearch>;
  getSavedSearches(): Promise<SavedSearch[]>;
  getSavedSearchById(id: string): Promise<SavedSearch | null>;
  updateSavedSearch(id: string, updates: Partial<SavedSearch>): Promise<SavedSearch | null>;
  deleteSavedSearch(id: string): Promise<boolean>;
  
  // Search alerts
  createSearchAlert(alert: Omit<SearchAlert, 'id' | 'alertedAt'>): Promise<SearchAlert>;
  getAlertsBySearchId(savedSearchId: string): Promise<SearchAlert[]>;
  markAlertAsSent(id: string): Promise<boolean>;
  
  // Sync status tracking
  createSyncStatus(status: Omit<SyncStatus, 'id'>): Promise<SyncStatus>;
  updateSyncStatus(id: number, updates: Partial<SyncStatus>): Promise<SyncStatus | null>;
  getLatestSyncStatus(): Promise<SyncStatus | null>;
  getSyncHistory(limit?: number): Promise<SyncStatus[]>;
  
  // Statistics and analytics
  getContractCount(): Promise<number>;
  getContractCountByStatus(): Promise<Record<string, number>>;
  getContractCountByAgency(): Promise<Record<string, number>>;
  getContractCountByNaics(): Promise<Record<string, number>>;
  
  // Utility methods
  cleanup(): Promise<void>;
}