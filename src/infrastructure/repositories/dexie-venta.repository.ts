import type { VentaRepository } from '@/domain/venta/venta.repository'
import type { NuevaVenta, VentaMensual } from '@/domain/venta/venta.entity'
import { ahoraISO, nuevoId, type Id, type Periodo } from '@/domain/shared/types'
import { compararPeriodos } from '@/domain/shared/periodo'
import type { BaseSGC } from '../db/schema'

export class DexieVentaRepository implements VentaRepository {
  constructor(private readonly db: BaseSGC) {}

  listarTodas(): Promise<VentaMensual[]> {
    return this.db.ventas.toArray()
  }

  listarPorPeriodo(periodo: Periodo): Promise<VentaMensual[]> {
    return this.db.ventas.where('periodo').equals(periodo).toArray()
  }

  listarPorRango(desde: Periodo, hasta: Periodo): Promise<VentaMensual[]> {
    return this.db.ventas.where('periodo').between(desde, hasta, true, true).toArray()
  }

  listarPorCliente(clienteId: Id): Promise<VentaMensual[]> {
    return this.db.ventas.where('clienteId').equals(clienteId).toArray()
  }

  obtener(clienteId: Id, periodo: Periodo): Promise<VentaMensual | undefined> {
    return this.db.ventas.where('[clienteId+periodo]').equals([clienteId, periodo]).first()
  }

  /**
   * Inserta o actualiza en bloque dentro de una unica transaccion.
   *
   * Es transaccional a proposito: una importacion se aplica completa o no se
   * aplica. Un guardado a medias dejaria los indicadores mintiendo.
   */
  async guardarLote(ventas: NuevaVenta[]): Promise<void> {
    if (ventas.length === 0) return
    const instante = ahoraISO()

    await this.db.transaction('rw', this.db.ventas, async () => {
      // Se cargan los periodos afectados de una sola vez y se indexan en
      // memoria. La version anterior hacia una consulta por fila: con las 2.400
      // filas de un historico de dos anos eso son 2.400 consultas, y era la
      // deuda anotada en la revision del Sprint 1.
      const periodos = [...new Set(ventas.map((v) => v.periodo))]
      const existentes = await this.db.ventas.where('periodo').anyOf(periodos).toArray()
      const porClave = new Map(existentes.map((v) => [`${v.clienteId}|${v.periodo}`, v.id]))

      const filas: VentaMensual[] = ventas.map((venta) => ({
        ...venta,
        id: porClave.get(`${venta.clienteId}|${venta.periodo}`) ?? nuevoId(),
        actualizadoEn: instante,
      }))

      await this.db.ventas.bulkPut(filas)
    })
  }

  async eliminarPorPeriodos(periodos: Periodo[]): Promise<void> {
    if (periodos.length === 0) return
    await this.db.ventas.where('periodo').anyOf(periodos).delete()
  }

  async periodosConDatos(): Promise<Periodo[]> {
    const claves = await this.db.ventas.orderBy('periodo').uniqueKeys()
    return claves.map(String).sort(compararPeriodos)
  }
}
