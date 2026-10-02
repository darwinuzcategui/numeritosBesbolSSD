# PLAN: Reporte PDF (Numeritos Web — Fase 2)

**SPEC de referencia:** `docs/features/numeritos-web-pdf-report/SPEC.md`
**Estado:** Aprobado (aprobado por el usuario — "si" / "continua")

## Contexto técnico verificado

- Node v22.22.1, `pdfmake` no está instalado aún (se agrega).
- Backend: Fastify (`buildApp()` en `app.ts`) registra rutas por archivo; `db.ts` expone `db` con `node:sqlite`.
- Frontend: Astro (`astro.config.mjs` con adaptador Node), página de equipo en `teams/[id].astro`.
- Datos disponibles: `/teams` (lista), `/teams/:id/season` (stats por jugador), `/settings` (encabezado).

## Solución propuesta

**Backend:** agregar `pdfmake` al `backend/package.json`, crear `routes/reports.ts` con:
- `GET /teams/:id/report.pdf` → PDF de equipo (ofensa + pitcheo + header de settings)
- `GET /league/report.pdf` → PDF de liga (resumen por equipo + top 10 líderes)

**Frontend:** agregar botón en `teams/[id].astro` ("Exportar PDF") y botón en `index.astro` (dashboard, "Reporte de liga"). El botón hace `window.open('/teams/'+id+'/report.pdf')` (o fetch + download con `Content-Disposition: attachment`).

## Módulos afectados

| Módulo | Acción | Detalle |
|---|---|---|
| `backend/package.json` | agregar | `pdfmake` + `@types/pdfmake` si existe |
| `backend/src/routes/reports.ts` | nuevo | Endpoints PDF (usa `seasonStats` de `games.ts`) |
| `backend/src/app.ts` | editar | Registrar `registerReportRoutes` |
| `frontend/src/pages/teams/[id].astro` | editar | Botón "Exportar PDF" |
| `frontend/src/pages/index.astro` | editar | Botón "Reporte de liga" |

## Datos / contrato del PDF

- Header: `division`, `league`, `championship`, `season`, `category` desde `/settings`; nombre del equipo o "Liga completa".
- Equipo PDF: tabla ofensiva (Nº, Nombre, VB, H, 2B, 3B, HR, CI, AV, SLG) y tabla pitcheo (Nº, Nombre, JJ, JG, JP, JS, INN, CL, PCL/ERA).
- Liga PDF: tabla resumen (Nombre, VB, H, HR, AV, JJ, JS, PCL/ERA) + top 10 líderes (AV, SLG, HR, CI, K, PCL/ERA, JS, JG, JP).

## Validación

- `npm install` sin errores en backend y frontend; `npm test` pasa (no se rompen calc/integración).
- Descargar PDF de equipo y de liga; abrir en viso PDF; comparar AV/SLG con web.
