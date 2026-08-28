import { useMemo } from 'react'
import type { ClienteEnriquecido } from '@/domain/cliente/cliente.entity'
import {
  filtrarClientes,
  zonasDisponibles,
  type FiltrosClientes,
} from '@/application/clientes/filtrarClientes'
import { useResumen } from './useResumen'
import { useRepositorios } from './contexto-repositorios'
import { useConsulta } from './useConsulta'

export interface EstadoClientes {
  readonly visibles: readonly ClienteEnriquecido[]
  readonly zonas: readonly string[]
  readonly cargando: boolean
  readonly totalSinFiltrar: number
  readonly sinVentas: boolean
}

/**
 * Cartera con sus indicadores ya calculados.
 *
 * Reutiliza el mismo resumen que alimenta el panel, de modo que la
 * clasificacion y el estado que ve el usuario en la tabla son exactamente los
 * que ve en el panel. Calcularlos dos veces seria la forma mas segura de que
 * un dia dejaran de coincidir.
 */
export function useClientes(filtros: FiltrosClientes): EstadoClientes {
  const resumen = useResumen()

  const visibles = useMemo(
    () => (resumen ? filtrarClientes(resumen.clientes, filtros) : []),
    [resumen, filtros],
  )
  const zonas = useMemo(() => (resumen ? zonasDisponibles(resumen.clientes) : []), [resumen])

  return {
    visibles,
    zonas,
    cargando: resumen === undefined,
    totalSinFiltrar: resumen?.clientes.filter((c) => !c.archivado).length ?? 0,
    sinVentas: resumen?.sinDatos ?? false,
  }
}

/** Notas de un cliente, en orden cronologico inverso. */
export function useNotas(clienteId: string | null) {
  const repositorios = useRepositorios()
  return useConsulta(
    async () => (clienteId ? await repositorios.clientes.listarNotas(clienteId) : []),
    [repositorios, clienteId],
  )
}

/** Historico completo de ventas de un cliente, del mas reciente al mas antiguo. */
export function useVentasCliente(clienteId: string | null) {
  const repositorios = useRepositorios()
  return useConsulta(async () => {
    if (!clienteId) return []
    const ventas = await repositorios.ventas.listarPorCliente(clienteId)
    return ventas.filter((v) => v.valor > 0).sort((a, b) => b.periodo.localeCompare(a.periodo))
  }, [repositorios, clienteId])
}
