# SPEC: Tabla de numeritos de béisbol (Excel v1)

**Estado:** Aprobada <!-- Borrador | En revisión | Aprobada -->

<!-- PARA LA PERSONA
Copia esta plantilla como SPEC.md en una carpeta de la funcionalidad.
Pide al agente que la complete contigo usando MOBILE_GUIDELINES.md.
SPEC.md define qué debe cumplirse; PLAN.md desarrolla cómo implementarlo;
TASKS.md organiza los pasos de ejecución.
-->

<!-- PARA EL AGENTE
- Lee las instrucciones del proyecto y MOBILE_GUIDELINES.md. Inspecciona el
  repositorio para comprobar el comportamiento actual. Si falta la guía, pide su ubicación.
- Completa esta spec con la persona: investiga lo comprobable y consulta las
  decisiones pendientes. Haz pocas preguntas por vez y actualiza las respuestas.
- No inventes requisitos ni exclusiones. Distingue propuestas de decisiones
  confirmadas y marca como PENDIENTE lo que aún no esté resuelto.
- Aplica las consideraciones mobile relevantes sin ampliar el alcance automáticamente.
- No incluyas diseño de clases, tablas, componentes, archivos o algoritmos:
  esos detalles pertenecen a PLAN.md. Sí registra restricciones explícitas del pedido.
- Mantén el documento breve y proporcional a la funcionalidad. Conserva los comentarios.
- Un documento completo no está aprobado automáticamente. Solicita aprobación
  antes de marcarlo como Aprobada. No implementes durante esta etapa.
-->

## Qué construimos y para quién

Un libro de Excel que sirve para llevar las estadísticas ofensivas, de pitcheo
y la tabla de posiciones de una liga de béisbol menor, dirigido a quien organiza
y registra los "numeritos" de la liga. El libro debe calcular automáticamente los
acumulados, el average, el slugging, la tabla de posiciones y los líderes
(top 10) por renglón, sin que el usuario tenga que ordenar o sumar a mano.

Esta es la **primera fase** de un proyecto que después evolucionará hacia una
aplicación móvil y una aplicación web local (con licencia por equipo). En esta
fase el entregable es únicamente el libro de Excel funcionando.

## Situación actual

Verificado en `numeritos beisbol menor.xls` (formato `.xls` antiguo):

- Contiene **10 hojas de equipo** (`equipo1`..`equipo10`) y una hoja
  `total general`.
- Cada hoja de equipo registra solo **ofensiva individual**, en bloques
  horizontales de 17 columnas, uno por juego (**15 juegos** por equipo).
- Cada equipo tiene **19 filas de jugadores** (filas 8 a 26).
- `total general` consolida, por referencia directa, un bloque resumen
  ("LÍDERES INDIVIDUAL") de cada equipo: `NOMBRE, No, organización, VB, CA, H,
  2B, 3B, HR, CI, K, BB, BR, GP, SH, SF, INT, BAL, AL, AV, SLG`.
- `AV` = `H*1000/VB` y `SLG` = `bases totales*1000/VB`, ambas como número entero
  (por ejemplo, 250 equivale a .250). `BAL` (columna Q) calcula las bases totales;
  `AL` (columna R) calcula `VB+BB+GP+SH+SF+INT`.
- **No existen** secciones de lanzadores ni tabla de posiciones.
- **No existe** cálculo de líderes (top 10).
- Detectada una inconsistencia en `equipo3` (una columna desplazada respecto a
  los demás equipos).

Debe conservarse: los datos reales ya capturados (nombres de jugadores y
estadísticas por juego) y la lógica de cálculo de AV/SLG/AL existente.

## Dentro del alcance

- **RF-01:** Cada equipo admite hasta **25 jugadores** en su tabla ofensiva.
- **RF-02:** El libro admite **20 equipos**.
- **RF-03:** La hoja `total general` consolida automáticamente los 20 equipos.
- **RF-04:** Se muestran automáticamente los **10 mejores** en: average de bateo
  (AV), slugging (SLG), jonrones (HR), carreras impulsadas (CI) e hits conectados (H).
- **RF-05:** Se incorpora una sección de **lanzadores** (pitcheo) por equipo, con
  el mismo roster de 25 jugadores y columnas: JJ, JG, JP, entradas lanzadas (INN),
  carreras limpias (CL), ponches (K), hits permitidos (H) y efectividad (PCL/ERA).
- **RF-06:** Se incorpora una **tabla de posiciones** de equipos con los renglones:
  Juegos Jugados (JJ), Juegos Ganados (JG), Juegos Perdidos (JP), Juegos Empatados (JE),
  Carreras Anotadas (CA), Carreras Recibidas (CR), Diferencia de carreras (neta CA−CR),
  Diferencia a favor y en contra (dos columnas: a favor = CA y en contra = CR),
  y Average.
- **RF-07:** La tabla de posiciones y los líderes se actualizan automáticamente
  al registrar resultados.
- **RF-08:** Se muestran automáticamente los **líderes de lanzadores** (top 10)
  por: PCL/ERA (menor), JG (más ganados), K (más ponches), INN (más entradas) y
  H permitidos (menor).

## Fuera de alcance

- Aplicación móvil y aplicación web local (fases posteriores).
- Sistema de licencia por disco duro / ID de equipo (fase final, producción).
- Importación/exportación desde fuentes externas o conexión a servicios remotos.
- Macros/Apps Script de Google Sheets (la variante `.xlsx` usa solo fórmulas
  dinámicas; la automatización VBA queda en la variante `.xlsm`).

## Flujo de usuario

1. El usuario abre el libro y selecciona la hoja del equipo.
2. Captura el resultado y las estadísticas ofensivas de cada juego en el bloque
   del juego correspondiente.
3. Captura las estadísticas de pitcheo de cada juego en la sección de lanzadores.
4. El libro calcula automáticamente acumulados, AV, SLG y PCL/ERA.
5. El resultado de cada juego (ganado/perdido/empatado y carreras) alimenta
   automáticamente la tabla de posiciones.
6. En la hoja `total general`, el usuario consulta la tabla consolidada y los
   líderes (top 10) de ofensiva y de pitcheo.

## Datos y reglas de negocio

- **Ofensiva (existente):** columnas `NOMBRE, No, VB, CA, H, 2B, 3B, HR, CI, K,
  BB, BR, GP, SH, SF, INT, BAL, AL`, con `AV = H/VB` y `SLG = bases totales/VB`.
  AV y SLG se muestran en formato decimal `.XXX` (ej. .250).
- **Líderes ofensivos top 10:** se ordenan de mayor a menor por AV, SLG, HR, CI y H.
  Si hay empate en el corte, se muestran todos los empatados (la lista puede superar 10).
- **Lanzadores:** mismo roster de 25 jugadores; columnas JJ, JG, JP, INN, CL, K,
  H permitidos y PCL/ERA. INN se registra en tercios (ej. 3.1 = 3 entradas y 1 out).
  `PCL/ERA = (CL × 9) / INN` (INN convertido a tercios).
- **Tabla de posiciones:** renglones JJ, JG, JP, JE, CA, CR, diferencia neta
  (CA−CR), dos columnas a favor (CA) y en contra (CR), y Average. Average =
  `(JG + 0.5×JE) / JJ`. Los equipos se ordenan por Average descendente y, a igual
  Average, por diferencia de carreras descendente. Los datos se alimentan desde la
  captura de resultados por juego en cada hoja de equipo.
- **Sin datos:** un jugador sin estadísticas muestra celdas vacías y no altera los
  acumulados; AV/SLG con VB=0 muestran 0.

## Comportamiento mobile y casos alternativos

<!-- Adapta la tabla usando MOBILE_GUIDELINES.md. Añade escenarios relevantes.
Marca No aplica con su motivo cuando corresponda. -->

| Situación | Comportamiento esperado |
| --- | --- |
| Carga o acción en curso | No aplica (archivo local, sin red ni carga asíncrona). |
| Sin datos | Un jugador sin estadísticas se muestra en blanco y no altera los acumulados. |
| Entrada inválida | El texto en una columna numérica no rompe los totales (las fórmulas SUM lo ignoran); AV/SLG con VB=0 muestran 0. |
| Error o espera excesiva | No aplica (cálculo local de Excel). |
| Sin conexión o conexión interrumpida | No aplica (no requiere red). |
| Cancelar o volver atrás | No aplica. |
| Pasar a segundo plano y regresar | No aplica (no es app). |
| Recrear la pantalla | No aplica (no es app). |
| Reabrir después de terminarse el proceso | El archivo conserva lo guardado; los cálculos se recalculan al abrir. |

**Puntos de la guía no aplicables y motivo:** todos los puntos específicos de
aplicación móvil (ciclo de vida, conectividad, permisos, accesibilidad de app)
no aplican porque esta fase entrega un libro de Excel de escritorio, no una app.

## Restricciones del pedido

- Entregable de esta fase: libro de Excel (no app).
- 25 jugadores por equipo.
- 20 equipos.
- Líderes top 10 en AV, SLG, HR, CI y H.
- Tabla de posiciones con los renglones indicados.
- Actualización automática de resultados, posiciones y líderes.
- Dos entregables: `.xlsm` (fórmulas + macros VBA, para Excel de escritorio) y
  `.xlsx` (fórmulas dinámicas SORT/FILTER/TAKE/LARGE, compatible con Excel 365 y
  Google Sheets).
- Las fórmulas dinámicas del `.xlsx` requieren Excel 365 o Google Sheets.

## Criterios de aceptación

- **CA-01 · RF-01:** Dado un equipo con 25 jugadores cargados, cuando se observa
  la hoja del equipo, entonces los 25 jugadores se muestran y sus acumulados se
  calculan sin cortar filas.
- **CA-02 · RF-02:** Dado el libro con 20 equipos creados, cuando se revisan las
  hojas, entonces existen las 20 hojas de equipo y la hoja resumen las referencia.
- **CA-03 · RF-03:** Dado un dato editado en una hoja de equipo, cuando se abre la
  hoja `total general`, entonces el valor consolidado refleja el cambio.
- **CA-04 · RF-04:** Dados los acumulados de todos los equipos, cuando se consulta
  la sección de líderes, entonces se listan en orden correcto los mejores por AV,
  SLG, HR, CI y H; y si hay empate en el corte, se muestran todos los empatados.
- **CA-05 · RF-05:** Dado el registro de pitcheo de un equipo, cuando se consulta
  la sección de lanzadores, entonces JJ, JG, JP, INN, CL, K, H y PCL/ERA por
  jugador son correctos según `PCL/ERA = (CL × 9) / INN`.
- **CA-06 · RF-06:** Dados los resultados registrados, cuando se consulta la tabla
  de posiciones, entonces JJ, JG, JP, JE, CA, CR, diferencia, a favor/en contra y
  Average por equipo son correctos y los equipos se ordenan por Average desc y
  luego por diferencia desc.
- **CA-07 · RF-07:** Dado un nuevo resultado ingresado, cuando se recalculan las
  fórmulas, entonces la tabla de posiciones y los líderes se actualizan sin pasos manuales.
- **CA-08 · RF-08:** Dados los registros de pitcheo, cuando se consulta la sección
  de líderes de lanzadores, entonces se listan en orden correcto los mejores por
  PCL/ERA, JG, K, INN y H permitidos, mostrando los empatados del corte.

## Cómo se comprueba el comportamiento

| Criterio | Condiciones y pasos | Resultado esperado |
| --- | --- | --- |
| CA-01 | Cargar 25 jugadores con datos en una hoja de equipo y revisar acumulados. | Se muestran 25 filas con acumulados correctos, sin cortes. |
| CA-02 | Revisar la lista de hojas del libro. | Existen 20 hojas de equipo más la hoja resumen. |
| CA-03 | Editar un valor ofensivo en un equipo y revisar `total general`. | El valor consolidado refleja el cambio. |
| CA-04 | Verificar la sección de líderes con datos conocidos. | Los 10 mejores por AV, SLG, HR, CI y H en orden; empatados del corte incluidos. |
| CA-05 | Ingresar pitcheo de prueba y verificar cada columna contra cálculo manual. | JJ, JG, JP, INN, CL, K, H y PCL/ERA correctos. |
| CA-06 | Ingresar resultados de varios equipos y verificar posiciones. | JJ, JG, JP, JE, CA, CR, diferencia, a favor/en contra y Average correctos y orden correcto. |
| CA-07 | Cambiar un resultado y recalcular. | Posiciones y líderes se actualizan solos. |
| CA-08 | Verificar líderes de lanzadores con datos conocidos. | Mejores por PCL/ERA, JG, K, INN y H permitidos en orden; empatados incluidos. |

Además, la variante `.xlsx` debe verificarse abriéndola en Google Sheets y
comprobando que las fórmulas dinámicas recalcular correctamente.

## Decisiones pendientes

Ninguna.

<!-- ANTES DE SOLICITAR APROBACIÓN
Comprueba que el alcance está acordado, los flujos son coherentes, los puntos
mobile relevantes están cubiertos y cada requisito tiene criterios comprobables.
Resuelve las dudas y los marcadores pendientes. Mantén el diseño técnico en PLAN.md.
-->
