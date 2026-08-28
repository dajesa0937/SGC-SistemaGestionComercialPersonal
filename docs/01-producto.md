# SGC Personal · Documento de Producto

**Versión:** 1.0 · **Fecha:** 26 de agosto de 2026 · **Estado:** Aprobación pendiente

---

## 1. Visión del producto

### Declaración

> **SGC Personal es el centro de control comercial de un ejecutivo de territorio.**
> Convierte el reporte de ventas que la empresa entrega en Excel en respuestas accionables sobre el
> cumplimiento del mes, y le da un lugar propio al conocimiento del cliente que hoy vive en la cabeza
> del ejecutivo, en un cuaderno y en conversaciones de WhatsApp.

### El problema real

La empresa **mide** al ejecutivo comercial, pero no le entrega herramientas para **gestionarse**. El
Excel de ventas llega tarde, agregado y sin contexto. Responder "¿cómo voy?" exige abrir una hoja de
cálculo, filtrar y hacer cuentas mentales. Responder "¿a quién estoy perdiendo?" no se responde: se
descubre tarde.

### Anti-visión (igual de importante)

SGC Personal **no** es:

- Un ERP ni un reemplazo del sistema de la empresa. La empresa sigue siendo la fuente de verdad de la facturación.
- Un Excel con mejor apariencia. Si el resultado es una tabla infinita, el proyecto fracasó.
- Un producto multiusuario. Hoy tiene exactamente un usuario, y esa restricción es una ventaja de diseño que se aprovecha: sin roles, sin permisos, sin multi-tenancy, sin autenticación.

### Usuario

Un único usuario: Ejecutivo Comercial de Equipos Supra S.A.S., territorio en Tolima. Trabaja
principalmente desde computador, con conocimiento técnico alto (desarrolla sus propias herramientas).

### Métricas de éxito del producto

| Métrica | Meta |
|---|---|
| Frecuencia de uso | Se abre al menos 4 días de cada 5 hábiles |
| Tiempo para saber "¿cómo voy?" | Menos de 5 segundos desde abrir la app |
| Tiempo de importación mensual | Menos de 2 minutos de principio a fin |
| Sustitución del Excel | El Excel deja de abrirse para consultar; solo se importa |

---

## 2. Alcance del MVP

**Nombre del MVP: "Control de Cumplimiento".**

El MVP resuelve un solo problema y lo resuelve completo: *saber en todo momento cómo va el
cumplimiento del territorio y qué clientes están detrás del resultado.*

### Dentro del MVP

| # | Capacidad | Por qué está |
|---|---|---|
| 1 | Importación del Excel de ventas | Es la puerta de entrada de todos los datos. Sin esto no hay app. |
| 2 | Maestro de clientes | Los indicadores no tienen sentido sin saber quién es quién. |
| 3 | Presupuesto mensual | Sin meta no hay cumplimiento. |
| 4 | Panel de indicadores | Es el dolor #1 declarado. |
| 5 | Reportes imprimibles | Requisito explícito: llevar el informe en papel o PDF a reuniones. |
| 6 | Respaldo y restauración | Los datos viven en el navegador. Sin respaldo, un clic los borra para siempre. |

### Fuera del MVP — con justificación

| Capacidad | Fase | Por qué se aplaza |
|---|---|---|
| Rutas, mapas, geolocalización | Fase 3 | Es la parte más costosa de construir y la que menos dolor quita hoy. El uso es en PC, no en calle. |
| Agenda y visitas | Fase 2 | Valioso, pero depende de tener el maestro de clientes ya sólido. |
| Oportunidades y pipeline | Fase 2 | Requiere que primero exista el hábito de usar la app a diario. |
| Mezcla de producto | **Disponible** | El archivo de ventas trae categoría y producto. Se calcula la participación de cada línea en el mes y en el año. Resuelta D-01. |
| Sincronización entre dispositivos | Fase 4 | Multiplica la complejidad por tres. La arquitectura queda preparada, no construida. |
| Multiusuario / CRM comercial | Fase 5 | Es otro producto. Se llega si el personal demuestra valor. |

### Definición de "MVP terminado"

El MVP está terminado cuando, con el Excel del mes en la mano, se puede:

1. Importarlo en menos de 2 minutos sin tocar código.
2. Responder en 10 segundos: *¿cómo voy contra la cuota?*, *¿voy a cumplir al ritmo actual?*, *¿qué clientes cayeron?*, *¿a quién le tengo que caer esta semana?*
3. Imprimir un informe mensual presentable.
4. Sacar un respaldo completo en un archivo.

---

## 3. Requerimientos funcionales

### RF-A · Importación de datos

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-A01 | Importar archivos `.xlsx`, `.xls` y `.csv` con ventas por cliente y periodo | Debe |
| RF-A02 | Permitir elegir la hoja del libro y la fila donde empiezan los datos | Debe |
| RF-A03 | Mapeo de columnas configurable por el usuario (cliente, valor, periodo, código) | Debe |
| RF-A04 | Recordar el último mapeo usado y proponerlo automáticamente | Debe |
| RF-A05 | Vista previa antes de aplicar: filas nuevas, actualizadas, con error y clientes no reconocidos | Debe |
| RF-A06 | Resolver clientes no reconocidos: crear nuevo o vincular a uno existente creando un alias | Debe |
| RF-A07 | Importación idempotente: reimportar el mismo periodo reemplaza los valores, nunca duplica | Debe |
| RF-A08 | Historial de importaciones con opción de revertir la última | Debería |
| RF-A09 | Carga inicial de histórico multi-periodo en una sola operación | Debe |
| RF-A10 | Registro manual de una venta cuando el Excel aún no llega | Podría |

### RF-B · Clientes

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-B01 | Crear, editar y archivar clientes (nunca eliminar: rompe el histórico) | Debe |
| RF-B02 | Ficha 360 del cliente: datos, histórico mensual, tendencia, notas | Debe |
| RF-B03 | Clasificación ABC automática por participación en facturación (Pareto) | Debe |
| RF-B04 | Estado derivado del cliente: Nuevo / Activo / En riesgo / Inactivo, con umbrales configurables | Debe |
| RF-B05 | Búsqueda por nombre, código o NIT | Debe |
| RF-B06 | Filtros por zona, estado y clasificación | Debe |
| RF-B07 | Notas fechadas asociadas al cliente | Debería |
| RF-B08 | Gestión de alias para conciliar nombres distintos del Excel | Debe |
| RF-B09 | Importar el maestro de clientes desde Excel | Debería |

### RF-C · Presupuesto

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-C01 | Definir la cuota mensual en pesos para cada mes del año | Debe |
| RF-C02 | Vista anual con los 12 meses editables y total acumulado | Debe |
| RF-C03 | Replicar una cifra a todos los meses restantes del año | Debería |
| RF-C04 | Historial de cambios de cuota (auditoría personal) | Podría |

### RF-D · Indicadores

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-D01 | Cumplimiento del mes: vendido, meta, % y faltante en pesos | Debe |
| RF-D02 | Ritmo requerido: cuánto hay que vender por día hábil restante para cumplir | Debe |
| RF-D03 | Proyección de cierre del mes según el ritmo actual | Debe |
| RF-D04 | Acumulado del año contra meta anual | Debe |
| RF-D05 | Cobertura: clientes que compraron sobre clientes activos del territorio | Debe |
| RF-D06 | Clientes nuevos del periodo (primera compra registrada) | Debe |
| RF-D07 | Ranking de clientes del periodo con variación contra mes anterior y contra mismo mes del año anterior | Debe |
| RF-D08 | Alertas: clientes que dejaron de comprar y caídas superiores a un umbral | Debe |
| RF-D09 | Serie de ventas de los últimos 12 meses contra la meta | Debe |
| RF-D10 | Comparativo por zona | Podría |

### RF-E · Reportes imprimibles

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-E01 | Informe mensual de gestión: encabezado, cumplimiento, gráfica, top clientes, alertas | Debe |
| RF-E02 | Listado de clientes con filtros aplicados, en formato de tabla imprimible | Debe |
| RF-E03 | Ficha individual del cliente imprimible (útil antes de una visita) | Debería |
| RF-E04 | Diseño de impresión propio (`@media print`): sin sidebar, sin botones, saltos de página controlados, encabezado y pie con periodo y fecha de generación | Debe |
| RF-E05 | Exportación a PDF mediante el diálogo de impresión del navegador ("Guardar como PDF") | Debe |
| RF-E06 | Exportar cualquier tabla a CSV | Debería |

### RF-F · Transversales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-F01 | Exportar respaldo completo en un archivo JSON | Debe |
| RF-F02 | Restaurar desde un archivo de respaldo | Debe |
| RF-F03 | Recordatorio de respaldo cuando han pasado más de N días sin respaldar | Debería |
| RF-F04 | Instalable como PWA de escritorio | Debe |
| RF-F05 | Funcionamiento completo sin conexión | Debe |
| RF-F06 | Modo claro y oscuro | Debe |
| RF-F07 | Configuración de umbrales de negocio (días para "en riesgo", % de caída para alerta, corte ABC) | Debería |

---

## 4. Requerimientos no funcionales

| ID | Categoría | Requerimiento | Cómo se verifica |
|---|---|---|---|
| RNF-01 | Rendimiento | Primera carga útil < 2 s; navegación entre pantallas < 100 ms | Lighthouse + medición manual |
| RNF-02 | Rendimiento | Recálculo completo de indicadores < 200 ms con 100 clientes × 36 periodos | Prueba de rendimiento con datos sintéticos |
| RNF-03 | Disponibilidad | 100 % de la funcionalidad disponible sin conexión tras la primera carga | Prueba con red desconectada |
| RNF-04 | Durabilidad | Ningún dato puede existir únicamente en IndexedDB sin ruta de respaldo | Revisión de diseño |
| RNF-05 | Portabilidad de datos | Todos los datos exportables a un archivo legible y reimportables | Prueba de ida y vuelta |
| RNF-06 | Mantenibilidad | Ninguna referencia a Dexie fuera de `infrastructure/` | Regla de ESLint que prohíbe el import |
| RNF-07 | Mantenibilidad | TypeScript en modo `strict`, cero `any` explícitos | `tsc --noEmit` en CI |
| RNF-08 | Corrección | Cobertura de pruebas ≥ 90 % en `application/indicadores/` | Vitest coverage |
| RNF-09 | Extensibilidad | Agregar un módulo nuevo no debe requerir modificar módulos existentes | Revisión de arquitectura |
| RNF-10 | Privacidad | Cero telemetría, cero servicios de terceros, cero salida de datos del equipo | Revisión de dependencias de red |
| RNF-11 | Accesibilidad | Navegación completa por teclado y contraste WCAG AA | Auditoría con axe |
| RNF-12 | Tamaño | Bundle inicial < 300 KB comprimido; carga diferida por módulo | `rollup-plugin-visualizer` |
| RNF-13 | Costo | Costo total de operación: **0 pesos** | Ver §15 en el documento de arquitectura |
| RNF-14 | Impresión | Todo reporte debe caber en ancho carta vertical sin corte lateral | Prueba de impresión real |

> **Sobre RNF-02:** con menos de 100 clientes el volumen de datos es trivial (≈3.600 registros). Esto
> es una excelente noticia y hay que aprovecharla: **no** se necesitan Web Workers, ni virtualización
> de tablas, ni paginación en servidor. Todo cabe en memoria. Cualquier propuesta que introduzca esa
> complejidad en el MVP debe rechazarse.

---

## 5. Casos de uso

### CU-01 · Importar las ventas del mes (crítico)

- **Actor:** Ejecutivo comercial
- **Precondición:** Tiene el archivo Excel del periodo; existe el maestro de clientes
- **Disparador:** Llega el reporte mensual de la empresa

**Flujo principal**

1. Entra a *Importar* y selecciona el archivo.
2. El sistema detecta las hojas y propone el mapeo de columnas usado la última vez.
3. Confirma o ajusta el mapeo y el periodo al que corresponde.
4. El sistema procesa y muestra la vista previa: *N filas leídas, X clientes reconocidos, Y no reconocidos, Z filas con error*.
5. Resuelve los clientes no reconocidos, uno por uno: crear nuevo, o vincular a uno existente (queda guardado como alias).
6. Confirma la importación.
7. El sistema guarda las ventas, registra la importación con su snapshot previo y muestra un resumen.
8. El panel de indicadores queda actualizado.

**Flujos alternos**

- *4a. El archivo no tiene el formato esperado:* el sistema explica qué columna falta y permite corregir el mapeo sin volver a cargar el archivo.
- *4b. El periodo ya fue importado:* el sistema advierte y ofrece reemplazar los valores existentes; nunca duplica.
- *5a. Hay más de 20 clientes no reconocidos:* señal de que el mapeo está mal; el sistema lo advierte antes de continuar.
- *6a. Error durante el guardado:* la operación es transaccional; o se aplica completa o no se aplica nada.

**Postcondición:** las ventas del periodo están registradas y los indicadores reflejan el nuevo estado.

---

### CU-02 · Revisar el cumplimiento del mes (crítico)

- **Actor:** Ejecutivo comercial
- **Precondición:** Existe cuota del mes y al menos una venta registrada
- **Disparador:** Consulta diaria de control

**Flujo principal**

1. Abre la aplicación; el panel es la pantalla de inicio.
2. Lee, sin hacer un solo clic: vendido del mes, meta, % de cumplimiento, faltante, proyección de cierre y acumulado del año.
3. Revisa el bloque *Requieren atención* con los clientes en caída o inactivos.
4. Hace clic en un cliente para abrir su ficha y entender qué pasó.

**Postcondición:** conoce su situación y tiene una lista concreta de clientes a trabajar.

---

### CU-03 · Preparar una visita o llamada

1. Busca al cliente por nombre.
2. Abre su ficha: histórico de 12 meses, tendencia, última compra, notas anteriores.
3. Opcionalmente imprime la ficha.
4. Después del contacto, registra una nota fechada.

### CU-04 · Detectar clientes en caída

1. En el panel, abre *Requieren atención*.
2. Filtra la lista de clientes por estado *En riesgo* o *Inactivo*.
3. Ordena por facturación histórica para priorizar por impacto.
4. Imprime la lista como plan de trabajo de la semana.

### CU-05 · Definir el presupuesto del año

1. Entra a *Presupuesto* y selecciona el año.
2. Digita la cuota de cada mes en la grilla, o digita una y la replica al resto.
3. El sistema muestra el total anual resultante.

### CU-06 · Generar el informe mensual

1. Entra a *Reportes* y elige *Informe mensual de gestión*.
2. Selecciona el periodo.
3. Revisa la vista previa en pantalla, ya con formato de impresión.
4. Imprime en papel o guarda como PDF desde el diálogo del navegador.

### CU-07 · Respaldar la información

1. Entra a *Configuración → Respaldo*.
2. Descarga el archivo JSON con todos los datos.
3. Lo guarda fuera del equipo (nube personal o disco externo).

---

## 6. Historias de usuario

Formato: *Como ejecutivo comercial, quiero **X**, para **Y***. Cada historia lleva criterios de
aceptación verificables. Las historias del MVP están marcadas con **[MVP]**.

### Épica 1 · Importación

**HU-01 [MVP] — Importar el Excel del mes**
Quiero cargar el archivo que me manda la empresa, para no volver a digitar ventas a mano.
- Dado un archivo `.xlsx` válido, cuando lo cargo y confirmo el mapeo, entonces veo una vista previa con el conteo de filas leídas, reconocidas y con error.
- Cuando confirmo, las ventas quedan guardadas y el panel se actualiza.
- Si el archivo está dañado o vacío, veo un mensaje que dice exactamente qué pasó, y la app no se rompe.

**HU-02 [MVP] — Que la app recuerde cómo se lee mi archivo**
Quiero que recuerde el mapeo de columnas, para no reconfigurarlo cada mes.
- Al cargar un archivo nuevo, el mapeo de la última importación viene preseleccionado.
- Puedo modificarlo y el nuevo mapeo queda guardado.

**HU-03 [MVP] — Resolver clientes que no reconoce**
Quiero decidir qué hacer con los nombres que no coinciden, para que ninguna venta se pierda.
- Veo la lista de nombres no reconocidos con su valor.
- Por cada uno puedo: crear cliente nuevo, o vincularlo a uno existente.
- Al vincularlo, ese nombre queda guardado como alias y en la siguiente importación se reconoce solo.

**HU-04 [MVP] — Reimportar sin duplicar**
Quiero poder volver a importar un periodo, para corregir un archivo equivocado sin ensuciar los datos.
- Si el periodo ya existe, la app advierte antes de continuar.
- Al confirmar, los valores se reemplazan; el total del periodo no se duplica.

**HU-05 [MVP] — Cargar el histórico**
Quiero cargar de una vez los últimos 24 meses, para que los comparativos y los "clientes nuevos" tengan sentido desde el primer día.
- Puedo importar un archivo con varios periodos en columnas o filas.
- Al terminar, la gráfica de 12 meses muestra datos reales.

**HU-06 — Deshacer la última importación**
Quiero revertir una importación equivocada, para no tener que restaurar un respaldo completo.
- En el historial, la última importación tiene botón *Revertir*.
- Al revertir, los datos vuelven exactamente al estado anterior.

### Épica 2 · Clientes

**HU-07 [MVP] — Ver mi cartera completa**
Quiero una lista de todos mis clientes con su venta del mes y del año, para saber dónde estoy parado.
- La tabla muestra nombre, zona, clasificación, venta del mes, venta del año, última compra y tendencia.
- Puedo buscar por nombre, código o NIT y filtrar por zona, estado y clasificación.
- Los filtros se conservan al volver de la ficha de un cliente.

**HU-08 [MVP] — Ficha 360 del cliente**
Quiero ver todo lo que sé de un cliente en una sola pantalla, para llegar preparado a la conversación.
- Al hacer clic en un cliente se abre un panel lateral sin perder la lista.
- Veo gráfica de 12 meses, total del año, variación, última compra, datos de contacto y notas.

**HU-09 [MVP] — Clasificación ABC automática**
Quiero saber cuáles clientes concentran mi facturación, para priorizar mi tiempo.
- El sistema calcula A/B/C por Pareto sobre los últimos 12 meses.
- Los cortes son configurables (por defecto 80 % / 95 %).
- La clasificación se recalcula sola después de cada importación.

**HU-10 [MVP] — Saber quién se me está cayendo**
Quiero que la app me diga qué clientes dejaron de comprar, para reaccionar antes de perderlos.
- Un cliente sin compras en N meses aparece como *Inactivo*; con caída mayor a X % aparece *En riesgo*.
- N y X son configurables.
- Estos clientes aparecen en el bloque *Requieren atención* del panel.

**HU-11 — Notas del cliente**
Quiero anotar lo que hablamos, para no depender de mi memoria ni de WhatsApp.
- Puedo agregar una nota fechada desde la ficha.
- Las notas se ven en orden cronológico inverso.

### Épica 3 · Presupuesto e indicadores

**HU-12 [MVP] — Definir mi cuota**
Quiero registrar la meta de cada mes, para medir el cumplimiento.
- Grilla de 12 meses editable con total anual.
- Puedo replicar una cifra a los meses restantes.

**HU-13 [MVP] — Saber cómo voy, sin hacer clic**
Quiero abrir la app y entender mi situación de inmediato.
- El panel muestra vendido, meta, % de cumplimiento y faltante del mes actual.
- El color del indicador es verde ≥ 100 %, ámbar entre 85 % y 99 %, rojo por debajo de 85 %.

**HU-14 [MVP] — Saber si voy a cumplir**
Quiero una proyección de cierre, para reaccionar a tiempo y no enterarme el día 30.
- El panel muestra la proyección de cierre según el ritmo actual y el faltante por día hábil restante.
- El cálculo considera solo días hábiles.

**HU-15 [MVP] — Ver mi año completo**
Quiero ver los últimos 12 meses contra la meta, para entender mi tendencia.
- Gráfica de barras de ventas mensuales con línea de meta superpuesta.
- Al pasar el cursor veo la cifra exacta y el porcentaje de cumplimiento del mes.

**HU-16 [MVP] — Cobertura y clientes nuevos**
Quiero saber a cuántos clientes le vendí y cuántos son nuevos, porque también me miden por eso.
- Cobertura del periodo = clientes con compra / clientes activos, en número y porcentaje.
- Clientes nuevos = clientes cuya primera compra registrada cae en el periodo, con su lista.

**HU-17 [MVP] — Ranking de clientes**
Quiero ver quién me está sosteniendo el mes y quién no.
- Top 10 del periodo con variación contra el mes anterior y contra el mismo mes del año anterior.

### Épica 4 · Reportes e impresión

**HU-18 [MVP] — Imprimir mi informe mensual**
Quiero un informe presentable en papel o PDF, para llevar a las reuniones de resultados.
- El informe incluye encabezado con periodo y fecha, cumplimiento, gráfica, top de clientes y alertas.
- Al imprimir no aparecen sidebar, botones ni elementos de navegación.
- Cabe en carta vertical sin corte lateral y con saltos de página limpios.

**HU-19 [MVP] — Imprimir listas de trabajo**
Quiero imprimir la lista de clientes filtrada, para trabajar con ella en la calle.
- Lo que se imprime respeta los filtros y el orden aplicados en pantalla.
- El encabezado indica qué filtros se aplicaron.

**HU-20 — Exportar a CSV**
Quiero bajar cualquier tabla a CSV, para hacer un análisis puntual en Excel cuando lo necesite.

### Épica 5 · Confianza en los datos

**HU-21 [MVP] — Respaldar mis datos**
Quiero descargar todo en un archivo, porque sé que los datos viven en el navegador.
- Un botón descarga un JSON con todo.
- Puedo restaurarlo y quedar exactamente igual.

**HU-22 [MVP] — Que me recuerde respaldar**
Quiero un aviso si llevo mucho sin respaldar, porque se me va a olvidar.
- Si pasaron más de 15 días desde el último respaldo, aparece un aviso discreto y persistente.

**HU-23 [MVP] — Instalarla como aplicación**
Quiero abrirla como un programa del computador, no como una pestaña más del navegador.
- Se puede instalar desde el navegador y abre en ventana propia.
- Funciona completa sin conexión.

---

## 7. Decisiones pendientes

| ID | Decisión | Por qué bloquea | Opciones |
|---|---|---|---|
| **D-01** | Indicador «mezcla de producto» | **Resuelta el 28-ago-2026.** El archivo real de ventas sí trae categoría y producto, así que el indicador dejó de ser imposible: se calcula y está en el panel. Con los datos actuales: Motores 32,0 %, Motosierras 25,3 %, Guadañadoras 21,2 %, Motobombas 20,0 %, Repuestos 1,6 %. Ver ADR 0008. |
| **D-02** | Profundidad del histórico inicial | **Resuelta a medias.** El archivo trae ocho meses (enero a agosto de 2026). Alcanza para comparar contra el mes anterior; para el comparativo interanual faltan dieciséis meses más. |
| **D-03** | Estructura real del archivo Excel | **Resuelta el 28-ago-2026.** Llegaron el maestro de clientes (62 clientes) y el archivo de ventas (119 líneas, 8 meses, $ 239.572.000). Los dos se importan solos y están verificados contra su origen. Advertencia registrada: el archivo de ventas entregado parece generado y no exportado del sistema —62 clientes que coinciden exactamente con el maestro, un solo precio por producto y ningún cliente sin compras—, así que las cifras son reales para ese archivo, no para el territorio. |
| **D-04** | Módulo de cartera | El reporte de cuentas por cobrar es un archivo mensual, limpio y con dolor real detrás: $ 100,5 M vencidos, el 45,5 % de la cartera. No estaba en el alcance del MVP. | **a)** Módulo de cartera propio con cortes comparables en el tiempo → recomendada, los datos existen y el reporte llega solo. **b)** Solo usarlo para completar el maestro → desaprovecha el 90 % del archivo. **c)** Aplazar a fase 2 → el vencido no espera. |
