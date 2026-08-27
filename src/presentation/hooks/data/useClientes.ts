import { useMemo } from 'react'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import {
  filtrarClientes,
  zonasDisponibles,
  type FiltrosClientes,
} from '@/application/clientes/filtrarClientes'
import { useRepositorios } from './contexto-repositorios'
import { useConsulta } from './useConsulta'

export interface EstadoClientes {
  /** `undefined` mientras la primera consulta esta en curso. */
  readonly todos: readonly Cliente[] | undefined
  readonly visibles: readonly Cliente[]
  readonly zonas: readonly string[]
  readonly cargando: boolean
  readonly totalSinFiltrar: number
}

export function useClientes(filtros: FiltrosClientes): EstadoClientes {
  const repositorios = useRepositorios()

  // Con menos de cien clientes se traen todos y se filtra en memoria: es
  // instantaneo y evita reconsultar la base en cada pulsacion de tecla.
  const todos = useConsulta(
    () => repositorios.clientes.listar({ incluirArchivados: true }),
    [repositorios],
  )

  const visibles = useMemo(() => (todos ? filtrarClientes(todos, filtros) : []), [todos, filtros])
  const zonas = useMemo(() => (todos ? zonasDisponibles(todos) : []), [todos])

  return {
    todos,
    visibles,
    zonas,
    cargando: todos === undefined,
    totalSinFiltrar: todos?.filter((c) => !c.archivado).length ?? 0,
  }
}

export function useCliente(id: string | null) {
  const repositorios = useRepositorios()
  return useConsulta(
    async () => (id ? ((await repositorios.clientes.obtener(id)) ?? null) : null),
    [repositorios, id],
  )
}
