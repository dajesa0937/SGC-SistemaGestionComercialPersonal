import { createContext, useContext } from 'react'
import type { Periodo } from '@/domain/shared/types'

export interface EstadoPeriodo {
  periodo: Periodo
  cambiarPeriodo: (periodo: Periodo) => void
}

export const ContextoPeriodo = createContext<EstadoPeriodo | null>(null)

/**
 * Periodo seleccionado, compartido por toda la aplicacion.
 *
 * Es global a proposito: cambiar el mes en el panel debe cambiarlo tambien en
 * clientes y en reportes. Tener dos pantallas mostrando periodos distintos es
 * una fuente segura de conclusiones equivocadas.
 */
export function usePeriodoSeleccionado(): EstadoPeriodo {
  const estado = useContext(ContextoPeriodo)
  if (!estado) throw new Error('usePeriodoSeleccionado debe usarse dentro de <ProveedorPeriodo>.')
  return estado
}
