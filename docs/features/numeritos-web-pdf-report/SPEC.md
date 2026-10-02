# SPEC: Reporte PDF (Numeritos Web — Fase 2)

**Estado:** Borrador <!-- Borrador | En revisión | Aprobada -->

<!-- PARA LA PERSONA
Copia esta plantilla como SPEC.md en una carpeta de la funcionalidad.
SPEC.md define qué debe cumplirse; PLAN.md desarrolla cómo implementarlo;
TASKS.md organiza los pasos de ejecución.
-->

<!-- PARA EL AGENTE
- Lee las instrucciones del proyecto (AGENTS.md, docs/GENERIC_RULES.md). Inspecciona
  el repositorio para comprobar el comportamiento actual. Si falta un documento, pídelo.
- Completa esta spec con la persona: investiga lo comprobable y consulta lo pendiente.
- No inventes requisitos ni exclusiones. Marca como PENDIENTE lo no resuelto.
- No incluyas diseño de clases, tablas, componentes o algoritmos: eso va en PLAN.md.
- Un documento completo no está aprobado automáticamente. No implementes en esta etapa.
-->

## Qué construimos y para quién

Un **reporte en PDF** que descarga el usuario desde la web, con dos vistas:

1. **Reporte de equipo** — estadísticas ofensivas y de pitcheo de un equipo (equivalente
   a las hojas `equipoX` del Excel de Fase 1), con encabezado de liga.
2. **Reporte de liga** — resumen ofensivo y de pitcheo por todos los equipos, más los
   **top 10 líderes** en las principales estadísticas (AV, SLG, HR, CI, K,
   PCL/ERA, K de pitcheo, JS, JG, JP).

Dirigido a quien organiza la liga y necesita una hoja imprimible o enviable por correo
con las mismas reglas de cálculo que el Excel.

## Situación actual

- La web (Fase 2) ya captura y calcula ofensiva y pitcheo por jugador y por juego
  (`GET /teams/:id/season` devuelve acumulados con AV/SLG por mil y PCL/ERA).
- La información de liga (división, liga, campeonato, temporada, categoría) existe
  en `/settings`.
- **No hay** funcionalidad de exportación ni reporte PDF alguno.
- **No existe** tabla de posiciones con WL por equipo en el modelo de datos
  (el `result` de `pitching_games` es G/P/S del lanzador, no del equipo).

## Dentro del alcance

- **RF-01:** El backend genera un PDF para un equipo (`/teams/:id/report.pdf`) con:
  encabezado (liga, temporada, categoría, campeonato), tabla de ofensiva por jugador
  y tabla de pitcheo por jugador.
- **RF-02:** El backend genera un PDF de liga (`/league/report.pdf`) con: encabezado de
  liga, tabla resumen por equipo (ofensiva + pitcheo) y top 10 líderes.
- **RF-03:** El frontend muestra botones "Exportar PDF" en la página de equipo y en el
  dashboard, que descargan el PDF.
- **RF-04:** Los PDFs usan los mismos cálculos que la Fase 1 (AV = H×1000/VB,
  SLG = BAL×1000/VB, PCL/ERA = CL×27/outs).

## Fuera de alcance

- Tabla de posiciones WL por equipo (no hay datos de WL a nivel equipo en el modelo).
- Edición manual de WL para posiciones (como el Excel).

## Flujo de usuario

1. El usuario ingresa a la página de un equipo y pulsa **"Exportar PDF"** → se
   descarga un PDF con el reporte de ese equipo.
2. El usuario está en el dashboard y pulsa **"Exportar PDF de liga"** → se descarga
   un PDF con el reporte de toda la liga (resumen por equipos + líderes).
3. Si no hay equipos o jugadores, el PDF se genera igual con el mensaje
   "Sin datos" en las tablas correspondientes.

## Datos y reglas de negocio

- El PDF de equipo reúne los mismos datos que `/teams/:id/season` (jugadores con
  ofensiva: VB, CA, H, 2B, 3B, HR, CI, K, BB, BR, GP, SH, SF, INT; y pitcheo:
  JJ, JG, JP, JS, INN, CL, K, H, PCL/ERA).
- El PDF de liga itera todos los equipos y agrega:
  - Resumen equipo: nombre, VB, H, HR, CI, AV; y JJ, JS, PCL/ERA (del mejor lanzador).
  - Top 10 líderes: AV (VB ≥ 10), SLG (VB ≥ 10), HR, CI, K (ofensiva), PCL/ERA
    (outs ≥ 27), K (pitcheo), JS, JG, JP.
- El encabezado del PDF incluye la info de `/settings`.

## Comportamiento web y casos alternativos

| Situación | Comportamiento esperado |
| --- | --- |
| Carga / generación del PDF | Indicador de carga en el botón; no bloquear la UI. |
| Sin equipos o jugadores | PDF generado con "Sin datos" en las tablas. |
| Backend no disponible | Mensaje de error al clickear "Exportar PDF". |
| Sin autenticación | Redirigir al login (el endpoint requiere auth). |
| Permiso insuficiente | El `capturador` también puede descargar PDFs (consulta). |

## Restricciones del pedido

- **Tecnología de generación:** `pdfmake` en el backend (Fastify), respondiendo
  `application/pdf`. No se usa Puppeteer ni Chromium.
- La app sigue siendo **local** (backend + frontend en la máquina del usuario).
- Los cálculos deben reproducir la Fase 1 (Excel).

## Criterios de aceptación

- **CA-01 · RF-01:** Dado un equipo con datos cargados, cuando descargo el PDF de
  equipo, entonces contiene el nombre del equipo, encabezado de liga y tablas de
  ofensiva y pitcheo con valores calculados correctos.
- **CA-02 · RF-02:** Dada una liga con varios equipos, cuando descargo el PDF de liga,
  entonces contiene el resumen por equipo y los top 10 líderes en AV, SLG, HR, CI,
  PCL/ERA y JS.
- **CA-03 · RF-03:** Cuando pulso "Exportar PDF" en la UI, entonces el navegador
  descarga un archivo `.pdf` con el nombre `reporte-equipo-<nombre>.pdf` o
  `reporte-liga-<temporada>.pdf`.
- **CA-04 · RF-04:** Los valores de AV/SLG/PCL/ERA en el PDF coinciden con los
  mostrados en la web para el mismo equipo.
- **CA-05:** Dado un usuario no autenticado, cuando intenta descargar un PDF, entonces
  se requiere login (redirección o 401).

## Cómo se comprueba el comportamiento

| Criterio | Condiciones y pasos | Resultado esperado |
| --- | --- | --- |
| CA-01 | Cargar datos demo, descargar PDF de equipo | PDF con tablas y valores correctos |
| CA-02 | Descargar PDF de liga | PDF con resumen por equipos y top 10 |
| CA-03 | Clic en "Exportar PDF" desde UI | Descarga inicia con nombre correcto |
| CA-04 | Comparar AV/SLG/PCL/ERA PDF vs web | Valores idénticos |
| CA-05 | Descargar PDF sin login | Redirect a `/login` o 401 |

## Decisiones pendientes

- Ninguna funcional. Detalles de implementación (rutas PDF, templates de pdfmake)
  van en `PLAN.md`.
