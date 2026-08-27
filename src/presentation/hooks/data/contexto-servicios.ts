import { createContext, useContext } from 'react'
import type { LectorTabular } from '@/domain/archivos/lector-tabular'

/**
 * Servicios que no son repositorios pero tambien son adaptadores hacia el
 * exterior. Se inyectan igual, y por la misma razon.
 */
export interface Servicios {
  readonly lectorTabular: LectorTabular
}

export const ContextoServicios = createContext<Servicios | null>(null)

export function useServicios(): Servicios {
  const servicios = useContext(ContextoServicios)
  if (!servicios) throw new Error('useServicios debe usarse dentro de <ProveedorServicios>.')
  return servicios
}
