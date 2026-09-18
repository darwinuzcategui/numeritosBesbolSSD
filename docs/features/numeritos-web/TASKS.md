# TASKS: Numeritos Web (Fase 2 — MVP)

Derivado de `PLAN.md` (aprobado) y `SPEC.md` (aprobada). Cada tarea se marca `[x]`
solo cuando su implementación y validación estén hechas y registradas.

## Tareas

- **T1 — Scaffold del monorepo:** crear `web/` con workspaces npm (backend, frontend),
  tsconfig y scripts. Validación: `npm install` sin errores.
- **T2 — Backend: base de datos** (`db.ts`): esquema SQLite (users, sessions, teams,
  players, settings, offense_games, pitching_games). Validación: tablas creadas.
- **T3 — Backend: autenticación** (`auth.ts`): scrypt, sesión por cookie, roles.
  Validación: login admin/capturador, rechazo de credenciales malas (CA-01).
- **T4 — Backend: cálculos** (`calc.ts`) + tests unitarios (AV/SLG/PCL-ERA con casos
  Fase 1). Validación: `node --test` en verde (CA-04, CA-05).
- **T5 — Backend: rutas de equipos y jugadores** (CRUD). Validación: tests de
  integración (CA-02, CA-03).
- **T6 — Backend: rutas de estadísticas** (por juego y por jugador) + acumulados.
  Validación: tests de integración (CA-04..CA-07).
- **T7 — Backend: ajustes y usuarios** (admin) + permisos por rol. Validación:
  tests de integración (CA-01, CA-06).
- **T8 — Frontend: scaffold Astro + login.** Validación: login redirige según rol.
- **T9 — Frontend: equipos y jugadores** (CRUD en UI). Validación: CA-02, CA-03.
- **T10 — Frontend: captura** por juego y por jugador. Validación: CA-07.
- **T11 — Frontend: pantallas admin** (usuarios, ajustes). Validación: permisos.
- **T12 — Integración y evidencia:** recorrer CA y registrar en esta tabla.
- **T13 — Backend: resultados de equipo** (tabla `team_games` + `GET/PUT /teams/:id/results`).
  Validación: tests (CA-09, CA-11).
- **T14 — Backend: consolidados y líderes** (`/league/offense`, `/league/pitching`,
  `/league/standings`, `/league/leaders`). Validación: tests (CA-10, CA-12).
- **T15 — Frontend: vistas de consolidado, posiciones, líderes y captura de resultados.**
  Validación: `astro build` + manual.
- **T16 — Seed de resultados de equipo** (desde el Excel demo). Validación: posiciones pobladas.

## Registro de evidencia

| Tarea / CA | Verificación | Dato de entrada | Resultado | Estado |
| --- | --- | --- | --- | --- |
| T4 / CA-04,05 | `node --test` (calc.test.ts, 7 tests) | VB=51,H=16,HR=1; CL=7,18IP | AV .314, SLG .373, PCL/ERA 3.50 | ✓ |
| T3 / CA-01 | `integration.test.ts` | admin/admin; credenciales malas | 200 / 401 | ✓ |
| T5 / CA-02,03 | `integration.test.ts` | crear equipo/jugador | CRUD persiste | ✓ |
| T6 / CA-04..07 | `integration.test.ts` | stats por juego | AV .314, PCL 3.5, settings | ✓ |
| T7 / CA-01 | `integration.test.ts` | capturador crea equipo | 403 (sin permiso) | ✓ |
| Backend | `npm test` + `typecheck` + smoke | — | 15/15 tests, 0 errores TS, listen+login+sesión OK | ✓ |
| Hotfix AV/SLG+SV | `npm test` (15 tests) + `build` frontend | VB=51,H=16,HR=1; result S×2 | AV 313.7, SLG 372.5, JS=2 | ✓ |
| Frontend | `npm run build -w frontend` | — | `astro build` completo sin errores | ✓ |
| T13 / CA-09,11 | `integration.test.ts` | resultados G/E/P + marcador | JJ/JG/JP/JE/CA/CR/DIF/Average y orden correctos | ✓ |
| T14 / CA-10,12 | `integration.test.ts` | consolidado 500 jugadores | AV 313.7, SLG 372.5; leaders por categoría | ✓ |
| T15/T16 | `astro build` + smoke en BD real | seed demo (20 equipos) | standings 20 equipos, top3 = E19(1.0),E1(.75),E11(.75) | ✓ |
| CA UI (flujos) | Manual en navegador | — | pendiente (no se automatizó UI) | pendiente |

## Notas

- Driver de BD: `node:sqlite` (Node v22.22.1, experimental). Aislado en `db.ts`.
- Backend: Fastify + node:sqlite. Frontend: Astro SSR (adaptador Node).
- Usuario inicial: `admin` / `admin` (cambiar tras el primer acceso).
- Hotfix aplicado a la web (alineado al Excel): `AV`/`SLG` por mil (`H*1000/VB`, 1 decimal) y
  lanzadores con resultado `G/P/S` + `JS` (juegos salvados = conteo de `S`).
- Cómo ejecutar: `npm run dev:backend` y `npm run dev:frontend` (abrir http://localhost:4321).
- Pendiente: prueba manual de los flujos de UI en navegador (login, CRUD, captura).

## Estado al cierre (continuar mañana)

- ✅ Backend completo (Fastify + node:sqlite): 14/14 tests en verde, typecheck limpio.
- ✅ Frontend completo (Astro SSR): login, equipos, jugadores, captura (por juego y por jugador), admin (usuarios/ajustes).
- ✅ Configuración de liga/campeonato (división, liga, campeonato, temporada, categoría) — RF-10.
- ✅ Rediseño de interfaz (marcador + paleta del Excel). Patrones guardados en `.interface-design/system.md`.
- ✅ Git init + commit inicial (`.gitignore` excluye node_modules, dist, .db).

**Pendiente:**
- 🔲 Validación manual completa de la UI en navegador.
- 🔲 Publicar a GitHub (crear repo remoto y `git push`; revisar con `gh`).
- 🔲 Registrar evidencia final de CA-01..CA-08 en la tabla de evidencia.
