# SGC Personal

Sistema de Gestión Comercial Personal — PWA para administrar un territorio comercial.

> **Estado:** Sprints 0, 1, 3, 4, 5 y 6 terminados. La aplicación administra la cartera con ficha 360
> por cliente, guarda el presupuesto anual, registra ventas, muestra el panel de cumplimiento, genera
> informes imprimibles y respalda y restaura toda la base en un archivo. Solo falta el importador de
> Excel (Sprint 2), a la espera de un archivo de ventas real.

## Puesta en marcha

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
| `npm run preview` | Sirve la construcción de producción (aquí sí funciona la PWA) |
| `npm run verificar` | Lint + tipos + pruebas. **Ejecutar antes de cada commit.** |
| `npm run test:watch` | Pruebas en modo observación |
| `npm run test:cov` | Cobertura (mínimo 90 % en `application/indicadores/`) |
| `npm run iconos` | Regenera los iconos PNG de la PWA |
| `npm run tildes` | Corrige las tildes de los textos visibles |

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
