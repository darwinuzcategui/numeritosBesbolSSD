import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { auth } from '../middleware.js';

const TEXT_FIELDS = ['division', 'league', 'championship', 'season', 'category'] as const;

export function registerSettingsRoutes(app: FastifyInstance) {
  app.get('/settings', async () => {
    return db.prepare('SELECT * FROM settings WHERE id = 1').get();
  });

  app.put('/settings', { preHandler: auth('admin') }, async (request, reply) => {
    const body = request.body as {
      games_count?: number;
      division?: string;
      league?: string;
      championship?: string;
      season?: string;
      category?: string;
    };

    if (body.games_count !== undefined) {
      if (!Number.isInteger(body.games_count) || body.games_count < 1) {
        return reply.code(400).send({ error: 'games_count debe ser un entero mayor o igual a 1' });
      }
      db.prepare('UPDATE settings SET games_count = ? WHERE id = 1').run(body.games_count);
    }

    for (const field of TEXT_FIELDS) {
      const value = body[field];
      if (typeof value === 'string') {
        db.prepare(`UPDATE settings SET ${field} = ? WHERE id = 1`).run(value.trim());
      }
    }

    return db.prepare('SELECT * FROM settings WHERE id = 1').get();
  });
}
