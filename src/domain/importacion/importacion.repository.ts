import type { Id } from '../shared/types'
import type { Importacion, MapeoColumnas, NuevaImportacion } from './importacion.entity'

export interface ImportacionRepository {
  listar(): Promise<Importacion[]>
  obtener(id: Id): Promise<Importacion | undefined>
  ultima(): Promise<Importacion | undefined>
  registrar(datos: NuevaImportacion): Promise<Importacion>
  marcarRevertida(id: Id): Promise<void>

  /** Ultimo mapeo usado, para proponerlo en la siguiente importacion (RF-A04). */
  ultimoMapeo(): Promise<MapeoColumnas | undefined>
}
