# ADR 0012 · Módulo de cartera por cobrar

**Estado:** aceptado · **Fecha:** 29-ago-2026 · **Sprint 11**

## Contexto

El usuario recibe cada mes de la empresa el reporte «Cuentas por cobrar detallada por documento».
El archivo real analizado en el Sprint 7 tiene 62 documentos, 32 clientes y $ 220,6 M, de los que
$ 100,5 M están vencidos. Era la decisión abierta D-04 y el usuario la puso segunda en el orden de
lo que falta, después del informe de gerencia.

El archivo tiene una forma incómoda: seis filas de título con celdas combinadas, el encabezado en la
fila 7, dos columnas (CONTACTO y TELEFONO) que el usuario escribe a mano en cada exportación, una
fila suelta al final con la fecha de proceso, e importes con centavos en 35 de las 62 filas.

## Decisiones

### 1. En el código se llama «cobranza», no «cartera»

`analizarCartera.ts` ya existía y usa «cartera» con el otro sentido de la palabra en la calle: la
cartera de clientes. Dos cosas distintas con el mismo nombre en el mismo proyecto es la vía rápida a
un error de importación que nadie ve. El módulo nuevo es `domain/cobranza` y `application/cobranza`.
En pantalla dice «Cartera», que es como lo llama el usuario y como lo llama el reporte.

### 2. El dinero de cartera se guarda en centavos enteros

El resto de la aplicación usa `Pesos` enteros porque el peso no usa centavos en la práctica
comercial. Aquí no vale: 35 de 62 filas traen decimales, y en el archivo se cumple **exactamente**,
fila por fila, que

    Total = vencidos + saldo por vencer − saldo a favor

Esa igualdad es la única comprobación independiente que tiene el importador de que leyó bien. Sumar
sesenta y dos importes en coma flotante la rompe por centésimas y convierte una comprobación útil en
ruido. Tipo `Centavos` en `domain/shared/dinero.ts`; se divide solo al mostrar.

Alternativa descartada: redondear a pesos al importar. Habría dado un total distinto del que imprime
la empresa, y ese es justo el número que el usuario tiene que poder defender.

### 3. El tramo de edad se **deriva**, y las columnas del archivo se usan para comprobarlo

Se guardan la fecha de vencimiento y el importe; el tramo sale de los días entre esa fecha y la del
corte. Las seis columnas de edades que trae el archivo no se guardan: se contrastan al importar y
cualquier discrepancia se muestra, sin descartar la fila.

Es la regla de «derivar, no duplicar» del proyecto, y aquí además paga: si la fecha del corte que se
escribe no es la real, el aviso de descuadre lo dice en vez de dejar una cartera silenciosamente mal
envejecida.

### 4. El signo manda sobre la fecha

Un saldo a favor es saldo a favor aunque su documento tenga fecha vencida. **No es una suposición:**
al derivar el tramo por fecha en las 62 filas reales, las nueve que discrepaban del archivo eran
exactamente las nueve filas con saldo a favor. El importe se guarda **una sola vez y con signo**: el
archivo dice lo mismo en dos sitios (positivo en «Saldo a favor», negativo en «Total cartera») y
guardar los dos es como se acaba con dos cifras para el mismo saldo.

### 5. Un corte es una foto de una fecha, no un libro mayor

`CorteCartera` + `DocumentoCartera`. Reimportar el reporte de una fecha reemplaza el corte de esa
fecha; los demás no se tocan. Es la misma regla que la importación de ventas y por el mismo motivo:
el reporte de una fecha es la verdad completa de esa fecha, así que reimportarlo corrige, no duplica.

Con dos cortes aparece la comparación cliente a cliente. Los estados se llaman **sube, baja,
saldado, nuevo** y en ningún sitio se dice «pagó»: entre un corte y otro también se factura, así que
una bajada de saldo no es un pago. Para saber lo recaudado haría falta el reporte de pagos, que este
archivo no trae. La pantalla lo dice con esas palabras.

### 6. El documento se sostiene solo, sin ficha de cliente

Cada documento guarda `identificacion` y `nombre` como texto además del `clienteId` opcional. Diez
de los treinta y dos clientes con cartera no están en el maestro; el corte tiene que poder leerse
entero igualmente. Crear esas fichas es una casilla en la revisión, no un efecto automático.

## Consecuencias

- Esquema Dexie v4 (`cortes`, `documentosCartera`) y respaldo v4. Un respaldo v3 —anterior a este
  módulo— se restaura sin cartera, con prueba que lo fija.
- La cartera de un cliente sin municipio no cae en ningún departamento ni zona. La pantalla avisa con
  la cifra: en el archivo real son $ 42,6 M de 10 clientes.
- El informe imprimible cabe en una página. Si el usuario no ha definido zonas, agrupa por
  departamento en vez de dar una sola fila que diga «Sin ubicación».
- Falta el recaudo. Mientras no llegue, la aplicación no puede decir cuánto se cobró, solo cuánto se
  debe y cómo se movió. Se dice en la pantalla en vez de disimularlo con un indicador que parecería
  un pago.

## Verificación

Importado el archivo real en el navegador y contrastado contra cifras calculadas aparte con Python:
total $ 220.581.121, vencido $ 100.453.038 (45,5 %), los seis tramos al peso, mora ponderada 112
días, concentración top-5 62,0 %, documento más antiguo 321 días, 62 documentos de 32 clientes, 10
clientes sin ficha, y el reparto por departamento fila por fila. Cero descuadres y cero errores: las
62 filas cuadran con lo que dice la empresa. La hoja impresa se capturó en el instante de
`window.print()` y ocupa una página.
