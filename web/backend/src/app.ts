import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { registerAuthRoutes } from './routes/auth.js';
import { registerTeamRoutes } from './routes/teams.js';
import { registerPlayerRoutes } from './routes/players.js';
import { registerGameRoutes } from './routes/games.js';
import { registerSettingsRoutes } from './routes/settings.js';
import { registerUserRoutes } from './routes/users.js';
import { registerLeagueRoutes } from './routes/league.js';

export function buildApp() {
  const app = Fastify({ logger: false });

  app.register(cors, { origin: true, credentials: true });
  app.register(cookie);

  app.register(registerAuthRoutes);
  app.register(registerTeamRoutes);
  app.register(registerPlayerRoutes);
  app.register(registerGameRoutes);
  app.register(registerSettingsRoutes);
  app.register(registerUserRoutes);
  app.register(registerLeagueRoutes);

  return app;
}
