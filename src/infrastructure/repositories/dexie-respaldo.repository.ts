import type { RespaldoRepository } from '@/domain/respaldo/respaldo.repository'
import type { ContenidoRespaldo } from '@/domain/respaldo/respaldo.entity'
import type { BaseSGC } from '../db/schema'

export class DexieRespaldoRepository implements RespaldoRepository {
  constructor(private readonly db: BaseSGC) {}

  private get tablas() {
    return [
      this.db.clientes,
      this.db.aliases,
      this.db.notas,
      this.db.ventas,
      this.db.presupuestos,
      this.db.importaciones,
      this.db.configuracion,
    ]
  }

  async exportar(): Promise<ContenidoRespaldo> {
    const [clientes, aliases, notas, ventas, presupuestos, importaciones, configuracion] =
      await Promise.all([
        this.db.clientes.toArray(),
        this.db.aliases.toArray(),
        this.db.notas.toArray(),
        this.db.ventas.toArray(),
        this.db.presupuestos.toArray(),
        this.db.importaciones.toArray(),
        this.db.configuracion.toArray(),
      ])

    return { clientes, aliases, notas, ventas, presupuestos, importaciones, configuracion }
  }

  /**
   * Borra y vuelve a escribir dentro de UNA transaccion.
   *
   * Si algo falla a mitad, Dexie deshace todo y la base queda como estaba. Un
   * borrado que no llega a escribir dejaria al usuario sin datos y sin respaldo
   * aplicado, que es exactamente el desastre que este modulo evita.
   */
  async reemplazar(contenido: ContenidoRespaldo): Promise<void> {
    await this.db.transaction('rw', this.tablas, async () => {
      await Promise.all(this.tablas.map((tabla) => tabla.clear()))

      await this.db.clientes.bulkAdd([...contenido.clientes])
      await this.db.aliases.bulkAdd([...contenido.aliases])
      await this.db.notas.bulkAdd([...contenido.notas])
      await this.db.ventas.bulkAdd([...contenido.ventas])
      await this.db.presupuestos.bulkAdd([...contenido.presupuestos])
      await this.db.importaciones.bulkAdd([...contenido.importaciones])
      await this.db.configuracion.bulkAdd([...contenido.configuracion])
    })
  }

  async borrarTodo(): Promise<void> {
    await this.db.transaction('rw', this.tablas, async () => {
      await Promise.all(this.tablas.map((tabla) => tabla.clear()))
    })
  }
}
