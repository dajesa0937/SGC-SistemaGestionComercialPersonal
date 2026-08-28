import {
  VERSION_RESPALDO,
  type ContenidoRespaldo,
  type Respaldo,
} from '@/domain/respaldo/respaldo.entity'
import { ahoraISO } from '@/domain/shared/types'

/** Envuelve el contenido de la base en el formato de archivo de respaldo. */
export function construirRespaldo(contenido: ContenidoRespaldo): Respaldo {
  return {
    aplicacion: 'sgc-personal',
    version: VERSION_RESPALDO,
    generadoEn: ahoraISO(),
    datos: contenido,
  }
}

/**
 * Serializa el respaldo con sangría.
 *
 * Ocupa más, pero un respaldo se abre alguna vez para mirarlo o para rescatar
 * un dato a mano, y una sola línea de veinte mil caracteres no sirve para eso.
 */
export function serializarRespaldo(respaldo: Respaldo): string {
  return JSON.stringify(respaldo, null, 2)
}
