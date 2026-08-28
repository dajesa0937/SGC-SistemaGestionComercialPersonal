# ADR 0005 · La gráfica del panel se dibuja a mano, sin librería

**Fecha:** 28 de agosto de 2026 · **Estado:** aceptada · **Sustituye a:** la elección de Recharts
en el documento de arquitectura (§15)

## Contexto

El documento de arquitectura reservaba Recharts para «la gráfica principal del panel», rechazándolo
solo para las minigráficas de la tabla. Al construir el Sprint 3 se midió el resultado real:

| | Tamaño comprimido |
|---|---|
| `PaginaPanel` con Recharts | **112,65 kB** |
| `PaginaPanel` con SVG propio | **6,52 kB** |
| Precaché total de la PWA | 1.184 KiB → **823 KiB** |

Cien kilobytes comprimidos para dibujar doce barras y una línea escalonada.

## Decisión

Se elimina la dependencia. La gráfica se dibuja en SVG con un `viewBox` fijo, que escala solo sin
medir el contenedor, y la geometría de ejes vive en `src/lib/escala.ts` con pruebas propias.

## Por qué, más allá del tamaño

- **Coherencia.** El mismo argumento ya había rechazado Recharts para las minigráficas y para el
  analizador de CSV. Aplicarlo aquí no es una excepción: es la misma regla.
- **La PWA precachea todo.** Cada kilobyte del paquete se descarga en la instalación y en cada
  actualización, y el panel es la pantalla de inicio: se paga siempre.
- **Lo que se pierde es poco.** El `viewBox` da el comportamiento adaptable gratis; el tooltip son
  quince líneas; la accesibilidad se cubre mejor a mano, con una tabla de datos desplegable que
  además es lo que sale al imprimir.

## Consecuencias

- Una dependencia menos que mantener y auditar.
- El código de la gráfica es responsabilidad nuestra: por eso `escala.ts` lleva pruebas de topes
  redondos, espaciado uniforme y valores degenerados.
- Si en el futuro aparece una necesidad real de gráficas complejas (dispersión, mapas de calor,
  ejes temporales continuos), esta decisión se revisa. Para barras, líneas y áreas no hace falta.

## Nota sobre el color

El validador de paletas confirmó que el acento del tema y el gris secundario **no son
distinguibles bajo protanopía** (ΔE 2,9). Por eso la meta no se distingue por color sino por forma:
línea discontinua frente a barras, con leyenda. La identidad de una serie nunca depende del tono.
