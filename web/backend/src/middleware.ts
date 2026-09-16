import type { FastifyReply, FastifyRequest } from 'fastify';
import { getUserBySession } from './auth.js';

export interface AuthedRequest extends FastifyRequest {
  user: { id: number; username: string; role: 'admin' | 'capturador' };
}

export function auth(role?: 'admin') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = (request.cookies as Record<string, string> | undefined)?.session;
    const user = getUserBySession(token || '');
    if (!user) {
      return reply.code(401).send({ error: 'No autenticado' });
    }
    if (role && user.role !== role) {
      return reply.code(403).send({ error: 'Sin permisos' });
    }
    (request as AuthedRequest).user = user;
  };
}
