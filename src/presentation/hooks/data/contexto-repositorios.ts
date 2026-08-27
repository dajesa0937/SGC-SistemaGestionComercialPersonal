import { createContext, useContext } from 'react'
import type { Repositorios } from '@/domain/repositorios'

export const ContextoRepositorios = createContext<Repositorios | null>(null)

/**
 * Acceso a los repositorios desde la capa de presentacion.
 *
 * Los componentes consumen este contrato del dominio; jamas importan Dexie ni
 * ninguna clase de `infrastructure/`. Es la regla que mantiene abierta la ruta
 * de migracion a SQLite y luego a PostgreSQL.
 */
export function useRepositorios(): Repositorios {
  const repositorios = useContext(ContextoRepositorios)
  if (!repositorios) {
    throw new Error('useRepositorios debe usarse dentro de <ProveedorRepositorios>.')
  }
  return repositorios
}
