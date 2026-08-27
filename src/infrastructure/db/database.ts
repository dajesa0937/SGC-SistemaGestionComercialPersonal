import Dexie from 'dexie'
import { aplicarEsquema, type BaseSGC } from './schema'

export const NOMBRE_BASE = 'sgc-personal'

let instancia: BaseSGC | null = null

/** Instancia unica de la base local. */
export function obtenerBase(): BaseSGC {
  if (!instancia) {
    const db = new Dexie(NOMBRE_BASE) as BaseSGC
    aplicarEsquema(db)
    instancia = db
  }
  return instancia
}

/** Solo para pruebas: descarta la instancia en memoria. */
export function reiniciarBaseParaPruebas(): void {
  instancia = null
}
