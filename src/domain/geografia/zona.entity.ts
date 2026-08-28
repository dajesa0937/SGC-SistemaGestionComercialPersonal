import type { Id, InstanteISO } from '../shared/types'
import type { CodigoMunicipio } from './geografia'

/**
 * Zona comercial definida por el usuario.
 *
 * El DANE dice qué municipios existen; el ejecutivo dice cómo los agrupa. Una
 * zona es un conjunto de municipios y nada más: no se guarda en el cliente.
 *
 * Guardarla en el cliente sería duplicar la verdad. Si «Magdalena Medio»
 * incorpora Puerto Wilches, los clientes de Puerto Wilches quedan en Magdalena
 * Medio en ese mismo instante, sin recorrer ni reescribir un solo cliente.
 */
export interface Zona {
  readonly id: Id
  nombre: string
  /** Municipios que la componen, por código DANE. */
  municipios: readonly CodigoMunicipio[]
  creadoEn: InstanteISO
  actualizadoEn: InstanteISO
}

export type NuevaZona = Omit<Zona, 'id' | 'creadoEn' | 'actualizadoEn'>

/**
 * Índice municipio → zona.
 *
 * Un municipio pertenece a una sola zona. Si dos zonas reclaman el mismo
 * municipio gana la primera por nombre, de forma estable: el resultado no puede
 * depender del orden en que la base devuelva las filas.
 */
export function indexarZonasPorMunicipio(zonas: readonly Zona[]): Map<CodigoMunicipio, Zona> {
  const indice = new Map<CodigoMunicipio, Zona>()
  const ordenadas = [...zonas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-CO'))
  for (const zona of ordenadas) {
    for (const municipio of zona.municipios) {
      if (!indice.has(municipio)) indice.set(municipio, zona)
    }
  }
  return indice
}

/** Municipios reclamados por más de una zona. Se muestran para que el usuario decida. */
export function municipiosEnConflicto(zonas: readonly Zona[]): readonly CodigoMunicipio[] {
  const cuenta = new Map<CodigoMunicipio, number>()
  for (const zona of zonas) {
    for (const municipio of new Set(zona.municipios)) {
      cuenta.set(municipio, (cuenta.get(municipio) ?? 0) + 1)
    }
  }
  return [...cuenta.entries()].filter(([, n]) => n > 1).map(([codigo]) => codigo)
}
