# Design System — Numeritos (Fase 2 web)

## Dirección / sensación

"Marcador" (scoreboard) + libro de anotación de béisbol. Moderno y limpio, con la
paleta del Excel de la Fase 1: amarillo y azul. Barra superior oscura (marcador)
con franja amarilla; contenido claro tipo "papel" con tarjetas y tablas.

## Paleta (tokens)

| Token | Valor | Uso |
| --- | --- | --- |
| `--yellow` | `#F6C600` | acento principal (botones clave, activo, marca) |
| `--yellow-strong` | `#E5B800` | hover del amarillo |
| `--yellow-paper` | `#FFFBE6` | fondo resaltado (hover de filas) |
| `--blue` | `#1F4E8C` | acciones, enlaces, botón primario |
| `--blue-soft` | `#E9EFF8` | encabezados de tabla |
| `--blue-pale` | `#CCCCFF` | borde inferior de encabezados (Excel) |
| `--navy` / `--navy-2` | `#141B2D` / `#1C2540` | barra superior |
| `--ink` / `--ink-2` / `--ink-3` | `#172033` / `#43506A` / `#8892A6` | jerarquía de texto |
| `--line` / `--line-soft` / `--line-strong` | rgba(23,32,51,…) | jerarquía de bordes |
| `--surface` / `--surface-2` / `--canvas` | `#FFF` / `#F7F9FC` / `#F4F6FA` | elevación de superficies |

## Estrategia de profundidad

Bordes finos (baja opacidad) + sombra suave (`--shadow-sm`). No mezclar con
sombras dramáticas. Elevación por tono (superficie, superficie-2, canvas).

## Espaciado

Base de 8px. Escala: micro (0.25/0.35rem), componente (0.5/0.6rem), sección
(0.7/0.9rem), área (1.25/1.5rem).

## Tipografía

Stack del sistema (`Segoe UI`, system-ui…). Datos/estadísticas con
`font-variant-numeric: tabular-nums`; números clave en mono (`--mono`).
Jerarquía: h1 (1.5rem, 700), h2 (1.05rem, 650), labels (0.82rem, 600), muted (0.72rem).

## Componentes clave

- **Topbar (marcador):** `navy` con franja `yellow`; marca "Numeritos ◆"; info de
  liga (división · temporada / liga · categoría · campeonato); nav con estado
  `.active` (fondo amarillo translúcido); badge de rol + botón "Salir" ghost.
- **Card:** fondo `surface`, borde `line-soft`, radio `--radius-m`, sombra suave.
- **Tabla (libro de anotación):** envuelta en `.table-wrap`; `thead` con `blue-soft`
  + borde inferior `blue-pale`; filas alternadas `surface-2`; hover `yellow-paper`.
- **Botones:** base azul; `.btn-yellow` para acción principal; `.btn-ghost` (barra);
  foco con anillo `box-shadow` azul.
- **Radios:** `--radius-s` (inputs/botones), `--radius-m` (tarjetas).

## Reglas

- Un solo acento (amarillo) con intención; azul para estructura/acciones.
- Bordes con rgba (no hex sólidos). Sin gradientes decorativos.
- Estados: hover/focus/disabled en controles; empty/error/loading en datos.
