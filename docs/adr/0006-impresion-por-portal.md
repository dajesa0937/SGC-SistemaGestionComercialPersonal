# ADR 0006 · Impresión por portal, no de la pantalla

**Fecha:** 28 de agosto de 2026 · **Estado:** aceptada

## Contexto

`print.css` oculta la navegación, los botones y los paneles laterales para que el papel salga
limpio. Eso funcionaba mientras lo que se imprimía era la pantalla completa, pero rompía el caso más
útil: el botón **«Imprimir ficha»** dentro del panel lateral imprimía la lista de clientes de
detrás, porque la propia regla que limpia el papel ocultaba el panel.

Además, imprimir «lo que se ve» tiene un defecto de fondo: la pantalla está paginada (25 filas) y
filtrada para leerse cómodamente, mientras que en papel se quiere el conjunto completo.

## Opciones

1. **Excepciones en `print.css`** para mostrar el panel al imprimir — frágil: cada pantalla nueva
   necesita su propia excepción, y el resultado depende del estado visual del momento.
2. **Una ruta `/imprimir/...` por reporte** — limpia, pero se pierde el contexto: hay que volver a
   cargar los datos y el usuario sale de donde estaba.
3. **Un portal de impresión**: el documento se monta en un contenedor aparte del árbol de la
   aplicación, se marca `<html data-imprimiendo>` y en impresión se oculta `#root` entero.

## Decisión

Opción 3, en `useHojaImpresion()`. Quien quiera imprimir algo llama `imprimir(<Documento .../>)`.

## Consecuencias

- Lo que se imprime es un documento explícito, no un efecto secundario de lo que había en pantalla.
  Al imprimir la cartera salen **todos** los clientes filtrados, no la página visible.
- Los documentos (`InformeMensual`, `FichaImprimible`, `ListaImprimible`) se escriben una sola vez y
  se ven igual en la vista previa y en el papel: una única maquetación, como decidió el ADR del
  documento de arquitectura al rechazar las librerías de PDF.
- `EncabezadoPagina` pasa a ser `no-imprimir`: si alguien pulsa Ctrl+P estando en una pantalla, no
  debe salir el encabezado de la aplicación encima del contenido.
- Verificado generando los PDF reales con el motor de impresión del navegador y revisándolos.
