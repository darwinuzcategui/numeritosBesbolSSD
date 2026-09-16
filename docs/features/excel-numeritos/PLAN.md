# PLAN: Tabla de numeritos de béisbol (Excel v1)

**SPEC de referencia:** `docs/features/excel-numeritos/SPEC.md`
**Versión de la spec revisada:** Aprobada el 2026-09-16
**Estado:** Aprobado <!-- Borrador | En revisión | Aprobado -->

<!-- PARA LA PERSONA
Copia esta plantilla como PLAN.md junto a la SPEC.md aprobada.
Este documento define la solución técnica. Una vez revisado, el agente puede
derivar TASKS.md con tareas, dependencias y comprobaciones.
-->

<!-- PARA EL AGENTE
- Lee la SPEC.md aprobada, las instrucciones del proyecto y MOBILE_GUIDELINES.md.
  Si falta un documento necesario o la spec no está aprobada, indícalo antes de avanzar.
- Inspecciona el repositorio. Referencia rutas verificadas y distingue las nuevas propuestas.
- Propón una solución proporcional al alcance y coherente con el proyecto.
  Reutiliza lo existente y justifica nuevas dependencias o cambios de arquitectura.
- Distingue hechos, decisiones confirmadas y propuestas. Consulta las decisiones
  no resueltas; haz pocas preguntas por vez y actualiza el plan con las respuestas.
- Referencia los requisitos y criterios por su ID, sin copiar toda la spec.
- Si una decisión cambia el comportamiento o alcance, vuelve a la spec y solicita
  confirmación. No resuelvas una duda de producto mediante una suposición técnica.
- Conserva estos comentarios. No implementes durante la planificación.
- Solicita aprobación antes de marcar el plan como Aprobado. La autorización
  para implementar debe ser explícita; no se deduce del estado de los documentos.
-->

## Contexto técnico verificado

| Componente o archivo existente | Ruta verificada | Responsabilidad y uso previsto |
| --- | --- | --- |
| `numeritos beisbol menor.xls` | raíz | Fuente de datos y estructura base (OLE2/.xls). Se migra a `.xlsx`/`.xlsm`. |
| Hojas `equipo1`..`equipo10` | dentro del `.xls` | Ofensiva individual: 19 jugadores × 15 juegos (bloques de 17 columnas). |
| Hoja `total general` | dentro del `.xls` | Consolida por referencia directa el resumen de cada equipo (AV, SLG). |
| Fórmulas AV/SLG/AL/BAL | en cada hoja de equipo | `AV=H*1000/VB`, `SLG=bases*1000/VB`, `AL=VB+BB+GP+SH+SF+INT`, `BAL=bases totales`. Se reutilizan ajustando el formato a `.XXX`. |
| Plantillas SDD | `docs/SPEC_TEMPLATE.md`, `docs/PLAN_TEMPLATE.md` | Origen de esta spec y este plan. |
| Excel COM 16.0 | entorno Windows | Herramienta de generación/edición de `.xlsx` y `.xlsm` (verificada disponible). |

**Herramientas verificadas:** Excel COM 16.0 disponible. Python/openpyxl **no
disponible** (solo el stub de Windows Store). Por tanto, la generación y edición
de los libros se hará con **Excel COM vía PowerShell**.

**Subagentes:** no se requieren; el trabajo es un único flujo de generación con
Excel COM y validación manual.

## Solución propuesta

Se entregan **dos archivos** con la misma maqueta de hojas y fórmulas base; solo
cambia el mecanismo de orden de líderes y posiciones:

- **`.xlsm`** (Excel de escritorio): orden de líderes/posiciones con una **macro VBA**
  (`ActualizarRankings`) que ordena y escribe el top 10 (con empates) al pulsar un
  botón y, opcionalmente, al cambiar datos.
- **`.xlsx`** (Excel 365 + Google Sheets): orden con **fórmulas dinámicas**
  (`SORT`, `FILTER`, `LARGE`, `INDEX`). Se evita `TAKE`/`DROP` (no disponibles en
  Google Sheets) y se usa `INDEX`/`ARRAY_CONSTRAIN` para el recorte, de modo que el
  mismo archivo recalcula en ambos.

### Maqueta de cada hoja de equipo (propuesta)

1. **Cabecera** (filas 1–7): conserva título, categoría y encabezados.
2. **Ofensiva** (RF-01): 25 filas de jugadores × 15 bloques de juego (17 columnas
   cada uno), fila de `TOTALES`, y bloque resumen "LÍDERES INDIVIDUAL" (25 filas)
   con AV/SLG en `.XXX`.
3. **Lanzadores** (RF-05): 25 filas (mismo roster) × bloques por juego con las
   columnas de pitcheo (JJ se deriva de "pitcheó sí/no", JG/JP del resultado, INN,
   CL, K, H), más resumen con `PCL/ERA = (CL×9)/INN`.
4. **Resultados del equipo** (RF-06): 15 filas (una por juego) con resultado
   (G/P/E) y carreras a favor/en contra, que alimentan la tabla de posiciones.

### Hoja `total general`

1. **Consolidado ofensivo** (RF-03): 20 equipos × 25 jugadores, por referencia.
2. **Líderes ofensivos** (RF-04): top 10 por AV, SLG, HR, CI y H, con empates del corte.
3. **Líderes de lanzadores** (RF-08): top 10 por PCL/ERA (menor), JG, K, INN y H permitidos.
4. **Tabla de posiciones** (RF-06/RF-07): 20 equipos con JJ, JG, JP, JE, CA, CR,
   diferencia neta, a favor/en contra y Average, ordenada por Average desc y luego
   diferencia desc.

## Módulos y componentes afectados

No hay modularización (es un libro de Excel); se listan hojas/secciones.

| Componente o ruta | Acción | Cambio y responsabilidad | Requisito relacionado |
| --- | --- | --- | --- |
| `numeritos beisbol menor.xls` | Modificar (migrar) | Convertir a `.xlsx` base conservando datos; corregir `equipo3`. | RF-01..RF-08 |
| Hojas `equipo1..equipo20` | Crear/modificar | Extender a 25 jugadores y 20 equipos; añadir lanzadores y resultados. | RF-01, RF-02, RF-05, RF-06 |
| Hoja `total general` | Modificar | Consolidado de 20 equipos + líderes + tabla de posiciones. | RF-03, RF-04, RF-06, RF-07, RF-08 |
| Fórmulas AV/SLG/AL/BAL | Reutilizar/ajustar | Cambiar formato a decimal `.XXX` y mantener lógica. | RF-04 |
| Fórmulas PCL/ERA, Average | Crear | Nuevas fórmulas de pitcheo y posiciones. | RF-05, RF-06 |
| Macro VBA `ActualizarRankings` (`.xlsm`) | Crear | Ordenar líderes y posiciones con empates. | RF-04, RF-06, RF-07, RF-08 |
| Fórmulas dinámicas de orden (`.xlsx`) | Crear | `SORT`/`FILTER`/`LARGE`/`INDEX` para líderes y posiciones. | RF-04, RF-06, RF-07, RF-08 |

## Datos y contratos

- **Ofensiva (reutilizada):** `NOMBRE, No, VB, CA, H, 2B, 3B, HR, CI, K, BB, BR,
  GP, SH, SF, INT, BAL, AL`; `AV = H/VB` y `SLG = BAL/VB`, formato `0.000` y
  `IFERROR(...,0)` para VB=0.
- **Lanzadores (nueva):** por jugador y juego: indicador de que pitcheó (→ JJ),
  resultado G/P (→ JG/JP), `INN` (tercios: 3.1 = 3 entradas y 1 out), `CL`, `K`,
  `H`. Resumen: `PCL/ERA = IFERROR(CL*9 / ((INT(INN)*3 + (INN-INT(INN))*10)/3), 0)`.
  Validación de INN: entero más `.0`, `.1` o `.2`.
- **Resultados por juego (nueva):** `resultado (G/P/E)`, `CA`, `CR` por juego.
- **Posiciones (nueva):** `JJ=Σ juegos`, `JG/JP/JE=Σ resultados`, `CA=Σ a favor`,
  `CR=Σ en contra`, `Dif=CA−CR`, columnas a favor (CA) y en contra (CR),
  `Average=IFERROR((JG+0.5*JE)/JJ,0)`. Orden: Average desc, luego Dif desc.
- **Líderes (top 10 con empates):** se toma el valor del décimo puesto como corte y
  se muestran todos los registros con valor ≥ corte (o ≤ para PCL/ERA y H permitidos).

## Estado, operaciones y errores

- **Recálculo:** las fórmulas recalculan al editar; en `.xlsm` el orden se aplica
  con la macro (botón/evento), en `.xlsx` con fórmulas dinámicas.
- **Sin datos:** celdas vacías; `IFERROR(...,0)` evita `#DIV/0!` en AV/SLG/PCL/ERA/Average.
- **Entrada inválida:** `SUM` ignora texto; INN fuera de `.0/.1/.2` se trata como
  dato a corregir (documentado en la hoja).
- **Empates:** se muestran todos los empatados en el corte (la lista puede superar 10).

## Dependencias y configuración

- Excel de escritorio para el `.xlsm` (VBA) y Excel 365 o Google Sheets para el `.xlsx`.
- Herramienta de generación: Excel COM vía PowerShell (sin dependencias externas nuevas).
- Riesgo de entorno: escribir VBA vía COM requiere habilitar en Excel
  "Confiar en el acceso al modelo de objetos de proyectos de VBA"; si está bloqueado,
  se documenta el módulo VBA y se inserta manualmente.

## Estrategia de validación

Validación manual y funcional (no hay build/tests). Cada criterio se comprueba con
datos de prueba conocidos y se registra la celda verificada, el dato de entrada y
el resultado observado.

| Criterio | Método | Entorno y datos | Evidencia prevista |
| --- | --- | --- | --- |
| CA-01 | Manual: cargar 25 jugadores y revisar acumulados | Excel; 25 filas con datos | Celda de total y 25 filas visibles |
| CA-02 | Manual: revisar lista de hojas | Excel | 20 hojas de equipo + resumen |
| CA-03 | Manual: editar un valor y ver `total general` | Excel | Valor consolidado actualizado |
| CA-04 | Manual: líderes con datos conocidos | Excel (`.xlsm` macro y `.xlsx` fórmulas) | Top 10 correcto por AV/SLG/HR/CI/H, empates incluidos |
| CA-05 | Manual: pitcheo de prueba vs cálculo manual | Excel | JJ/JG/JP/INN/CL/K/H/PCL-ERA correctos |
| CA-06 | Manual: resultados y posiciones | Excel | Posiciones correctas y orden Average desc, Dif desc |
| CA-07 | Manual: cambiar un resultado y recalcular | Excel | Posiciones y líderes se actualizan |
| CA-08 | Manual: líderes de lanzadores | Excel | Top 10 correcto por PCL-ERA/JG/K/INN/H, empates incluidos |
| `.xlsx` en Google Sheets | Manual: abrir en Google Sheets y recalcular | Google Sheets | Fórmulas dinámicas recalculan correctamente |

**Comprobaciones de regresión:** tras cada cambio de estructura, reabrir el archivo
y confirmar que los datos originales migrados se conservan y los totales previos no cambian.

**Comandos verificados:** no aplican (sin build); la generación usa Excel COM vía PowerShell.

**Limitaciones del entorno:** no se puede verificar Google Sheets aquí si no hay
acceso; quedará pendiente la verificación en Google Sheets para el `.xlsx`.

## Orden de implementación

1. Migrar `.xls` → `.xlsx` base (conservar datos), corregir la columna desplazada
   de `equipo3`. Comprobación: datos idénticos a la fuente.
2. Extender ofensiva a 25 jugadores y duplicar a 20 equipos; ajustar `total general`.
   Comprobación: CA-01 y CA-02.
3. Ajustar AV/SLG a `.XXX` y montar líderes ofensivos top 10 (CA-03, CA-04).
4. Añadir sección de lanzadores con PCL/ERA (CA-05).
5. Añadir resultados por juego y tabla de posiciones (CA-06, CA-07).
6. Añadir líderes de lanzadores (CA-08).
7. Generar las dos variantes: `.xlsm` (VBA) y `.xlsx` (fórmulas dinámicas).
8. Validación completa (todas las CA) y registro de evidencia en `TASKS.md`.

## Riesgos y decisiones pendientes

- **Riesgo (compatibilidad):** `TAKE`/`DROP` no existen en Google Sheets; se usará
  `SORT`/`FILTER`/`LARGE`/`INDEX`/`ARRAY_CONSTRAIN`. Impacto: se mantiene el
  comportamiento; el detalle de fórmula se resuelve en TASKS.
- **Riesgo (entorno):** escritura de VBA vía COM puede requerir habilitar el acceso
  al modelo de objetos de VBA en Excel. Mitigación: documentar el módulo para inserción manual.
- **Riesgo (paridad):** la sintaxis de fórmulas dinámicas difiere levemente entre
  Excel 365 y Google Sheets; se validará en ambos (Google Sheets queda pendiente de
  verificación si no hay acceso).
- **Decisiones pendientes:** Ninguna funcional; solo los detalles técnicos de
  fórmulas y VBA que se concretan en TASKS.

<!-- ANTES DE SOLICITAR APROBACIÓN
Comprueba que el plan cubre los requisitos, respeta las exclusiones, reutiliza
componentes verificados y permite demostrar todos los criterios de aceptación.
Resuelve dudas y marcadores pendientes. Si la spec cambió, revisa su impacto.
Tras aprobar el plan, deriva TASKS.md con IDs, dependencias, referencias a RF/CA
y comprobaciones. No marques una tarea terminada sin realizar su validación;
si está bloqueada, registra el motivo.
-->
