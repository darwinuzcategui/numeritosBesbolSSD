# Test de Excel — Numeritos de Béisbol (Fase 1)

Un solo archivo funciona en **Excel**, **Google Sheets**, **LibreOffice** y
**OpenOffice** (usa solo funciones universales: `LARGE`, `SMALL`, `INDEX`,
`MATCH`, `COUNTIF`, `IFERROR`).

## Archivos

| Archivo | Qué es |
| --- | --- |
| `numeritos-beisbol.xlsx` | Entregable (limpio, para tus datos reales) |
| `numeritos-beisbol-demo.xlsx` | Con campeonato de ejemplo (Equipo 19 invicto, Equipo 2 sin ganar) |

## Hojas

| Hoja | Contenido |
| --- | --- |
| `equipo1`..`equipo20` | Captura por equipo: ofensiva, lanzadores y resultados |
| `total general` | Consolidado **ofensivo** (con filtro en la fila 7) |
| `lanzadores` | Consolidado de **lanzadores** (con filtro en la fila 2) |
| `posiciones` | Tabla de posiciones ordenada |
| `lideres` | Top 10 ofensivos y de lanzadores (con empates) |

## Protección

Las hojas están **protegidas**: solo puedes editar las celdas de entrada
(nombres, números, estadísticas de cada juego, resultado y carreras). Las celdas
de cálculo (AV, SLG, PCL/ERA, totales, líderes, posiciones) son de solo lectura.

**Clave para desproteger:** `Gmd11642590` (menú Revisar → Desproteger hoja).

## Cómo probar

1. **Ofensiva:** hoja `equipoN` → "LÍDERES INDIVIDUAL" (AV/SLG en `.XXX`).
2. **Lanzadores:** hoja `equipoN` → "LANZADORES" (`PCL/ERA` = CL×27/outs).
3. **Consolidados:** `total general` (ofensivo) y `lanzadores`, con filtros.
4. **Posiciones:** hoja `posiciones` (ordenada por Average y luego diferencia).
5. **Líderes:** hoja `lideres` (top 10 con empates).
