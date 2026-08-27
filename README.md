# SGC Personal

Sistema de Gestión Comercial Personal — PWA para administrar un territorio comercial.

> **Estado:** Sprint 0 (Fundación) terminado. La aplicación arranca, navega, cambia de tema y
> funciona sin conexión. Los módulos de negocio llegan en los sprints 1 a 6.

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
navegador o reinstalar el sistema **los borra sin aviso**. El respaldo descargable llega en el
Sprint 6; hasta entonces la aplicación no debe ser la única copia de nada importante.
