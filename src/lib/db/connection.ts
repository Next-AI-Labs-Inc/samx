import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { mkdirSync } from 'fs';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Get database path from environment or use default
  const dbPath = process.env.DATABASE_URL || './data/contracts.db';
  
  // Ensure data directory exists
  const dataDir = join(process.cwd(), 'data');
  try {
    mkdirSync(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
    console.log('Data directory exists or created');
  }

  // Initialize SQLite database
  const fullDbPath = dbPath.startsWith('./') ? join(process.cwd(), dbPath) : dbPath;
  
  try {
    db = new Database(fullDbPath);
    
    // Configure SQLite for better performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 1000000');
    db.pragma('foreign_keys = ON');
    db.pragma('temp_store = MEMORY');
    
    console.log(`Database connected: ${fullDbPath}`);
    
    // Initialize schema
    initializeSchema(db);
    
    return db;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

export function initializeSchema(database: Database.Database): void {
  try {
    // Read and execute schema SQL
    const schemaPath = join(process.cwd(), 'src/lib/db/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute the entire schema as one block (SQLite handles this fine)
    try {
      console.log('Executing database schema...');
      database.exec(schema);
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Schema execution failed:', error);
      throw error;
    }
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

// Graceful shutdown
process.on('exit', closeDatabase);
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});
process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});