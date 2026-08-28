import type { ContenidoRespaldo } from './respaldo.entity'

export interface RespaldoRepository {
  /** Lee todas las tablas de una sola vez. */
  exportar(): Promise<ContenidoRespaldo>

  /**
   * Sustituye TODO el contenido por el del respaldo.
   *
   * Tiene que ser transaccional: un borrado que no llega a escribir dejaria al
   * usuario sin sus datos y sin el respaldo aplicado, que es exactamente el
   * desastre que este modulo existe para evitar.
   */
  reemplazar(contenido: ContenidoRespaldo): Promise<void>

  /** Deja la base vacia. Operacion destructiva y sin vuelta atras. */
  borrarTodo(): Promise<void>
}
