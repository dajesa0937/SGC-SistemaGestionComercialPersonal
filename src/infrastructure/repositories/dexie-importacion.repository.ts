import type { ImportacionRepository } from '@/domain/importacion/importacion.repository'
import type {
  Importacion,
  MapeoColumnas,
  NuevaImportacion,
} from '@/domain/importacion/importacion.entity'
import { ahoraISO, nuevoId, type Id } from '@/domain/shared/types'
import type { BaseSGC } from '../db/schema'

export class DexieImportacionRepository implements ImportacionRepository {
  constructor(private readonly db: BaseSGC) {}

  async listar(): Promise<Importacion[]> {
    const todas = await this.db.importaciones.orderBy('fecha').reverse().toArray()
    return todas
  }

  obtener(id: Id): Promise<Importacion | undefined> {
    return this.db.importaciones.get(id)
  }

  ultima(): Promise<Importacion | undefined> {
    return this.db.importaciones.orderBy('fecha').last()
  }

  async registrar(datos: NuevaImportacion): Promise<Importacion> {
    const fila: Importacion = { ...datos, id: nuevoId(), fecha: ahoraISO() }
    await this.db.importaciones.add(fila)
    return fila
  }

  async marcarRevertida(id: Id): Promise<void> {
    await this.db.importaciones.update(id, { estado: 'revertida' })
  }

  async ultimoMapeo(): Promise<MapeoColumnas | undefined> {
    const ultima = await this.ultima()
    return ultima?.mapeo
  }
}
