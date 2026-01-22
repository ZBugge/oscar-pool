import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use DATABASE_PATH env var for Railway volume persistence, fallback to local path for dev
const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../database.db');
console.log('Database path:', dbPath);

let db: SqlJsDatabase;

async function initDb() {
  const SQL = await initSqlJs();

  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

function saveDb() {
  if (db) {
    const data = db.export();
    writeFileSync(dbPath, data);
  }
}

export let dbPromise = initDb();

export async function getDb(): Promise<SqlJsDatabase> {
  return dbPromise;
}

export async function initializeDatabase() {
  const database = await getDb();

  database.exec(`
    -- Admin accounts
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- System configuration for limits
    CREATE TABLE IF NOT EXISTS system_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      max_admins INTEGER NOT NULL DEFAULT 100,
      max_lobbies_per_admin INTEGER NOT NULL DEFAULT 10,
      max_participants_per_lobby INTEGER NOT NULL DEFAULT 50,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO system_config (id, max_admins, max_lobbies_per_admin, max_participants_per_lobby)
    VALUES (1, 100, 10, 50);

    -- Oscar categories (e.g., "Best Picture", "Best Actor")
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Nominees within categories
    CREATE TABLE IF NOT EXISTS nominees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      is_winner BOOLEAN DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      UNIQUE(category_id, name)
    );

    -- Lobbies with invite codes
    CREATE TABLE IF NOT EXISTS lobbies (
      id TEXT PRIMARY KEY,
      admin_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      locked_at DATETIME,
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    );

    -- Participants (anonymous users who join lobbies)
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lobby_id TEXT NOT NULL,
      name TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lobby_id) REFERENCES lobbies(id),
      UNIQUE(lobby_id, name)
    );

    -- Predictions (one per participant per category)
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      nominee_id INTEGER NOT NULL,
      FOREIGN KEY (participant_id) REFERENCES participants(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (nominee_id) REFERENCES nominees(id),
      UNIQUE(participant_id, category_id)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_nominees_category ON nominees(category_id);
    CREATE INDEX IF NOT EXISTS idx_lobbies_admin ON lobbies(admin_id);
    CREATE INDEX IF NOT EXISTS idx_participants_lobby ON participants(lobby_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_participant ON predictions(participant_id);
  `);

  saveDb();
}

export async function runQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const database = await getDb();
  const stmt = database.prepare(query);
  stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  saveDb();

  return results;
}

export async function runExec(query: string, params: any[] = []): Promise<void> {
  const database = await getDb();
  const stmt = database.prepare(query);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDb();
}

export async function runInsert(query: string, params: any[] = []): Promise<number> {
  const database = await getDb();
  const stmt = database.prepare(query);
  stmt.bind(params);
  stmt.step();
  stmt.free();

  const result = await runQuery<{ last_insert_rowid: number }>('SELECT last_insert_rowid() as last_insert_rowid');
  saveDb();

  return result[0].last_insert_rowid;
}

// TypeScript Interfaces

export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface SystemConfig {
  id: number;
  max_admins: number;
  max_lobbies_per_admin: number;
  max_participants_per_lobby: number;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  display_order: number;
  created_at: string;
}

export interface Nominee {
  id: number;
  category_id: number;
  name: string;
  is_winner: number; // SQLite boolean (0/1)
}

export interface Lobby {
  id: string;
  admin_id: number;
  name: string;
  status: 'open' | 'locked' | 'completed';
  created_at: string;
  locked_at: string | null;
}

export interface Participant {
  id: number;
  lobby_id: string;
  name: string;
  submitted_at: string;
}

export interface Prediction {
  id: number;
  participant_id: number;
  category_id: number;
  nominee_id: number;
}
