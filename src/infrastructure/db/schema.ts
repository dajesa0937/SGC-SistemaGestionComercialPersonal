import type Dexie from 'dexie'
import type { EntityTable } from 'dexie'
import type { AliasCliente, Cliente, NotaCliente } from '@/domain/cliente/cliente.entity'
import type { VentaMensual } from '@/domain/venta/venta.entity'
import type { Presupuesto } from '@/domain/presupuesto/presupuesto.entity'
import type { Importacion } from '@/domain/importacion/importacion.entity'

/** Fila de la tabla clave-valor de configuracion. */
export interface FilaConfiguracion {
  clave: string
  valor: unknown
}

export type BaseSGC = Dexie & {
  clientes: EntityTable<Cliente, 'id'>
  aliases: EntityTable<AliasCliente, 'id'>
  notas: EntityTable<NotaCliente, 'id'>
  ventas: EntityTable<VentaMensual, 'id'>
  presupuestos: EntityTable<Presupuesto, 'id'>
  importaciones: EntityTable<Importacion, 'id'>
  configuracion: EntityTable<FilaConfiguracion, 'clave'>
}

/**
 * Esquema de la base local.
 *
 * `&[clienteId+periodo]` es un indice unico compuesto: la garantia, a nivel de
 * motor de almacenamiento, de que reimportar un periodo no puede duplicar
 * ventas (RF-A07). La regla de negocio queda respaldada por la base de datos y
 * no unicamente por el codigo de la aplicacion.
 */
export function aplicarEsquema(db: Dexie): void {
  db.version(1).stores({
    clientes: 'id, codigo, nombre, zona, estadoManual, archivado',
    aliases: 'id, clienteId, &textoOriginal',
    notas: 'id, clienteId, fecha',
    ventas: 'id, clienteId, periodo, &[clienteId+periodo]',
    presupuestos: 'id, &periodo',
    importaciones: 'id, fecha',
    configuracion: '&clave',
  })
}
