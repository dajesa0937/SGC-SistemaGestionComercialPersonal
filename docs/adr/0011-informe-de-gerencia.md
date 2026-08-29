# ADR 0011 · Informe de gerencia: explicar la diferencia, no solo mostrarla

**Fecha:** 29 de agosto de 2026
**Estado:** aceptada

## Contexto

El usuario preguntó qué más podía analizar la aplicación para un informe de gerencia, y nombró
visitas, ventas, eficacia, efectividad y gastos de ruta. Va dirigido a su **jefe directo / gerencia
comercial**, en una página.

Tres precisiones que ordenaron el trabajo:

- **Eficacia** es lograr la meta — ya estaba (cumplimiento).
- **Eficiencia** es a qué costo — **no se puede medir**: no hay gastos cargados.
- **Efectividad** en calle es el porcentaje de visitas que terminan en pedido — sí se puede, desde
  que el plan de visitas empezó a registrarlas.

La aplicación tampoco tiene compras, pagos ni margen, y se le dijo así.

## Decisión

**El informe lidera con el cumplimiento y, justo debajo, con el puente de ventas.**

Lo primero que preguntan es «¿cumpliste?»; lo segundo es «¿por qué?», y eso es lo que casi ningún
tablero responde. Un informe que dice «bajamos seis millones» no permite hacer nada. Uno que dice
«entraron siete de clientes nuevos y trece de recuperados, pero se fueron veinticuatro» apunta a
acciones distintas.

### El puente de ventas

Descomposición de la variación contra el mes anterior, con identidad exacta:

```
base + nuevos + recuperados + crecimiento + contracción + pérdidas = final
```

Se dibuja como cascada, a mano en SVG (ADR 0005). Los aportes y las restas se distinguen por color
**y por el signo escrito encima**, nunca solo por color.

**Un cliente que vuelve no es un cliente nuevo.** Contarlos juntos infla los «nuevos» mes tras mes
con los de siempre, así que se mira si compró alguna vez antes del mes anterior.

**Una venta en cero no cuenta como compra.** Si contara, un cliente en cero pasaría por activo y no
aparecería nunca como perdido.

### Los indicadores del anexo

Se calculan sobre el **año en curso**, no sobre el mes: un ticket promedio de un solo mes, en una
cartera que compra dos veces al año, no significa nada. La excepción es la efectividad de visita, que
se mide del mes porque es lo que se puede corregir la semana siguiente.

- **Pedidos** — un cliente y una fecha son un pedido. El archivo no trae número de documento, y esto
  es lo más cercano a la factura real sin inventarlo.
- **Ticket promedio y mediana** — las dos, porque un pedido grande desplaza el promedio.
- **Líneas por pedido** y **categorías por cliente** — venta cruzada dentro de la factura y a lo
  largo del año. Con los datos actuales: **1,01 líneas por pedido** y **1,71 categorías de 5**.
- **Penetración por línea** — qué fracción de la cartera activa compra cada categoría. Ninguna pasa
  del 37 %.
- **Concentración** — top 5 y cuántos clientes hacen la mitad de la venta.

## El defecto que casi se va al informe

La primera versión medía la efectividad como **pedidos del mes ÷ visitas del mes**. Con tres visitas
registradas y quince pedidos dio **500 %**.

Un indicador de efectividad por encima del 100 % es la señal de que el denominador no cubre al
numerador: los pedidos existen aunque no se haya visitado a nadie, así que se estaban dividiendo dos
cosas que no se corresponden. Y era el peor sitio posible para un número inflado — una hoja que se
lleva a la reunión con el jefe.

Corregido a lo que significa de verdad: **de las visitas hechas, cuántas fueron seguidas de un pedido
de ESE cliente dentro de 30 días.** Nunca pasa de 100 %. Treinta días porque es el ciclo típico de
decisión en maquinaria: menos dejaría fuera ventas que sí vinieron de la visita, y más empezaría a
atribuirle a la visita pedidos que habrían entrado igual.

Tres pruebas lo vigilan, incluida una que comprueba que el resultado nunca supera 1.

## Lo que sigue sin poder calcularse, y qué haría falta

| Lo que falta | Qué haría falta |
|---|---|
| Costo por visita, costo por peso vendido, gasto por zona | Un registro de gastos: fecha, tipo, valor y zona |
| Cartera y recaudo | El reporte de cuentas por cobrar, que ya existe — es la D-04 |
| Margen y rentabilidad | El costo de cada producto. Sin eso cualquier margen sería inventado |

## Cómo se verificó

400 pruebas. En navegador con los datos reales, contrastando cada cifra contra un cálculo
independiente hecho aparte: 118 pedidos, 1,01 líneas por pedido, 1,71 categorías por cliente, ticket
$ 2,0 M con mediana $ 1,7 M, 22 clientes que compraron una sola vez, concentración del 20 % en los
cinco mayores, y la penetración por línea coincidiendo exactamente. El puente cuadra a la vista:
$ 33,1 M + 7 + 13,4 + 2,4 − 5 − 24,2 = **$ 26,7 M**.

La hoja impresa se capturó en el instante de imprimir —no del contenido de la pantalla— y cabe en una
página A4.
