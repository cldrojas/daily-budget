-- Migration: create tables for daily-budget compatible with Cloudflare D1 (SQLite)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  start_amount REAL NOT NULL,
  start_date TEXT,
  end_date TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  icon TEXT,
  parent_id TEXT,
  FOREIGN KEY(parent_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  account TEXT NOT NULL,
  FOREIGN KEY(account) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Optional single-row settings table for other fields
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
