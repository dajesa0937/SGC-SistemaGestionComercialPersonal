# SGC Personal · Documento de Arquitectura

**Versión:** 1.0 · **Fecha:** 26 de agosto de 2026

---

## 7. Arquitectura de software

### 7.1 Principio rector

> **La lógica de negocio no puede saber que existe IndexedDB.**

Esta única regla es la que hace posible la migración IndexedDB → SQLite → PostgreSQL sin reescribir
la aplicación. Todo lo demás en esta sección se deriva de ella.

### 7.2 Capas

```
┌──────────────────────────────────────────────────────┐
│  presentation/     React, shadcn/ui, Recharts        │
│                    Páginas, componentes, hooks de UI  │
└────────────────────────┬─────────────────────────────┘
                         │ depende de
┌────────────────────────▼─────────────────────────────┐
│  application/      Casos de uso y servicios           │
│                    Cálculo de indicadores, importación│
└────────────────────────┬─────────────────────────────┘
                         │ depende de
┌────────────────────────▼─────────────────────────────┐
│  domain/           Entidades, tipos, reglas puras     │
│                    INTERFACES de repositorio          │
│                    ← no depende de NADA               │
└────────────────────────▲─────────────────────────────┘
                         │ implementa
┌────────────────────────┴─────────────────────────────┐
│  infrastructure/   Dexie, SheetJS, respaldo, archivos │
│                    IMPLEMENTACIONES de repositorio    │
└──────────────────────────────────────────────────────┘
```

**Reglas de dependencia (no negociables):**

1. `domain/` no importa absolutamente nada: ni React, ni Dexie, ni librerías externas.
2. `application/` solo importa de `domain/`.
3. `infrastructure/` implementa las interfaces de `domain/`.
4. `presentation/` importa de `application/` y `domain/`; **nunca** de `infrastructure/`.
5. La única unión entre capas ocurre en `app/providers/` (composición de dependencias).

Estas reglas se hacen cumplir con ESLint (`import/no-restricted-paths`), no con buena voluntad.

### 7.3 Decisión clave: patrón Repository

**Problema:** Dexie ofrece `useLiveQuery`, un hook que da reactividad automática con muy poco código.
Es tentador usarlo directamente en los componentes.

**Alternativas evaluadas:**

| Alternativa | Ventaja | Costo |
|---|---|---|
| **A. `useLiveQuery` directo en componentes** | Máxima velocidad de desarrollo, menos archivos | Acopla la UI al almacenamiento. Migrar a un backend implica reescribir cada componente. Imposible probar sin navegador. |
| **B. Repositorios puros con `async`** | Desacoplamiento total, testeable | Se pierde la reactividad; hay que refrescar a mano tras cada escritura |
| **C. Repositorios + hooks de acceso a datos que usan `useLiveQuery` por dentro** | Desacoplamiento y reactividad | Un archivo adicional por entidad |

**Recomendación: alternativa C.** El componente consume `useClientes(filtros)`; ese hook vive en
`presentation/hooks/data/` y por dentro usa `useLiveQuery` sobre el repositorio inyectado. El día que
haya backend, se cambia la implementación del hook —no los componentes—. Es el punto de equilibrio
correcto entre pureza arquitectónica y pragmatismo.

### 7.4 Gestión de estado

| Tipo de estado | Solución | Justificación |
|---|---|---|
| Datos persistidos | Hooks de repositorio con `useLiveQuery` | Reactividad automática al escribir en Dexie |
| Estado de servidor | **Ninguna por ahora** | No hay servidor. React Query entra en la fase 4, no antes. |
| Estado de UI local | `useState` | Suficiente |
| Filtros y preferencias compartidas | Context de React | Un solo consumidor por contexto, bajo volumen |
| Estado global complejo | **Zustand: no todavía** | KISS. Se añade el día que exista un dolor demostrable, no antes. |

> **Nota de arquitectura:** el stack propuesto originalmente incluye Zustand y React Query. Ambos son
> excelentes, y ninguno resuelve un problema que exista hoy. Añadir una librería de estado global a una
> app sin estado global compartido es la definición de sobre-ingeniería. Quedan en el radar, no en el
> `package.json`.

### 7.5 Motor de indicadores

Es el corazón del producto y el código con mayor riesgo: **si los números están mal, la aplicación es
peor que inútil, porque induce decisiones equivocadas con apariencia de rigor.**

Diseño:

- Funciones **puras**, en `application/indicadores/`, sin acceso a base de datos ni a React.
- Firma uniforme: `(ventas: VentaMensual[], presupuestos: Presupuesto[], config: ConfigIndicadores) => Resultado`.
- Cada indicador en su propio archivo, con su propio archivo de pruebas.
- Cobertura mínima 90 % (RNF-08). Es el único código con esta exigencia.
- Memoización en la capa de presentación (`useMemo`), no dentro del motor.

Con menos de 100 clientes, el conjunto completo de datos cabe en memoria y se recalcula entero en
milisegundos. No se requiere cálculo incremental ni caché persistida: sería complejidad sin beneficio.

### 7.6 Manejo de errores

- Errores de dominio como clases tipadas: `ClienteNoEncontradoError`, `PeriodoInvalidoError`, `ArchivoNoValidoError`.
- La capa de presentación traduce el error a un mensaje en español entendible. **Nunca** se muestra un stack trace ni un mensaje en inglés.
- Un `ErrorBoundary` por ruta, para que un fallo en el panel no tumbe toda la aplicación.
- La importación es transaccional: se aplica completa o no se aplica.

---

## 8. Modelo de datos

### 8.1 Decisiones de modelado y su justificación

| Decisión | Justificación |
|---|---|
| **Grano de la venta: cliente × periodo** | Es exactamente el grano del Excel que llega. Modelar un grano más fino sería inventar datos que no existen. Si más adelante llega detalle de producto (D-01), se agrega la dimensión sin romper lo existente. |
| **`periodo` como texto `'YYYY-MM'`, no como fecha** | Es ordenable lexicográficamente, indexable, comparable, no tiene ambigüedad de zona horaria y se traduce directo a SQL. Usar `Date` para representar un mes es una fuente clásica de errores de un día de diferencia. |
| **Dinero como entero de pesos** | El peso colombiano no usa centavos en la práctica comercial. Enteros eliminan por completo los errores de punto flotante en sumas y porcentajes. |
| **`codigo` del cliente como clave de conciliación + tabla de alias** | Es la decisión que hace que el importador sobreviva al tiempo. Los nombres en el Excel cambian ("FERRETERÍA EL TORNILLO" → "FERRETERIA EL TORNILLO S.A.S."); el código no. Y cuando el Excel no trae código, el alias resuelve el nombre una sola vez y para siempre. |
| **Los clientes se archivan, nunca se borran** | Borrar un cliente huérfana su histórico de ventas y corrompe todos los comparativos interanuales. |
| **La clasificación ABC y el estado del cliente NO se persisten** | Son valores **derivados**: cambian con cada importación. Persistirlos crea dos fuentes de verdad que se desincronizan (violación de DRY). Se calculan al vuelo. |
| **`snapshotAnterior` en cada importación** | Es la red de seguridad que permite deshacer sin restaurar un respaldo completo. Con menos de 100 clientes el snapshot pesa unos pocos KB. |
| **IDs con `crypto.randomUUID()`** | Nativo del navegador, cero dependencias, sin colisiones, y compatible con `UUID` de PostgreSQL el día de la migración. |

### 8.2 Entidades

```typescript
// domain/shared/types.ts
type Id = string;                    // UUID v4
type Periodo = string;               // 'YYYY-MM' — invariante validado en el dominio
type Pesos = number;                 // entero, sin decimales
type FechaISO = string;              // 'YYYY-MM-DD'

// domain/cliente/cliente.entity.ts
interface Cliente {
  id: Id;
  codigo: string;                    // código del sistema de la empresa · clave de conciliación
  nombre: string;                    // razón social
  nombreComercial?: string;
  nit?: string;
  zona?: string;
  ciudad?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contactoPrincipal?: string;
  estadoManual: 'prospecto' | 'cliente' | 'suspendido';
  archivado: boolean;
  creadoEn: FechaISO;
  actualizadoEn: FechaISO;
}

// domain/cliente/alias.entity.ts
interface AliasCliente {
  id: Id;
  clienteId: Id;
  textoOriginal: string;             // normalizado: sin tildes, mayúsculas, sin espacios dobles
}

// domain/venta/venta.entity.ts
interface VentaMensual {
  id: Id;
  clienteId: Id;
  periodo: Periodo;
  valor: Pesos;
  unidades?: number;
  origen: 'importacion' | 'manual';
  importacionId?: Id;
  actualizadoEn: FechaISO;
}

// domain/presupuesto/presupuesto.entity.ts
interface Presupuesto {
  id: Id;
  periodo: Periodo;
  meta: Pesos;
  nota?: string;
  actualizadoEn: FechaISO;
}

// domain/importacion/importacion.entity.ts
interface Importacion {
  id: Id;
  fecha: FechaISO;
  archivoNombre: string;
  periodos: Periodo[];
  filasLeidas: number;
  filasAplicadas: number;
  filasConError: number;
  clientesCreados: number;
  mapeo: MapeoColumnas;
  snapshotAnterior: VentaMensual[];  // para revertir
  estado: 'aplicada' | 'revertida';
}

interface MapeoColumnas {
  hoja: string;
  filaInicio: number;
  colCodigo?: string;
  colCliente: string;
  colValor: string;
  colPeriodo?: string;               // ausente = periodo único elegido a mano
  colUnidades?: string;
  colZona?: string;
}

// domain/cliente/nota.entity.ts
interface NotaCliente {
  id: Id;
  clienteId: Id;
  fecha: FechaISO;
  texto: string;
  tipo: 'visita' | 'llamada' | 'general';
}

// domain/config/configuracion.entity.ts
interface Configuracion {
  clave: string;
  valor: unknown;
}
// Claves definidas: 'tema', 'mesesParaInactivo' (3), 'umbralCaidaPct' (30),
// 'corteA' (0.80), 'corteB' (0.95), 'ultimoRespaldo', 'diasAvisoRespaldo' (15)
```

### 8.3 Valores derivados (calculados, no almacenados)

```typescript
type ClasificacionABC = 'A' | 'B' | 'C' | 'SIN_HISTORIA';
type EstadoCliente = 'nuevo' | 'activo' | 'en_riesgo' | 'inactivo';

interface ClienteEnriquecido extends Cliente {
  clasificacion: ClasificacionABC;   // Pareto sobre últimos 12 meses
  estado: EstadoCliente;             // reglas configurables
  ventaPeriodo: Pesos;
  ventaAnio: Pesos;
  ultimaCompra?: Periodo;
  variacionMesAnterior: number;      // fracción: 0.15 = +15 %
  variacionAnioAnterior: number;
  serie12Meses: Pesos[];
}
```

**Reglas de derivación:**

- `ClasificacionABC`: se ordenan los clientes por facturación de los últimos 12 meses; acumulado ≤ `corteA` → A; ≤ `corteB` → B; resto → C. Sin compras en 12 meses → `SIN_HISTORIA`.
- `EstadoCliente`: primera compra dentro del año en curso → `nuevo`; sin compras en `mesesParaInactivo` meses → `inactivo`; caída sobre el promedio de los 3 meses previos mayor a `umbralCaidaPct` → `en_riesgo`; en otro caso → `activo`.

### 8.4 Esquema Dexie e índices

```typescript
// infrastructure/db/schema.ts
db.version(1).stores({
  clientes:      'id, codigo, nombre, zona, estadoManual, archivado',
  aliases:       'id, clienteId, &textoOriginal',
  ventas:        'id, clienteId, periodo, &[clienteId+periodo]',
  presupuestos:  'id, &periodo',
  importaciones: 'id, fecha',
  notas:         'id, clienteId, fecha',
  configuracion: '&clave',
});
```

- `&[clienteId+periodo]` es un índice **único compuesto**: la garantía a nivel de base de datos de que una reimportación no puede duplicar un periodo (RF-A07). La regla de negocio queda respaldada por el motor de almacenamiento, no solo por el código.
- `&textoOriginal` único evita que un mismo nombre del Excel apunte a dos clientes distintos.

### 8.5 Ruta de migración futura

El esquema es relacional puro, sin documentos anidados ni campos polimórficos. La traducción a
PostgreSQL es directa:

| Dexie | PostgreSQL |
|---|---|
| `clientes` | `cliente` con `PRIMARY KEY (id UUID)` y `UNIQUE (codigo)` |
| `ventas` | `venta_mensual` con `UNIQUE (cliente_id, periodo)` y `FK` a cliente |
| `periodo: string` | `CHAR(7)` o columna generada `DATE` |
| `valor: number` | `BIGINT` (pesos) |
| `snapshotAnterior` | `JSONB` |

Al añadir backend se agrega `usuario_id` a cada tabla y `Row Level Security`. El modelo no cambia.

---

## 9. Arquitectura de carpetas

```
sgc-personal/
├── docs/                            # esta documentación, versionada con el código
├── public/
│   ├── manifest.webmanifest
│   └── icons/
├── src/
│   ├── app/                         # composición: aquí y solo aquí se unen las capas
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   ├── providers/
│   │   │   ├── RepositoriosProvider.tsx   # inyección de dependencias
│   │   │   └── TemaProvider.tsx
│   │   └── layouts/
│   │       ├── LayoutPrincipal.tsx
│   │       └── LayoutImpresion.tsx        # layout limpio para reportes
│   │
│   ├── domain/                      # ← no importa nada externo
│   │   ├── shared/
│   │   │   ├── types.ts             # Id, Periodo, Pesos, FechaISO
│   │   │   ├── periodo.ts           # crear, validar, sumar, rango, formatear
│   │   │   └── errores.ts
│   │   ├── cliente/
│   │   │   ├── cliente.entity.ts
│   │   │   ├── cliente.repository.ts      # interfaz
│   │   │   ├── alias.entity.ts
│   │   │   ├── nota.entity.ts
│   │   │   └── cliente.rules.ts           # clasificarABC, derivarEstado
│   │   ├── venta/
│   │   ├── presupuesto/
│   │   └── importacion/
│   │
│   ├── application/
│   │   ├── clientes/
│   │   │   ├── crearCliente.ts
│   │   │   ├── archivarCliente.ts
│   │   │   └── enriquecerClientes.ts
│   │   ├── indicadores/             # ← código crítico, 90 % de cobertura
│   │   │   ├── calcularCumplimiento.ts
│   │   │   ├── proyectarCierre.ts
│   │   │   ├── calcularCobertura.ts
│   │   │   ├── detectarClientesNuevos.ts
│   │   │   ├── detectarAlertas.ts
│   │   │   ├── construirSerie12Meses.ts
│   │   │   └── *.test.ts
│   │   ├── importacion/
│   │   │   ├── analizarArchivo.ts   # → vista previa, sin escribir nada
│   │   │   ├── aplicarImportacion.ts
│   │   │   ├── revertirImportacion.ts
│   │   │   └── conciliarClientes.ts # resolución por código → alias → nombre normalizado
│   │   └── respaldo/
│   │       ├── exportarRespaldo.ts
│   │       └── restaurarRespaldo.ts
│   │
│   ├── infrastructure/
│   │   ├── db/
│   │   │   ├── database.ts
│   │   │   ├── schema.ts
│   │   │   └── seed.ts              # datos de prueba para desarrollo
│   │   ├── repositories/
│   │   │   ├── dexie-cliente.repository.ts
│   │   │   ├── dexie-venta.repository.ts
│   │   │   └── ...
│   │   ├── excel/
│   │   │   ├── lector-excel.ts      # SheetJS encapsulado
│   │   │   └── detector-columnas.ts # heurística para proponer el mapeo
│   │   └── archivos/
│   │       ├── descargar.ts
│   │       └── exportar-csv.ts
│   │
│   ├── presentation/
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui — no se modifica a mano
│   │   │   └── shared/
│   │   │       ├── TarjetaKPI.tsx
│   │   │       ├── TablaDatos.tsx
│   │   │       ├── EncabezadoPagina.tsx
│   │   │       ├── EstadoVacio.tsx
│   │   │       ├── BadgeEstado.tsx
│   │   │       ├── Moneda.tsx       # formato COP con números tabulares
│   │   │       └── MiniGrafica.tsx  # sparkline en SVG puro
│   │   ├── hooks/
│   │   │   ├── data/                # useClientes, useVentas, usePresupuesto...
│   │   │   └── ui/                  # useFiltros, useImpresion...
│   │   └── features/
│   │       ├── panel/
│   │       ├── clientes/
│   │       ├── presupuesto/
│   │       ├── importacion/
│   │       ├── reportes/
│   │       └── configuracion/
│   │
│   ├── lib/
│   │   ├── formato.ts               # moneda, porcentaje, fecha, abreviaturas
│   │   ├── diasHabiles.ts           # incluye festivos de Colombia
│   │   └── texto.ts                 # normalización para conciliación
│   │
│   └── styles/
│       ├── globals.css
│       └── print.css                # hoja de estilos de impresión
└── ...
```

**Reglas de la estructura:**

1. Cada carpeta en `features/` contiene sus páginas, componentes y hooks propios, y expone un único `index.ts`. Ninguna feature importa del interior de otra feature.
2. Un componente sube a `components/shared/` solo cuando lo usan **dos o más** features. Antes de eso vive en su feature. (Regla de tres: no se abstrae por anticipado.)
3. `lib/` es para utilidades sin lógica de negocio. Si tiene una regla de negocio, va a `domain/`.

---

## 10. Diseño UX/UI

### 10.1 Principios

1. **Una pantalla, una pregunta.** Si una pantalla responde tres preguntas, son tres pantallas.
2. **El panel no se navega, se lee.** La información más importante no puede estar detrás de un clic.
3. **Densidad de herramienta, no de landing page.** Es software de trabajo diario: se optimiza para el uso número 200, no para el primero.
4. **El color significa algo o no se usa.** El semáforo se reserva exclusivamente para el estado de cumplimiento. Nada decorativo.
5. **Todo estado vacío ofrece una acción.** "Aún no has importado ventas" viene con el botón *Importar Excel*.
6. **Toda cifra es imprimible.** Si se ve en pantalla, tiene que poder salir en papel.

### 10.2 Navegación

Sidebar fija a la izquierda (diseño desktop-first), colapsable:

```
◆ SGC Personal
─────────────────
▸ Panel                 (inicio)
▸ Clientes
▸ Presupuesto
▸ Importar
▸ Reportes
─────────────────
▸ Configuración
```

Encabezado con breadcrumb, selector de periodo global y conmutador de tema. El selector de periodo es
global y persistente: cambiar el mes en el panel lo cambia también en clientes y reportes. Evita la
confusión de estar viendo dos periodos distintos en dos pantallas.

### 10.3 Pantalla · Panel (la más importante)

```
┌───────────────────────────────────────────────────────────────────────┐
│  Panel · Agosto 2026                          [Ago 2026 ▾]  [☾]      │
├───────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐┌───────────────┐┌───────────────┐┌───────────────┐ │
│ │ CUMPLIMIENTO  ││ FALTANTE      ││ PROYECCIÓN    ││ ACUMULADO AÑO │ │
│ │    78,4 %     ││  $ 10,8 M     ││   92 %        ││    86,1 %     │ │
│ │ ▓▓▓▓▓▓▓░░░    ││ $ 1,35 M/día  ││ cierre est.   ││ $ 312 M/362 M │ │
│ │ $ 39,2/50,0 M ││ 8 días hábiles││ ▼ bajo meta   ││ ▲ +4 pts      │ │
│ └───────────────┘└───────────────┘└───────────────┘└───────────────┘ │
├───────────────────────────────────────────────────────────────────────┤
│  Ventas vs. meta · últimos 12 meses                                   │
│   ▁▃▅▂▆▇▄▅▃▆█▅   ── línea de meta                                     │
├──────────────────────────────────┬────────────────────────────────────┤
│  REQUIEREN ATENCIÓN          (7) │  TOP CLIENTES DEL MES              │
│  ● Ferretería El Tornillo        │  1. Agroinsumos del Sur   $ 8,2 M  │
│    sin compras hace 4 meses      │     ▲ +12 % vs. mes anterior       │
│  ● Distribuciones Ariza          │  2. Maquinaria Tolima     $ 6,1 M  │
│    ▼ −62 % vs. promedio          │     ▼ −8 %                         │
│  ...                             │  ...                               │
│                    [Ver todos →] │                    [Ver todos →]   │
└──────────────────────────────────┴────────────────────────────────────┘
```

**Regla de diseño:** exactamente 4 tarjetas de KPI. Ni 5 ni 6. Con más de cuatro, el ojo deja de
jerarquizar y el panel se convierte en un tablero de instrumentos que nadie lee.

### 10.4 Pantalla · Clientes

Tabla densa con barra de herramientas: búsqueda, filtros (zona, estado, clasificación), botón
*Imprimir* y botón *Exportar CSV*.

| Cliente | Zona | Clas. | Estado | Venta mes | Venta año | Últ. compra | Tendencia |
|---|---|---|---|---|---|---|---|
| Agroinsumos del Sur | Ibagué | `A` | `Activo` | $ 8.200.000 | $ 68.400.000 | Ago 2026 | ▁▃▅▆█ |

- Clic en la fila → **panel lateral (drawer)**, no navegación a otra página. Conserva el contexto de la lista y los filtros; permite revisar cinco clientes seguidos sin perder el hilo.
- La tendencia es una minigráfica en SVG puro, no un componente de Recharts: 100 instancias de Recharts en una tabla es un desperdicio de renderizado innecesario.
- Los filtros se conservan en la URL para poder volver con el botón atrás del navegador.

### 10.5 Panel lateral · Ficha del cliente

Encabezado con nombre, badges de clasificación y estado, y acciones (*Editar*, *Imprimir ficha*).
Pestañas: **Resumen** (gráfica 12 meses, KPIs del cliente, última compra), **Histórico** (tabla
mensual con variaciones), **Notas** (cronológica inversa, con campo para agregar), **Datos** (contacto
y dirección).

### 10.6 Pantalla · Importar (asistente de 3 pasos)

```
   ①  Archivo  ──────  ②  Mapeo  ──────  ③  Revisión
```

1. **Archivo** — zona de arrastre, selección de hoja, y elección del periodo (cuando el archivo no lo trae).
2. **Mapeo** — cada campo del sistema frente a un selector de columna del archivo, con una vista previa de las primeras 5 filas leídas con ese mapeo. El mapeo anterior viene preseleccionado.
3. **Revisión** — cuatro contadores (*leídas / reconocidas / nuevas / con error*), la lista de clientes no reconocidos con acción por cada uno, y la advertencia si el periodo ya existía. Botón *Aplicar importación*.

Este asistente es la pantalla que más protege el proyecto: **el usuario nunca debe poder aplicar una
importación sin haber visto antes qué va a pasar.**

### 10.7 Pantalla · Presupuesto

Grilla de los 12 meses del año seleccionado, editable en línea, con total anual y comparación contra
lo vendido y el porcentaje de cumplimiento por mes. Acción *Replicar a meses restantes*.

### 10.8 Pantalla · Reportes

Lista de reportes disponibles; al elegir uno se muestra **la vista previa ya con formato de
impresión** (fondo blanco, ancho carta), con un botón flotante *Imprimir* que abre el diálogo del
navegador. Lo que se ve es exactamente lo que sale.

### 10.9 Sistema visual

| Elemento | Definición |
|---|---|
| Tipografía | Inter (variable, autoalojada — sin CDN, para que funcione sin conexión) |
| Cifras | `font-variant-numeric: tabular-nums` en **toda** cifra monetaria y porcentaje. Las columnas de números tienen que alinearse verticalmente; es el detalle que separa una herramienta profesional de una amateur. |
| Moneda | `$ 8.200.000` en tablas; `$ 8,2 M` en tarjetas de KPI. Cero decimales siempre. |
| Color base | Escala neutra (slate) + un acento único para elementos interactivos |
| Semáforo | **Solo** para cumplimiento: verde ≥ 100 %, ámbar 85–99 %, rojo < 85 %. Umbrales configurables. |
| Espaciado | Escala de 4 px. Densidad media-alta: filas de tabla de 40 px, no de 64 px. |
| Radios y sombras | Sutiles. Nada de sombras pronunciadas ni degradados. |
| Modo oscuro | Desde el primer día, mediante tokens CSS de shadcn/ui. Se implementa al inicio o no se implementa: retrofitear temas es doloroso. |

### 10.10 Diseño de impresión (RF-E04)

Hoja `print.css` con reglas explícitas:

```css
@media print {
  @page { size: letter portrait; margin: 1.5cm; }

  .no-imprimir,
  aside, nav, button, .drawer { display: none !important; }

  body { background: #fff; color: #000; font-size: 10pt; }

  .reporte-encabezado { position: running(encabezado); }
  .salto-antes { break-before: page; }
  .no-cortar   { break-inside: avoid; }   /* tarjetas KPI, filas, gráficas */

  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }  /* repite encabezado en cada página */
  tr    { break-inside: avoid; }

  a[href]::after { content: none; }       /* no imprimir URLs */
}
```

**Decisión: la exportación a PDF se hace con el diálogo de impresión del navegador, no con una
librería.**

| Alternativa | Veredicto |
|---|---|
| `@media print` + "Guardar como PDF" | **Recomendada.** Cero dependencias, cero peso, tipografía y vectores perfectos, texto seleccionable, y el mismo código sirve para papel y PDF. |
| `jsPDF` + `html2canvas` | Rechazada. Rasteriza: el texto deja de ser texto, la calidad baja, pesa ~500 KB y hay que mantener una segunda maquetación. |
| `react-pdf` | Rechazada para el MVP. Implica reconstruir cada reporte con componentes propios: dos maquetaciones que mantener sincronizadas. |

### 10.11 Anti-patrones prohibidos

- Tablas que muestren todo sin filtros, imitando una hoja de cálculo.
- Más de 4 KPIs simultáneos en el panel.
- Gráficas de torta (el ojo humano compara mal ángulos; se usan barras).
- Modales para editar registros complejos (se usa el panel lateral).
- Íconos sin etiqueta de texto en la navegación principal.
- Animaciones de más de 200 ms en una herramienta de uso diario.

---

## 14. Riesgos técnicos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| **R-01** | El formato del Excel cambia y rompe el importador | Alta | Alto | Mapeo configurable por el usuario; **jamás** leer columnas por índice fijo; validación con vista previa; mensajes de error que digan exactamente qué columna falta |
| **R-02** | Pérdida total de datos por borrado de IndexedDB (limpiar caché, cambio de navegador, reinstalación) | Media | **Crítico** | `navigator.storage.persist()` al iniciar; respaldo exportable desde el día 1; aviso persistente a los 15 días sin respaldar; documentar que el respaldo debe guardarse fuera del equipo |
| **R-03** | Los nombres del Excel no coinciden con los clientes registrados | Alta | Alto | Conciliación en cascada: código exacto → alias → nombre normalizado (sin tildes, mayúsculas, sin sufijos societarios) → resolución manual que crea alias permanente |
| **R-04** | El indicador de mezcla de producto es imposible con los datos actuales | Cierta | Medio | Decisión D-01 pendiente. No prometer el indicador hasta resolverla. |
| **R-05** | "Clientes nuevos" y comparativos interanuales sin histórico suficiente | Alta | Medio | Carga inicial de 24 meses (HU-05) antes de habilitar esos indicadores; si no hay dato, la app dice "sin histórico suficiente", no muestra un cero engañoso |
| **R-06** | **Sobre-ingeniería: la arquitectura perfecta que nunca se termina** | Media | Alto | El riesgo más real de un proyecto personal. Mitigación estructural: cada sprint entrega algo usable; la fase 0 incluye una rebanada vertical completa; se prohíbe añadir librerías sin dolor demostrado |
| **R-07** | Abandono del proyecto por falta de resultado visible | Media | Alto | MVP de 5 semanas, no de 5 meses; primer valor real en el sprint 2 |
| **R-08** | Los datos de facturación pertenecen a Equipos Supra | Baja | Alto | Como herramienta personal de trabajo no hay problema. Si alguna vez se comercializa como CRM, hay que hablarlo con la empresa **antes** de escribir una línea de ese producto |
| **R-09** | Cálculo de indicadores equivocado que induce decisiones erradas | Media | **Crítico** | Motor de indicadores puro y con 90 % de cobertura de pruebas; validación cruzada contra el Excel original en la primera importación real |
| **R-10** | Acoplamiento a Dexie que impida migrar | Baja | Alto | Ya mitigado por diseño: patrón Repository + regla de ESLint que prohíbe importar Dexie fuera de `infrastructure/` |
| **R-11** | Los días hábiles y festivos de Colombia mal calculados desvirtúan la proyección | Media | Medio | Tabla de festivos colombianos (ley Emiliani) en `lib/diasHabiles.ts`, con pruebas |

---

## 15. Tecnologías recomendadas

### 15.1 Stack confirmado

| Capa | Tecnología | Costo | Notas |
|---|---|---|---|
| Lenguaje | TypeScript (`strict`) | Gratis | Sin `any` |
| UI | React 18 | Gratis | |
| Build | Vite | Gratis | |
| Estilos | TailwindCSS | Gratis | |
| Componentes | shadcn/ui | Gratis | Se copia el código al proyecto: sin dependencia externa, control total |
| Rutas | React Router | Gratis | |
| Formularios | React Hook Form + Zod | Gratis | Zod se usa además para validar lo que entra del Excel |
| Base de datos | Dexie sobre IndexedDB | Gratis | |
| Gráficas | Recharts | Gratis | Solo para gráficas grandes; ver 15.3 |
| Íconos | Lucide | Gratis | |
| PWA | `vite-plugin-pwa` | Gratis | Envuelve Workbox; ver 15.3 |

### 15.2 Adiciones necesarias (no estaban en la lista original)

| Tecnología | Para qué | Por qué es indispensable |
|---|---|---|
| **SheetJS (`xlsx`)** | Leer archivos Excel | Es el requisito central del MVP y no había ninguna librería para ello en el stack. Alternativa `exceljs`: más pesada y orientada a escritura; SheetJS es el estándar para lectura. Ambas gratuitas. |
| **`date-fns`** | Fechas y días hábiles | Modular, con soporte de español; se importa solo lo que se usa. Alternativa `dayjs`: más liviana pero menos completa en manejo de intervalos. |
| **Vitest + Testing Library** | Pruebas | Sin pruebas del motor de indicadores no hay confianza en los números (R-09). Integración nativa con Vite. |
| **ESLint + `import/no-restricted-paths`** | Hacer cumplir la arquitectura | Las reglas de dependencia entre capas se verifican solas o se violan en la tercera semana. |
| **Prettier** | Formato | Elimina discusiones de estilo |

### 15.3 Tecnologías cuestionadas

| Tecnología | Recomendación | Justificación |
|---|---|---|
| **Leaflet / OpenStreetMap** | **Sacar del MVP → fase 3** | Alto costo de construcción, bajo valor inmediato dado que el uso es en PC |
| **Zustand** | **No incluir todavía** | No existe estado global compartido que lo justifique. Se añade cuando aparezca el dolor. |
| **React Query** | **No incluir todavía** | No hay servidor. Entra en la fase 4 junto con el backend. |
| **Recharts para sparklines** | **Usar SVG propio** | Instanciar Recharts en cada fila de una tabla de 100 clientes es costoso e innecesario: una sparkline es una `polyline` de 12 puntos, unas 20 líneas de código. Recharts se reserva para la gráfica principal del panel. |
| **Workbox directo** | **Usar `vite-plugin-pwa`** | Configurar Workbox a mano es innecesario; el plugin resuelve manifiesto, service worker y actualización con una configuración declarativa. |
| **jsPDF / html2canvas** | **No usar** | Ver §10.10: el diálogo de impresión del navegador produce mejor resultado con cero código |

### 15.4 Infraestructura y costos

| Concepto | Solución | Costo mensual |
|---|---|---|
| Repositorio | GitHub (privado) | $ 0 |
| Alojamiento | GitHub Pages o Netlify (plan gratuito) | $ 0 |
| Dominio | Subdominio de GitHub/Netlify | $ 0 |
| Base de datos | IndexedDB, en el equipo | $ 0 |
| Respaldo | Archivo JSON en nube personal | $ 0 |
| CI | GitHub Actions (2.000 min/mes gratis) | $ 0 |
| **Total** | | **$ 0** |

> **Recomendación de alojamiento:** Netlify por encima de GitHub Pages, siendo ambos gratuitos.
> Netlify maneja mejor las rutas de una SPA (redirección a `index.html` sin trucos), da vistas previas
> por rama y cabeceras HTTP configurables —útil para el caché del service worker—. GitHub Pages exige
> un `404.html` de reemplazo para que funcione React Router.
>
> La fase 4, si llega, usaría Supabase en plan gratuito (500 MB de PostgreSQL, autenticación
> incluida). Volumen esperado: menos de 5 MB. Cabe holgadamente y seguiría costando $ 0.
