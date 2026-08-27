import type { PresupuestoRepository } from '@/domain/presupuesto/presupuesto.repository'
import type { NuevoPresupuesto, Presupuesto } from '@/domain/presupuesto/presupuesto.entity'
import { ahoraISO, nuevoId, type Periodo } from '@/domain/shared/types'
import { compararPeriodos, crearPeriodo } from '@/domain/shared/periodo'
import type { BaseSGC } from '../db/schema'

export class DexiePresupuestoRepository implements PresupuestoRepository {
  constructor(private readonly db: BaseSGC) {}

  async listarTodos(): Promise<Presupuesto[]> {
    const todos = await this.db.presupuestos.toArray()
    return todos.sort((a, b) => compararPeriodos(a.periodo, b.periodo))
  }

  listarPorAnio(anio: number): Promise<Presupuesto[]> {
    return this.db.presupuestos
      .where('periodo')
      .between(crearPeriodo(anio, 1), crearPeriodo(anio, 12), true, true)
      .toArray()
  }

  obtener(periodo: Periodo): Promise<Presupuesto | undefined> {
    return this.db.presupuestos.where('periodo').equals(periodo).first()
  }

  async guardar(datos: NuevoPresupuesto): Promise<Presupuesto> {
    const existente = await this.obtener(datos.periodo)
    const fila: Presupuesto = {
      ...datos,
      id: existente?.id ?? nuevoId(),
      actualizadoEn: ahoraISO(),
    }
    await this.db.presupuestos.put(fila)
    return fila
  }

  async guardarLote(datos: NuevoPresupuesto[]): Promise<void> {
    if (datos.length === 0) return
    await this.db.transaction('rw', this.db.presupuestos, async () => {
      for (const item of datos) await this.guardar(item)
    })
  }

  async eliminar(periodo: Periodo): Promise<void> {
    await this.db.presupuestos.where('periodo').equals(periodo).delete()
  }
}
