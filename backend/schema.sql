-- Users Table (Modified to include profile_picture_url)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_picture_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Favorite Items Table (Replaces favorites)
CREATE TABLE IF NOT EXISTS favorite_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    media_id INTEGER NOT NULL,
    media_type TEXT,
    media_data TEXT, -- JSONB equivalent
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Progress Records Table (Replaces watch_progress)
CREATE TABLE IF NOT EXISTS progress_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    media_id INTEGER NOT NULL,
    media_type TEXT,
    progress_data TEXT, -- JSONB equivalent
    media_data TEXT, -- JSONB equivalent
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Watchlist Items Table (Replaces watchlist)
CREATE TABLE IF NOT EXISTS watchlist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    media_id INTEGER NOT NULL,
    media_type TEXT,
    media_data TEXT, -- JSONB equivalent
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorite_items(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress_records(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist_items(user_id);
