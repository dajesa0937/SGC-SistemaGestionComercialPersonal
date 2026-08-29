import type { Id } from '../shared/types'
import type { AliasCliente, Cliente, NotaCliente, NuevoCliente } from './cliente.entity'

/**
 * Contrato de persistencia de clientes.
 *
 * Vive en `domain/` a proposito: la implementacion sobre Dexie esta en
 * `infrastructure/` y puede sustituirse por una sobre SQLite o PostgreSQL
 * sin tocar una sola linea de logica de negocio.
 */
export interface ClienteRepository {
  listar(opciones?: { incluirArchivados?: boolean }): Promise<Cliente[]>
  obtener(id: Id): Promise<Cliente | undefined>
  buscarPorCodigo(codigo: string): Promise<Cliente | undefined>
  crear(datos: NuevoCliente): Promise<Cliente>
  actualizar(id: Id, cambios: Partial<NuevoCliente>): Promise<Cliente>
  archivar(id: Id, archivado: boolean): Promise<void>
  contar(): Promise<number>

  listarAlias(): Promise<AliasCliente[]>
  buscarPorAlias(textoNormalizado: string): Promise<AliasCliente | undefined>
  crearAlias(clienteId: Id, textoNormalizado: string): Promise<AliasCliente>

  listarNotas(clienteId: Id): Promise<NotaCliente[]>
  /** Todas las notas. El plan de visitas necesita la ultima de cada cliente. */
  listarTodasLasNotas(): Promise<NotaCliente[]>
  crearNota(nota: Omit<NotaCliente, 'id' | 'creadoEn'>): Promise<NotaCliente>
  eliminarNota(id: Id): Promise<void>
}
