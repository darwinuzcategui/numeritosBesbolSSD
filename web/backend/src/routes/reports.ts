import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { auth } from '../middleware.js';
import { seasonStats } from './games.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdfmake = require('pdfmake');

pdfmake.setFonts({
  Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold' },
  Times: { normal: 'Times-Roman', bold: 'Times-Bold' },
});
pdfmake.setUrlAccessPolicy(() => false);

function pdfBuffer(doc: any): Promise<Buffer> {
  return pdfmake.createPdf(doc).getBuffer();
}

function leagueInfo() {
  const r = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
  return r || {};
}

export function registerReportRoutes(app: FastifyInstance) {
  app.get('/teams/:id/report.pdf', { preHandler: auth() }, async (request, reply) => {
    const teamId = Number((request.params as any).id);
    const team = db.prepare('SELECT id, name FROM teams WHERE id = ?').get(teamId) as any;
    if (!team) return reply.code(404).send({ error: 'Equipo no encontrado' });
    const info = leagueInfo();
    const players = seasonStats(teamId);
    const doc: any = {
      content: [
        { text: 'Numeritos de Béisbol — Reporte de Equipo', style: 'header' },
        { text: `Equipo: ${team.name} | ${info.division || ''} | ${info.season || ''}`, style: 'subheader' },
        { text: `Campeonato: ${info.championship || ''} | Categoría: ${info.category || ''}`, style: 'subheader' },
        { text: ' ', margin: [0, 6, 0, 6] },
        { text: 'OFENSIVA', style: 'section' },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*'],
            body: [
              ['Nº', 'Nombre', 'VB', 'H', 'HR', 'CI', 'AV', 'SLG'],
              ...players.map((p: any) => [
                String(p.number ?? ''), p.name, String(p.offense.at_bats), String(p.offense.hits),
                String(p.offense.home_runs), String(p.offense.rbi),
                p.offense.av.toFixed(1), p.offense.slg.toFixed(1),
              ]),
            ],
          },
        },
        { text: ' ', margin: [0, 6, 0, 6] },
        { text: 'PITCHEO', style: 'section' },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*', '*', '*', '*', '*'],
            body: [
              ['Nº', 'Nombre', 'JJ', 'JG', 'JP', 'JS', 'INN', 'PCL/ERA'],
              ...players.map((p: any) => [
                String(p.number ?? ''), p.name, String(p.pitching.jj), String(p.pitching.jg),
                String(p.pitching.jp), String(p.pitching.js),
                p.pitching.innings.toFixed(1), p.pitching.pcl_era.toFixed(2),
              ]),
            ],
          },
        },
      ],
      styles: {
        header: { fontSize: 16, bold: true, color: '#2e5090', margin: [0, 0, 0, 4] },
        subheader: { fontSize: 10, color: '#555', margin: [0, 0, 0, 2] },
        section: { fontSize: 12, bold: true, color: '#bfa000', margin: [0, 6, 0, 2] },
      },
      defaultStyle: { font: 'Helvetica', fontSize: 9 },
    };
    const buf = await pdfBuffer(doc);
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="reporte-equipo-${team.name}.pdf"`);
    return reply.send(buf);
  });

  app.get('/league/report.pdf', { preHandler: auth() }, async (request, reply) => {
    const info = leagueInfo();
    const teams = db.prepare('SELECT id, name FROM teams ORDER BY name').all() as any[];
    const teamRows = teams.map((t: any) => {
      const stats = seasonStats(t.id);
      const offSum = stats.reduce((a: any, s: any) => ({ at_bats: a.at_bats + s.offense.at_bats, hits: a.hits + s.offense.hits, home_runs: a.home_runs + s.offense.home_runs, rbi: a.rbi + s.offense.rbi, av: 0, slg: 0 }), { at_bats: 0, hits: 0, home_runs: 0, rbi: 0, av: 0, slg: 0 });
      const pitSum = stats.reduce((a: any, s: any) => ({ jj: a.jj + s.pitching.jj, js: a.js + s.pitching.js, innings: a.innings + s.pitching.innings, earned_runs: a.earned_runs + s.pitching.earned_runs, pcl_era: 0 }), { jj: 0, js: 0, innings: 0, earned_runs: 0, pcl_era: 0 });
      // Re-calcular AV/SLG agregados simples por equipo (promedio ponderado por VB o acumulado total)
      const totalVB = offSum.at_bats;
      const totalHits = offSum.hits;
      const totalBases = stats.reduce((acc: number, s: any) => acc + (s.offense.at_bats > 0 ? s.offense.slg * s.offense.at_bats / 1000 : 0), 0);
      const av = totalVB > 0 ? (totalHits * 1000 / totalVB).toFixed(1) : '0';
      const slg = totalVB > 0 ? (totalBases * 1000 / totalVB).toFixed(1) : '0';
      const outs = pitSum.innings * 3; // aproximado para resumen
      const era = (outs > 0 && pitSum.earned_runs > 0) ? (pitSum.earned_runs * 27 / outs).toFixed(2) : '0';
      return [t.name, String(totalVB), String(totalHits), String(offSum.home_runs), String(offSum.rbi), av, slg, String(pitSum.jj), String(pitSum.js), era];
    });

    // Top 10 líderes ofensivos (AV, VB >= 10) de todos los jugadores
    const allPlayers: any[] = [];
    for (const t of teams) {
      const stats = seasonStats(t.id);
      for (const s of stats) {
        if (s.offense.at_bats >= 10) allPlayers.push({ name: s.name, team: t.name, vb: s.offense.at_bats, av: s.offense.av, slg: s.offense.slg, hr: s.offense.home_runs, ci: s.offense.rbi, k: s.offense.strikeouts });
      }
    }
    const leadersAV = allPlayers.sort((a, b) => b.av - a.av).slice(0, 10);
    const leadersHR = allPlayers.sort((a, b) => b.hr - a.hr).slice(0, 10);
    const leadersCI = allPlayers.sort((a, b) => b.ci - a.ci).slice(0, 10);

    const doc: any = {
      content: [
        { text: 'Numeritos de Béisbol — Reporte de Liga', style: 'header' },
        { text: `Liga: ${info.league || ''} | División: ${info.division || ''} | ${info.season || ''}`, style: 'subheader' },
        { text: ' ', margin: [0, 6, 0, 6] },
        { text: 'RESUMEN POR EQUIPO', style: 'section' },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*', '*'],
            body: [
              ['Equipo', 'VB', 'H', 'HR', 'CI', 'AV', 'SLG', 'JJ', 'JS', 'PCL/ERA'],
              ...teamRows,
            ],
          },
        },
        { text: ' ', margin: [0, 6, 0, 6] },
        { text: 'TOP 10 LÍDERES — AV', style: 'section' },
        { table: { headerRows: 1, widths: ['*', '*', '*', '*', '*'], body: [['Jugador', 'Equipo', 'VB', 'AV', 'SLG'], ...leadersAV.map((l: any) => [l.name, l.team, String(l.vb), l.av.toFixed(1), l.slg.toFixed(1)])] } },
        { text: ' ', margin: [0, 6, 0, 6] },
        { text: 'TOP 10 LÍDERES — HR', style: 'section' },
        { table: { headerRows: 1, widths: ['*', '*', '*', '*', '*'], body: [['Jugador', 'Equipo', 'VB', 'HR', 'CI'], ...leadersHR.map((l: any) => [l.name, l.team, String(l.vb), String(l.hr), String(l.ci)])] } },
        { text: ' ', margin: [0, 6, 0, 6] },
        { text: 'TOP 10 LÍDERES — CI', style: 'section' },
        { table: { headerRows: 1, widths: ['*', '*', '*', '*', '*'], body: [['Jugador', 'Equipo', 'VB', 'CI', 'HR'], ...leadersCI.map((l: any) => [l.name, l.team, String(l.vb), String(l.ci), String(l.hr)])] } },
      ],
      styles: {
        header: { fontSize: 16, bold: true, color: '#2e5090', margin: [0, 0, 0, 4] },
        subheader: { fontSize: 10, color: '#555', margin: [0, 0, 0, 2] },
        section: { fontSize: 12, bold: true, color: '#bfa000', margin: [0, 6, 0, 2] },
      },
      defaultStyle: { font: 'Helvetica', fontSize: 9 },
    };
    const buf = await pdfBuffer(doc);
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="reporte-liga-${info.season || '2026'}.pdf"`);
    return reply.send(buf);
  });
}
