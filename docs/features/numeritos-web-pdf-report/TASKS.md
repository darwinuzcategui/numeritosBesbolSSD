# TASKS: Reporte PDF (Numeritos Web — Fase 2)

## Tareas

- **T-R1:** Agregar `pdfmake` a `backend/package.json`; instalar (`npm install` en backend).
- **T-R2:** Crear `backend/src/routes/reports.ts` con endpoints `/teams/:id/report.pdf` y `/league/report.pdf`; usar funciones puras de calc + `db.prepare(...)` para agregar datos; devolver `application/pdf`; incluir header de settings.
- **T-R3:** Registrar rutas en `app.ts`; verificar compila (`npm run typecheck`).
- **T-R4:** Agregar botón "Exportar PDF" en `teams/[id].astro`; agregar botón "Reporte de liga" en `index.astro`; ambos apuntan a los endpoints con `window.open(...)`.
- **T-R5:** Validar: descargar PDF de equipo, PDF de liga; comparar valores AV/SLG; verificar header de liga.

## Registro de evidencia

| Tarea / CA | Verificación | Resultado | Estado |
|---|---|---|---|
| T-R1 | `npm install pdfmake -w backend` | pdfmake 0.3.11 instalado | ✓ |
| T-R2 | `npm run typecheck` + archivo creado | `routes/reports.ts` con 2 endpoints PDF | ✓ |
| T-R3 | `npm run typecheck` + `npm test` | 0 errores TS; 15/15 tests pasan | ✓ |
| T-R4 | Archivos editados | Botones en `teams/[id].astro` + `index.astro` | ✓ |
| T-R5 | Servidor + descarga real + `pdftotext` | Ambos PDF 200, `%PDF-1.3`…`%%EOF`, contenido correcto | ✓ |

## Validación T-R5 (evidencia real)

- **Login:** `POST /auth/login` (admin/admin) → 200.
- **PDF de equipo:** `GET /teams/4/report.pdf` → 200, 12 712 bytes, magic `%PDF-1.3`, tail `%%EOF`.
  `pdftotext` confirma: encabezado `Numeritos de Béisbol — Reporte de Equipo`, `Equipo: Equipo 1`,
  info de liga (CORPORACION CRIOLLITOS DE VENEZUELA / TEMPORADA 2026), tabla `OFENSIVA` con jugadores y VB/H.
- **PDF de liga:** `GET /league/report.pdf` → 200, 12 291 bytes, `%PDF-1.3`…`%%EOF`.
  `pdftotext` confirma: `Reporte de Liga`, info de liga, tabla `RESUMEN POR EQUIPO` con `Equipo 1 179 88 …`.
- **Sin autenticación:** `GET /teams/4/report.pdf` sin cookie → 401 (CA-05).
- **CA-04 (valores AV/SLG/PCL-ERA):** el PDF usa la misma función `seasonStats()` que
  `GET /teams/:id/season`, cubierta por `calc.test.ts` e `integration.test.ts` (AV/SLG/PCL-ERA verificados).

## Correcciones aplicadas durante la implementación

1. **Import de pdfmake roto (ESM/CJS):** `import PdfPrinter from 'pdfmake'` y
   `require('pdfmake/js/Printer.js')` no exponían el constructor. Solución:
   `const pdfmake = require('pdfmake')` + `pdfmake.setFonts(...)` + `pdfmake.createPdf(doc).getBuffer()`.
2. **`reply.send(stream)` fallaba** con `FST_ERR_REP_INVALID_PAYLOAD_TYPE`. Solución: bufferizar
   el PDF con `getBuffer()` (Promise<Buffer>) y enviar el Buffer.
3. **Fuente estándar denegada:** `setLocalAccessPolicy(() => false)` rompía `Helvetica-Bold`.
   Se retiró (se mantiene `setUrlAccessPolicy(() => false)` por seguridad).
4. **Columna "VB" de líderes con valores basura** (`Math.round(l.av/1000*51||0)`). Se corrigió
   para mostrar `at_bats` real del jugador.
