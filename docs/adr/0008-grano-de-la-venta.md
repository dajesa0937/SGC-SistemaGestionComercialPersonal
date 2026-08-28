# ADR 0008 · Guardar la línea de factura y derivar el total mensual

**Fecha:** 28 de agosto de 2026
**Estado:** aceptada
**Sustituye parcialmente a:** la decisión de grano registrada en `venta.entity.ts` durante el diseño

## Contexto

Al levantar los requisitos, el usuario describió el archivo de ventas como «total por cliente y mes».
Sobre esa descripción se modeló `VentaMensual` con la unicidad `cliente + periodo`, y se dejó escrito
en el código que «modelar un grano más fino sería inventar datos que no existen». También por eso la
decisión **D-01 — mezcla de producto** quedó marcada como *matemáticamente imposible*: sin detalle de
producto no hay mezcla que calcular.

El archivo real llegó el 28 de agosto y desmiente la descripción. `ventas 2.xlsx` trae **119 filas,
una por línea de factura**, con fecha, cliente, identificación, ciudad, **categoría, producto,
cantidad y valor unitario**. Ocho meses, $ 239.572.000, 62 clientes.

La descripción no era falsa: es probable que la empresa emita los dos reportes. Lo que cambia es que
ya no se puede asumir uno solo.

## Decisión

**Dos granos, una sola verdad por cliente y mes.**

- `MovimientoVenta` es la línea de factura: fecha, categoría, producto, cantidad, unitario y valor.
- `VentaMensual` sigue siendo lo que consumen **todos** los indicadores, sin cambios.
- Cuando el archivo viene detallado, el total mensual **se deriva** de los movimientos
  (`origen: 'movimientos'`). Cuando viene agregado, se guarda directamente (`origen: 'importacion'`).

El campo `origen` no es decorativo: distingue un total que se puede editar a mano de uno que solo se
corrige corrigiendo sus líneas. Nunca hay dos escritores del mismo cliente y periodo.

El importador **acepta las dos formas** y decide por lo que encuentre: si hay columna de fecha, es
detallado; si solo hay periodo, es agregado. No se le pregunta al usuario algo que el archivo ya
responde.

## Consecuencias

- **D-01 deja de estar bloqueada.** La mezcla de producto se calcula con `calcularMezcla`, por
  categoría o por producto, y aparece en el panel. Con el archivo real: Motores 32,0 %,
  Motosierras 25,3 %, Guadañadoras 21,2 %, Motobombas 20,0 %, Repuestos 1,6 %.
- **D-02 queda respondida a medias:** ocho meses de histórico. Comparar contra el mes anterior sí;
  contra el mismo mes del año anterior todavía no.
- La base sube a Dexie v3 y el respaldo a v3. No hay migración de datos: la tabla nace vacía.
- Reimportar un mes **reemplaza** sus movimientos y sus totales, no los suma. El archivo de un mes es
  la verdad completa de ese mes (RF-A07).
- Deshacer guarda y restaura **los dos granos**. Ver más abajo.

## Lo que salió mal y lo corrigió una prueba

La primera versión de la reversión guardaba solo el snapshot de los totales. Al deshacer, los totales
volvían y las líneas no: quedaban meses con cifra de venta y sin nada detrás. El cumplimiento seguía
saliendo, la mezcla de producto desaparecía, y las dos cifras se contradecían sin que nada avisara.

Lo detectó la verificación en navegador, no una prueba unitaria — porque solo aparece cuando los dos
granos se mueven juntos. La corrección añade `snapshotMovimientos` y ahora hay tres pruebas que
vigilan exactamente eso.

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Agregar al importar y guardar solo el total | Es lo que había. Descarta el detalle de producto, que es justo el indicador por el que evalúan al usuario |
| Guardar solo movimientos y calcular el total en cada consulta | Obliga a recorrer todas las líneas en cada indicador y deja sin sitio las ventas capturadas a mano, que no tienen línea |
| Guardar los dos y dejar que cada uno se escriba por su lado | Dos fuentes de verdad para la misma cifra. Es exactamente lo que este diseño evita en zonas, en ABC y aquí |
| Preguntarle al usuario qué formato trae el archivo | El archivo ya lo dice. Preguntar lo que se puede deducir es trasladarle al usuario un trabajo que es nuestro |

## Cómo se verificó

Importando `ventas 2.xlsx` en el navegador, sobre los 62 clientes reales ya cargados:

- hoja, fila de encabezado y **las nueve columnas** detectadas solas;
- 119 filas leídas, 119 aplicadas, **0 errores**, 0 clientes nuevos;
- 119 movimientos y 113 totales cliente × mes en la base;
- **$ 239.572.000**, idéntico al Excel, y la suma de los totales igual a la suma de los movimientos;
- **los ocho meses coinciden peso a peso** con el archivo;
- reimportar el mismo archivo deja 119 movimientos, no 238;
- deshacer devuelve el mes exactamente a como estaba, con líneas y totales cuadrados.
