import type { FechaISO, Id } from '@/domain/shared/types'
import { ahoraISO, nuevoId } from '@/domain/shared/types'
import type { CorteCartera, DocumentoCartera, NuevoDocumento } from '@/domain/cobranza/cobranza.entity'
import type { CobranzaRepository, NuevoCorte } from '@/domain/cobranza/cobranza.repository'
import type { BaseSGC } from '../db/schema'

export class DexieCobranzaRepository implements CobranzaRepository {
  constructor(private readonly db: BaseSGC) {}

  async listarCortes(): Promise<CorteCartera[]> {
    const cortes = await this.db.cortes.toArray()
    return cortes.sort((a, b) => b.fecha.localeCompare(a.fecha))
  }

  async corteMasReciente(): Promise<CorteCartera | null> {
    const cortes = await this.listarCortes()
    return cortes[0] ?? null
  }

  async obtenerCorte(id: Id): Promise<CorteCartera | null> {
    return (await this.db.cortes.get(id)) ?? null
  }

  async documentosDelCorte(corteId: Id): Promise<DocumentoCartera[]> {
    return this.db.documentosCartera.where('corteId').equals(corteId).toArray()
  }

  async documentosDeCliente(clienteId: Id): Promise<DocumentoCartera[]> {
    const documentos = await this.db.documentosCartera.where('clienteId').equals(clienteId).toArray()
    return documentos.sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))
  }

  /**
   * Borra el corte que hubiera en esa fecha, con sus documentos, y escribe el
   * nuevo. Todo en una transaccion: si fallara a la mitad quedaria una fecha
   * sin cartera, que es peor que no haber importado.
   */
  async guardarCorte(corte: NuevoCorte, documentos: readonly NuevoDocumento[]): Promise<Id> {
    const id = nuevoId()
    const fila: CorteCartera = {
      ...corte,
      id,
      importadoEn: ahoraISO(),
      total: documentos.reduce((suma, documento) => suma + documento.valor, 0),
      documentos: documentos.length,
    }
    const filas: DocumentoCartera[] = documentos.map((documento) => ({
      ...documento,
      id: nuevoId(),
      corteId: id,
    }))

    await this.db.transaction('rw', this.db.cortes, this.db.documentosCartera, async () => {
      const previos = await this.db.cortes.where('fecha').equals(corte.fecha).toArray()
      for (const previo of previos) {
        await this.db.documentosCartera.where('corteId').equals(previo.id).delete()
        await this.db.cortes.delete(previo.id)
      }
      await this.db.cortes.add(fila)
      if (filas.length > 0) await this.db.documentosCartera.bulkAdd(filas)
    })

    return id
  }

  async eliminarCorte(id: Id): Promise<void> {
    await this.db.transaction('rw', this.db.cortes, this.db.documentosCartera, async () => {
      await this.db.documentosCartera.where('corteId').equals(id).delete()
      await this.db.cortes.delete(id)
    })
  }

  async fechasConCorte(): Promise<FechaISO[]> {
    const fechas = await this.db.cortes.orderBy('fecha').uniqueKeys()
    return fechas.map(String)
  }
}
