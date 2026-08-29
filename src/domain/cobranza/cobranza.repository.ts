import type { FechaISO, Id } from '../shared/types'
import type { CorteCartera, DocumentoCartera, NuevoDocumento } from './cobranza.entity'

/** Datos de un corte sin los campos que asigna el repositorio. */
export type NuevoCorte = Omit<CorteCartera, 'id' | 'importadoEn' | 'total' | 'documentos'>

export interface CobranzaRepository {
  listarCortes(): Promise<CorteCartera[]>
  /** El corte mas reciente por fecha, o `null` si no hay ninguno. */
  corteMasReciente(): Promise<CorteCartera | null>
  obtenerCorte(id: Id): Promise<CorteCartera | null>
  documentosDelCorte(corteId: Id): Promise<DocumentoCartera[]>
  documentosDeCliente(clienteId: Id): Promise<DocumentoCartera[]>

  /**
   * Guarda un corte con sus documentos, reemplazando el que hubiera en esa
   * misma fecha.
   *
   * Reemplazar y no agregar es lo mismo que hace la importacion de ventas y por
   * el mismo motivo: el reporte de una fecha es la verdad completa de esa
   * fecha, asi que reimportarlo tiene que corregir, no duplicar.
   */
  guardarCorte(corte: NuevoCorte, documentos: readonly NuevoDocumento[]): Promise<Id>

  eliminarCorte(id: Id): Promise<void>
  fechasConCorte(): Promise<FechaISO[]>
}
