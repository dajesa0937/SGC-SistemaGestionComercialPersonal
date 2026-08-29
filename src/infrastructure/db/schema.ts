import type Dexie from 'dexie'
import type { EntityTable } from 'dexie'
import type { AliasCliente, Cliente, NotaCliente } from '@/domain/cliente/cliente.entity'
import { normalizarIdentificacion } from '@/domain/cliente/identificacion'
import type { Zona } from '@/domain/geografia/zona.entity'
import { municipioPorNombre, normalizarCodigoMunicipio } from '@/domain/geografia/geografia'
import type { VentaMensual } from '@/domain/venta/venta.entity'
import type { MovimientoVenta } from '@/domain/venta/movimiento.entity'
import type { Presupuesto } from '@/domain/presupuesto/presupuesto.entity'
import type { Importacion } from '@/domain/importacion/importacion.entity'
import type { CorteCartera, DocumentoCartera } from '@/domain/cobranza/cobranza.entity'

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
  movimientos: EntityTable<MovimientoVenta, 'id'>
  presupuestos: EntityTable<Presupuesto, 'id'>
  importaciones: EntityTable<Importacion, 'id'>
  zonas: EntityTable<Zona, 'id'>
  cortes: EntityTable<CorteCartera, 'id'>
  documentosCartera: EntityTable<DocumentoCartera, 'id'>
  configuracion: EntityTable<FilaConfiguracion, 'clave'>
}

/** Forma de un cliente en la version 1, para poder migrarlo. */
interface ClienteV1 {
  nit?: string
  zona?: string
  ciudad?: string
  identificacion?: string
  municipio?: string
}

/**
 * Esquema de la base local.
 *
 * `&[clienteId+periodo]` es un indice unico compuesto: la garantia, a nivel de
 * motor de almacenamiento, de que reimportar un periodo no puede duplicar
 * ventas (RF-A07). La regla de negocio queda respaldada por la base de datos y
 * no unicamente por el codigo de la aplicacion.
 *
 * `&identificacion` hace lo mismo con los clientes: dos filas con el mismo NIT
 * son imposibles, no improbables.
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

  db.version(2)
    .stores({
      clientes: 'id, codigo, nombre, &identificacion, municipio, estadoManual, archivado',
      zonas: 'id, &nombre',
    })
    .upgrade(async (tx) => {
      // El texto libre de la version 1 se traduce a las estructuras nuevas.
      // Lo que no se pueda traducir con certeza se deja sin traducir: inventar
      // un municipio a partir de un nombre ambiguo seria peor que no tenerlo.
      const zonasPorNombre = new Map<string, Set<string>>()

      await tx
        .table('clientes')
        .toCollection()
        .modify((cliente: ClienteV1) => {
          cliente.identificacion = normalizarIdentificacion(cliente.nit)

          const codigo = normalizarCodigoMunicipio(cliente.ciudad)
          cliente.municipio =
            codigo ?? (cliente.ciudad ? municipioPorNombre(cliente.ciudad) : undefined)

          const zona = cliente.zona?.trim()
          if (zona) {
            const municipios = zonasPorNombre.get(zona) ?? new Set<string>()
            if (cliente.municipio) municipios.add(cliente.municipio)
            zonasPorNombre.set(zona, municipios)
          }

          delete cliente.nit
          delete cliente.zona
          delete cliente.ciudad
        })

      // Las zonas que existian como texto se convierten en zonas de verdad,
      // con los municipios de los clientes que las usaban.
      const ahora = new Date().toISOString()
      const nuevas: Zona[] = [...zonasPorNombre.entries()].map(([nombre, municipios]) => ({
        id: crypto.randomUUID(),
        nombre,
        municipios: [...municipios],
        creadoEn: ahora,
        actualizadoEn: ahora,
      }))
      if (nuevas.length > 0) await tx.table('zonas').bulkAdd(nuevas)
    })

  // El archivo de ventas real resulto venir linea a linea, con producto y
  // cantidad. Los movimientos son ese grano fino; el total mensual se deriva.
  // No hay migracion de datos: la tabla nace vacia y se llena al importar.
  db.version(3).stores({
    movimientos: 'id, clienteId, periodo, fecha, categoria, producto, [clienteId+periodo]',
  })

  // Cartera por cobrar. Un corte es la foto de una fecha, con sus documentos;
  // la tabla nace vacia y se llena al importar, asi que no hay que migrar nada.
  //
  // `fecha` va indexada porque es la llave real del corte: reimportar el
  // reporte de una fecha tiene que encontrar el anterior y reemplazarlo.
  db.version(4).stores({
    cortes: 'id, fecha',
    documentosCartera: 'id, corteId, clienteId, identificacion, fechaVencimiento',
  })
}
