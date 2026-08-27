# ADR 0001 · Imponer las reglas de capas con ESLint del núcleo

**Fecha:** 26 de agosto de 2026 · **Estado:** aceptada

## Contexto

El documento de arquitectura establece que la lógica de negocio no puede saber que existe
IndexedDB. Una regla que solo vive en un documento se viola en la tercera semana sin que nadie
se dé cuenta.

## Opciones

1. **`eslint-plugin-import` con `no-restricted-paths`** — es lo habitual, pero añade una
   dependencia que históricamente se retrasa al subir de versión mayor de ESLint.
2. **`eslint-plugin-boundaries`** — más expresivo, misma dependencia externa.
3. **`no-restricted-imports` del núcleo de ESLint** — menos expresivo (trabaja con patrones de
   ruta, no con un grafo de capas), pero sin dependencias.

## Decisión

Opción 3. Un bloque de configuración por capa, con patrones sobre el alias `@/`.

## Consecuencias

- Cero dependencias que mantener para hacer cumplir la arquitectura.
- Los mensajes de error explican *por qué* existe la regla, no solo que se violó.
- Verificado con una prueba negativa: un `import` de `@/infrastructure/*` desde `presentation/`
  hace fallar el lint.
- Limitación aceptada: las reglas se escriben por patrón de ruta. Si la estructura de carpetas
  cambia, hay que actualizar `eslint.config.js`.
