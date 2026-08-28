# SGC Personal

Sistema de Gestión Comercial Personal — PWA para administrar un territorio comercial.

> **Estado: MVP terminado.** La aplicación importa el maestro de clientes y el Excel de ventas del
> mes, administra la cartera con ficha 360 por cliente, guarda el presupuesto anual, muestra el panel
> de cumplimiento con la mezcla de producto, dibuja la cobertura sobre el mapa de Colombia, genera
> informes imprimibles y respalda y restaura toda la base en un archivo.
>
> La cartera se administra por **municipio DANE** (los 1.122 del país) y por **zonas que tú defines**.

## Usarla todos los días

**Doble clic en `Iniciar SGC.bat`.** Prepara la aplicación y la abre en
`http://localhost:4173`. La primera vez tarda un par de minutos porque instala las dependencias;
después arranca en segundos.

El arranque diario no verifica tipos ni ejecuta pruebas — eso es trabajo de desarrollo, y hacerlo
cada mañana solo añadiría medio minuto de espera. Para eso está `npm run verificar`.

Desde el navegador, en el menú de Chrome o Edge, elige **Instalar SGC Personal**. A partir de ahí
tienes un icono propio y la aplicación abre en su propia ventana, sin barra de direcciones.

**Una vez instalada, abre aunque no ejecutes nada.** La aplicación se guarda entera en el navegador,
así que funciona sin internet y sin el servidor encendido. Solo necesitas volver a ejecutar
`Iniciar SGC.bat` cuando haya cambios en el código.

### El puerto es parte de tus datos

Los datos viven en el navegador y se guardan **por origen**, y el origen incluye el puerto. Lo que
cargues en `localhost:4173` **no existe** en `localhost:5173`.

- `Iniciar SGC.bat` y `npm run inicio` → `http://localhost:4173`. **Este es el de uso diario.**
- `npm run dev` → `http://localhost:5173`. Este es el de desarrollo, con recarga automática.

Son dos bases de datos distintas. Si ya cargaste datos en uno y quieres pasarlos al otro, descarga el
respaldo desde *Configuración → Respaldo* y restáuralo en el otro. Es exactamente para lo que existe.

Los dos puertos están fijados a propósito: si estuvieran ocupados, la aplicación falla con un mensaje
claro en vez de arrancar en otro puerto y aparecer vacía.

## Puesta en marcha para desarrollar

```bash
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Verifica tipos y construye para producción |
| `npm run inicio` | **Uso diario.** Construye y abre la aplicación en `http://localhost:4173` |
| `npm run preview` | Sirve la construcción ya hecha, sin volver a construir |
| `npm run verificar` | Lint + tipos + pruebas. **Ejecutar antes de cada commit.** |
| `npm run test:watch` | Pruebas en modo observación |
| `npm run test:cov` | Cobertura (mínimo 90 % en `application/indicadores/`) |
| `npm run iconos` | Regenera los iconos PNG de la PWA |
| `npm run tildes` | Corrige las tildes de los textos visibles |
| `npm run municipios` | Regenera el catálogo DANE de municipios |
| `npm run mapa` | Regenera los trazados del mapa de departamentos |

## Arquitectura

La regla que sostiene todo el diseño:

> **La lógica de negocio no puede saber que existe IndexedDB.**

```
presentation/  → React. Nunca importa infrastructure/.
application/   → Casos de uso. Solo depende de domain/.
domain/        → Entidades, reglas puras e interfaces de repositorio. No importa nada.
infrastructure/→ Dexie, SheetJS, archivos. Implementa las interfaces de domain/.
```

Las reglas de dependencia entre capas **se verifican solas** con ESLint
(`no-restricted-imports` en `eslint.config.js`). Un `import` de `@/infrastructure/*` desde
`presentation/` rompe la verificación. La única excepción documentada es
`presentation/hooks/data/useConsulta.ts`, la costura deliberada donde vive la reactividad de Dexie.

La composición de dependencias ocurre en un solo lugar: `src/app/providers/`.

## Documentación

Toda la documentación de diseño está en [`docs/`](./docs/README.md): visión, alcance del MVP,
requerimientos, casos de uso, historias, modelo de datos, UX, roadmap, backlog, sprints y riesgos.

## Advertencia sobre los datos

Los datos viven en IndexedDB, dentro de este navegador. Limpiar los datos del sitio, cambiar de
navegador o reinstalar el sistema **los borra sin aviso**.

Por eso existe *Configuración → Respaldo*: descarga un archivo `.json` con absolutamente todo y
guárdalo fuera de este equipo. La aplicación avisa sola cuando pasan quince días sin respaldar, y ese
aviso no se puede descartar a propósito. Restaurar reemplaza todos los datos actuales, y el archivo
se revisa entero antes de tocar nada.
