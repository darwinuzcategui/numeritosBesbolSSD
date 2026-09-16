# Numeritos de Béisbol

Sistema para llevar las estadísticas de una liga de béisbol menor: ofensiva,
pitcheo, tabla de posiciones y líderes. El proyecto avanza por fases, cada una
especificada y aprobada antes de implementarse (Spec-Driven Development).

## Fases

| Fase | Entregable | Estado |
| --- | --- | --- |
| 1. Libro de Excel | `.xlsx` con ofensiva (25 jugadores × 20 equipos), lanzadores, tabla de posiciones y líderes top 10 | En especificación |
| 2. Aplicación web | Web con backend local y base de datos SQLite | Pendiente |
| 3. Aplicación móvil | Android nativo o Flutter (por decidir) | Pendiente |
| 4. Licencia (producción) | Licencia por usuario/equipo: ID de disco duro (escritorio/web) o ID de equipo (móvil) | Pendiente |

## Estructura

```
docs/
├── GENERIC_RULES.md          # reglas de trabajo reutilizables
├── SPEC_TEMPLATE.md          # plantilla de especificación
├── PLAN_TEMPLATE.md          # plantilla de plan técnico
├── MOBILE_GUIDELINES.md      # checklist para fases móviles
└── features/
    └── excel-numeritos/
        └── SPEC.md           # especificación de la Fase 1
numeritos beisbol menor.xls   # archivo original a migrar a .xlsx
```

## Flujo SDD

`SPEC.md` → aprobar → `PLAN.md` → aprobar → `TASKS.md` → implementar → validar.

Ver [AGENTS.md](AGENTS.md) y [docs/GENERIC_RULES.md](docs/GENERIC_RULES.md).
