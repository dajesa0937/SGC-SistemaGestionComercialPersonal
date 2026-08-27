# SGC Personal · Plan de Ejecución

**Versión:** 1.0 · **Fecha:** 26 de agosto de 2026

---

## 11. Roadmap del proyecto

**Supuesto de capacidad:** proyecto personal, entre 8 y 10 horas semanales. *Este supuesto hay que
confirmarlo: si la dedicación real es menor, el plan se estira proporcionalmente y es mejor saberlo
ahora que descubrirlo en la semana 4.*

```
FASE 0 · FUNDACIÓN                                          1 semana
└─ Andamiaje, capas, base de datos, layout, tema, PWA
   ▸ Entregable: aplicación instalable, navegable y vacía

FASE 1 · MVP "CONTROL DE CUMPLIMIENTO"                      6 semanas
├─ Maestro de clientes
├─ Importación de Excel
├─ Presupuesto y motor de indicadores
├─ Panel de control              ◄── PRIMER VALOR REAL (semana 4)
├─ Reportes imprimibles
└─ Respaldo y endurecimiento
   ▸ Entregable: sustituye el Excel como herramienta de consulta diaria

FASE 2 · GESTIÓN COMERCIAL                                  4 semanas
├─ Agenda y visitas
├─ Seguimientos con recordatorios
└─ Oportunidades y pipeline
   ▸ Entregable: nada comprometido se pierde

FASE 3 · TERRITORIO                                         3 semanas
├─ Zonas y geolocalización de clientes
├─ Mapa con Leaflet + OpenStreetMap
└─ Planificación de rutas semanales
   ▸ Entregable: el territorio se ve, no se imagina

FASE 4 · NUBE                                               4 semanas
├─ Backend PostgreSQL (Supabase, plan gratuito)
├─ Sincronización offline-first
└─ Acceso real desde el celular
   ▸ Entregable: los mismos datos en cualquier dispositivo

FASE 5 · CRM COMERCIAL                                      abierta
└─ Multiusuario, roles, equipo, reportes de jefatura
   ▸ Solo si la fase 1 demostró valor sostenido durante al menos 6 meses
```

**Regla de avance entre fases:** no se inicia una fase nueva hasta que la anterior lleve **un mes
completo en uso real**. Es la única forma de saber si lo construido sirve antes de construir encima.

---

## 12. Backlog priorizado

Prioridad calculada como **valor ÷ esfuerzo**, en escala de 1 a 5. Los empates se rompen por
dependencia técnica.

| # | Historia | Valor | Esf. | Prio. | Fase |
|---|---|---|---|---|---|
| 1 | Andamiaje del proyecto y capas de arquitectura | 5 | 2 | **Crítica** | 0 |
| 2 | Esquema Dexie y repositorios base | 5 | 2 | **Crítica** | 0 |
| 3 | Layout, sidebar, breadcrumb y modo oscuro | 4 | 2 | **Crítica** | 0 |
| 4 | PWA instalable y funcionamiento sin conexión (HU-23) | 4 | 1 | **Crítica** | 0 |
| 5 | HU-07 · Lista de clientes con búsqueda y filtros | 5 | 3 | **Alta** | 1 |
| 6 | CRUD de clientes (RF-B01) | 5 | 2 | **Alta** | 1 |
| 7 | HU-01 · Importar Excel de ventas | 5 | 4 | **Alta** | 1 |
| 8 | HU-02 · Recordar el mapeo de columnas | 4 | 1 | **Alta** | 1 |
| 9 | HU-12 · Definir cuota mensual | 5 | 2 | **Alta** | 1 |
| 10 | HU-13 · Cumplimiento del mes | 5 | 2 | **Alta** | 1 |
| 11 | HU-14 · Proyección de cierre y ritmo requerido | 5 | 2 | **Alta** | 1 |
| 12 | HU-15 · Serie de 12 meses contra meta | 4 | 2 | **Alta** | 1 |
| 13 | HU-21 · Respaldo y restauración | 5 | 2 | **Alta** | 1 |
| 14 | HU-03 · Resolver clientes no reconocidos con alias | 5 | 3 | **Alta** | 1 |
| 15 | HU-04 · Reimportación idempotente | 5 | 2 | **Alta** | 1 |
| 16 | HU-05 · Carga de histórico multi-periodo | 4 | 3 | **Media** | 1 |
| 17 | HU-08 · Ficha 360 en panel lateral | 4 | 3 | **Media** | 1 |
| 18 | HU-10 · Detección de clientes en riesgo e inactivos | 5 | 2 | **Alta** | 1 |
| 19 | HU-09 · Clasificación ABC automática | 4 | 2 | **Media** | 1 |
| 20 | HU-16 · Cobertura y clientes nuevos | 4 | 2 | **Media** | 1 |
| 21 | HU-17 · Ranking de clientes con variaciones | 4 | 2 | **Media** | 1 |
| 22 | HU-18 · Informe mensual imprimible | 5 | 3 | **Alta** | 1 |
| 23 | HU-19 · Impresión de listas filtradas | 4 | 2 | **Media** | 1 |
| 24 | HU-22 · Recordatorio de respaldo | 3 | 1 | **Media** | 1 |
| 25 | RF-F07 · Configuración de umbrales de negocio | 3 | 2 | **Media** | 1 |
| 26 | HU-11 · Notas del cliente | 3 | 2 | **Media** | 1 |
| 27 | HU-06 · Revertir la última importación | 3 | 3 | **Baja** | 1 |
| 28 | HU-20 · Exportar tablas a CSV | 2 | 1 | **Baja** | 1 |
| 29 | RF-B09 · Importar maestro de clientes desde Excel | 3 | 2 | **Media** | 1 |
| 30 | RF-E03 · Ficha de cliente imprimible | 3 | 1 | **Media** | 1 |

---

## 13. Sprints de desarrollo

Sprints de **una semana**. Cada sprint termina con algo que se puede abrir y usar: **no hay sprints
de infraestructura invisible**. Es la mitigación estructural del riesgo R-07 (abandono).

### Definición de Terminado (aplica a todo sprint)

Una historia está terminada cuando:

- [ ] Cumple todos sus criterios de aceptación
- [ ] `tsc --noEmit` pasa sin errores y sin `any`
- [ ] ESLint pasa, incluidas las reglas de dependencia entre capas
- [ ] Si toca `application/indicadores/`, tiene pruebas y la cobertura del módulo sigue ≥ 90 %
- [ ] Funciona en modo claro y oscuro
- [ ] Tiene estado de carga, estado vacío y estado de error
- [ ] Si muestra datos, se puede imprimir sin elementos de navegación
- [ ] Está commiteada en una rama y fusionada a `main`

---

### Sprint 0 · Fundación
**Objetivo:** que exista un esqueleto correcto sobre el cual todo lo demás sea fácil.

- Proyecto Vite + React + TypeScript `strict`
- TailwindCSS y shadcn/ui configurados con tokens de tema
- Estructura de carpetas completa de §9 (con archivos `index.ts` vacíos)
- ESLint con `import/no-restricted-paths` haciendo cumplir las reglas de capas
- `domain/shared/`: tipos `Id`, `Periodo`, `Pesos`, utilidades de periodo con pruebas
- Esquema Dexie versión 1 e interfaces de repositorio
- `LayoutPrincipal` con sidebar, breadcrumb, selector de periodo y conmutador de tema
- Rutas vacías para las 6 secciones
- `vite-plugin-pwa` con manifiesto e íconos
- Repositorio en GitHub y despliegue en Netlify

**Entregable demostrable:** aplicación instalable desde el navegador, con navegación completa, modo
oscuro y funcionamiento sin conexión, aunque todas las pantallas estén vacías.

**Riesgo del sprint:** perder días afinando el tema visual. Regla: tokens por defecto de shadcn, se
afinan después.

---

### Sprint 1 · Maestro de clientes
**Objetivo:** que la cartera exista dentro de la aplicación.

- Repositorio de clientes sobre Dexie + hook `useClientes`
- Formulario de creación y edición (React Hook Form + Zod)
- Archivado (nunca eliminación)
- Componente `TablaDatos` reutilizable con orden y paginación
- Búsqueda por nombre, código y NIT; filtros por zona y estado
- Persistencia de filtros en la URL
- Estado vacío con acción
- Importación del maestro de clientes desde Excel (backlog #29) — reutiliza el lector de SheetJS y sirve de ensayo para el importador de ventas

**Entregable demostrable:** cartera completa cargada y consultable.

---

### Sprint 2 · Importación de ventas
**Objetivo:** que los datos de ventas entren a la aplicación.

- `infrastructure/excel/lector-excel.ts` encapsulando SheetJS
- Detección de hojas y heurística de propuesta de mapeo
- Asistente de 3 pasos (§10.6)
- `analizarArchivo.ts`: produce la vista previa **sin escribir nada**
- Conciliación en cascada: código → alias → nombre normalizado
- Resolución manual de no reconocidos, creando alias
- `aplicarImportacion.ts` transaccional e idempotente
- Persistencia del último mapeo usado

**Entregable demostrable:** el Excel real del mes entra completo y correcto a la aplicación.

**Riesgo del sprint:** es el sprint más difícil del proyecto. Si se desborda, se recorta la heurística
de detección automática de columnas (el usuario mapea a mano) antes que la vista previa. **La vista
previa no es negociable.**

---

### Sprint 3 · Presupuesto, indicadores y panel ◄ *primer valor real*
**Objetivo:** responder "¿cómo voy?" sin abrir Excel.

- Grilla anual de presupuesto editable en línea
- Motor de indicadores completo con pruebas ≥ 90 %:
  `calcularCumplimiento`, `proyectarCierre`, `calcularCobertura`, `detectarClientesNuevos`,
  `detectarAlertas`, `construirSerie12Meses`, `clasificarABC`
- `lib/diasHabiles.ts` con festivos de Colombia y pruebas
- Panel completo: 4 tarjetas de KPI, gráfica de 12 meses (Recharts), bloque *Requieren atención*, Top 10
- Validación cruzada: los totales de la aplicación deben coincidir **exactamente** con los del Excel original

**Entregable demostrable:** al abrir la aplicación se conoce la situación comercial completa en menos
de 5 segundos. **A partir de aquí la herramienta ya se usa a diario.**

---

### Sprint 4 · Ficha del cliente y análisis
**Objetivo:** entender qué hay detrás de cada número.

- Panel lateral con pestañas (Resumen, Histórico, Notas, Datos)
- Gráfica de 12 meses por cliente
- Minigráficas SVG en la tabla de clientes
- Clasificación ABC y estado derivado visibles como badges
- Variaciones contra mes anterior y contra mismo mes del año anterior
- Notas fechadas
- Pantalla de configuración de umbrales de negocio

**Entregable demostrable:** se puede preparar una visita con toda la información del cliente en pantalla.

---

### Sprint 5 · Reportes imprimibles
**Objetivo:** llevar la información fuera de la pantalla.

- `LayoutImpresion` y hoja `print.css` (§10.10)
- Informe mensual de gestión
- Impresión de la lista de clientes respetando filtros y orden
- Ficha individual del cliente imprimible
- Exportación a CSV
- Pruebas de impresión reales en papel y en PDF

**Entregable demostrable:** el informe del mes sale impreso y presentable.

---

### Sprint 6 · Confianza y pulido
**Objetivo:** poder depender de la herramienta sin miedo.

- Exportación y restauración de respaldo completo
- `navigator.storage.persist()` y aviso de respaldo pendiente
- Historial de importaciones y reversión de la última
- Revisión de accesibilidad (teclado y contraste)
- Revisión de rendimiento y tamaño del paquete
- Refactorización de la deuda acumulada en 6 sprints
- Manual breve de uso en `docs/`

**Entregable demostrable:** MVP terminado según los criterios de §2.

---

## Cómo vamos a trabajar

**Ciclo por sprint:**

1. **Refinamiento** — al iniciar el sprint repasamos sus historias y cerramos las ambigüedades. Si aparece una decisión de producto, se resuelve antes de codificar, no durante.
2. **Diseño** — para cada módulo se recorren los pasos del flujo obligatorio: analizar → alternativas → recomendación → arquitectura → UX → modelo → componentes → interfaces TypeScript. **Las interfaces se escriben antes que las implementaciones.**
3. **Implementación** — módulo por módulo, cada uno terminado antes de empezar el siguiente.
4. **Revisión** — al cerrar el sprint: verificación contra la Definición de Terminado, revisión de código y anotación de la deuda técnica detectada.
5. **Refactorización** — la deuda anotada se paga en el sprint siguiente, no "algún día".

**Convenciones de trabajo:**

- Una rama por historia (`feat/HU-07-lista-clientes`), fusionada a `main` al terminarla.
- Commits en formato convencional (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`).
- `main` siempre desplegable: si `main` está roto, arreglarlo es la prioridad número uno.
- La documentación de `docs/` se actualiza en el mismo commit que cambia la decisión que documenta. Documentación desactualizada es peor que no tener documentación.
- Cada decisión de arquitectura relevante que se tome durante el desarrollo se registra como un ADR corto en `docs/adr/`: contexto, opciones, decisión y consecuencias. En un año nadie recuerda por qué se hizo algo; el ADR sí.

**Antes de empezar el Sprint 0 hacen falta tres cosas:**

1. Resolver la decisión **D-01** (mezcla de producto) o aceptar explícitamente aplazarla a la fase 2.
2. Confirmar cuántos meses de histórico se pueden conseguir (**D-02**).
3. Un archivo Excel de ejemplo en `docs/ejemplos/` (**D-03**), aunque tenga las cifras alteradas. El importador es el componente más riesgoso del proyecto y no se puede diseñar bien contra un formato imaginario.
