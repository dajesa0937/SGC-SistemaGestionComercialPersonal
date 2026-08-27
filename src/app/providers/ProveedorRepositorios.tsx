import { useMemo, type ReactNode } from 'react'
import { ContextoRepositorios } from '@/presentation/hooks/data/contexto-repositorios'
import { crearRepositoriosDexie } from '@/infrastructure/repositories'

/**
 * Composicion de dependencias.
 *
 * Este es el unico punto de la aplicacion donde se unen la capa de
 * infraestructura y la de presentacion.
 */
export function ProveedorRepositorios({ children }: { children: ReactNode }) {
  const repositorios = useMemo(() => crearRepositoriosDexie(), [])
  return (
    <ContextoRepositorios.Provider value={repositorios}>{children}</ContextoRepositorios.Provider>
  )
}
