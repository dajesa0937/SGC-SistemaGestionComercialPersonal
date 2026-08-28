import type { Id } from '@/domain/shared/types'
import { ahoraISO, nuevoId } from '@/domain/shared/types'
import type { NuevaZona, Zona } from '@/domain/geografia/zona.entity'
import type { ZonaRepository } from '@/domain/geografia/zona.repository'
import type { BaseSGC } from '../db/schema'

export class DexieZonaRepository implements ZonaRepository {
  constructor(private readonly db: BaseSGC) {}

  async listar(): Promise<Zona[]> {
    const zonas = await this.db.zonas.toArray()
    return zonas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-CO'))
  }

  async obtener(id: Id): Promise<Zona | undefined> {
    return this.db.zonas.get(id)
  }

  async crear(zona: NuevaZona): Promise<Zona> {
    const instante = ahoraISO()
    const fila: Zona = { ...zona, id: nuevoId(), creadoEn: instante, actualizadoEn: instante }
    await this.db.zonas.add(fila)
    return fila
  }

  async actualizar(id: Id, cambios: Partial<NuevaZona>): Promise<void> {
    await this.db.zonas.update(id, { ...cambios, actualizadoEn: ahoraISO() })
  }

  /**
   * Borrar una zona no toca ningun cliente.
   *
   * Es la ventaja de no guardar la zona en el cliente: sus municipios
   * simplemente dejan de pertenecer a una zona.
   */
  async eliminar(id: Id): Promise<void> {
    await this.db.zonas.delete(id)
  }
}
