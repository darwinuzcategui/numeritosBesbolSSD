import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { auth } from '../middleware.js';
import { basesTotal, battingAverage, slugging, inningsOuts, pclEra, outsToInnings, round1, round2, round3 } from '../calc.js';

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function gamesCount(): number {
  const row = db.prepare('SELECT games_count FROM settings WHERE id = 1').get() as any;
  return Number(row.games_count);
}

interface PlayerRow {
  id: number;
  name: string;
  number: number | null;
  team_id: number;
  team_name: string;
}

function allPlayers(): PlayerRow[] {
  return db
    .prepare(
      `SELECT p.id, p.name, p.number, t.id AS team_id, t.name AS team_name
       FROM players p JOIN teams t ON t.id = p.team_id
       ORDER BY t.name, p.number IS NULL, p.number, p.name`,
    )
    .all() as unknown as PlayerRow[];
}

function offenseSeason(playerId: number) {
  const rows = db.prepare('SELECT * FROM offense_games WHERE player_id = ?').all(playerId) as any[];
  const sum = (c: string) => rows.reduce((a, r) => a + num(r[c]), 0);
  const atBats = sum('at_bats');
  const hits = sum('hits');
  const bases = rows.reduce(
    (a, r) => a + basesTotal(num(r.hits), num(r.doubles), num(r.triples), num(r.home_runs)),
    0,
  );
  return {
    at_bats: atBats,
    runs: sum('runs'),
    hits,
    doubles: sum('doubles'),
    triples: sum('triples'),
    home_runs: sum('home_runs'),
    rbi: sum('rbi'),
    strikeouts: sum('strikeouts'),
    walks: sum('walks'),
    stolen_bases: sum('stolen_bases'),
    hit_by_pitch: sum('hit_by_pitch'),
    sacrifice_hits: sum('sacrifice_hits'),
    sacrifice_flies: sum('sacrifice_flies'),
    interference: sum('interference'),
    bal: bases,
    al: atBats + sum('walks') + sum('hit_by_pitch') + sum('sacrifice_hits') + sum('sacrifice_flies') + sum('interference'),
    av: round1(battingAverage(hits, atBats)),
    slg: round1(slugging(bases, atBats)),
  };
}

function pitchingSeason(playerId: number) {
  const rows = db.prepare('SELECT * FROM pitching_games WHERE player_id = ?').all(playerId) as any[];
  const sum = (c: string) => rows.reduce((a, r) => a + num(r[c]), 0);
  const jj = rows.filter((r) => r.pitched === 1).length;
  const jg = rows.filter((r) => r.result === 'G').length;
  const jp = rows.filter((r) => r.result === 'P').length;
  const js = rows.filter((r) => r.result === 'S').length;
  const outs = rows.reduce((a, r) => a + inningsOuts(num(r.innings)), 0);
  const earnedRuns = sum('earned_runs');
  return {
    jj,
    jg,
    jp,
    js,
    innings: outsToInnings(outs),
    earned_runs: earnedRuns,
    strikeouts: sum('strikeouts'),
    hits_allowed: sum('hits_allowed'),
    pcl_era: round2(pclEra(earnedRuns, outs)),
  };
}

function standings() {
  const teams = db.prepare('SELECT id, name FROM teams ORDER BY name').all() as any[];
  const rows = teams.map((t) => {
    const g = db.prepare('SELECT * FROM team_games WHERE team_id = ?').all(t.id) as any[];
    const played = g.filter((r) => r.result === 'G' || r.result === 'P' || r.result === 'E');
    const jj = played.length;
    const jg = played.filter((r) => r.result === 'G').length;
    const jp = played.filter((r) => r.result === 'P').length;
    const je = played.filter((r) => r.result === 'E').length;
    const ca = played.reduce((a, r) => a + num(r.runs_scored), 0);
    const cr = played.reduce((a, r) => a + num(r.runs_against), 0);
    return {
      team_id: t.id,
      team: t.name,
      jj,
      jg,
      jp,
      je,
      ca,
      cr,
      dif: ca - cr,
      average: jj > 0 ? round3((jg + je * 0.5) / jj) : 0,
    };
  });
  rows.sort((a, b) => b.average - a.average || b.dif - a.dif || b.ca - a.ca || a.team.localeCompare(b.team));
  return rows;
}

export function registerLeagueRoutes(app: FastifyInstance) {
  app.get('/teams/:id/results', { preHandler: auth() }, async (request, reply) => {
    const teamId = Number((request.params as any).id);
    const team = db.prepare('SELECT id, name FROM teams WHERE id = ?').get(teamId);
    if (!team) return reply.code(404).send({ error: 'Equipo no encontrado' });
    const rows = db.prepare('SELECT * FROM team_games WHERE team_id = ? ORDER BY game_number').all(teamId) as any[];
    const byGame = new Map<number, any>();
    for (const r of rows) byGame.set(r.game_number, r);
    const results = [];
    for (let g = 1; g <= gamesCount(); g++) {
      const r = byGame.get(g);
      results.push({
        game_number: g,
        result: r?.result ?? null,
        runs_scored: r ? num(r.runs_scored) : 0,
        runs_against: r ? num(r.runs_against) : 0,
      });
    }
    return { team, games_count: gamesCount(), results };
  });

  app.put('/teams/:id/results', { preHandler: auth() }, async (request, reply) => {
    const teamId = Number((request.params as any).id);
    const { results } = request.body as {
      results?: Array<{ game_number: number; result?: string | null; runs_scored?: number; runs_against?: number }>;
    };
    const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(teamId);
    if (!team) return reply.code(404).send({ error: 'Equipo no encontrado' });
    if (!Array.isArray(results)) return reply.code(400).send({ error: 'Se requiere el arreglo "results"' });
    const upsert = db.prepare(
      `INSERT INTO team_games (team_id, game_number, result, runs_scored, runs_against)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (team_id, game_number) DO UPDATE SET
         result = excluded.result,
         runs_scored = excluded.runs_scored,
         runs_against = excluded.runs_against`,
    );
    for (const r of results) {
      const g = Number(r.game_number);
      if (!Number.isInteger(g) || g < 1 || g > gamesCount()) {
        return reply.code(400).send({ error: `Número de juego inválido: ${r.game_number}` });
      }
      const result = r.result === 'G' || r.result === 'P' || r.result === 'E' ? r.result : null;
      upsert.run(teamId, g, result, num(r.runs_scored), num(r.runs_against));
    }
    return { ok: true };
  });

  app.get('/league/offense', { preHandler: auth() }, async () => {
    return allPlayers().map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      team: p.team_name,
      offense: offenseSeason(p.id),
    }));
  });

  app.get('/league/pitching', { preHandler: auth() }, async () => {
    return allPlayers()
      .map((p) => ({ id: p.id, name: p.name, number: p.number, team: p.team_name, pitching: pitchingSeason(p.id) }))
      .filter((p) => p.pitching.jj > 0);
  });

  app.get('/league/standings', { preHandler: auth() }, async () => standings());

  app.get('/league/leaders', { preHandler: auth() }, async () => {
    const players = allPlayers().map((p) => ({
      name: p.name,
      team: p.team_name,
      offense: offenseSeason(p.id),
      pitching: pitchingSeason(p.id),
    }));
    const top = (sel: (x: any) => number, filter: (x: any) => boolean, desc = true) =>
      players
        .filter(filter)
        .map((x) => ({ name: x.name, team: x.team, value: sel(x) }))
        .sort((a, b) => (desc ? b.value - a.value : a.value - b.value))
        .slice(0, 10);
    return {
      offense: {
        av: top((x) => x.offense.av, (x) => x.offense.at_bats > 0),
        slg: top((x) => x.offense.slg, (x) => x.offense.at_bats > 0),
        hr: top((x) => x.offense.home_runs, () => true),
        ci: top((x) => x.offense.rbi, () => true),
        h: top((x) => x.offense.hits, () => true),
        br: top((x) => x.offense.stolen_bases, () => true),
        ca: top((x) => x.offense.runs, () => true),
      },
      pitching: {
        pcl_era: top((x) => x.pitching.pcl_era, (x) => x.pitching.jj > 0 && x.pitching.innings > 0, false),
        jg: top((x) => x.pitching.jg, (x) => x.pitching.jj > 0),
        k: top((x) => x.pitching.strikeouts, (x) => x.pitching.jj > 0),
        inn: top((x) => x.pitching.innings, (x) => x.pitching.jj > 0),
        h_permitidos: top((x) => x.pitching.hits_allowed, (x) => x.pitching.jj > 0, false),
        sv: top((x) => x.pitching.js, (x) => x.pitching.jj > 0),
      },
    };
  });
}
