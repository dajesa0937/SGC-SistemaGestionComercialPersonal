import type { Id, Periodo } from '../shared/types'
import type { NuevaVenta, VentaMensual } from './venta.entity'

export interface VentaRepository {
  listarTodas(): Promise<VentaMensual[]>
  listarPorPeriodo(periodo: Periodo): Promise<VentaMensual[]>
  listarPorRango(desde: Periodo, hasta: Periodo): Promise<VentaMensual[]>
  listarPorCliente(clienteId: Id): Promise<VentaMensual[]>
  obtener(clienteId: Id, periodo: Periodo): Promise<VentaMensual | undefined>

  /**
   * Inserta o actualiza en bloque respetando la unicidad de `cliente + periodo`.
   *
   * Es la operacion que garantiza que reimportar un periodo reemplace los
   * valores en lugar de duplicarlos (RF-A07). Debe ser transaccional.
   */
  guardarLote(ventas: NuevaVenta[]): Promise<void>

  eliminarPorPeriodos(periodos: Periodo[]): Promise<void>
  periodosConDatos(): Promise<Periodo[]>
}
