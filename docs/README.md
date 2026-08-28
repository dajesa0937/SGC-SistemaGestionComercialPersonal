# SGC Personal · Documentación de diseño

Sistema de Gestión Comercial Personal · Ejecutivo Comercial, Equipos Supra S.A.S.

> **Estado del proyecto:** MVP terminado. Los siete sprints están cerrados, incluido el importador
> de ventas, verificado contra el archivo real de la empresa.

## Documentos

| Documento | Contenido |
|---|---|
| [01 · Producto](./01-producto.md) | Visión, alcance del MVP, requerimientos funcionales y no funcionales, casos de uso, historias de usuario y decisiones pendientes |
| [02 · Arquitectura](./02-arquitectura.md) | Arquitectura de software, modelo de datos, estructura de carpetas, diseño UX/UI, riesgos técnicos y stack tecnológico |
| [03 · Plan](./03-plan.md) | Roadmap, backlog priorizado, sprints y forma de trabajo |
| [04 · Manual de uso](./04-manual.md) | Cómo se usa la aplicación en el día a día |

## Resumen en una página

**Qué es.** Un panel de control comercial personal que convierte el Excel de ventas de la empresa en
respuestas accionables sobre el cumplimiento del territorio, y guarda el conocimiento del cliente que
hoy no vive en ningún sistema.

**Qué NO es.** No es un ERP, no es un Excel bonito, no es una app de campo (todavía), no es multiusuario.

**MVP.** "Control de Cumplimiento": importar Excel → maestro de clientes → presupuesto → indicadores →
reportes imprimibles → respaldo. Seis semanas más una de fundación.

**Stack.** React 19 + TypeScript + Vite + Tailwind 4 + Dexie/IndexedDB + read-excel-file. Los
gráficos se dibujan en SVG a mano (ADR 0005) y el catálogo DANE de los 1.122 municipios del país va
dentro de la aplicación (ADR 0007). Todo gratuito. Costo de operación: $ 0.

**La regla que sostiene el diseño.** La lógica de negocio no sabe que existe IndexedDB. Esa única regla
es la que permitirá migrar a SQLite y luego a PostgreSQL sin reescribir la aplicación.

## Decisiones pendientes

| ID | Decisión |
|---|---|
| D-01 | **Resuelta.** El archivo de ventas sí trae categoría y producto: la mezcla se calcula y está en el panel |
| D-02 | **Resuelta a medias.** Hay ocho meses de histórico: comparativo mes a mes sí, interanual todavía no |
| D-03 | **Resuelta.** Llegaron el maestro de clientes y el archivo de ventas; los dos se importan y están verificados |
| D-04 | Si el reporte de cuentas por cobrar se convierte en un módulo de cartera |

## Registro de decisiones de arquitectura

Las decisiones que se tomen durante el desarrollo se documentan en `docs/adr/`.

## Registro de avance

| Sprint | Estado | Entregable |
|---|---|---|
| 0 · Fundación | **Terminado** (26-ago-2026) | Aplicación instalable, navegable, con tema claro/oscuro y funcionamiento sin conexión |
| 1 · Maestro de clientes | **Terminado** (26-ago-2026) | Cartera completa cargada, consultable e importable desde Excel |
| 2 · Importación de ventas | **Terminado** (28-ago-2026) | El Excel del mes entra completo y correcto, con detalle de producto |
| 3 · Presupuesto e indicadores | **Terminado** (28-ago-2026) | **Primer valor real:** la situación comercial en menos de 5 segundos |
| 4 · Ficha del cliente | **Terminado** (28-ago-2026) | Preparar una visita con toda la información en pantalla |
| 5 · Reportes imprimibles | **Terminado** (28-ago-2026) | El informe del mes, impreso y presentable |
| 6 · Respaldo y confianza | **Terminado** (28-ago-2026) | Los datos se pueden sacar del navegador y volver a entrar |
| 7 · Datos reales y geografía | **Terminado** (28-ago-2026) | El maestro real cargado, municipios de toda Colombia y zonas propias |

**MVP terminado el 28 de agosto de 2026**, con los datos reales dentro y cada cifra contrastada
contra su archivo de origen.
