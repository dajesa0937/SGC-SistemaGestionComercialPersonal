import type { Periodo } from '../shared/types'
import type { NuevoPresupuesto, Presupuesto } from './presupuesto.entity'

export interface PresupuestoRepository {
  listarTodos(): Promise<Presupuesto[]>
  listarPorAnio(anio: number): Promise<Presupuesto[]>
  obtener(periodo: Periodo): Promise<Presupuesto | undefined>
  guardar(datos: NuevoPresupuesto): Promise<Presupuesto>
  guardarLote(datos: NuevoPresupuesto[]): Promise<void>
  eliminar(periodo: Periodo): Promise<void>
}
