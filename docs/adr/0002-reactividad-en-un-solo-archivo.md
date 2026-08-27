# ADR 0002 · La reactividad de Dexie vive en un único archivo

**Fecha:** 26 de agosto de 2026 · **Estado:** aceptada

## Contexto

`useLiveQuery` de `dexie-react-hooks` da reactividad automática con muy poco código, pero
importarlo en cada componente acopla toda la interfaz al motor de almacenamiento.

## Decisión

`src/presentation/hooks/data/useConsulta.ts` es el único archivo de la capa de presentación que
importa `dexie-react-hooks`, con una excepción explícita en `eslint.config.js`. Los hooks de datos
(`useResumenBase`, y los que vengan) lo usan por dentro; los componentes solo ven el hook.

## Consecuencias

- Se conservan reactividad y desacoplamiento a la vez (alternativa C del documento de arquitectura).
- Migrar a un backend en la fase 4 se reduce a reimplementar ese archivo, por ejemplo con
  TanStack Query. Ningún componente cambia.
- La excepción está en un solo sitio, comentada, y es visible en la configuración de ESLint.
