import { SamApiService } from './sam-api';
import { Contract, SyncStatus } from '../types/contract';
import { realContractsStore } from '../data/real-contracts-store';

interface SyncResult {
  syncId: string;
  syncType: 'initial' | 'incremental';
  status: 'completed' | 'failed';
  contractsProcessed: number;
  contractsAdded: number;
  contractsUpdated: number;
  contractsSkipped: number;
  duplicatesFound: number;
  errors: string[];
  startedAt: Date;
  completedAt?: Date;
  nextSyncRecommended: Date;
}

export class SyncService {
  private samApi: SamApiService;
  private syncInProgress: boolean = false;

  constructor() {
    this.samApi = new SamApiService();
  }

  /**
   * Perform defensive incremental sync
   * Only downloads new/updated contracts, handles duplicates intelligently
   */
  async performIncrementalSync(options: {
    forceFullSync?: boolean;
    maxRecordsPerCall?: number;
    onProgress?: (progress: { processed: number; total: number; message: string }) => void;
    onThrottled?: (retryAfterMs: number, nextAccessTime?: string) => void;
    onRetrying?: () => void;
  } = {}): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    const syncId = `sync_${Date.now()}`;
    const startedAt = new Date();
    const maxRecords = options.maxRecordsPerCall || 1000; // Optimize for single API call

    const result: SyncResult = {
      syncId,
      syncType: 'initial',
      status: 'failed',
      contractsProcessed: 0,
      contractsAdded: 0,
      contractsUpdated: 0,
      contractsSkipped: 0,
      duplicatesFound: 0,
      errors: [],
      startedAt,
      nextSyncRecommended: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours default
    };

    try {
      // Get existing contracts to determine sync strategy
      const existingContracts = realContractsStore.getContracts();
      const lastSyncTime = realContractsStore.getLastSyncTime();
      
      // Determine sync type
      const isInitialSync = !lastSyncTime || options.forceFullSync;
      result.syncType = isInitialSync ? 'initial' : 'incremental';

      console.log(`🚀 Starting ${result.syncType} sync (ID: ${syncId})`);
      console.log(`📊 Current database: ${existingContracts.length} contracts`);
      
      if (options.onProgress) {
        options.onProgress({ 
          processed: 0, 
          total: 0, 
          message: `Starting ${result.syncType} sync...` 
        });
      }

      // Fetch data from SAM.gov using optimized incremental approach
      const samResponse = await this.samApi.searchOpportunitiesWithRetry({
        ...await this.getIncrementalSyncParams(lastSyncTime, maxRecords),
        onThrottled: options.onThrottled,
        onRetrying: options.onRetrying
      });

      if (!samResponse.opportunitiesData || samResponse.opportunitiesData.length === 0) {
        console.log('✅ No new opportunities found');
        result.status = 'completed';
        result.completedAt = new Date();
        return result;
      }

      const opportunities = samResponse.opportunitiesData;
      result.contractsProcessed = opportunities.length;

      console.log(`📋 Processing ${opportunities.length} opportunities from SAM.gov`);

      // Create lookup map of existing contracts for efficient duplicate detection
      const existingContractsMap = new Map<string, Contract>();
      existingContracts.forEach(contract => {
        existingContractsMap.set(contract.id, contract);
        existingContractsMap.set(contract.solicitationNumber, contract);
      });

      const newContracts: Contract[] = [];
      const updatedContracts: Contract[] = [];

      // Process each opportunity defensively
      for (let i = 0; i < opportunities.length; i++) {
        const opportunity = opportunities[i];
        
        if (options.onProgress) {
          options.onProgress({
            processed: i + 1,
            total: opportunities.length,
            message: `Processing: ${opportunity.title || 'Untitled'}`
          });
        }

        try {
          // Transform SAM.gov data to our contract format
          const contract = this.samApi.transformOpportunityToContract(opportunity);
          
          // Check for duplicates using multiple identifiers
          const existingById = existingContractsMap.get(contract.id);
          const existingBySolicitation = existingContractsMap.get(contract.solicitationNumber);
          const existingContract = existingById || existingBySolicitation;

          if (existingContract) {
            // Contract exists - check if it needs updating
            const needsUpdate = this.shouldUpdateContract(existingContract, contract);
            
            if (needsUpdate) {
              // Update with new data but keep original creation timestamp
              contract.createdAt = existingContract.createdAt;
              contract.updatedAt = new Date().toISOString();
              updatedContracts.push(contract);
              result.contractsUpdated++;
              console.log(`🔄 Updated: ${contract.solicitationNumber}`);
            } else {
              result.contractsSkipped++;
              console.log(`⏭️  Skipped (no changes): ${contract.solicitationNumber}`);
            }
            
            result.duplicatesFound++;
          } else {
            // New contract
            newContracts.push(contract);
            result.contractsAdded++;
            console.log(`✨ New: ${contract.solicitationNumber}`);
          }
        } catch (error: any) {
          console.error(`❌ Error processing opportunity ${opportunity.noticeId}:`, error.message);
          result.errors.push(`Opportunity ${opportunity.noticeId}: ${error.message}`);
        }
      }

      // Store results efficiently
      if (newContracts.length > 0 || updatedContracts.length > 0) {
        const allContracts = [...newContracts, ...updatedContracts, ...existingContracts.filter(existing => 
          !newContracts.some(n => n.id === existing.id || n.solicitationNumber === existing.solicitationNumber) &&
          !updatedContracts.some(u => u.id === existing.id || u.solicitationNumber === existing.solicitationNumber)
        )];

        realContractsStore.setContracts(allContracts);
        console.log(`💾 Stored ${allContracts.length} total contracts`);
      }

      result.status = 'completed';
      result.completedAt = new Date();

      // Calculate next recommended sync time based on activity
      const activityLevel = (result.contractsAdded + result.contractsUpdated) / Math.max(result.contractsProcessed, 1);
      const nextSyncHours = activityLevel > 0.1 ? 2 : activityLevel > 0.05 ? 4 : 8; // Adaptive scheduling
      result.nextSyncRecommended = new Date(Date.now() + nextSyncHours * 60 * 60 * 1000);

      console.log(`✅ Sync completed successfully:`);
      console.log(`  📊 Processed: ${result.contractsProcessed}`);
      console.log(`  ✨ Added: ${result.contractsAdded}`);
      console.log(`  🔄 Updated: ${result.contractsUpdated}`);
      console.log(`  ⏭️  Skipped: ${result.contractsSkipped}`);
      console.log(`  🔍 Duplicates found: ${result.duplicatesFound}`);
      console.log(`  ⏰ Next sync recommended: ${result.nextSyncRecommended.toLocaleString()}`);

      return result;

    } catch (error: any) {
      console.error('❌ Sync failed:', error);
      result.errors.push(error.message || 'Unknown error');
      result.completedAt = new Date();
      result.status = 'failed';
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get optimized parameters for incremental sync
   */
  private async getIncrementalSyncParams(lastSyncTime: Date | null, maxRecords: number) {
    if (!lastSyncTime) {
      // Initial sync: get last 30 days
      return {
        limit: maxRecords,
        // Will use default date range from getOpportunitiesIncremental
      };
    }

    // Incremental sync: optimize date range based on last sync
    const hoursSinceLastSync = (Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60);
    
    return {
      limit: maxRecords,
      postedFrom: new Date(lastSyncTime.getTime() - 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit', 
        year: 'numeric'
      }) // 24-hour buffer for safety
    };
  }

  /**
   * Determine if an existing contract needs updating
   */
  private shouldUpdateContract(existing: Contract, incoming: Contract): boolean {
    // Compare key fields that might change
    const fieldsToCheck = [
      'title', 'description', 'responseDueDate', 'archiveDate',
      'contractAwardDate', 'awardAmount', 'status', 'contactInfo'
    ] as const;

    return fieldsToCheck.some(field => {
      const existingValue = existing[field];
      const incomingValue = incoming[field];
      return existingValue !== incomingValue;
    });
  }

  /**
   * Check if sync is currently in progress
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Get sync recommendations based on current state
   */
  getSyncRecommendations(): {
    shouldSync: boolean;
    reason: string;
    recommendedAction: string;
  } {
    const lastSyncTime = realContractsStore.getLastSyncTime();
    const contractCount = realContractsStore.getContracts().length;

    if (!lastSyncTime) {
      return {
        shouldSync: true,
        reason: 'No previous sync found',
        recommendedAction: 'Perform initial sync to populate database'
      };
    }

    const hoursSinceLastSync = (Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastSync > 8) {
      return {
        shouldSync: true,
        reason: `Last sync was ${Math.round(hoursSinceLastSync)} hours ago`,
        recommendedAction: 'Perform incremental sync to get latest opportunities'
      };
    }

    if (contractCount === 0) {
      return {
        shouldSync: true,
        reason: 'No contracts in database',
        recommendedAction: 'Perform full sync to populate database'
      };
    }

    return {
      shouldSync: false,
      reason: `Recent sync (${Math.round(hoursSinceLastSync)} hours ago)`,
      recommendedAction: `Next sync recommended in ${Math.round(8 - hoursSinceLastSync)} hours`
    };
  }
}