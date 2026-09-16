import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './password.js';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'capturador';
}

const path = process.env.DB_PATH || 'numeritos.db';

export const db = new DatabaseSync(path);

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','capturador'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    number INTEGER
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    games_count INTEGER NOT NULL DEFAULT 15,
    division TEXT NOT NULL DEFAULT 'CORPORACION CRIOLLITOS DE VENEZUELA',
    league TEXT NOT NULL DEFAULT 'LIGA DE BEISBOL MENOR JUAN GUILLERMO GUZMAN',
    championship TEXT NOT NULL DEFAULT 'REGULAR',
    season TEXT NOT NULL DEFAULT 'TEMPORADA 2026',
    category TEXT NOT NULL DEFAULT 'INFANTIL'
  );

  CREATE TABLE IF NOT EXISTS offense_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    game_number INTEGER NOT NULL,
    at_bats INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    doubles INTEGER DEFAULT 0,
    triples INTEGER DEFAULT 0,
    home_runs INTEGER DEFAULT 0,
    rbi INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    walks INTEGER DEFAULT 0,
    stolen_bases INTEGER DEFAULT 0,
    hit_by_pitch INTEGER DEFAULT 0,
    sacrifice_hits INTEGER DEFAULT 0,
    sacrifice_flies INTEGER DEFAULT 0,
    interference INTEGER DEFAULT 0,
    UNIQUE (player_id, game_number)
  );

  CREATE TABLE IF NOT EXISTS pitching_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    game_number INTEGER NOT NULL,
    pitched INTEGER DEFAULT 0,
    result TEXT,
    innings REAL DEFAULT 0,
    earned_runs INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    hits_allowed INTEGER DEFAULT 0,
    UNIQUE (player_id, game_number)
  );
`);

// Ajustes por defecto
db.prepare('INSERT OR IGNORE INTO settings (id, games_count) VALUES (1, 15)').run();

// Migración: añadir columnas de información de liga si no existen (para BD existentes)
function ensureColumn(ddl: string) {
  const name = ddl.trim().split(/\s+/)[0];
  const cols = db.prepare('PRAGMA table_info(settings)').all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === name)) {
    db.exec(`ALTER TABLE settings ADD COLUMN ${ddl}`);
  }
}
ensureColumn("division TEXT NOT NULL DEFAULT 'CORPORACION CRIOLLITOS DE VENEZUELA'");
ensureColumn("league TEXT NOT NULL DEFAULT 'LIGA DE BEISBOL MENOR JUAN GUILLERMO GUZMAN'");
ensureColumn("championship TEXT NOT NULL DEFAULT 'REGULAR'");
ensureColumn("season TEXT NOT NULL DEFAULT 'TEMPORADA 2026'");
ensureColumn("category TEXT NOT NULL DEFAULT 'INFANTIL'");

// Usuario administrador por defecto (cambiar la contraseña tras el primer acceso)
const hasAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!hasAdmin) {
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .run('admin', hashPassword('admin'), 'admin');
}
