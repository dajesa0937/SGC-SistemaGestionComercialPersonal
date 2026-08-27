# ADR 0003 · Librería para leer Excel

**Fecha:** 26 de agosto de 2026 · **Estado:** aceptada

## Contexto

Leer el archivo que envía la empresa es el requisito central del MVP. El stack original no incluía
ninguna librería para ello.

## Opciones

1. **SheetJS (`xlsx`) desde npm** — el estándar de hecho, pero el paquete de npm está congelado en
   la versión 0.18.5, que arrastra vulnerabilidades conocidas (CVE-2023-30533, CVE-2024-22363).
   SheetJS trasladó su distribución a su propio CDN.
2. **SheetJS desde `cdn.sheetjs.com`** — versión actual y sin vulnerabilidades, pero la dependencia
   queda anclada a una URL con versión fija que nunca recibe actualizaciones automáticas, y ese
   host no es alcanzable desde el entorno donde se ejecuta la verificación.
3. **`exceljs`** — está en npm y se mantiene, pero pesa alrededor de 1 MB, está orientado a
   escritura y su uso en el navegador exige rellenos para módulos de Node.
4. **`read-excel-file`** — en npm, mantenido, MIT, unos 16 kB comprimidos, orientado exclusivamente
   a lectura, y devuelve la hoja como rejilla de celdas sin imponer un esquema.

## Decisión

Opción 4, `read-excel-file`, con carga diferida. Los CSV se leen con un analizador propio de unas
sesenta líneas (`src/lib/csv.ts`) cubierto por pruebas, en lugar de añadir otra dependencia.

## Consecuencias

- El lector solo pesa para quien entra a importar: no toca el paquete de arranque.
- **Limitación aceptada: no se pueden leer archivos `.xls`** (Excel 97-2003). Si el archivo mensual
  llega en ese formato, hay que abrirlo y usar «Guardar como → Libro de Excel». La aplicación
  detecta el caso y lo explica con esas palabras en vez de fallar.
- Si el archivo real resulta ser `.xls` de forma recurrente, esta decisión se revisa: la opción 2
  vuelve a la mesa, ya que en el equipo del usuario sí hay acceso a internet sin restricciones.
- El analizador de CSV es código propio, y por tanto responsabilidad nuestra: por eso lleva pruebas
  de comillas, separadores dentro de comillas, saltos de línea en celda, BOM y detección de
  separador.
