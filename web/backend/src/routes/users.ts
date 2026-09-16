import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { auth } from '../middleware.js';
import { hashPassword } from '../password.js';

export function registerUserRoutes(app: FastifyInstance) {
  app.get('/users', { preHandler: auth('admin') }, async () => {
    return db.prepare('SELECT id, username, role FROM users ORDER BY username').all();
  });

  app.post('/users', { preHandler: auth('admin') }, async (request, reply) => {
    const { username, password, role } = request.body as { username?: string; password?: string; role?: string };
    if (!username || !password) return reply.code(400).send({ error: 'Usuario y contraseña requeridos' });
    if (role !== 'admin' && role !== 'capturador') return reply.code(400).send({ error: 'Rol inválido' });
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists) return reply.code(409).send({ error: 'El usuario ya existe' });
    const r = db
      .prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run(username, hashPassword(password), role);
    return reply.code(201).send({ id: Number(r.lastInsertRowid), username, role });
  });

  app.put('/users/:id', { preHandler: auth('admin') }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const { username, password, role } = request.body as { username?: string; password?: string; role?: string };
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existing) return reply.code(404).send({ error: 'Usuario no encontrado' });
    if (username) {
      const dup = db.prepare('SELECT id FROM users WHERE username = ? AND id <> ?').get(username, id);
      if (dup) return reply.code(409).send({ error: 'El usuario ya existe' });
      db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, id);
    }
    if (role === 'admin' || role === 'capturador') {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    }
    if (password) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), id);
    }
    return db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(id);
  });

  app.delete('/users/:id', { preHandler: auth('admin') }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const r = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (r.changes === 0) return reply.code(404).send({ error: 'Usuario no encontrado' });
    return { ok: true };
  });
}
