import { useLiveQuery } from 'dexie-react-hooks'

/**
 * Unico punto de la capa de presentacion que conoce la reactividad de Dexie.
 *
 * Es la costura deliberada de la alternativa C del documento de arquitectura:
 * los componentes obtienen reactividad automatica sin acoplarse al motor de
 * almacenamiento. El dia que haya backend se reemplaza la implementacion de
 * este archivo (por ejemplo con TanStack Query) y ningun componente cambia.
 *
 * `undefined` significa "todavia no hay respuesta". Para distinguir eso de
 * "la respuesta llego y esta vacia" esta `useConsultaConEstado`.
 */
export function useConsulta<T>(consulta: () => Promise<T>, dependencias: unknown[]): T | undefined {
  return useLiveQuery(consulta, dependencias)
}

export interface EstadoConsulta<T> {
  readonly datos: T | undefined
  readonly cargando: boolean
  /** La consulta ya respondio: `datos` es de fiar aunque venga vacio. */
  readonly resuelta: boolean
}

/**
 * Igual que `useConsulta`, pero distinguiendo la primera carga.
 *
 * Sin esto, una lista vacia y una lista que aun no ha llegado se ven igual, y
 * la pantalla muestra "no hay nada" durante el parpadeo inicial. Era la deuda
 * anotada en la revision del Sprint 1.
 */
export function useConsultaConEstado<T>(
  consulta: () => Promise<T>,
  dependencias: unknown[],
): EstadoConsulta<T> {
  const datos = useLiveQuery(consulta, dependencias)
  return { datos, cargando: datos === undefined, resuelta: datos !== undefined }
}
