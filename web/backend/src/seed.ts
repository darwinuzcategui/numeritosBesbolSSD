import { db } from './db.js';
import { inningsOuts, outsToInnings } from './calc.js';
import fs from 'node:fs';

const file = process.argv[2] || 'seed-data.json';
const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw) as Team[];

interface Offense {
  at_bats: number; runs: number; hits: number; doubles: number; triples: number;
  home_runs: number; rbi: number; strikeouts: number; walks: number; stolen_bases: number;
  hit_by_pitch: number; sacrifice_hits: number; sacrifice_flies: number; interference: number;
}
interface Pitching {
  jj: number; jg: number; jp: number; js: number;
  innings: number; earned_runs: number; strikeouts: number; hits_allowed: number;
}
interface Player { name: string; number: number; offense: Offense; pitching: Pitching | null }
interface Team { name: string; players: Player[] }

function splitInt(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const base = Math.floor(total / parts);
  const rem = total % parts;
  const out = new Array(parts).fill(base);
  for (let i = 0; i < rem; i++) out[i] += 1;
  return out;
}

db.exec('DELETE FROM offense_games; DELETE FROM pitching_games; DELETE FROM players; DELETE FROM teams;');

const insertTeam = db.prepare('INSERT INTO teams (name) VALUES (?)');
const insertPlayer = db.prepare('INSERT INTO players (team_id, name, number) VALUES (?, ?, ?)');
const insertOffense = db.prepare(
  `INSERT INTO offense_games (player_id, game_number, at_bats, runs, hits, doubles, triples,
     home_runs, rbi, strikeouts, walks, stolen_bases, hit_by_pitch, sacrifice_hits,
     sacrifice_flies, interference)
   VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const insertPitching = db.prepare(
  `INSERT INTO pitching_games (player_id, game_number, pitched, result, innings, earned_runs, strikeouts, hits_allowed)
   VALUES (?, ?, 1, ?, ?, ?, ?, ?)`,
);

db.exec('BEGIN');
try {
  for (const team of data) {
    const teamId = Number(insertTeam.run(team.name).lastInsertRowid);
    for (const p of team.players) {
      const playerId = Number(insertPlayer.run(teamId, p.name, p.number > 0 ? p.number : null).lastInsertRowid);
      const o = p.offense;
      insertOffense.run(
        playerId,
        o.at_bats, o.runs, o.hits, o.doubles, o.triples, o.home_runs, o.rbi, o.strikeouts,
        o.walks, o.stolen_bases, o.hit_by_pitch, o.sacrifice_hits, o.sacrifice_flies, o.interference,
      );
      const pit = p.pitching;
      if (pit && pit.jj > 0) {
        const outs = inningsOuts(pit.innings);
        const outsSplit = splitInt(outs, pit.jj);
        const erSplit = splitInt(pit.earned_runs, pit.jj);
        const kSplit = splitInt(pit.strikeouts, pit.jj);
        const hSplit = splitInt(pit.hits_allowed, pit.jj);
        const results: (string | null)[] = [
          ...Array<null>(pit.jg).fill(null).map(() => 'G'),
          ...Array<null>(pit.jp).fill(null).map(() => 'P'),
          ...Array<null>(pit.js).fill(null).map(() => 'S'),
        ];
        for (let g = 0; g < pit.jj; g++) {
          insertPitching.run(
            playerId,
            g + 1,
            results[g] ?? null,
            outsToInnings(outsSplit[g]),
            erSplit[g],
            kSplit[g],
            hSplit[g],
          );
        }
      }
    }
  }
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

const tc = db.prepare('SELECT COUNT(*) AS c FROM teams').get() as { c: number };
const pc = db.prepare('SELECT COUNT(*) AS c FROM players').get() as { c: number };
const og = db.prepare('SELECT COUNT(*) AS c FROM offense_games').get() as { c: number };
const pg = db.prepare('SELECT COUNT(*) AS c FROM pitching_games').get() as { c: number };
console.log(`Seeded: ${tc.c} teams, ${pc.c} players, ${og.c} offense rows, ${pg.c} pitching rows`);
