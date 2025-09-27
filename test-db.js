const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Create data directory
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const dbPath = path.join(dataDir, 'contracts.db');
console.log('Creating database at:', dbPath);

const db = new Database(dbPath);

// Configure SQLite
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000000');
db.pragma('foreign_keys = ON');
db.pragma('temp_store = MEMORY');

// Read schema
const schemaPath = path.join(process.cwd(), 'src/lib/db/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

console.log('Schema loaded, length:', schema.length);

// Execute the entire schema as one block
try {
  console.log('Executing entire schema...');
  db.exec(schema);
  console.log('✅ Schema executed successfully');
} catch (error) {
  console.error('❌ Schema execution failed:', error.message);
}

// Test the database
try {
  const result = db.prepare('SELECT name FROM sqlite_master WHERE type=?').all('table');
  console.log('Tables created:', result.map(r => r.name));
  
  const contractCount = db.prepare('SELECT COUNT(*) as count FROM contracts').get();
  console.log('Contract count:', contractCount.count);
} catch (error) {
  console.error('Database test failed:', error.message);
}

db.close();
console.log('Database initialized successfully!');