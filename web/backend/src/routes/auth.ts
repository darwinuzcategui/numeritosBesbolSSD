import type { FastifyInstance } from 'fastify';
import { authenticate, createSession, deleteSession } from '../auth.js';
import { auth, type AuthedRequest } from '../middleware.js';

export function registerAuthRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };
    if (!username || !password) {
      return reply.code(400).send({ error: 'Usuario y contraseña requeridos' });
    }
    const user = authenticate(username, password);
    if (!user) {
      return reply.code(401).send({ error: 'Credenciales incorrectas' });
    }
    const token = createSession(user.id);
    reply.setCookie('session', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });
    return { id: user.id, username: user.username, role: user.role };
  });

  app.post('/auth/logout', { preHandler: auth() }, async (request, reply) => {
    const token = (request.cookies as Record<string, string> | undefined)?.session;
    deleteSession(token || '');
    reply.clearCookie('session', { path: '/' });
    return { ok: true };
  });

  app.get('/auth/me', { preHandler: auth() }, async (request) => {
    return (request as AuthedRequest).user;
  });
}
