import type { Id, Periodo } from '../shared/types'
import type { MovimientoVenta, NuevoMovimiento } from './movimiento.entity'

export interface MovimientoRepository {
  listarTodos(): Promise<MovimientoVenta[]>
  listarPorPeriodo(periodo: Periodo): Promise<MovimientoVenta[]>
  listarPorRango(desde: Periodo, hasta: Periodo): Promise<MovimientoVenta[]>
  listarPorCliente(clienteId: Id): Promise<MovimientoVenta[]>

  /**
   * Reemplaza por completo los movimientos de los periodos indicados.
   *
   * Reemplazar y no agregar es lo que hace que reimportar un mes corrija en vez
   * de duplicar: el archivo del mes es la verdad completa de ese mes.
   */
  reemplazarPeriodos(periodos: Periodo[], movimientos: NuevoMovimiento[]): Promise<void>

  eliminarPorPeriodos(periodos: Periodo[]): Promise<void>
  periodosConDatos(): Promise<Periodo[]>
}
