# Archivos de ejemplo

## Lo que hay aquí

Dos archivos **sintéticos** de ventas, generados para poder construir el importador del Sprint 2
contra algo concreto. Cubren de enero de 2025 a agosto de 2026 y usan los mismos códigos de cliente
que el maestro, para que la conciliación funcione.

| Archivo | Forma | Encabezado |
|---|---|---|
| `ejemplo-ventas-largo.xlsx` | Una fila por cliente y periodo | Fila 4 |
| `ejemplo-ventas-ancho.xlsx` | Un cliente por fila, un mes por columna | Fila 3 |

Los ocho clientes tienen comportamientos distintos a propósito: estables, en crecimiento, en caída,
uno que dejó de comprar hace cinco meses y uno que abrió hace cuatro. Así los indicadores de estado,
alertas y clientes nuevos tienen algo real que detectar. Hay estacionalidad (diciembre fuerte, enero
flojo) y una fila de **TOTAL GENERAL** que el importador debe ignorar.

## Advertencia

> **Estos datos validan que el importador funciona; no validan que funcione con el archivo real.**

El formato que envía Equipos Supra puede traer cosas que no se me ocurrieron: subtotales por zona,
celdas combinadas, meses escritos de otra forma, una hoja por sucursal, valores como texto. Sigue
haciendo falta un archivo real —aunque sea con las cifras alteradas— antes de dar el Sprint 2 por
terminado. Ponlo aquí con cualquier otro nombre; los `.xlsx` que no empiecen por `ejemplo-` están
excluidos del repositorio.

## Hallazgo de diseño para el Sprint 2

El formato **ancho** no encaja en el modelo de mapeo actual. `MapeoColumnas` asume que el periodo
vive en *una* columna (`colPeriodo`), lo cual solo describe el formato largo. En el ancho, cada
columna de mes **es** un periodo, y el mapeo tiene que decir «estas veinte columnas son periodos, y
así se lee su encabezado».

Esto obliga a que el asistente del Sprint 2 detecte la forma del archivo y ofrezca dos modos de
mapeo. No es un detalle menor: es la diferencia entre un importador que sirve y uno que solo sirve
para la mitad de los archivos posibles.

## Plantillas SGC Personal.xlsx

Plantilla de importación lista para usar. Cuatro hojas:

- **Instrucciones** — qué es obligatorio y qué no.
- **Clientes** — los títulos que la aplicación reconoce, con dos filas de ejemplo.
- **Ventas** — lo mismo para el archivo del mes.
- **Municipios DANE** — los 1.122 municipios del país con su código, para copiar y pegar.

**El orden de las columnas no importa**: el importador lee los títulos, nunca la posición. Está
verificado importando un archivo con las columnas desordenadas y con nombres alternativos
(«CEDULA», «RAZON SOCIAL», «CELULAR», «ENCARGADO»): las reconoció todas sin intervención.
