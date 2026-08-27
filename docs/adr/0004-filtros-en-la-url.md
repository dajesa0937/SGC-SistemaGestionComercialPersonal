# ADR 0004 · Filtros en la URL y comportamiento del historial

**Fecha:** 26 de agosto de 2026 · **Estado:** aceptada

## Contexto

Los filtros de la cartera viven en la URL para poder guardar la vista como marcador y no perder el
contexto al volver de la ficha de un cliente.

La primera implementación usaba `replace: true` en todos los casos. Una prueba de extremo a extremo
demostró que eso hacía que el botón atrás **saliera de la aplicación** en lugar de deshacer el
filtro, justo lo contrario de lo que afirmaba el comentario del código.

## Decisión

El comportamiento depende del tipo de cambio:

- **Escribir en el buscador reemplaza** la entrada del historial. Una entrada por pulsación de tecla
  dejaría el botón atrás inservible.
- **Cambiar zona, estado, orden o página apila** una entrada nueva. Son decisiones deliberadas que
  el usuario puede querer deshacer.

## Consecuencias

- El botón atrás deshace el último filtro y mantiene al usuario dentro de la aplicación.
- La regla está verificada con una prueba de extremo a extremo, no solo razonada.
- Lección para el resto del proyecto: un comentario que afirma un comportamiento no lo garantiza.
  Si la afirmación importa, hay que probarla.
