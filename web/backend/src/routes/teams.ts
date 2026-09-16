import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { auth } from '../middleware.js';

export function registerTeamRoutes(app: FastifyInstance) {
  app.get('/teams', { preHandler: auth() }, async () => {
    return db.prepare('SELECT id, name FROM teams ORDER BY name').all();
  });

  app.post('/teams', { preHandler: auth('admin') }, async (request, reply) => {
    const { name } = request.body as { name?: string };
    if (!name || !name.trim()) return reply.code(400).send({ error: 'Nombre requerido' });
    const trimmed = name.trim();
    const exists = db.prepare('SELECT id FROM teams WHERE name = ?').get(trimmed);
    if (exists) return reply.code(409).send({ error: 'El equipo ya existe' });
    const r = db.prepare('INSERT INTO teams (name) VALUES (?)').run(trimmed);
    return reply.code(201).send({ id: Number(r.lastInsertRowid), name: trimmed });
  });

  app.put('/teams/:id', { preHandler: auth('admin') }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const { name } = request.body as { name?: string };
    if (!name || !name.trim()) return reply.code(400).send({ error: 'Nombre requerido' });
    const trimmed = name.trim();
    const dup = db.prepare('SELECT id FROM teams WHERE name = ? AND id <> ?').get(trimmed, id);
    if (dup) return reply.code(409).send({ error: 'El equipo ya existe' });
    const r = db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(trimmed, id);
    if (r.changes === 0) return reply.code(404).send({ error: 'Equipo no encontrado' });
    return { id, name: trimmed };
  });

  app.delete('/teams/:id', { preHandler: auth('admin') }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const r = db.prepare('DELETE FROM teams WHERE id = ?').run(id);
    if (r.changes === 0) return reply.code(404).send({ error: 'Equipo no encontrado' });
    return { ok: true };
  });
}
