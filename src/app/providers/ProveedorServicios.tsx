import { useMemo, type ReactNode } from 'react'
import { ContextoServicios, type Servicios } from '@/presentation/hooks/data/contexto-servicios'
import { crearLectorTabular } from '@/infrastructure/excel/lector-tabular'

export function ProveedorServicios({ children }: { children: ReactNode }) {
  const servicios = useMemo<Servicios>(() => ({ lectorTabular: crearLectorTabular() }), [])
  return <ContextoServicios.Provider value={servicios}>{children}</ContextoServicios.Provider>
}
