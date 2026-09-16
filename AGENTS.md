# AGENTS.md

Guía para agentes de IA que trabajan en este repositorio. Todas las rutas son
relativas a la raíz del repositorio.

## Lectura obligatoria

Antes de planificar, revisar o modificar este proyecto, lee
[docs/GENERIC_RULES.md](docs/GENERIC_RULES.md) completo y aplícalo junto con este
archivo. Contiene reglas de trabajo reutilizables; este archivo añade las
convenciones específicas del proyecto. Ninguno de los dos anula las instrucciones
explícitas de la persona ni las instrucciones de mayor prioridad del agente.

## Proyecto

**Numeritos de Béisbol**: sistema para llevar las estadísticas de una liga de
béisbol menor (ofensiva, pitcheo, tabla de posiciones y líderes).

Roadmap iterativo (en este orden; cada fase se aprueba antes de avanzar):

1. **Fase 1 — Libro de Excel** (actual): tabla ofensiva con 25 jugadores y 20
   equipos, sección de lanzadores, tabla de posiciones y líderes top 10.
   Entregable: `.xlsx`.
2. **Fase 2 — Web**: aplicación web con backend local y base de datos SQLite.
3. **Fase 3 — Móvil**: aplicación móvil (Android nativo o Flutter — pendiente).
4. **Fase 4 — Producción**: licencia por usuario/equipo (ID de disco duro en
   escritorio/web; ID de equipo en móvil).

Stack y lenguajes: **decisiones pendientes** que se tomarán al iniciar cada fase.
No asumirlas; preguntar antes de incorporarlas.

## Flujo de trabajo Spec-Driven (SDD)

Cada etapa está gateada por la aprobación de la anterior. Un documento solo queda
`Aprobada`/`Aprobado` cuando la persona lo dice: un documento completo no es uno
aprobado, y el agente nunca cambia ese estado por su cuenta.

1. **Spec:** completar `SPEC.md` desde `docs/SPEC_TEMPLATE.md`, en colaboración y
   sección por sección. No empezar el plan hasta que la persona apruebe la spec.
2. **Plan:** escribir `PLAN.md` desde `docs/PLAN_TEMPLATE.md` para la spec
   aprobada. No empezar tareas hasta que la persona apruebe el plan.
3. **Tareas:** derivar `TASKS.md` del plan aprobado (no hay plantilla compartida).
   Tareas pequeñas, ordenadas y verificables, con identificador, objetivo, alcance,
   dependencias, criterios que resuelven y método de validación.
4. **Implementación:** ejecutar las tareas dentro del alcance acordado, con
   autorización explícita (no se deduce del estado de los documentos).
5. **Validación:** demostrar los criterios de aceptación con evidencia real y
   registrar el resultado en `TASKS.md`.

Documentos de referencia: `docs/SPEC_TEMPLATE.md`, `docs/PLAN_TEMPLATE.md`,
`docs/MOBILE_GUIDELINES.md` (aplica solo a fases móviles) y `docs/GENERIC_RULES.md`.

### Documentos por feature

- `docs/features/<feature-name>/SPEC.md`
- `docs/features/<feature-name>/PLAN.md`
- `docs/features/<feature-name>/TASKS.md`

### Feature actual

- `docs/features/excel-numeritos/SPEC.md` — Fase 1, en revisión.

## Validación en Fase 1 (Excel)

No hay build ni tests automatizados para el libro. La validación es manual y
funcional con Excel: abrir el archivo, cargar datos de prueba y comprobar los
valores calculados. El plan y las tareas definen los casos concretos y su
evidencia. Un valor "que parece correcto" no es evidencia: registrar la celda
verificada, el dato de entrada y el resultado observado.

## Convenciones

- Documentación en español.
- Preservar los datos reales del archivo original al migrar de `.xls`.
- Fase 1: dos entregables — `.xlsm` (fórmulas + macros VBA, Excel de escritorio) y
  `.xlsx` (fórmulas dinámicas, compatible con Excel 365 y Google Sheets).
- No introducir tecnología de fases futuras (web/móvil/licencia) en esta fase.

## Informe de finalización

Resumir el comportamiento implementado, los documentos de feature afectados y los
resultados de validación. Vincular cada criterio de aceptación a su evidencia en
`TASKS.md`. Identificar claramente lo incompleto o no verificado; no presentar un
nombre de test, un comando no ejecutado o un "debería funcionar" como prueba.
