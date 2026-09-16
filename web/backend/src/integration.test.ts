import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';

process.env.DB_PATH = ':memory:';
const { buildApp } = await import('./app.js');

let app: FastifyInstance;

before(async () => {
  app = buildApp();
  await app.ready();
});

async function login(role: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { username: role, password: role },
  });
  assert.equal(res.statusCode, 200);
  const cookie = res.headers['set-cookie'] as string;
  return { cookie };
}

// usuarios de prueba (admin por defecto ya existe en db.ts)
async function seedUser(username: string, role: string) {
  const admin = await login('admin');
  const res = await app.inject({
    method: 'POST',
    url: '/users',
    headers: { cookie: admin.cookie },
    payload: { username, password: username, role },
  });
  assert.equal(res.statusCode, 201);
}

test('login admin por defecto funciona', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { username: 'admin', password: 'admin' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().role, 'admin');
});

test('login con credenciales incorrectas falla', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { username: 'admin', password: 'mal' },
  });
  assert.equal(res.statusCode, 401);
});

test('CRUD de equipos (admin)', async () => {
  const { cookie } = await login('admin');
  const create = await app.inject({
    method: 'POST', url: '/teams', headers: { cookie },
    payload: { name: 'Equipo A' },
  });
  assert.equal(create.statusCode, 201);
  const id = create.json().id;

  const list = await app.inject({ method: 'GET', url: '/teams', headers: { cookie } });
  assert.equal(list.statusCode, 200);
  assert.ok(list.json().some((t: any) => t.name === 'Equipo A'));

  const del = await app.inject({ method: 'DELETE', url: `/teams/${id}`, headers: { cookie } });
  assert.equal(del.statusCode, 200);
});

test('capturador no puede crear equipos (403)', async () => {
  await seedUser('capturador', 'capturador');
  const { cookie } = await login('capturador');
  const res = await app.inject({
    method: 'POST', url: '/teams', headers: { cookie }, payload: { name: 'X' },
  });
  assert.equal(res.statusCode, 403);
});

test('estadísticas: AV y SLG (caso Fase 1)', async () => {
  const { cookie } = await login('admin');
  const team = await app.inject({ method: 'POST', url: '/teams', headers: { cookie }, payload: { name: 'Equipo 1' } });
  const teamId = team.json().id;
  const player = await app.inject({
    method: 'POST', url: `/teams/${teamId}/players`, headers: { cookie },
    payload: { name: 'JESUS HERNANDEZ', number: 5 },
  });
  const playerId = player.json().id;

  // VB=51, H=16, HR=1 repartidos en 2 juegos
  await app.inject({
    method: 'PUT', url: `/players/${playerId}/games/1`, headers: { cookie },
    payload: { offense: { at_bats: 25, hits: 8, home_runs: 1 } },
  });
  await app.inject({
    method: 'PUT', url: `/players/${playerId}/games/2`, headers: { cookie },
    payload: { offense: { at_bats: 26, hits: 8 } },
  });

  const season = await app.inject({ method: 'GET', url: `/teams/${teamId}/season`, headers: { cookie } });
  const p = season.json().players[0];
  assert.equal(p.offense.at_bats, 51);
  assert.equal(p.offense.hits, 16);
  assert.equal(p.offense.av, 0.314);
  assert.equal(p.offense.slg, 0.373);
});

test('estadísticas: PCL/ERA (caso Fase 1)', async () => {
  const { cookie } = await login('admin');
  const team = await app.inject({ method: 'POST', url: '/teams', headers: { cookie }, payload: { name: 'Equipo P' } });
  const teamId = team.json().id;
  const player = await app.inject({
    method: 'POST', url: `/teams/${teamId}/players`, headers: { cookie },
    payload: { name: 'LANZADOR', number: 1 },
  });
  const playerId = player.json().id;

  // 6 juegos de 3.0 IP con CL total 7 -> 18 IP, 54 outs -> ERA 3.5
  const cl = [0, 1, 2, 3, 0, 1];
  for (let g = 1; g <= 6; g++) {
    await app.inject({
      method: 'PUT', url: `/players/${playerId}/games/${g}`, headers: { cookie },
      payload: { pitching: { pitched: 1, result: 'G', innings: 3.0, earned_runs: cl[g - 1] } },
    });
  }
  const season = await app.inject({ method: 'GET', url: `/teams/${teamId}/season`, headers: { cookie } });
  const p = season.json().players[0];
  assert.equal(p.pitching.jj, 6);
  assert.equal(p.pitching.innings, 18.0);
  assert.equal(p.pitching.pcl_era, 3.5);
});

test('número de juegos configurable (settings)', async () => {
  const { cookie } = await login('admin');
  const upd = await app.inject({
    method: 'PUT', url: '/settings', headers: { cookie }, payload: { games_count: 20 },
  });
  assert.equal(upd.statusCode, 200);
  const get = await app.inject({ method: 'GET', url: '/settings', headers: { cookie } });
  assert.equal(get.json().games_count, 20);
});
