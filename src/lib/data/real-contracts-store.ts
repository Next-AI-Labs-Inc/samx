import { Contract } from '../types/contract';

// In-memory store for real contracts fetched from SAM.gov
// Later we'll replace this with a proper database
class RealContractsStore {
  private contracts: Contract[] = [];
  private lastSyncTime: Date | null = null;

  setContracts(contracts: Contract[]) {
    this.contracts = contracts;
    this.lastSyncTime = new Date();
    console.log(`📦 Stored ${contracts.length} real contracts from SAM.gov`);
  }

  getContracts(): Contract[] {
    return this.contracts;
  }

  hasRealData(): boolean {
    return this.contracts.length > 0;
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  setLastSyncTime(time: Date) {
    this.lastSyncTime = time;
  }

  clear() {
    this.contracts = [];
    this.lastSyncTime = null;
  }
}

// Export a singleton instance
export const realContractsStore = new RealContractsStore();