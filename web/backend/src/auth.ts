import { randomBytes } from 'node:crypto';
import { db, type User } from './db.js';
import { verifyPassword } from './password.js';

export function authenticate(username: string, password: string): User | null {
  const row = db
    .prepare('SELECT id, username, role, password_hash FROM users WHERE username = ?')
    .get(username) as any;
  if (!row) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return { id: Number(row.id), username: row.username, role: row.role };
}

export function createSession(userId: number): string {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return token;
}

export function getUserBySession(token: string): User | null {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.role FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString()) as any;
  if (!row) return null;
  return { id: Number(row.id), username: row.username, role: row.role };
}

export function deleteSession(token: string): void {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}
