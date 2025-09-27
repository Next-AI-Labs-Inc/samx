import { ContractRepository } from './contract-repository';
import { SqliteContractRepository } from './sqlite-contract-repository';

// Repository factory to abstract database implementation
export function createContractRepository(): ContractRepository {
  // For now, always return SQLite implementation
  // In the future, we can check environment variables to decide between SQLite and MongoDB
  const dbType = process.env.DATABASE_TYPE || 'sqlite';
  
  switch (dbType.toLowerCase()) {
    case 'sqlite':
      return new SqliteContractRepository();
    case 'mongodb':
      // TODO: Implement MongoDB repository
      throw new Error('MongoDB repository not implemented yet');
    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

// Singleton pattern for repository instance
let repositoryInstance: ContractRepository | null = null;

export function getContractRepository(): ContractRepository {
  if (!repositoryInstance) {
    repositoryInstance = createContractRepository();
  }
  return repositoryInstance;
}

// Re-export types for convenience
export * from './contract-repository';
export * from '../types/contract';