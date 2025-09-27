-- Contracts table for storing SAM.gov contract opportunities
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  solicitation_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  agency TEXT,
  office TEXT,
  naics_code TEXT,
  naics_description TEXT,
  posted_date TEXT,
  response_due_date TEXT,
  archive_date TEXT,
  contract_award_date TEXT,
  award_amount TEXT,
  set_aside_code TEXT,
  set_aside_description TEXT,
  place_of_performance TEXT,
  contact_info TEXT,
  sam_url TEXT,
  status TEXT DEFAULT 'active',
  last_updated TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Saved searches table for user search preferences
CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  keywords TEXT,
  naics_codes TEXT, -- JSON array of NAICS codes
  agencies TEXT, -- JSON array of agencies
  min_posted_date TEXT,
  max_posted_date TEXT,
  min_due_date TEXT,
  max_due_date TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Search alerts table for tracking notifications
CREATE TABLE IF NOT EXISTS search_alerts (
  id TEXT PRIMARY KEY,
  saved_search_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  alerted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (saved_search_id) REFERENCES saved_searches(id) ON DELETE CASCADE,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- Sync status table for tracking API sync operations
CREATE TABLE IF NOT EXISTS sync_status (
  id INTEGER PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'full' or 'incremental'
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  contracts_processed INTEGER DEFAULT 0,
  contracts_added INTEGER DEFAULT 0,
  contracts_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  next_sync_at TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contracts_solicitation ON contracts(solicitation_number);
CREATE INDEX IF NOT EXISTS idx_contracts_naics ON contracts(naics_code);
CREATE INDEX IF NOT EXISTS idx_contracts_agency ON contracts(agency);
CREATE INDEX IF NOT EXISTS idx_contracts_posted_date ON contracts(posted_date);
CREATE INDEX IF NOT EXISTS idx_contracts_due_date ON contracts(response_due_date);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_last_updated ON contracts(last_updated);

-- Full-text search support for contract titles and descriptions
CREATE VIRTUAL TABLE IF NOT EXISTS contracts_fts USING fts5(
  id UNINDEXED,
  title,
  description,
  content=contracts,
  content_rowid=rowid
);

-- Users table for authentication (cloud-ready structure)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  email_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table for OAuth providers (cloud-ready)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_account_id)
);

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  expires TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User settings table for storing API keys and configuration (linked to users)
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  api_key TEXT,
  setup_completed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feedback table for storing user feedback
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  feedback_text TEXT NOT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT
);

-- Triggers to keep FTS table in sync
CREATE TRIGGER IF NOT EXISTS contracts_fts_insert AFTER INSERT ON contracts BEGIN
  INSERT INTO contracts_fts(rowid, id, title, description)
  VALUES (NEW.rowid, NEW.id, NEW.title, NEW.description);
END;

CREATE TRIGGER IF NOT EXISTS contracts_fts_update AFTER UPDATE ON contracts BEGIN
  UPDATE contracts_fts SET title = NEW.title, description = NEW.description
  WHERE rowid = NEW.rowid;
END;

CREATE TRIGGER IF NOT EXISTS contracts_fts_delete AFTER DELETE ON contracts BEGIN
  DELETE FROM contracts_fts WHERE rowid = OLD.rowid;
END;
