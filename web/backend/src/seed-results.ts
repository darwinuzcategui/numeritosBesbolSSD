import { db } from './db.js';
import fs from 'node:fs';

const file = process.argv[2] || 'team-results.json';
const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw) as Array<{ team: string; results: Array<{ game_number: number; result: string; runs_scored: number; runs_against: number }> }>;

db.exec('DELETE FROM team_games;');

const upsert = db.prepare(
  `INSERT INTO team_games (team_id, game_number, result, runs_scored, runs_against)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT (team_id, game_number) DO UPDATE SET
     result = excluded.result,
     runs_scored = excluded.runs_scored,
     runs_against = excluded.runs_against`,
);

let inserted = 0;
for (const t of data) {
  const team = db.prepare('SELECT id FROM teams WHERE name = ?').get(t.team) as { id: number } | undefined;
  if (!team) {
    console.log(`Equipo no encontrado: ${t.team}`);
    continue;
  }
  for (const r of t.results) {
    if (r.result === 'G' || r.result === 'P' || r.result === 'E') {
      upsert.run(team.id, r.game_number, r.result, r.runs_scored, r.runs_against);
      inserted++;
    }
  }
}

const count = db.prepare('SELECT COUNT(*) AS c FROM team_games').get() as { c: number };
console.log(`Seeded results: ${inserted} juegos (${count.c} filas en team_games)`);
