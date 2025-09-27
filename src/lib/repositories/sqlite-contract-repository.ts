import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { 
  Contract, 
  ContractFilters, 
  PaginationParams, 
  ContractSearchResult,
  SavedSearch,
  SearchAlert,
  SyncStatus,
  ContractRow,
  SavedSearchRow
} from '../types/contract';
import { ContractRepository } from './contract-repository';
import { getDatabase } from '../db/connection';

export class SqliteContractRepository implements ContractRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  // Helper methods for data conversion
  private contractRowToContract(row: ContractRow): Contract {
    return {
      id: row.id,
      solicitationNumber: row.solicitation_number,
      title: row.title,
      description: row.description,
      agency: row.agency,
      office: row.office,
      naicsCode: row.naics_code,
      naicsDescription: row.naics_description,
      postedDate: row.posted_date,
      responseDueDate: row.response_due_date,
      archiveDate: row.archive_date,
      contractAwardDate: row.contract_award_date,
      awardAmount: row.award_amount,
      setAsideCode: row.set_aside_code,
      setAsideDescription: row.set_aside_description,
      placeOfPerformance: row.place_of_performance,
      contactInfo: row.contact_info,
      samUrl: row.sam_url,
      status: row.status as Contract['status'],
      lastUpdated: row.last_updated,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private contractToContractRow(contract: Partial<Contract>): Partial<ContractRow> {
    return {
      id: contract.id,
      solicitation_number: contract.solicitationNumber,
      title: contract.title,
      description: contract.description,
      agency: contract.agency,
      office: contract.office,
      naics_code: contract.naicsCode,
      naics_description: contract.naicsDescription,
      posted_date: contract.postedDate,
      response_due_date: contract.responseDueDate,
      archive_date: contract.archiveDate,
      contract_award_date: contract.contractAwardDate,
      award_amount: contract.awardAmount,
      set_aside_code: contract.setAsideCode,
      set_aside_description: contract.setAsideDescription,
      place_of_performance: contract.placeOfPerformance,
      contact_info: contract.contactInfo,
      sam_url: contract.samUrl,
      status: contract.status,
      last_updated: contract.lastUpdated,
      created_at: contract.createdAt,
      updated_at: contract.updatedAt
    };
  }

  private savedSearchRowToSavedSearch(row: SavedSearchRow): SavedSearch {
    return {
      id: row.id,
      name: row.name,
      keywords: row.keywords,
      naicsCodes: row.naics_codes ? JSON.parse(row.naics_codes) : undefined,
      agencies: row.agencies ? JSON.parse(row.agencies) : undefined,
      minPostedDate: row.min_posted_date,
      maxPostedDate: row.max_posted_date,
      minDueDate: row.min_due_date,
      maxDueDate: row.max_due_date,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Contract CRUD operations
  async createContract(contract: Omit<Contract, 'createdAt' | 'updatedAt'>): Promise<Contract> {
    const now = new Date().toISOString();
    const contractWithDates: Contract = {
      ...contract,
      createdAt: now,
      updatedAt: now
    };

    const row = this.contractToContractRow(contractWithDates);
    
    const stmt = this.db.prepare(`
      INSERT INTO contracts (
        id, solicitation_number, title, description, agency, office,
        naics_code, naics_description, posted_date, response_due_date,
        archive_date, contract_award_date, award_amount, set_aside_code,
        set_aside_description, place_of_performance, contact_info, sam_url,
        status, last_updated, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        row.id, row.solicitation_number, row.title, row.description,
        row.agency, row.office, row.naics_code, row.naics_description,
        row.posted_date, row.response_due_date, row.archive_date,
        row.contract_award_date, row.award_amount, row.set_aside_code,
        row.set_aside_description, row.place_of_performance, row.contact_info,
        row.sam_url, row.status, row.last_updated, row.created_at, row.updated_at
      );
      return contractWithDates;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  async getContractById(id: string): Promise<Contract | null> {
    const stmt = this.db.prepare('SELECT * FROM contracts WHERE id = ?');
    const row = stmt.get(id) as ContractRow | undefined;
    return row ? this.contractRowToContract(row) : null;
  }

  async getContractBySolicitation(solicitationNumber: string): Promise<Contract | null> {
    const stmt = this.db.prepare('SELECT * FROM contracts WHERE solicitation_number = ?');
    const row = stmt.get(solicitationNumber) as ContractRow | undefined;
    return row ? this.contractRowToContract(row) : null;
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | null> {
    const existing = await this.getContractById(id);
    if (!existing) return null;

    const updatedContract = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const row = this.contractToContractRow(updatedContract);
    
    const stmt = this.db.prepare(`
      UPDATE contracts SET
        title = ?, description = ?, agency = ?, office = ?,
        naics_code = ?, naics_description = ?, posted_date = ?,
        response_due_date = ?, archive_date = ?, contract_award_date = ?,
        award_amount = ?, set_aside_code = ?, set_aside_description = ?,
        place_of_performance = ?, contact_info = ?, sam_url = ?,
        status = ?, last_updated = ?, updated_at = ?
      WHERE id = ?
    `);

    try {
      const result = stmt.run(
        row.title, row.description, row.agency, row.office,
        row.naics_code, row.naics_description, row.posted_date,
        row.response_due_date, row.archive_date, row.contract_award_date,
        row.award_amount, row.set_aside_code, row.set_aside_description,
        row.place_of_performance, row.contact_info, row.sam_url,
        row.status, row.last_updated, row.updated_at, id
      );
      return result.changes > 0 ? updatedContract : null;
    } catch (error) {
      console.error('Error updating contract:', error);
      throw error;
    }
  }

  async deleteContract(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM contracts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Contract search and listing
  async searchContracts(filters: ContractFilters, pagination: PaginationParams): Promise<ContractSearchResult> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.keywords) {
      whereClause += ` AND (title LIKE ? OR description LIKE ?)`;
      const keyword = `%${filters.keywords}%`;
      params.push(keyword, keyword);
    }

    if (filters.naicsCodes && filters.naicsCodes.length > 0) {
      whereClause += ` AND naics_code IN (${filters.naicsCodes.map(() => '?').join(',')})`;
      params.push(...filters.naicsCodes);
    }

    if (filters.agencies && filters.agencies.length > 0) {
      whereClause += ` AND agency IN (${filters.agencies.map(() => '?').join(',')})`;
      params.push(...filters.agencies);
    }

    if (filters.status) {
      whereClause += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters.minPostedDate) {
      whereClause += ` AND posted_date >= ?`;
      params.push(filters.minPostedDate);
    }

    if (filters.maxPostedDate) {
      whereClause += ` AND posted_date <= ?`;
      params.push(filters.maxPostedDate);
    }

    // Count total results
    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM contracts ${whereClause}`);
    const totalResult = countStmt.get(...params) as { count: number };
    const total = totalResult.count;

    // Get paginated results
    const offset = (pagination.page - 1) * pagination.limit;
    const selectStmt = this.db.prepare(`
      SELECT * FROM contracts ${whereClause} 
      ORDER BY posted_date DESC, created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const rows = selectStmt.all(...params, pagination.limit, offset) as ContractRow[];
    const contracts = rows.map(row => this.contractRowToContract(row));

    return {
      contracts,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit)
    };
  }

  async searchContractsByKeywords(keywords: string, pagination: PaginationParams): Promise<ContractSearchResult> {
    const offset = (pagination.page - 1) * pagination.limit;
    
    // Use FTS for better text search
    const searchStmt = this.db.prepare(`
      SELECT c.* FROM contracts c
      JOIN contracts_fts fts ON c.id = fts.id
      WHERE contracts_fts MATCH ?
      ORDER BY rank, c.posted_date DESC
      LIMIT ? OFFSET ?
    `);

    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM contracts c
      JOIN contracts_fts fts ON c.id = fts.id
      WHERE contracts_fts MATCH ?
    `);

    const rows = searchStmt.all(keywords, pagination.limit, offset) as ContractRow[];
    const totalResult = countStmt.get(keywords) as { count: number };
    
    const contracts = rows.map(row => this.contractRowToContract(row));
    const total = totalResult.count;

    return {
      contracts,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit)
    };
  }

  async getAllContracts(): Promise<Contract[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM contracts 
      ORDER BY posted_date DESC, created_at DESC
    `);
    const rows = stmt.all() as ContractRow[];
    return rows.map(row => this.contractRowToContract(row));
  }

  async getRecentContracts(limit = 50): Promise<Contract[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM contracts 
      WHERE status = 'active'
      ORDER BY posted_date DESC, created_at DESC 
      LIMIT ?
    `);
    const rows = stmt.all(limit) as ContractRow[];
    return rows.map(row => this.contractRowToContract(row));
  }

  async getContractsByAgency(agency: string, pagination: PaginationParams): Promise<ContractSearchResult> {
    return this.searchContracts({ agencies: [agency] }, pagination);
  }

  async getContractsByNaics(naicsCode: string, pagination: PaginationParams): Promise<ContractSearchResult> {
    return this.searchContracts({ naicsCodes: [naicsCode] }, pagination);
  }

  // Batch operations
  async createMultipleContracts(contracts: Omit<Contract, 'createdAt' | 'updatedAt'>[]): Promise<Contract[]> {
    const insertMany = this.db.transaction((contractsToInsert: Contract[]) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO contracts (
          id, solicitation_number, title, description, agency, office,
          naics_code, naics_description, posted_date, response_due_date,
          archive_date, contract_award_date, award_amount, set_aside_code,
          set_aside_description, place_of_performance, contact_info, sam_url,
          status, last_updated, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const contract of contractsToInsert) {
        const row = this.contractToContractRow(contract);
        stmt.run(
          row.id, row.solicitation_number, row.title, row.description,
          row.agency, row.office, row.naics_code, row.naics_description,
          row.posted_date, row.response_due_date, row.archive_date,
          row.contract_award_date, row.award_amount, row.set_aside_code,
          row.set_aside_description, row.place_of_performance, row.contact_info,
          row.sam_url, row.status, row.last_updated, row.created_at, row.updated_at
        );
      }

      return contractsToInsert;
    });

    const now = new Date().toISOString();
    const contractsWithDates = contracts.map(contract => ({
      ...contract,
      createdAt: now,
      updatedAt: now
    }));

    return insertMany(contractsWithDates);
  }

  async updateMultipleContracts(updates: Array<{ id: string; updates: Partial<Contract> }>): Promise<Contract[]> {
    const results: Contract[] = [];
    
    for (const { id, updates: contractUpdates } of updates) {
      const updated = await this.updateContract(id, contractUpdates);
      if (updated) {
        results.push(updated);
      }
    }
    
    return results;
  }

  // Saved searches implementation (simplified for now)
  async createSavedSearch(search: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedSearch> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const savedSearch: SavedSearch = {
      ...search,
      id,
      createdAt: now,
      updatedAt: now
    };

    const stmt = this.db.prepare(`
      INSERT INTO saved_searches (
        id, name, keywords, naics_codes, agencies, min_posted_date,
        max_posted_date, min_due_date, max_due_date, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, search.name, search.keywords,
      search.naicsCodes ? JSON.stringify(search.naicsCodes) : null,
      search.agencies ? JSON.stringify(search.agencies) : null,
      search.minPostedDate, search.maxPostedDate, search.minDueDate,
      search.maxDueDate, search.isActive ? 1 : 0, now, now
    );

    return savedSearch;
  }

  // Placeholder implementations for other methods
  async getSavedSearches(): Promise<SavedSearch[]> {
    const stmt = this.db.prepare('SELECT * FROM saved_searches ORDER BY created_at DESC');
    const rows = stmt.all() as SavedSearchRow[];
    return rows.map(row => this.savedSearchRowToSavedSearch(row));
  }

  async getSavedSearchById(id: string): Promise<SavedSearch | null> {
    const stmt = this.db.prepare('SELECT * FROM saved_searches WHERE id = ?');
    const row = stmt.get(id) as SavedSearchRow | undefined;
    return row ? this.savedSearchRowToSavedSearch(row) : null;
  }

  async updateSavedSearch(id: string, updates: Partial<SavedSearch>): Promise<SavedSearch | null> {
    // Implementation similar to updateContract
    return null; // Placeholder
  }

  async deleteSavedSearch(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM saved_searches WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Placeholder implementations for other interface methods
  async createSearchAlert(alert: Omit<SearchAlert, 'id' | 'alertedAt'>): Promise<SearchAlert> {
    throw new Error('Not implemented yet');
  }

  async getAlertsBySearchId(savedSearchId: string): Promise<SearchAlert[]> {
    return [];
  }

  async markAlertAsSent(id: string): Promise<boolean> {
    return false;
  }

  async createSyncStatus(status: Omit<SyncStatus, 'id'>): Promise<SyncStatus> {
    const stmt = this.db.prepare(`
      INSERT INTO sync_status (
        sync_type, status, contracts_processed, contracts_added,
        contracts_updated, error_message, started_at, completed_at, next_sync_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      status.syncType, status.status, status.contractsProcessed,
      status.contractsAdded, status.contractsUpdated, status.errorMessage,
      status.startedAt, status.completedAt, status.nextSyncAt
    );

    return { ...status, id: result.lastInsertRowid as number };
  }

  async updateSyncStatus(id: number, updates: Partial<SyncStatus>): Promise<SyncStatus | null> {
    // Implementation similar to updateContract
    return null; // Placeholder
  }

  async getLatestSyncStatus(): Promise<SyncStatus | null> {
    const stmt = this.db.prepare('SELECT * FROM sync_status ORDER BY started_at DESC LIMIT 1');
    const row = stmt.get() as any;
    return row || null;
  }

  async getSyncHistory(limit = 10): Promise<SyncStatus[]> {
    const stmt = this.db.prepare('SELECT * FROM sync_status ORDER BY started_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows;
  }

  // Statistics
  async getContractCount(): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM contracts WHERE status = ?');
    const result = stmt.get('active') as { count: number };
    return result.count;
  }

  async getContractCountByStatus(): Promise<Record<string, number>> {
    const stmt = this.db.prepare('SELECT status, COUNT(*) as count FROM contracts GROUP BY status');
    const rows = stmt.all() as { status: string; count: number }[];
    return rows.reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {});
  }

  async getContractCountByAgency(): Promise<Record<string, number>> {
    const stmt = this.db.prepare(`
      SELECT agency, COUNT(*) as count FROM contracts 
      WHERE agency IS NOT NULL AND status = 'active'
      GROUP BY agency ORDER BY count DESC LIMIT 20
    `);
    const rows = stmt.all() as { agency: string; count: number }[];
    return rows.reduce((acc, row) => ({ ...acc, [row.agency]: row.count }), {});
  }

  async getContractCountByNaics(): Promise<Record<string, number>> {
    const stmt = this.db.prepare(`
      SELECT naics_code, COUNT(*) as count FROM contracts 
      WHERE naics_code IS NOT NULL AND status = 'active'
      GROUP BY naics_code ORDER BY count DESC LIMIT 20
    `);
    const rows = stmt.all() as { naics_code: string; count: number }[];
    return rows.reduce((acc, row) => ({ ...acc, [row.naics_code]: row.count }), {});
  }

  async cleanup(): Promise<void> {
    // Archive old contracts, clean up temp data, etc.
    const stmt = this.db.prepare(`
      UPDATE contracts SET status = 'archived' 
      WHERE archive_date < datetime('now') AND status = 'active'
    `);
    stmt.run();
  }
}