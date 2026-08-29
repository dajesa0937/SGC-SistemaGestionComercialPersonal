# ADR 0013 · Base de demostración

**Estado:** aceptado · **Fecha:** 29-ago-2026 · **Sprint 12**

## Contexto

El usuario pidió poder crear datos de prueba y borrarlos después. El riesgo obvio no es técnico: es
que unas cifras inventadas acaben en una reunión, o que los datos de prueba se mezclen con los reales
y ya no se puedan separar.

## Decisiones

### 1. La demostración entra por el camino del respaldo, y **reemplaza**

`generarDemo` produce un `ContenidoRespaldo` completo, se serializa, se valida con `validarRespaldo` y
se restaura con el mismo código que restaura un respaldo del usuario.

Tres cosas salen gratis de ahí: se reutiliza la única ruta de escritura masiva que ya estaba probada;
la demostración se valida a sí misma antes de tocar la base; y **volver atrás es restaurar el propio
respaldo**, que es exacto, en vez de intentar borrar registro a registro los que yo hubiera marcado.

Alternativa descartada: insertar los registros de prueba junto a los reales y borrarlos por una
marca. Nadie separa después cuarenta clientes de ochenta a mano si la marca falla en un registro, y
el fallo no se vería hasta que fuera irreversible.

### 2. El respaldo se pide **antes**, no se avisa después

El botón de cargar no lleva directo: cuando hay datos en la base abre un paso que dice cuántos
registros hay y ofrece descargar el respaldo ahí mismo. Un aviso que se descarta con un clic no es
una salvaguarda; un paso que ofrece la acción correcta sí.

### 3. El sello impreso cuelga de `<html data-demo>`, no de cada informe

El hook `useDemo` pone ese atributo y `print.css` estampa la banda «DATOS DE DEMOSTRACIÓN · NINGUNA
DE ESTAS CIFRAS ES REAL» sobre `#hoja-impresion`. Así lo lleva **cualquier** hoja, incluidas las que
se escriban en el futuro. Si dependiera de que cada informe se acordara de pintarlo, tarde o temprano
saldría un PDF de cifras inventadas con pinta de informe real, y ese es exactamente el accidente que
hay que hacer imposible.

Por lo mismo, cada cliente se llama `DEMO · algo` y cada id empieza por `demo-`: la marca sobrevive a
una exportación a CSV y se ve dentro del propio archivo de respaldo.

### 4. En demostración no se avisa del respaldo, y su exportación se llama distinto

Con la demo cargada no hay nada que proteger, y el aviso empujaría a descargar un archivo de datos
inventados que después se confundiría con el respaldo de verdad. Si aun así se exporta, el archivo se
llama `demostracion-sgc-<fecha>.json`: el nombre es lo único que se ve en la carpeta de descargas.

### 5. La generación es determinista

Semilla fija (mulberry32) y `hoy` como parámetro. Una demostración que cambia en cada carga no se
puede probar, y cuando algo se viera raro no habría forma de saber si es un fallo o el azar.

### 6. Los datos tienen que enseñar la aplicación entera

Cuarenta y dos clientes en los diez departamentos reales, con códigos DANE de verdad (hay una prueba
que lo comprueba: un código inventado dejaría clientes fuera del mapa y la demo enseñaría un fallo
que no existe). Dieciocho meses de ventas línea a línea con las cinco líneas de producto y
estacionalidad. Seis comportamientos distintos —crece, estable, cae, esporádico, nuevo, recién
abierto, perdido— porque con todos iguales ni el plan de visitas ni el puente de ventas mostrarían
nada. Visitas repartidas entre al día, vencidas y nunca visitados. Dos cortes de cartera separados
treinta días, con saldos a favor incluidos.

## Consecuencias

- Volver a los datos reales es restaurar el respaldo propio. «Quitar la demostración» solo borra y
  deja la base vacía; la pantalla lo dice con esas palabras.
- Restaurar un respaldo ahora vuelve a escribir la fecha del último respaldo. Antes se perdía —vivía
  en la misma tabla que se reemplazaba— y justo después de restaurar su propio archivo el usuario
  leía «nunca has descargado un respaldo», que es falso.
- La hoja de cartera pasó de doce a diez clientes en la tabla de vencidos: con dos cortes el bloque
  de comparación crece y el sello suma una línea más.

## Verificación

Recorrido completo en el navegador: importar el maestro real (62 clientes) → cargar la demostración
pasando por la puerta del respaldo → comprobar el aviso y el atributo → recorrer Panel, Clientes,
Visitas, Cartera y Reportes → generar el PDF y comprobar que lleva el sello → restaurar el respaldo
descargado → comprobar que no queda ninguna fila `DEMO ·`, que el aviso desaparece y que vuelven los
62 clientes reales.

El puente de ventas de la demostración cierra exacto: `153 + 4,6 + 1,7 + 57,2 − 27,5 − 0 = 189 M`.
