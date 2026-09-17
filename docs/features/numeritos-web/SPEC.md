# SPEC: Numeritos Web (Fase 2 — MVP)

**Estado:** Aprobada <!-- Borrador | En revisión | Aprobada -->

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

Una **aplicación web local** que lleva las estadísticas ofensivas y de pitcheo de
una liga de béisbol menor, dirigida a quien organiza y registra los "numeritos".
Reemplaza la captura manual en Excel por una interfaz web con base de datos local
(SQLite), **login con roles** (admin y capturador) y **número de equipos, jugadores
y juegos configurable**. Es la **Fase 2** del proyecto.

## Situación actual

- Fase 1 completada: libro `numeritos-beisbol.xlsx` con ofensiva (25 × 20),
  lanzadores, posiciones y líderes, calculados con fórmulas.
- Reglas de negocio ya definidas y validadas en la Fase 1:
  - Ofensiva por jugador y juego: `VB, CA, H, 2B, 3B, HR, CI, K, BB, BR, GP, SH, SF, INT`.
  - Calculados: `BAL` (bases totales), `AL` (apariciones), `AV = H/VB`, `SLG = bases/VB`.
  - Lanzadores por jugador y juego: `¿lanzó?, G/P/S, INN (tercios), CL, K, H`.
  - Calculados: `JJ, JG, JP, JS`, `PCL/ERA = CL × 9 / INN`.
- No existe aún código web/móvil en el repositorio.

## Dentro del alcance

- **RF-01:** Login con roles **admin** y **capturador**.
  - `admin`: gestiona equipos, jugadores, juegos y usuarios.
  - `capturador`: captura y edita estadísticas de juegos; ve equipos/jugadores pero no los administra.
- **RF-02:** CRUD de **equipos** (nombre único), sin límite fijo.
- **RF-03:** CRUD de **jugadores** por equipo (nombre y número), sin límite fijo.
- **RF-04:** Captura de **estadísticas ofensivas** por jugador y por juego.
- **RF-05:** Cálculo automático de `BAL`, `AL`, `AV` y `SLG`.
- **RF-06:** Captura de **estadísticas de lanzadores** por jugador y por juego.
- **RF-07:** Cálculo automático de `JJ`, `JG`, `JP` y `PCL/ERA`.
- **RF-08:** Número de **juegos de la temporada configurable** (por defecto 15).
- **RF-09:** Dos flujos de captura: **por juego del equipo** (todos los jugadores de
  un juego) y **por jugador** (sus juegos).
- **RF-10:** Configuración de la **información de la liga/campeonato**: división, liga,
  nombre de campeonato (Regular / Campeonato Navidad), temporada y categoría (Infantil / Adulto).

## Fuera de alcance

- Tabla de posiciones y líderes (iteración posterior).
- Importación/exportación del Excel (posterior).
- Aplicación móvil (Fase 3).
- Licencia por disco duro / ID de equipo (Fase 4).
- Sincronización con servicios remotos o multi-instancia.

## Flujo de usuario

1. El usuario abre la app y **inicia sesión** (usuario + contraseña).
2. Ve la **lista de equipos** y selecciona uno.
3. Ve la **lista de jugadores** del equipo y sus acumulados de temporada.
4. Captura estadísticas de un **juego** (ofensiva y lanzadores), ya sea:
   - **por juego:** elige el juego y llena las stats de todos los jugadores, o
   - **por jugador:** elige un jugador y llena sus stats juego por juego.
5. La app calcula y muestra automáticamente AV, SLG y PCL/ERA.
6. El **admin** puede además crear/editar equipos, jugadores y usuarios.

## Datos y reglas de negocio

- **Equipo:** nombre único. **Jugador:** pertenece a un equipo; nombre y número (dorsal).
- **Usuario:** nombre de usuario y contraseña; rol `admin` o `capturador`.
- **Temporada:** número de juegos configurable (por defecto 15).
- **Ofensiva (por juego):** `VB, CA, H, 2B, 3B, HR, CI, K, BB, BR, GP, SH, SF, INT`.
  - `BAL` (bases totales) = `(H - 2B - 3B - HR) + 2B×2 + 3B×3 + HR×4`.
  - `AL` (apariciones) = `VB + BB + GP + SH + SF + INT`.
  - `AV` = `H × 1000 / VB` (por mil, con decimal); `SLG` = `BAL × 1000 / VB`. Si `VB = 0`, `AV = SLG = 0`.
- **Lanzadores (por juego):** `¿lanzó?`, `G/P/S`, `INN` (tercios: 3.1 = 3 entradas y 1 out), `CL`, `K`, `H`.
  - `JJ` = juegos lanzados; `JG` = ganados; `JP` = perdidos; `JS` = salvados (juegos con resultado `S`).
  - `PCL/ERA` = `CL × 9 / INN` (INN en tercios). Sin entradas, `PCL/ERA` = 0.
- **Sin datos:** un jugador sin estadísticas no afecta acumulados; AV/SLG/PCL muestran 0.
- **Entrada inválida:** los campos numéricos son enteros ≥ 0; `INN` acepta tercios
  (`.0`, `.1`, `.2`); los acumulados no pueden ser negativos.

## Comportamiento web y casos alternativos

| Situación | Comportamiento esperado |
| --- | --- |
| Carga o acción en curso | Indicador de carga; no bloquear la app. |
| Sin datos | Mensaje claro ("sin equipos/jugadores") y acción para crear. |
| Entrada inválida | Validación en el formulario con mensaje por campo. |
| Error de servidor | Mensaje de error y posibilidad de reintentar. |
| Backend no disponible | Mensaje de que el backend no responde (local). |
| Sesión expirada / no autenticado | Redirigir al login. |
| Permiso insuficiente | El capturador no ve acciones de admin. |
| Cerrar sin guardar | Guardar automáticamente al guardar el juego; sin guardar, se descarta. |

**Puntos mobile no aplicables:** ciclo de vida, pantallas móviles, permisos y
accesibilidad móvil (aplican en Fase 3). Los estados web básicos se cubren arriba.

## Restricciones del pedido

- Frontend: **Astro**.
- Backend: **Fastify** (servidor separado del frontend).
- Base de datos: **SQLite** con **SQL directo** usando `node:sqlite` (requiere Node 22+).
- App **local** (corre en la máquina del usuario).
- Los cálculos reproducen las reglas de la Fase 1 (Excel).

## Criterios de aceptación

- **CA-01 · RF-01:** Dado un usuario con rol, cuando inicia sesión, entonces accede
  solo a las funciones de su rol; con credenciales incorrectas se rechaza.
- **CA-02 · RF-02:** Dado el CRUD de equipos, cuando creo/edito/elimino un equipo,
  entonces el cambio persiste y se refleja en la lista.
- **CA-03 · RF-03:** Dado un equipo, cuando agrego jugadores con nombre y número,
  entonces aparecen en la lista del equipo y persisten.
- **CA-04 · RF-04/RF-05:** Dado un jugador con estadísticas ofensivas cargadas, cuando
  consulto sus acumulados, entonces AV y SLG son correctos según `H/VB` y `bases/VB`.
- **CA-05 · RF-06/RF-07:** Dado un jugador con estadísticas de pitcheo cargadas, cuando
  consulto sus acumulados, entonces JJ, JG, JP y PCL/ERA son correctos.
- **CA-06 · RF-08:** Dado el número de juegos configurado, cuando capturo estadísticas,
  entonces los acumulados consideran exactamente ese número de juegos.
- **CA-07 · RF-09:** Dados ambos flujos de captura, cuando capturo por juego o por
  jugador, entonces los datos coinciden y persisten en ambas vistas.
- **CA-08 · RF-10:** Dado el formulario de configuración, cuando el admin edita y guarda
  la info de liga/campeonato (división, liga, campeonato, temporada, categoría),
  entonces persiste y se muestra correctamente.

## Cómo se comprueba el comportamiento

| Criterio | Condiciones y pasos | Resultado esperado |
| --- | --- | --- |
| CA-01 | Login con usuario admin y capturador; probar acciones permitidas/prohibidas. | Acceso según rol; credenciales malas rechazadas. |
| CA-02 | Crear/editar/eliminar equipo en la UI y verificar persistencia. | Cambios reflejados y persistentes. |
| CA-03 | Agregar jugadores a un equipo. | Aparecen en la lista y persisten. |
| CA-04 | Cargar ofensiva de prueba y comparar AV/SLG contra cálculo manual. | AV y SLG correctos (ej. H=16, VB=51 → AV 313.7, SLG 372.5). |
| CA-05 | Cargar pitcheo de prueba y comparar PCL/ERA contra cálculo manual. | PCL/ERA correcto (ej. CL=7, 18 IP → 3.5). |
| CA-06 | Configurar número de juegos y capturar; verificar acumulados. | Acumulados sobre el número configurado. |
| CA-07 | Capturar por juego y por jugador; verificar coherencia. | Mismos datos en ambas vistas. |

## Decisiones pendientes

- Ninguna funcional. Detalles técnicos (tablas, endpoints, componentes) van en PLAN.md.

<!-- ANTES DE SOLICITAR APROBACIÓN
Comprueba que el alcance está acordado, los flujos son coherentes y cada requisito
tiene criterios comprobables. Resuelve las dudas y los marcadores pendientes.
El diseño técnico (tablas, endpoints, componentes) va en PLAN.md.
-->
