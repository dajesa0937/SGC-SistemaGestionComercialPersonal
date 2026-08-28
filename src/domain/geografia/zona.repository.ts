import type { Id } from '../shared/types'
import type { NuevaZona, Zona } from './zona.entity'

export interface ZonaRepository {
  listar(): Promise<Zona[]>
  obtener(id: Id): Promise<Zona | undefined>
  crear(zona: NuevaZona): Promise<Zona>
  actualizar(id: Id, cambios: Partial<NuevaZona>): Promise<void>
  eliminar(id: Id): Promise<void>
}
