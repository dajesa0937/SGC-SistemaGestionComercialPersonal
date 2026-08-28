import type { Repositorios } from '@/domain/repositorios'
import type { MapeoColumnas, NuevaImportacion } from '@/domain/importacion/importacion.entity'
import type { NuevoMovimiento } from '@/domain/venta/movimiento.entity'
import type { NuevaVenta } from '@/domain/venta/venta.entity'
import type { Id } from '@/domain/shared/types'
import {
  claveDePendiente,
  esPendiente,
  type PrevisualizacionVentas,
} from './analizarVentas'

export interface ResultadoImportacion {
  readonly importacionId: Id
  readonly clientesCreados: number
  readonly movimientosGuardados: number
  readonly totalesGuardados: number
}

/**
 * Aplica una importacion de ventas ya analizada.
 *
 * El orden importa y no es intercambiable:
 *
 * 1. Se crean los clientes que faltan, porque los movimientos apuntan a ellos.
 * 2. Se guarda el estado anterior de los periodos afectados, que es la red para
 *    poder deshacer.
 * 3. Se reemplazan movimientos y totales de esos periodos.
 *
 * Reemplazar y no sumar es deliberado: el archivo de un mes es la verdad
 * completa de ese mes, asi que reimportarlo corrige en vez de duplicar (RF-A07).
 */
export async function aplicarVentas(
  repositorios: Repositorios,
  previa: PrevisualizacionVentas,
  archivoNombre: string,
  mapeo: MapeoColumnas,
): Promise<ResultadoImportacion> {
  // 1. Clientes nuevos.
  const idPorClave = new Map<string, Id>()
  for (const pendiente of previa.clientesPorCrear) {
    const creado = await repositorios.clientes.crear(pendiente.datos)
    idPorClave.set(pendiente.clave, creado.id)
  }

  const resolver = (clienteId: Id): Id =>
    esPendiente(clienteId) ? (idPorClave.get(claveDePendiente(clienteId)) ?? clienteId) : clienteId

  const periodos = [...previa.periodos]

  // 2. Estado anterior de los dos granos, para poder deshacer sin dejar
  //    totales huerfanos de sus lineas.
  const snapshotAnterior = (await repositorios.ventas.listarTodas()).filter((venta) =>
    periodos.includes(venta.periodo),
  )
  const snapshotMovimientos = (await repositorios.movimientos.listarTodos()).filter((movimiento) =>
    periodos.includes(movimiento.periodo),
  )

  // 3. Movimientos y totales.
  const movimientos: NuevoMovimiento[] = previa.movimientos.map((movimiento) => ({
    ...movimiento,
    clienteId: resolver(movimiento.clienteId),
  }))
  await repositorios.movimientos.reemplazarPeriodos(periodos, movimientos)

  const ventas: NuevaVenta[] = previa.totales.map((total) => ({
    clienteId: resolver(total.clienteId),
    periodo: total.periodo,
    valor: total.valor,
    unidades: total.unidades > 0 ? total.unidades : undefined,
    // Un total derivado de movimientos no se edita a mano: se corrige
    // corrigiendo sus lineas. El origen es lo que permite distinguirlo.
    origen: previa.modo === 'detallado' ? 'movimientos' : 'importacion',
  }))
  await repositorios.ventas.eliminarPorPeriodos(periodos)
  await repositorios.ventas.guardarLote(ventas)

  const registro: NuevaImportacion = {
    archivoNombre,
    periodos,
    filasLeidas: previa.totalFilas,
    filasAplicadas: previa.filasAplicadas,
    filasConError: previa.errores.length,
    clientesCreados: previa.clientesPorCrear.length,
    mapeo,
    snapshotAnterior,
    snapshotMovimientos,
    estado: 'aplicada',
  }
  const importacion = await repositorios.importaciones.registrar(registro)

  return {
    importacionId: importacion.id,
    clientesCreados: previa.clientesPorCrear.length,
    movimientosGuardados: movimientos.length,
    totalesGuardados: ventas.length,
  }
}

/**
 * Deshace una importacion devolviendo los periodos a como estaban.
 *
 * No intenta reconstruir el archivo: restaura el estado guardado, que es la
 * unica forma de que deshacer sea exacto y no una aproximacion.
 */
export async function revertirImportacion(
  repositorios: Repositorios,
  importacionId: Id,
): Promise<void> {
  const importacion = await repositorios.importaciones.obtener(importacionId)
  if (!importacion || importacion.estado === 'revertida') return

  const periodos = [...importacion.periodos]

  await repositorios.ventas.eliminarPorPeriodos(periodos)

  // Los movimientos se reemplazan por los que habia: `reemplazarPeriodos`
  // borra y escribe en una sola transaccion, asi que no queda un estado
  // intermedio sin lineas.
  await repositorios.movimientos.reemplazarPeriodos(
    periodos,
    (importacion.snapshotMovimientos ?? []).map((movimiento) => ({
      clienteId: movimiento.clienteId,
      fecha: movimiento.fecha,
      periodo: movimiento.periodo,
      categoria: movimiento.categoria,
      producto: movimiento.producto,
      cantidad: movimiento.cantidad,
      valorUnitario: movimiento.valorUnitario,
      valor: movimiento.valor,
      importacionId: movimiento.importacionId,
    })),
  )

  if (importacion.snapshotAnterior.length > 0) {
    await repositorios.ventas.guardarLote(
      importacion.snapshotAnterior.map((venta) => ({
        clienteId: venta.clienteId,
        periodo: venta.periodo,
        valor: venta.valor,
        unidades: venta.unidades,
        origen: venta.origen,
        importacionId: venta.importacionId,
      })),
    )
  }

  await repositorios.importaciones.marcarRevertida(importacionId)
}
