-- TaskFlow Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Categories table (Scoped to user)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4f46e5',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

-- Tags table (Scoped to user)
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

-- Todos table (Scoped to user)
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed')),
  priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high')),
  due_date TEXT, -- Stored as ISO YYYY-MM-DD
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Todo-Tags relationship (Many-to-Many)
CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (todo_id, tag_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance & Security Indexes
CREATE INDEX IF NOT EXISTS idx_todos_user_status ON todos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_todos_user_due_date ON todos(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_todos_user_priority ON todos(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_todos_user_category ON todos(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id, used);
