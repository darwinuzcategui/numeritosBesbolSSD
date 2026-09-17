import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { auth } from '../middleware.js';
import { basesTotal, battingAverage, slugging, inningsOuts, pclEra, outsToInnings, round1, round2 } from '../calc.js';

const OFFENSE_COLS = [
  'at_bats', 'runs', 'hits', 'doubles', 'triples', 'home_runs', 'rbi',
  'strikeouts', 'walks', 'stolen_bases', 'hit_by_pitch', 'sacrifice_hits',
  'sacrifice_flies', 'interference',
];

const PITCHING_COLS = ['pitched', 'result', 'innings', 'earned_runs', 'strikeouts', 'hits_allowed'];

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function gamesCount(): number {
  const row = db.prepare('SELECT games_count FROM settings WHERE id = 1').get() as any;
  return Number(row.games_count);
}

function upsertOffense(playerId: number, gameNumber: number, o: Record<string, unknown>) {
  const sets = OFFENSE_COLS.map((c) => `${c}=excluded.${c}`).join(', ');
  const sql =
    `INSERT INTO offense_games (player_id, game_number, ${OFFENSE_COLS.join(', ')}) ` +
    `VALUES (${['?', '?', ...OFFENSE_COLS.map(() => '?')].join(', ')}) ` +
    `ON CONFLICT (player_id, game_number) DO UPDATE SET ${sets}`;
  db.prepare(sql).run(playerId, gameNumber, ...OFFENSE_COLS.map((c) => num(o[c])));
}

function upsertPitching(playerId: number, gameNumber: number, p: Record<string, unknown>) {
  const sets = PITCHING_COLS.map((c) => `${c}=excluded.${c}`).join(', ');
  const sql =
    `INSERT INTO pitching_games (player_id, game_number, ${PITCHING_COLS.join(', ')}) ` +
    `VALUES (${['?', '?', ...PITCHING_COLS.map(() => '?')].join(', ')}) ` +
    `ON CONFLICT (player_id, game_number) DO UPDATE SET ${sets}`;
  const result = p.result === 'G' || p.result === 'P' || p.result === 'S' ? p.result : null;
  db.prepare(sql).run(
    playerId,
    gameNumber,
    num(p.pitched),
    result,
    num(p.innings),
    num(p.earned_runs),
    num(p.strikeouts),
    num(p.hits_allowed),
  );
}

function sum(rows: any[], col: string): number {
  return rows.reduce((acc, r) => acc + num(r[col]), 0);
}

function seasonStats(teamId: number) {
  const players = db
    .prepare('SELECT id, name, number FROM players WHERE team_id = ? ORDER BY number IS NULL, number, name')
    .all(teamId) as any[];
  return players.map((p) => {
    const off = db.prepare('SELECT * FROM offense_games WHERE player_id = ?').all(p.id) as any[];
    const pit = db.prepare('SELECT * FROM pitching_games WHERE player_id = ?').all(p.id) as any[];

    const atBats = sum(off, 'at_bats');
    const hits = sum(off, 'hits');
    const bases = off.reduce(
      (acc, r) => acc + basesTotal(num(r.hits), num(r.doubles), num(r.triples), num(r.home_runs)),
      0,
    );

    const jj = pit.filter((r) => r.pitched === 1).length;
    const jg = pit.filter((r) => r.result === 'G').length;
    const jp = pit.filter((r) => r.result === 'P').length;
    const js = pit.filter((r) => r.result === 'S').length;
    const outs = pit.reduce((acc, r) => acc + inningsOuts(num(r.innings)), 0);
    const earnedRuns = sum(pit, 'earned_runs');

    return {
      id: p.id,
      name: p.name,
      number: p.number,
      offense: {
        at_bats: atBats,
        runs: sum(off, 'runs'),
        hits,
        doubles: sum(off, 'doubles'),
        triples: sum(off, 'triples'),
        home_runs: sum(off, 'home_runs'),
        rbi: sum(off, 'rbi'),
        strikeouts: sum(off, 'strikeouts'),
        walks: sum(off, 'walks'),
        stolen_bases: sum(off, 'stolen_bases'),
        hit_by_pitch: sum(off, 'hit_by_pitch'),
        sacrifice_hits: sum(off, 'sacrifice_hits'),
        sacrifice_flies: sum(off, 'sacrifice_flies'),
        interference: sum(off, 'interference'),
        av: round1(battingAverage(hits, atBats)),
        slg: round1(slugging(bases, atBats)),
      },
      pitching: {
        jj,
        jg,
        jp,
        js,
        innings: outsToInnings(outs),
        earned_runs: earnedRuns,
        strikeouts: sum(pit, 'strikeouts'),
        hits_allowed: sum(pit, 'hits_allowed'),
        pcl_era: round2(pclEra(earnedRuns, outs)),
      },
    };
  });
}

export function registerGameRoutes(app: FastifyInstance) {
  app.get('/teams/:id/season', { preHandler: auth() }, async (request, reply) => {
    const teamId = Number((request.params as any).id);
    const team = db.prepare('SELECT id, name FROM teams WHERE id = ?').get(teamId);
    if (!team) return reply.code(404).send({ error: 'Equipo no encontrado' });
    return { team, games_count: gamesCount(), players: seasonStats(teamId) };
  });

  app.get('/teams/:id/games/:gameNumber', { preHandler: auth() }, async (request, reply) => {
    const teamId = Number((request.params as any).id);
    const gameNumber = Number((request.params as any).gameNumber);
    const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(teamId);
    if (!team) return reply.code(404).send({ error: 'Equipo no encontrado' });
    if (!Number.isInteger(gameNumber) || gameNumber < 1 || gameNumber > gamesCount()) {
      return reply.code(400).send({ error: 'Número de juego inválido' });
    }
    const players = db
      .prepare('SELECT id, name, number FROM players WHERE team_id = ? ORDER BY number IS NULL, number, name')
      .all(teamId) as any[];
    const result = players.map((p) => {
      const off = db
        .prepare('SELECT * FROM offense_games WHERE player_id = ? AND game_number = ?')
        .get(p.id, gameNumber) as any;
      const pit = db
        .prepare('SELECT * FROM pitching_games WHERE player_id = ? AND game_number = ?')
        .get(p.id, gameNumber) as any;
      return {
        player_id: p.id,
        name: p.name,
        number: p.number,
        offense: off ? OFFENSE_COLS.reduce((a, c) => ({ ...a, [c]: off[c] }), {}) : null,
        pitching: pit ? PITCHING_COLS.reduce((a, c) => ({ ...a, [c]: pit[c] }), {}) : null,
      };
    });
    return { game_number: gameNumber, players: result };
  });

  app.put('/teams/:id/games/:gameNumber', { preHandler: auth() }, async (request, reply) => {
    const teamId = Number((request.params as any).id);
    const gameNumber = Number((request.params as any).gameNumber);
    const { players } = request.body as { players?: Array<{ player_id: number; offense?: any; pitching?: any }> };
    if (!teamId || !Number.isInteger(gameNumber) || gameNumber < 1 || gameNumber > gamesCount()) {
      return reply.code(400).send({ error: 'Número de juego inválido' });
    }
    if (!Array.isArray(players)) return reply.code(400).send({ error: 'Se requiere el arreglo "players"' });

    for (const entry of players) {
      const belongs = db
        .prepare('SELECT id FROM players WHERE id = ? AND team_id = ?')
        .get(entry.player_id, teamId);
      if (!belongs) return reply.code(400).send({ error: `Jugador ${entry.player_id} no pertenece al equipo` });
      if (entry.offense) upsertOffense(entry.player_id, gameNumber, entry.offense);
      if (entry.pitching) upsertPitching(entry.player_id, gameNumber, entry.pitching);
    }
    return { ok: true, game_number: gameNumber };
  });

  app.get('/players/:id', { preHandler: auth() }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const player = db.prepare('SELECT id, team_id, name, number FROM players WHERE id = ?').get(id) as any;
    if (!player) return reply.code(404).send({ error: 'Jugador no encontrado' });
    const games = [];
    for (let g = 1; g <= gamesCount(); g++) {
      const off = db.prepare('SELECT * FROM offense_games WHERE player_id = ? AND game_number = ?').get(id, g) as any;
      const pit = db.prepare('SELECT * FROM pitching_games WHERE player_id = ? AND game_number = ?').get(id, g) as any;
      games.push({
        game_number: g,
        offense: off ? OFFENSE_COLS.reduce((a, c) => ({ ...a, [c]: off[c] }), {}) : null,
        pitching: pit ? PITCHING_COLS.reduce((a, c) => ({ ...a, [c]: pit[c] }), {}) : null,
      });
    }
    return { player, games };
  });

  app.put('/players/:id/games/:gameNumber', { preHandler: auth() }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const gameNumber = Number((request.params as any).gameNumber);
    const { offense, pitching } = request.body as { offense?: any; pitching?: any };
    const player = db.prepare('SELECT id FROM players WHERE id = ?').get(id);
    if (!player) return reply.code(404).send({ error: 'Jugador no encontrado' });
    if (!Number.isInteger(gameNumber) || gameNumber < 1 || gameNumber > gamesCount()) {
      return reply.code(400).send({ error: 'Número de juego inválido' });
    }
    if (offense) upsertOffense(id, gameNumber, offense);
    if (pitching) upsertPitching(id, gameNumber, pitching);
    return { ok: true };
  });
}
