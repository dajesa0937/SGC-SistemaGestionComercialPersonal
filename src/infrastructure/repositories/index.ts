import type { Repositorios } from '@/domain/repositorios'
import { obtenerBase } from '../db/database'
import { DexieClienteRepository } from './dexie-cliente.repository'
import { DexieVentaRepository } from './dexie-venta.repository'
import { DexiePresupuestoRepository } from './dexie-presupuesto.repository'
import { DexieImportacionRepository } from './dexie-importacion.repository'
import { DexieConfiguracionRepository } from './dexie-configuracion.repository'
import { DexieRespaldoRepository } from './dexie-respaldo.repository'

/** Construye la implementacion de los repositorios respaldada por IndexedDB. */
export function crearRepositoriosDexie(): Repositorios {
  const db = obtenerBase()
  return {
    clientes: new DexieClienteRepository(db),
    ventas: new DexieVentaRepository(db),
    presupuestos: new DexiePresupuestoRepository(db),
    importaciones: new DexieImportacionRepository(db),
    configuracion: new DexieConfiguracionRepository(db),
    respaldo: new DexieRespaldoRepository(db),
  }
}
