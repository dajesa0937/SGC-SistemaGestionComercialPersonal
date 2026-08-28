# ADR 0009 · Mapa de cobertura por departamento, no por puntos

**Fecha:** 28 de agosto de 2026
**Estado:** aceptada

## Contexto

El usuario pidió ver la cartera sobre el mapa de Colombia: «si creo un cliente en Montería, que me
quede en el mapa, y que me digas cuántos clientes hay por zona».

Cada cliente ya guarda su municipio como código DANE (ADR 0007), así que la información existe. Lo
que hace falta es la geometría.

## Lo que hay disponible y lo que no

Se buscó en npm geometría libre de Colombia:

- **Departamentos:** sí. `@svg-maps/colombia` trae los 33 con sus trazados, **CC BY 4.0**.
- **Municipios:** **no existe** ningún paquete libre con las coordenadas ni los polígonos de los
  1.122 municipios. Se revisaron `colombia-territorial`, `colombia-cities`,
  `@raulcifuentes/municipios-colombia` y varias búsquedas del registro: ninguno trae latitud y
  longitud.

## Decisión

**Mapa coroplético por departamento, y el detalle por municipio en tabla.**

No se dibujan puntos por municipio. Escribir de memoria las coordenadas de los 31 municipios que hoy
tienen clientes daría un mapa que se ve bien y miente: serían aproximadas, se romperían el día que se
abra un cliente en un municipio nuevo, y contradicen el requisito de que la aplicación sirva en todo
el país.

Lo que se entrega en su lugar responde a la misma pregunta con más precisión:

- El departamento pintado según cuántos clientes tiene, con la cifra encima.
- Tabla por **departamento**, por **zona** (las del usuario, ADR 0007) y por **municipio**, cada una
  con clientes, cuántos compraron, cobertura, venta del mes y venta del año.

El día que aparezca una fuente libre de coordenadas municipales, se añaden los puntos encima sin
tocar nada más: `CoberturaTerritorial` ya devuelve el desglose por municipio.

## Decisiones de dibujo

- **Rampa secuencial de un solo tono**, de claro a oscuro, sobre el verde de la aplicación. No es un
  arcoíris: el dato es una magnitud, no categorías. Monotonía de luminosidad verificada, y en modo
  oscuro son pasos elegidos contra esa superficie, no una inversión automática.
- **«Sin clientes» es un gris neutro, no el primer paso del color.** Un mapa donde la ausencia de
  datos se parece a «hay poquito» miente sobre la cobertura.
- **Las cifras van en una pastilla** del color de la superficie, no directamente sobre el relleno.
  Así su legibilidad no depende del tono que le haya tocado al departamento, y el mismo componente
  sirve en claro, en oscuro y en papel.
- **Solo se etiqueta lo que tiene datos.** Poner los 33 números convierte el mapa en una sopa de
  cifras y esconde justo lo que importa.
- **Las etiquetas que se pisan se separan solas.** En la costa caribe hay seis departamentos
  pequeños y pegados. `separarEtiquetas` coloca primero las de más peso y empuja las que chocan, con
  un tope de desplazamiento: mejor un solape pequeño que una cifra señalando otro departamento. Es
  determinista, así que los mismos datos dan siempre el mismo mapa.
- **Tramos proporcionales al máximo, no cuantiles.** Con pocos departamentos los cuantiles dan saltos
  que no corresponden a nada: con dos departamentos, uno saldría siempre en el color más oscuro.

## Atribución

La geometría es **«Map of Colombia» de VictorCazanave/svg-maps, CC BY 4.0**. La licencia obliga a dar
crédito y el crédito aparece en tres sitios: la cabecera del archivo generado, este documento y —lo
que de verdad cuenta— **debajo del mapa en la aplicación y en el informe impreso**.

## Consecuencias

- Aparece una dependencia de desarrollo, `@svg-maps/colombia`, usada solo por `npm run mapa`. La
  aplicación no descarga geometría en tiempo de ejecución: tiene que funcionar sin conexión.
- El módulo generado pesa 53 KB (19 KB comprimido) y queda dentro del fragmento de Reportes, que ya
  se carga bajo demanda. El paquete inicial no crece.
- Los clientes **archivados** quedan fuera del mapa: responde «dónde estoy trabajando».
- Un cliente **sin municipio** no se descarta en silencio, se cuenta aparte y el informe lo dice. Si
  desapareciera, la suma del mapa no cuadraría con la cartera y nadie sabría por qué.

## Un defecto que salió al construir esto

La página de Reportes mostraba un estado vacío que **tapaba la página entera** cuando no había
ventas. Como el informe mensual es el que sale por defecto, alguien con los clientes ya cargados y
sin haber importado el primer mes no podía ni ver las tarjetas para cambiar de informe — justo la
situación de quien acaba de empezar. Ahora el estado vacío sustituye solo al documento, y la
cobertura territorial y la cartera siguen accesibles, porque se sostienen solo con clientes.

## Cómo se verificó

Con los 62 clientes y las 119 ventas reales cargados:

- 33 departamentos dibujados, 10 etiquetados (los que tienen clientes);
- los diez departamentos coinciden con el Excel, en clientes **y** en cuántos compraron —
  Santander 13/7, Antioquia 9/2, Córdoba 8/1, Sucre 10/0, Bolívar 9/3, Magdalena 5/0, Cesar 4/1,
  Guainía 1/0, Norte de Santander 2/0, Chocó 1/0;
- Montería aparece con sus 2 clientes en el desglose por municipio;
- la zona «Magdalena Medio» (Barrancabermeja + Puerto Wilches + Puerto Berrío) agrupa 6 clientes,
  1 con compra — los mismos que da contar el archivo;
- **cero solapes** entre pastillas, medido sobre el DOM y no a ojo;
- el PDF de A4 sale legible, con mapa, leyenda, atribución y las tres tablas.
