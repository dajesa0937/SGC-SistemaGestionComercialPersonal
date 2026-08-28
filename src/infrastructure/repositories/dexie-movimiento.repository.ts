import type { Id, Periodo } from '@/domain/shared/types'
import { ahoraISO, nuevoId } from '@/domain/shared/types'
import type { MovimientoVenta, NuevoMovimiento } from '@/domain/venta/movimiento.entity'
import type { MovimientoRepository } from '@/domain/venta/movimiento.repository'
import type { BaseSGC } from '../db/schema'

export class DexieMovimientoRepository implements MovimientoRepository {
  constructor(private readonly db: BaseSGC) {}

  async listarTodos(): Promise<MovimientoVenta[]> {
    return this.db.movimientos.toArray()
  }

  async listarPorPeriodo(periodo: Periodo): Promise<MovimientoVenta[]> {
    return this.db.movimientos.where('periodo').equals(periodo).toArray()
  }

  async listarPorRango(desde: Periodo, hasta: Periodo): Promise<MovimientoVenta[]> {
    return this.db.movimientos.where('periodo').between(desde, hasta, true, true).toArray()
  }

  async listarPorCliente(clienteId: Id): Promise<MovimientoVenta[]> {
    const movimientos = await this.db.movimientos.where('clienteId').equals(clienteId).toArray()
    return movimientos.sort((a, b) => b.fecha.localeCompare(a.fecha))
  }

  /**
   * Borra los periodos indicados y escribe los movimientos nuevos, todo dentro
   * de una transaccion.
   *
   * Si fallara a la mitad quedaria un mes borrado y sin reemplazo, que es peor
   * que no haber importado.
   */
  async reemplazarPeriodos(periodos: Periodo[], movimientos: NuevoMovimiento[]): Promise<void> {
    const instante = ahoraISO()
    const filas: MovimientoVenta[] = movimientos.map((movimiento) => ({
      ...movimiento,
      id: nuevoId(),
      actualizadoEn: instante,
    }))

    await this.db.transaction('rw', this.db.movimientos, async () => {
      if (periodos.length > 0) {
        await this.db.movimientos.where('periodo').anyOf(periodos).delete()
      }
      if (filas.length > 0) await this.db.movimientos.bulkAdd(filas)
    })
  }

  async eliminarPorPeriodos(periodos: Periodo[]): Promise<void> {
    if (periodos.length === 0) return
    await this.db.movimientos.where('periodo').anyOf(periodos).delete()
  }

  async periodosConDatos(): Promise<Periodo[]> {
    const periodos = await this.db.movimientos.orderBy('periodo').uniqueKeys()
    return periodos.map(String)
  }
}
