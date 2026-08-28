# SGC Personal · Manual de uso

Guía corta. Si algo no se entiende en la aplicación sin leer esto, es un defecto de la aplicación,
no del manual.

---

## Cómo abrirla cada día

**Doble clic en `Iniciar SGC.bat`**, en la carpeta del proyecto. La aplicación se abre sola en
`http://localhost:4173`.

La primera vez, en el menú de Chrome o Edge elige **Instalar SGC Personal**. Después de eso tienes un
icono propio, la aplicación abre en su propia ventana sin barra de direcciones, y **abre aunque no
ejecutes nada y aunque no tengas internet**: queda guardada entera dentro del navegador.

Solo vuelves a ejecutar `Iniciar SGC.bat` cuando haya cambios en el código.

> **Ojo con el puerto.** Tus datos se guardan por dirección, y la dirección incluye el número del
> puerto. Lo que cargues en `localhost:4173` no aparece en `localhost:5173`, aunque sea la misma
> aplicación. El de uso diario es **4173**. Si ya tenías datos en el otro, descarga el respaldo allí
> y restáuralo aquí.

---

## Lo primero: tus datos viven en este navegador

No hay servidor. Todo está guardado en el navegador de este equipo. Eso hace que la aplicación sea
instantánea y funcione sin conexión, y tiene una consecuencia que conviene entender bien:

> **Limpiar los datos del sitio, cambiar de navegador o reinstalar Windows borra todo, sin preguntar.**

Por eso existe el respaldo, y por eso la aplicación insiste. **Descarga un respaldo cada quince días
y guárdalo fuera de este equipo** — en tu nube personal o en una memoria USB.

---

## El día a día

### 1. Define tu cuota — *Presupuesto*

Sin meta no hay cumplimiento que medir. Escribe la cuota de un mes y usa **Replicar** para copiarla
a los meses siguientes. Se guarda al salir de la casilla o al pulsar Enter.

### 2. Ten tu cartera cargada — *Clientes*

Puedes crear los clientes uno a uno o importar el maestro completo con **Importar**. El asistente te
muestra qué va a pasar antes de tocar nada, y los nombres que no reconozca te los pregunta.

El **código del cliente** es la pieza clave: es lo que concilia tu cartera con los archivos de la
empresa. Los nombres cambian de un mes a otro; el código no.

### 3. Registra las ventas — *Ventas*

Escribe el valor de cada cliente para el mes seleccionado. Se guarda al salir de la casilla.

*(La importación del Excel de ventas llega en una versión próxima. Mientras tanto, el registro
manual hace el mismo trabajo.)*

### 4. Mira cómo vas — *Panel*

Es la pantalla de inicio y responde sola:

| Indicador | Qué te dice |
|---|---|
| **Cumplimiento** | Cuánto llevas de la cuota del mes. Verde ≥ 100 %, ámbar 85–99 %, rojo por debajo |
| **Faltante** | Cuánto falta, y **cuánto tienes que vender por día hábil** para llegar |
| **Proyección de cierre** | Dónde vas a terminar si sigues al ritmo actual |
| **Acumulado del año** | Cómo vas contra la meta anual |
| **Cobertura** | Cuántos de tus clientes compraron este mes |
| **Requieren atención** | Quién dejó de comprar o cayó, ordenado por lo que factura |

Los días hábiles descuentan fines de semana y **festivos colombianos**, incluidos los que se
trasladan al lunes por la ley Emiliani.

### 5. Prepara la visita — *Clientes → clic en un cliente*

La ficha trae el histórico, la tendencia, las variaciones y tus notas. Escribe ahí lo que se habló:
lo que no se escribe se olvida.

### 6. Lleva el informe — *Reportes*

Cuatro documentos, todos con **Imprimir o guardar en PDF**:

- **Informe mensual de gestión** — cabe en una página, para reuniones de resultados.
- **Cobertura territorial** — el mapa de Colombia con tus clientes por departamento, y el desglose
  por zona y por municipio con venta y cobertura de cada uno.
- **Cartera de clientes** — el listado con los filtros que tengas puestos.
- **Ficha de cliente** — una hoja con todo, y espacio en blanco para escribir en la visita.

> **Sobre el mapa.** Pinta departamentos, no puntos por municipio: las coordenadas de los 1.122
> municipios del país no existen en ninguna fuente libre, y ponerlas a ojo sería un mapa que se ve
> bien y miente. El detalle exacto de cada municipio está en la tabla, justo debajo. Un cliente sin
> municipio asignado no aparece en el mapa y el informe te lo avisa.

---

## Cosas que conviene saber

**Los filtros viven en la dirección web.** Puedes guardar como marcador una vista filtrada, y el
botón atrás del navegador deshace el último filtro.

**Al imprimir sale todo lo filtrado**, no solo las veinticinco filas que se ven en pantalla.

**Los umbrales son tuyos.** En *Configuración* decides cuántos meses sin comprar convierten a un
cliente en inactivo, qué caída lo pone en riesgo y dónde cambian los colores del semáforo. Depende
del ciclo de compra de tu territorio, no de una regla general.

**Hay dos nociones de «cliente nuevo»** y se llaman distinto a propósito: *Nuevo en el año* es la
etiqueta del cliente (su primera compra fue este año) y *Nuevos este mes* es el indicador del panel
(su primera compra fue este mes).

**Instálala como aplicación.** En Chrome o Edge, el icono de instalar en la barra de direcciones.
Abre en su propia ventana y funciona sin conexión.

---

## Respaldo y restauración — *Configuración*

- **Descargar respaldo** genera un archivo `.json` con absolutamente todo.
- **Restaurar** revisa el archivo entero antes de tocar nada y te enseña qué contiene. Si el archivo
  está dañado o es de otra aplicación, te lo dice y **no modifica nada**.
- Restaurar **reemplaza todos los datos actuales**. No mezcla.
- **Borrar todos los datos** deja la aplicación como recién instalada. No se puede deshacer.

---

## Si algo va mal

**Los indicadores muestran cifras raras.** Compara el total del mes en *Ventas* con tu archivo de
origen. Si el total cuadra y el indicador no, es un error de la aplicación: hay que reportarlo.

**«Sin meta» en vez de un porcentaje.** Ese mes no tiene cuota asignada. Ve a *Presupuesto*.

**Un cliente aparece dos veces.** Tienes dos fichas con códigos distintos para el mismo cliente.
Archiva una desde su ficha; el histórico de la otra se conserva.

**No abre o se ve rota tras actualizar.** Recarga con Ctrl+Shift+R. Los datos no se pierden al
recargar.
