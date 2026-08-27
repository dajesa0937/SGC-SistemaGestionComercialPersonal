import type { ClienteRepository } from '@/domain/cliente/cliente.repository'
import type {
  AliasCliente,
  Cliente,
  NotaCliente,
  NuevoCliente,
} from '@/domain/cliente/cliente.entity'
import { CodigoDeClienteDuplicadoError, ClienteNoEncontradoError } from '@/domain/shared/errores'
import { ahoraISO, nuevoId, type Id } from '@/domain/shared/types'
import type { BaseSGC } from '../db/schema'

export class DexieClienteRepository implements ClienteRepository {
  constructor(private readonly db: BaseSGC) {}

  async listar(opciones?: { incluirArchivados?: boolean }): Promise<Cliente[]> {
    const todos = await this.db.clientes.toArray()
    const visibles = opciones?.incluirArchivados ? todos : todos.filter((c) => !c.archivado)
    return visibles.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }

  obtener(id: Id): Promise<Cliente | undefined> {
    return this.db.clientes.get(id)
  }

  buscarPorCodigo(codigo: string): Promise<Cliente | undefined> {
    return this.db.clientes.where('codigo').equals(codigo).first()
  }

  async crear(datos: NuevoCliente): Promise<Cliente> {
    const existente = await this.buscarPorCodigo(datos.codigo)
    if (existente) throw new CodigoDeClienteDuplicadoError(datos.codigo)

    const instante = ahoraISO()
    const cliente: Cliente = {
      ...datos,
      id: nuevoId(),
      archivado: datos.archivado ?? false,
      creadoEn: instante,
      actualizadoEn: instante,
    }
    await this.db.clientes.add(cliente)
    return cliente
  }

  async actualizar(id: Id, cambios: Partial<NuevoCliente>): Promise<Cliente> {
    const actual = await this.obtener(id)
    if (!actual) throw new ClienteNoEncontradoError(id)

    if (cambios.codigo && cambios.codigo !== actual.codigo) {
      const otro = await this.buscarPorCodigo(cambios.codigo)
      if (otro && otro.id !== id) throw new CodigoDeClienteDuplicadoError(cambios.codigo)
    }

    const actualizado: Cliente = { ...actual, ...cambios, id, actualizadoEn: ahoraISO() }
    await this.db.clientes.put(actualizado)
    return actualizado
  }

  async archivar(id: Id, archivado: boolean): Promise<void> {
    const cambiadas = await this.db.clientes.update(id, {
      archivado,
      actualizadoEn: ahoraISO(),
    })
    if (cambiadas === 0) throw new ClienteNoEncontradoError(id)
  }

  contar(): Promise<number> {
    return this.db.clientes.filter((c) => !c.archivado).count()
  }

  listarAlias(): Promise<AliasCliente[]> {
    return this.db.aliases.toArray()
  }

  buscarPorAlias(textoNormalizado: string): Promise<AliasCliente | undefined> {
    return this.db.aliases.where('textoOriginal').equals(textoNormalizado).first()
  }

  async crearAlias(clienteId: Id, textoNormalizado: string): Promise<AliasCliente> {
    const alias: AliasCliente = { id: nuevoId(), clienteId, textoOriginal: textoNormalizado }
    await this.db.aliases.put(alias)
    return alias
  }

  async listarNotas(clienteId: Id): Promise<NotaCliente[]> {
    const notas = await this.db.notas.where('clienteId').equals(clienteId).toArray()
    return notas.sort((a, b) => b.fecha.localeCompare(a.fecha))
  }

  async crearNota(nota: Omit<NotaCliente, 'id' | 'creadoEn'>): Promise<NotaCliente> {
    const completa: NotaCliente = { ...nota, id: nuevoId(), creadoEn: ahoraISO() }
    await this.db.notas.add(completa)
    return completa
  }

  async eliminarNota(id: Id): Promise<void> {
    await this.db.notas.delete(id)
  }
}
