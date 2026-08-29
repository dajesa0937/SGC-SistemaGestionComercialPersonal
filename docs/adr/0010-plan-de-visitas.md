# ADR 0010 · Plan de visitas: valor por tendencia, acotado por capacidad

**Fecha:** 29 de agosto de 2026
**Estado:** aceptada

## Contexto

El usuario pidió que la aplicación clasifique A/B/C «para la frecuencia de visitas y proyección y
crecimiento». La clasificación ABC ya existía desde el Sprint 3 (Pareto sobre los últimos doce
meses). Lo que faltaba era convertirla en un plan de trabajo.

Al mirar sus datos apareció el problema de fondo: **con los cortes actuales la clase A es el 52 % de
la cartera** — 32 de 62 clientes. Un Pareto sano da A ≈ 20 %. Que hagan falta 32 clientes para llegar
al 80 % significa que la facturación está muy repartida.

Eso rompe cualquier plan: 32 clientes A cada 15 días son 64 visitas al mes, más B y C, **86 visitas
al mes**, contra una capacidad declarada de 60. **Una clasificación que no cabe en el mes no sirve
para planear visitas**, por muy correcta que sea la matemática.

(Parte de esa planitud es el archivo de ventas sintético — todos los clientes compraron entre una y
tres veces con montos parecidos. Con el export real la cartera debería concentrarse. La decisión vale
igual.)

## Decisión

**Tres reglas.**

### 1. La prioridad combina valor y tendencia, no solo tamaño

`prioridad = peso(clase) × peso(tendencia) × urgencia`

- `peso(clase)`: A=4, B=2, C=1, sin historia=2. Escala gruesa a propósito: el Pareto no tiene más
  precisión que esa.
- `peso(tendencia)`: cae=3, sin base=1,5, crece=1,2, estable=1. **Caer pesa más que crecer**, porque
  recuperar a quien se está yendo vale más que acompañar a quien ya va solo.
- `urgencia`: el retraso como **fracción de su frecuencia**, no en días crudos. Diez días de retraso
  aprietan mucho más en un cliente quincenal que en uno semestral.

Los datos reales del usuario muestran por qué importa: **Gader del Cristo** pasó de $ 650.000 a
$ 9,9 M y **Jorge Alberto Mahecha** pasó de $ 2,9 M a cero. **Los dos son clase A.** Ordenar solo por
tamaño los trata igual.

### 2. La lista se corta por capacidad

El usuario declara cuántas visitas alcanza a hacer por semana. La pantalla muestra esa lista y no una
más larga. Un plan que no cabe en la semana no es un plan.

### 3. El déficit se muestra, no se esconde

Cuando las frecuencias piden más visitas de las que caben, la aplicación lo dice con las dos cifras y
la resta. Ocultarlo dejaría al usuario creyendo que cumple un plan que nunca fue posible.

Con sus datos: pide 86, caben 60, faltan 26.

**Nota calculada para él:** apretar el corte de Pareto no resuelve — ni siquiera bajándolo al 40 %,
que dejaría 13 clientes en A y aún pediría 67 visitas. Lo que sí cuadra es **espaciar la clase A a
25 días** (60 exactas). No se cambió por defecto: es su política comercial, no una decisión técnica.

## La última visita sale de las notas

No se inventó un registro de visitas: las notas de cliente ya tenían `tipo: 'visita'` desde el
Sprint 4. La última visita de un cliente es su nota de tipo visita más reciente, y el botón
«Visitado hoy» crea exactamente esa nota. Una fuente, no dos.

## Crecimiento y proyección

- **Crecimiento:** últimos tres meses contra los tres anteriores. Tres y no uno porque un mes no
  distingue una caída de una compra que se corrió dos semanas. Tres y no doce porque el objetivo es
  detectar el cambio a tiempo, no describir el año. Umbral del 15 % para no llamar señal al ruido.
- **Sin base no es crecer.** Vender por primera vez no es «+∞ %»: es empezar, que es otra cosa, y
  tiene su propia etiqueta.
- **Proyección:** acumulado del año más el promedio de los últimos tres meses por los meses que
  faltan. El promedio reciente y no el anual, para no arrastrar los ceros de enero de quien arrancó
  en junio.
- **Se marca «poca base»** cuando el cliente compró en menos de tres meses del año. El número se
  muestra igual: esconderlo sería peor, y un número sin base sigue siendo un número — por eso hay que
  decirlo.

## La hoja de ruta va por municipio, no por prioridad

En la calle el orden lo manda la carretera. La prioridad ya decidió **quiénes** entran a la hoja;
una vez decidido, saltar de un pueblo a otro para respetar un ranking es perder la mañana
conduciendo. Cada cliente lleva una línea en blanco: es una hoja de trabajo, no un informe.

## Un defecto de método que salió aquí

La verificación de impresión de los sprints anteriores **daba por buena la hoja sin haberla visto**:
generaba el PDF de la pantalla, y en Reportes la pantalla ya muestra el documento, así que el
resultado parecía correcto por casualidad. La hoja de ruta es el primer documento que **solo existe
durante la impresión**, y ahí el truco se cayó: el PDF salió con la pantalla del plan.

Corregido en la prueba: se sustituye `window.print` para capturar el documento exacto en el instante
de imprimir y se comprueba sobre eso. Es la tercera vez en este proyecto que una comprobación falla o
acierta por el motivo equivocado (el localizador del Sprint 6, la lectura de tabla del Sprint 8, y
esta). Vale la pena tenerlo presente.

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Ordenar solo por clase | Visita de más a los grandes tranquilos y no ve venir las caídas. Es el caso Jorge Alberto |
| Ordenar solo por tiempo sin visitar | Gasta el mismo esfuerzo en un cliente de $ 300.000 que en uno de $ 11 M |
| Forzar el corte de Pareto para que A quepa | Distorsiona la clasificación para tapar un problema de capacidad. Además no funciona: ni al 40 % cabe |
| Inventar un registro de visitas nuevo | Las notas de tipo visita ya existían. Dos registros de lo mismo se desincronizan |

## Cómo se verificó

376 pruebas. En navegador con los 62 clientes y 119 ventas reales: 62 pendientes, 15 en la lista de
la semana, el aviso de déficit con las cifras correctas (86 / 60 / faltan 26), y **el primero de la
lista es un cliente A que cae un 22 % y nunca ha sido visitado** — exactamente el orden buscado.
Registrar «Visitado hoy» lo saca de la lista y sube el siguiente. La hoja de ruta impresa se capturó
en el instante de imprimir y se comprobó que es la hoja y no la pantalla, que va agrupada por
municipio y que explica las frecuencias al pie.
