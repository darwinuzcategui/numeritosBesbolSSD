import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { auth } from '../middleware.js';

export function registerPlayerRoutes(app: FastifyInstance) {
  app.get('/teams/:id/players', { preHandler: auth() }, async (request, reply) => {
    const teamId = Number((request.params as any).id);
    const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(teamId);
    if (!team) return reply.code(404).send({ error: 'Equipo no encontrado' });
    return db
      .prepare('SELECT id, team_id, name, number FROM players WHERE team_id = ? ORDER BY number IS NULL, number, name')
      .all(teamId);
  });

  app.post('/teams/:id/players', { preHandler: auth('admin') }, async (request, reply) => {
    const teamId = Number((request.params as any).id);
    const { name, number } = request.body as { name?: string; number?: number };
    if (!name || !name.trim()) return reply.code(400).send({ error: 'Nombre requerido' });
    const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(teamId);
    if (!team) return reply.code(404).send({ error: 'Equipo no encontrado' });
    const r = db
      .prepare('INSERT INTO players (team_id, name, number) VALUES (?, ?, ?)')
      .run(teamId, name.trim(), number ?? null);
    return reply.code(201).send({ id: Number(r.lastInsertRowid), team_id: teamId, name: name.trim(), number: number ?? null });
  });

  app.put('/players/:id', { preHandler: auth('admin') }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const { name, number } = request.body as { name?: string; number?: number };
    if (!name || !name.trim()) return reply.code(400).send({ error: 'Nombre requerido' });
    const r = db
      .prepare('UPDATE players SET name = ?, number = ? WHERE id = ?')
      .run(name.trim(), number ?? null, id);
    if (r.changes === 0) return reply.code(404).send({ error: 'Jugador no encontrado' });
    return { id, name: name.trim(), number: number ?? null };
  });

  app.delete('/players/:id', { preHandler: auth('admin') }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const r = db.prepare('DELETE FROM players WHERE id = ?').run(id);
    if (r.changes === 0) return reply.code(404).send({ error: 'Jugador no encontrado' });
    return { ok: true };
  });
}
