# SGC Personal · Documentación de diseño

Sistema de Gestión Comercial Personal · Ejecutivo Comercial, Equipos Supra S.A.S.

> **Estado del proyecto:** diseño completado, pendiente de aprobación. Ninguna línea de código escrita.

## Documentos

| Documento | Contenido |
|---|---|
| [01 · Producto](./01-producto.md) | Visión, alcance del MVP, requerimientos funcionales y no funcionales, casos de uso, historias de usuario y decisiones pendientes |
| [02 · Arquitectura](./02-arquitectura.md) | Arquitectura de software, modelo de datos, estructura de carpetas, diseño UX/UI, riesgos técnicos y stack tecnológico |
| [03 · Plan](./03-plan.md) | Roadmap, backlog priorizado, sprints y forma de trabajo |

## Resumen en una página

**Qué es.** Un panel de control comercial personal que convierte el Excel de ventas de la empresa en
respuestas accionables sobre el cumplimiento del territorio, y guarda el conocimiento del cliente que
hoy no vive en ningún sistema.

**Qué NO es.** No es un ERP, no es un Excel bonito, no es una app de campo (todavía), no es multiusuario.

**MVP.** "Control de Cumplimiento": importar Excel → maestro de clientes → presupuesto → indicadores →
reportes imprimibles → respaldo. Seis semanas más una de fundación.

**Stack.** React + TypeScript + Vite + Tailwind + shadcn/ui + Dexie/IndexedDB + Recharts + SheetJS.
Todo gratuito. Costo de operación: $ 0.

**La regla que sostiene el diseño.** La lógica de negocio no sabe que existe IndexedDB. Esa única regla
es la que permitirá migrar a SQLite y luego a PostgreSQL sin reescribir la aplicación.

## Decisiones pendientes antes de codificar

| ID | Decisión |
|---|---|
| D-01 | Indicador de mezcla de producto: el Excel actual no trae detalle de producto |
| D-02 | Cuántos meses de histórico se pueden conseguir |
| D-03 | Archivo Excel de ejemplo en `docs/ejemplos/` |

## Registro de decisiones de arquitectura

Las decisiones que se tomen durante el desarrollo se documentan en `docs/adr/`.
