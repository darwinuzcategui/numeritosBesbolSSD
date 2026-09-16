# TASKS: Tabla de numeritos de béisbol (Excel v1)

Derivado de `PLAN.md` (aprobado) y `SPEC.md` (aprobada). Cada tarea se marca
`[x]` solo cuando su implementación **y validación** estén hechas y registradas.

## Estado

- Implementación del `.xlsx`: **completada** (T1–T8, salvo el VBA del `.xlsm`).
- Validación: **verificada** con LibreOffice headless (recalculo real) usando
  funciones universales (`LARGE`/`SMALL`/`INDEX`/`MATCH`/`COUNTIF`), por lo que
  el mismo archivo sirve en Excel, Google Sheets, LibreOffice y OpenOffice.
- Variante `.xlsm` (VBA): macro escrita como referencia; generación bloqueada por licencia.

## Tareas

- **T1 — Migrar y corregir `equipo3`:** completado (datos extraídos y reconstruidos).
- **T2 — 25 jugadores:** completado (filas 8–32; resumen 37–61).
- **T3 — 20 equipos + consolidación:** completado (equipo1..20; total general 8..507).
- **T4 — AV/SLG `.XXX` + líderes ofensivos:** completado (líderes con LARGE/INDEX/MATCH).
- **T5 — Lanzadores + PCL/ERA:** completado (INN en tercios; PCL/ERA = CL×27/outs).
- **T6 — Resultados + tabla de posiciones:** completado (orden portable).
- **T7 — Líderes de lanzadores:** completado (PCL/ERA, JG, K, INN, H permitidos).
- **T8 — Variantes:** `.xlsx` completado; `.xlsm` VBA = referencia en `ActualizarRankings.bas` (bloqueado).
- **T9 — Validación:** completada vía LibreOffice; pendiente confirmación visual en Google Sheets del usuario.

## Registro de evidencia (validación real con LibreOffice)

| Tarea / CA | Celda | Dato de entrada | Resultado observado | Estado |
| --- | --- | --- | --- | --- |
| T2 / CA-01 | equipo1 C37/C62 | 25 jugadores | C37 (VB jug.1) = 51; C62 (VB total) = 72 | ✓ |
| T4 / CA-04 | equipo1 T37/U37 | jug.1 VB=51, H=16 | AV = 0.314; SLG = 0.373 | ✓ |
| T3 / CA-03 | total general U8/V8 | consolidado | U8 = 0.314; V8 = 0.373 (coincide) | ✓ |
| T5 / CA-05 | equipo1 lanzador1 | 6 juegos, INN=3.0, CL=7 | PCL/ERA = 3.5 (=7×27/54) | ✓ |
| T6 / CA-06 | posiciones ordenada | resultados demo | equipo1 avg 1.0 → equipo2 0.933 → ... | ✓ |
| T7 / CA-08 | lideres PCL/ERA | demo | 3.15, 3.5, 4.05, 4.5 (ascendente) | ✓ |
| T4 / CA-04 | lideres AV | demo | top AV 0.667 con empates | ✓ |
| T7 / CA-08 | lideres K | demo | 26, 25, 24, 23, 22 (descendente) | ✓ |

## Bloqueos pendientes

1. **Licencia de Excel expirada** — impide generar el `.xlsm` (inyectar VBA vía COM).
2. **Confirmación en Google Sheets** — el usuario debe abrir el archivo y verificar visualmente.

## Siguiente paso

Abrir `test de excel/numeritos-beisbol-demo.xlsx` en Google Sheets (o Excel) y
confirmar que líderes y posiciones salen correctos. Con Excel activo, se genera
el `.xlsm` con la macro `ActualizarRankings` (ya escrita).
