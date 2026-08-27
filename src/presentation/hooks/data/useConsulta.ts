import { useLiveQuery } from 'dexie-react-hooks'

/**
 * Unico punto de la capa de presentacion que conoce la reactividad de Dexie.
 *
 * Es la costura deliberada de la alternativa C del documento de arquitectura:
 * los componentes obtienen reactividad automatica sin acoplarse al motor de
 * almacenamiento. El dia que haya backend se reemplaza la implementacion de
 * este archivo (por ejemplo con TanStack Query) y ningun componente cambia.
 */
export function useConsulta<T>(consulta: () => Promise<T>, dependencias: unknown[]): T | undefined {
  return useLiveQuery(consulta, dependencias)
}
