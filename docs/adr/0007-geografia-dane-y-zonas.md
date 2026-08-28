# ADR 0007 · Geografía por código DANE y zonas definidas por el usuario

**Fecha:** 28 de agosto de 2026
**Estado:** aceptada

## Contexto

El maestro de clientes real (`datos de clientes.xlsx`, 62 clientes) trae una columna `CIUDAD` que
no contiene nombres sino **códigos DANE de municipio de cinco dígitos**: `68001`, `05001`, `13430`.
Los clientes se reparten en **31 municipios de 10 departamentos** — Santander, Sucre, Antioquia,
Bolívar, Córdoba, Magdalena, Cesar, Norte de Santander, Guainía y Chocó — y el requisito del usuario
es explícito: la aplicación tiene que servir **en toda Colombia**, no en una lista fija.

Hasta ahora el cliente tenía dos campos de texto libre, `zona` y `ciudad`. Texto libre significa que
«Ibagué», «IBAGUE» e «ibague» son tres zonas distintas, que nada garantiza que dos clientes del
mismo municipio queden agrupados, y que ningún filtro es de fiar.

## Decisión

Tres niveles, con una sola fuente de verdad cada uno.

1. **Municipio** — código DANE de cinco dígitos, guardado como **texto**. Catálogo completo
   versionado en `src/domain/geografia/municipios.generado.ts`: 1.122 municipios, 33 departamentos,
   9 KB comprimidos, disponible sin conexión.
2. **Departamento** — **derivado** de los dos primeros dígitos. No se guarda y por tanto no se puede
   desincronizar del municipio.
3. **Zona** — entidad propia (`Zona { nombre, municipios[] }`) que el usuario crea y edita. El
   cliente **no** guarda su zona: la hereda de su municipio a través del índice
   `indexarZonasPorMunicipio`.

### Por qué el municipio se guarda como texto y no como número

`05001` es Medellín. Leído como número es `5001`, que no existe. El cero inicial de Antioquia (05),
Atlántico (08) y Bogotá (11 no, pero 05 y 08 sí) no es decorativo. Excel entrega la misma celda como
número o como texto según cómo se guardó el archivo, así que `normalizarCodigoMunicipio` acepta las
dos formas y rellena con ceros a la izquierda.

### Por qué la zona no se guarda en el cliente

Guardarla obligaría a recorrer y reescribir todos los clientes cada vez que una zona cambia, y
crearía dos verdades que se desincronizan en cuanto una escritura falle a medias. Derivándola:

- incorporar Puerto Wilches a «Magdalena Medio» reetiqueta a sus clientes **en el acto**;
- borrar una zona **no toca ni un solo cliente**: sus municipios simplemente dejan de tener zona;
- un municipio reclamado por dos zonas se resuelve de forma **estable** (la primera por orden
  alfabético) y la pantalla de zonas lo señala, en vez de que el cliente cambie de zona entre dos
  cargas de pantalla.

### Un código desconocido no se rechaza

`resolverMunicipio` devuelve siempre un municipio; si el catálogo no lo conoce, lo marca con
`conocido: false` y muestra el código tal cual. Esto no es hipotético: el maestro real tiene un
cliente en **27086 · Belén de Bajirá**, municipio de Chocó segregado de Riosucio en diciembre de
2022 y posterior a la versión de la fuente del catálogo. Un importador que rechace lo que no
reconoce pierde clientes en silencio, que es la peor forma de perderlos.

### La identificación pasa a ser la llave

El NIT o la cédula sustituye al nombre como clave de conciliación, con **índice único** en la base.
El cruce de los dos archivos reales lo respalda: 22 clientes aparecen en ambos, con 22 nombres
idénticos y cero ambigüedad — ningún NIT con dos nombres, ningún nombre con dos NIT.
`normalizarIdentificacion` guarda solo dígitos y descarta el dígito de verificación, porque es la
parte que unos reportes traen (`901593129-3`) y otros no (`901593129`).

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Seguir con `zona` y `ciudad` como texto libre | Es el problema, no la solución: sin catálogo no hay agrupación fiable ni filtro creíble |
| Depender del paquete `divipola` en tiempo de ejecución | La división político-administrativa del país no es una dependencia de ejecución. Se usa **solo** para generar el archivo, que queda versionado y revisado |
| Descargar el catálogo del DANE al arrancar | Rompe el funcionamiento sin conexión, que es un requisito no funcional del MVP |
| Guardar el nombre del municipio en vez del código | Hay municipios homónimos en departamentos distintos: «San Pablo» existe en Bolívar, Nariño y Antioquia. El nombre no identifica |
| Zonas fijas por departamento | El usuario no trabaja por departamento: cruza Santander y Antioquia en una misma ruta del Magdalena Medio |

## Consecuencias

- La base sube a la **versión 2** de Dexie. La migración traduce `nit → identificacion`,
  `ciudad → municipio` (por código, o por nombre solo si es inequívoco) y convierte cada `zona` de
  texto en una zona de verdad con los municipios de los clientes que la usaban.
- El **respaldo sube a v2** y sabe leer los v1: `migrarRespaldo` aplica exactamente la misma
  traducción. Un respaldo descargado antes del cambio sigue restaurándose.
- Aparece una dependencia de desarrollo, `divipola`, usada solo por `npm run municipios`.
- El catálogo se puede quedar desactualizado. Se acepta: el coste es que un municipio nuevo se vea
  como código hasta regenerar, no que se pierda el cliente.

## Cómo se verificó

Importando el maestro real en el navegador: hoja y fila de encabezado detectadas solas, las cinco
columnas mapeadas solas — incluidos los literales «Identificación (Obligatorio)» y «CIUDAD» —,
62 filas leídas, 62 clientes creados, **0 errores**. El filtro por departamento ofrece exactamente
los 10 departamentos del archivo y devuelve 13 clientes en Santander, que es el número que da
contar el Excel. Una zona «Magdalena Medio» con Barrancabermeja, Puerto Wilches y Puerto Berrío
agrupa 6 clientes: 2 + 1 + 3, los mismos que el archivo.
