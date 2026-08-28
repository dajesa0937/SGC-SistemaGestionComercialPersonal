import type { Cliente } from '@/domain/cliente/cliente.entity'
import type { Presupuesto } from '@/domain/presupuesto/presupuesto.entity'
import type { VentaMensual } from '@/domain/venta/venta.entity'
import type { Periodo, Pesos } from '@/domain/shared/types'

/** Constructores mínimos para las pruebas del motor de indicadores. */

export function cliente(id: string, extra: Partial<Cliente> = {}): Cliente {
  return {
    id,
    codigo: id,
    nombre: id,
    estadoManual: 'cliente',
    archivado: false,
    creadoEn: '2025-01-01T00:00:00.000Z',
    actualizadoEn: '2025-01-01T00:00:00.000Z',
    ...extra,
  }
}

export function venta(clienteId: string, periodo: Periodo, valor: Pesos): VentaMensual {
  return {
    id: `${clienteId}-${periodo}`,
    clienteId,
    periodo,
    valor,
    origen: 'manual',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
  }
}

export function presupuesto(periodo: Periodo, meta: Pesos): Presupuesto {
  return { id: periodo, periodo, meta, actualizadoEn: '2026-01-01T00:00:00.000Z' }
}
