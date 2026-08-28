# SGC Personal · Documentación de diseño

Sistema de Gestión Comercial Personal · Ejecutivo Comercial, Equipos Supra S.A.S.

> **Estado del proyecto:** Sprints 0, 1, 3, 4 y 5 terminados. Del MVP faltan el importador de Excel
> (Sprint 2, esperando un archivo real) y el respaldo con la reversión de importaciones (Sprint 6).

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

## Registro de avance

| Sprint | Estado | Entregable |
|---|---|---|
| 0 · Fundación | **Terminado** (26-ago-2026) | Aplicación instalable, navegable, con tema claro/oscuro y funcionamiento sin conexión |
| 1 · Maestro de clientes | **Terminado** (26-ago-2026) | Cartera completa cargada, consultable e importable desde Excel |
| 2 · Importación de ventas | Siguiente · **bloqueado por D-03** | El Excel del mes entra completo y correcto |
| 3 · Presupuesto e indicadores | **Terminado** (28-ago-2026) | **Primer valor real:** la situación comercial en menos de 5 segundos |
| 4 · Ficha del cliente | **Terminado** (28-ago-2026) | Preparar una visita con toda la información en pantalla |
| 5 · Reportes imprimibles | **Terminado** (28-ago-2026) | El informe del mes, impreso y presentable |
| 6 · Confianza y pulido | Pendiente | MVP terminado |
