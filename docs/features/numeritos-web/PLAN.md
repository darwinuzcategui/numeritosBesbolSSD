# PLAN: Numeritos Web (Fase 2 — MVP)

**SPEC de referencia:** `docs/features/numeritos-web/SPEC.md`
**Versión de la spec revisada:** Aprobada el 2026-09-16
**Estado:** Aprobado <!-- Borrador | En revisión | Aprobado -->

<!-- PARA EL AGENTE
- Lee la SPEC aprobada y las instrucciones del proyecto. Si falta un documento
  necesario o la spec no está aprobada, indícalo antes de avanzar.
- Inspecciona el repositorio. Referencia rutas verificadas y distingue propuestas.
- Propón una solución proporcional y coherente. Consulta las decisiones no resueltas.
- Referencia RF/CA por ID, sin copiar toda la spec.
- No implementes durante la planificación. Solicita aprobación antes de marcar Aprobado.
-->

## Contexto técnico verificado

| Componente | Ruta verificada | Estado |
| --- | --- | --- |
| Node.js | `node --version` | v22.22.1 (soporta `node:sqlite`, experimental) |
| npm | `npm --version` | 10.9.4 (soporta workspaces) |
| `node:sqlite` | `require('node:sqlite')` | Disponible (aviso "experimental") |
| Fase 1 (Excel) | `numeritos-beisbol.xlsx` | Reglas de cálculo ya definidas y validadas |
| Repositorio web | (ninguno) | No existe código web; se crea de cero |

**Herramientas:** Node 22 + npm. No hay pnpm ni bun instalados.

**Subagentes:** no requeridos para el plan; la implementación la ejecuta el agente
principal (scaffold + backend + frontend) con comprobaciones por etapa.

## Solución propuesta

**Monorepo con dos paquetes** (npm workspaces) dentro de `web/`:

```
web/
├── package.json          # workspaces: backend, frontend
├── backend/              # API Fastify (TypeScript)
│   ├── src/
│   │   ├── index.ts      # arranque del servidor
│   │   ├── db.ts         # conexión y esquema (node:sqlite)
│   │   ├── auth.ts       # login, sesión y roles
│   │   ├── calc.ts       # AV, SLG, PCL/ERA (reglas Fase 1)
│   │   └── routes/       # teams, players, games, users, settings
│   └── package.json
└── frontend/             # Astro (TypeScript)
    ├── astro.config.mjs  # adaptador Node (SSR)
    ├── src/pages/        # login, dashboard, equipos, jugadores, juegos, admin
    └── package.json
```

- **Backend Fastify** en un puerto propio (p. ej. `3000`), expone una API REST JSON.
- **Frontend Astro** (SSR con adaptador Node) en otro puerto (p. ej. `4321`), llama a
  la API por `fetch` con cookies de sesión. Para evitar CORS en desarrollo se usa
  `@fastify/cors` con credenciales; en producción el frontend hace proxy de `/api`.
- **SQLite** con `node:sqlite`; todo el acceso a BD queda en `db.ts` para poder
  cambiarlo a `better-sqlite3` sin tocar el resto (mitiga que `node:sqlite` es experimental).

## Módulos y componentes afectados

| Módulo o ruta | Existe / nuevo | Responsabilidad y cambios | Requisito |
| --- | --- | --- | --- |
| `web/package.json` | nuevo | Workspaces (backend, frontend) | — |
| `web/backend` | nuevo | API Fastify + SQLite | RF-01..RF-09 |
| `web/backend/src/db.ts` | nuevo | Esquema y acceso a SQLite (única puerta a la BD) | RF-02..RF-08 |
| `web/backend/src/calc.ts` | nuevo | Funciones puras AV/SLG/PCL-ERA (reglas Fase 1) | RF-05, RF-07 |
| `web/backend/src/auth.ts` | nuevo | Login, sesión, roles admin/capturador | RF-01 |
| `web/backend/src/routes/*` | nuevo | Endpoints REST de equipos, jugadores, juegos, usuarios, ajustes | RF-02..RF-09 |
| `web/frontend` | nuevo | UI Astro (SSR) contra la API | RF-01..RF-09 |

## Datos y contratos

### Esquema SQLite

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','capturador'))
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number INTEGER
);

CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  games_count INTEGER NOT NULL DEFAULT 15
);

CREATE TABLE offense_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL,
  at_bats INTEGER DEFAULT 0, runs INTEGER DEFAULT 0, hits INTEGER DEFAULT 0,
  doubles INTEGER DEFAULT 0, triples INTEGER DEFAULT 0, home_runs INTEGER DEFAULT 0,
  rbi INTEGER DEFAULT 0, strikeouts INTEGER DEFAULT 0, walks INTEGER DEFAULT 0,
  stolen_bases INTEGER DEFAULT 0, hit_by_pitch INTEGER DEFAULT 0,
  sacrifice_hits INTEGER DEFAULT 0, sacrifice_flies INTEGER DEFAULT 0, interference INTEGER DEFAULT 0,
  UNIQUE(player_id, game_number)
);

CREATE TABLE pitching_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL,
  pitched INTEGER DEFAULT 0,
  result TEXT,                 -- 'G', 'P' o NULL
  innings REAL DEFAULT 0,      -- tercios: 3.1 = 3 IP + 1 out
  earned_runs INTEGER DEFAULT 0,
  strikeouts INTEGER DEFAULT 0,
  hits_allowed INTEGER DEFAULT 0,
  UNIQUE(player_id, game_number)
);
```

- El campo `number` de jugador es el dorsal; no se exige único (se valida en UI).
- `innings` se guarda en notación de tercios (3.1, 3.2); el cálculo convierte a outs.

### Reglas de cálculo (en `calc.ts`, replican Fase 1)

- `bases = (hits - doubles - triples - home_runs) + doubles*2 + triples*3 + home_runs*4`
- `AV = hits / at_bats` (si `at_bats=0` → 0), formato `.XXX`
- `SLG = bases / at_bats` (si `at_bats=0` → 0)
- `outs = Σ (floor(innings)*3 + round((innings - floor(innings))*10))`
- `PCL_ERA = earned_runs * 27 / outs` (si `outs=0` → 0)
- `JJ` = nº de juegos con `pitched=1`; `JG`/`JP` = conteo de `result='G'/'P'`.

### Endpoints REST (JSON)

- **Auth:** `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
- **Equipos:** `GET /teams`, `POST /teams`, `PUT /teams/:id`, `DELETE /teams/:id`.
- **Jugadores:** `GET /teams/:id/players`, `POST /teams/:id/players`, `PUT /players/:id`, `DELETE /players/:id`.
- **Estadísticas:**
  - `GET /teams/:id/season` → acumulados por jugador (AV, SLG, PCL/ERA).
  - `GET /teams/:id/games/:gameNumber` → stats de un juego (todo el equipo).
  - `PUT /teams/:id/games/:gameNumber` → guardar stats de un juego (bulk).
  - `GET /players/:id` → jugador + sus juegos.
  - `PUT /players/:id/games/:gameNumber` → guardar un jugador en un juego.
- **Ajustes:** `GET /settings`, `PUT /settings` (games_count).
- **Usuarios (admin):** `GET /users`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id`.

**Permisos:** `admin` accede a todo; `capturador` solo a GET de equipos/jugadores/estadísticas
y a PUT de estadísticas (no gestiona equipos, jugadores ni usuarios).

## Estado, operaciones y errores

- **Autenticación/sesión:** contraseña con `crypto.scrypt` (hash + salt). Sesión por
  token en `sessions` con cookie `HttpOnly`. Middleware de auth resuelve el usuario y su rol.
- **Errores:** respuestas JSON con `{ error: mensaje }` y códigos adecuados
  (401 no autenticado, 403 sin permiso, 404 no encontrado, 400 validación, 500 interno).
- **Validación de entrada:** enteros ≥ 0 para conteos; `innings` con tercios `.0/.1/.2`;
  `game_number` dentro de `1..games_count`; `result` en `{'G','P'}`.
- **Upsert por juego:** `PUT .../games/:gameNumber` usa `INSERT ... ON CONFLICT` sobre
  `UNIQUE(player_id, game_number)` para crear o actualizar sin duplicados.
- **Concurrencia local:** app de un solo usuario por máquina; no se requiere lógica
  multi-usuario concurrente (se asume acceso secuencial).

## Dependencias y configuración

- **Backend:** `fastify`, `@fastify/cors`, `@fastify/cookie`; `typescript`, `tsx`,
  `@types/node`. Contraseñas con `node:crypto` (sin librería extra). BD con `node:sqlite`.
- **Frontend:** `astro`, `@astrojs/node`. Sin framework extra (componentes `.astro` +
  `fetch`); se puede añadir React/Svelte después si hiciera falta.
- **Scripts:** `npm run dev` (levanta backend y frontend), `npm run build`, `npm test`.
- No se introducen dependencias de fases futuras (móvil/licencia).

## Estrategia de validación

- **Unitarias (backend):** `node:test` sobre `calc.ts` (AV/SLG/PCL-ERA con casos conocidos
  de la Fase 1: H=16/VB=51 → AV .314; CL=7/18 IP → ERA 3.5) y sobre validación de entrada.
- **Integración (backend):** tests con `fastify.inject` sobre cada endpoint CRUD y de
  estadísticas (crear equipo → agregar jugador → cargar stats → verificar acumulados).
- **Frontend:** comprobación manual en navegador (login por rol, CRUD, captura por juego
  y por jugador, permisos).

| Criterio | Método | Entorno y datos | Evidencia prevista |
| --- | --- | --- | --- |
| CA-01 | Test integración auth | credenciales admin/capturador | 200/401/403 según rol |
| CA-02 | Test integración CRUD equipos | crear/editar/eliminar | persistencia verificada |
| CA-03 | Test integración CRUD jugadores | agregar jugadores | lista y persistencia |
| CA-04 | Test unitario calc + integración | ofensiva de prueba | AV .314, SLG .373 |
| CA-05 | Test unitario calc + integración | pitcheo de prueba | PCL/ERA 3.5 |
| CA-06 | Test integración settings | games_count distinto | acumulados según config |
| CA-07 | Test integración + manual | capturar por juego y por jugador | datos coherentes |

**Comprobaciones de regresión:** al cambiar `calc.ts`, re-ejecutar los tests unitarios
contra los casos conocidos de la Fase 1.

**Comandos verificados para compilar y ejecutar:** `node --version` (v22.22.1),
`npm --version` (10.9.4), `node:sqlite` (disponible). Los comandos de build/test del
proyecto se definirán en `web/package.json` y se verificarán durante la implementación.

**Limitaciones del entorno:** `node:sqlite` es experimental (aviso en Node 22); se aísla
en `db.ts`. La validación de UI es manual (no hay pruebas E2E automáticas).

## Orden de implementación

1. Scaffold del monorepo `web/` (workspaces, tsconfig, scripts). Comprobación: `npm install` sin errores.
2. Backend: `db.ts` con esquema y arranque de BD. Comprobación: tablas creadas.
3. Backend: `auth.ts` (scrypt, sesiones, roles). Comprobación: login admin/capturador.
4. Backend: `calc.ts` + tests unitarios. Comprobación: casos Fase 1 en verde.
5. Backend: rutas de equipos/jugadores. Comprobación: tests de integración CRUD.
6. Backend: rutas de estadísticas (por juego y por jugador) + cálculos. Comprobación: CA-04..CA-07.
7. Backend: ajustes y usuarios (admin). Comprobación: permisos por rol.
8. Frontend: scaffold Astro + login. Comprobación: login redirige según rol.
9. Frontend: dashboard y equipos/jugadores. Comprobación: CRUD en UI.
10. Frontend: captura por juego y por jugador. Comprobación: CA-07.
11. Frontend: pantallas de admin (usuarios, ajustes). Comprobación: permisos.
12. Integración final y registro de evidencia en `TASKS.md`.

## Riesgos y decisiones pendientes

- **Riesgo (`node:sqlite` experimental):** la API puede cambiar entre versiones de Node.
  Medida: aislar en `db.ts`; si hay problemas, cambiar a `better-sqlite3` (misma interfaz local).
- **Riesgo (CORS frontend/backend):** usar `@fastify/cors` con credenciales en dev y
  proxy `/api` en producción.
- **Riesgo (Astro SSR vs estático):** se usa SSR (adaptador Node) por requerir
  autenticación y datos dinámicos.
- **Decisiones pendientes:** Ninguna funcional. Detalles de implementación (nombres
  exactos de columnas, puertos) se concretan en TASKS.

<!-- ANTES DE SOLICITAR APROBACIÓN
Comprueba que el plan cubre los requisitos, respeta las exclusiones y permite
demostrar todos los criterios. Tras aprobar, deriva TASKS.md.
-->
