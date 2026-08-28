import { describe, expect, it } from 'vitest'
import { CONFIGURACION_POR_DEFECTO } from '@/domain/config/configuracion.entity'
import { resumenDelPeriodo } from './resumenDelPeriodo'
import { cliente, presupuesto, venta } from './ayudasParaPruebas'

const HOY = new Date(2026, 7, 26) // 26 de agosto de 2026

const CLIENTES = [cliente('a'), cliente('b'), cliente('c'), cliente('d')]

const VENTAS = [
  venta('a', '2026-08', 20_000_000),
  venta('b', '2026-08', 19_200_000),
  venta('a', '2026-07', 18_000_000),
  venta('b', '2026-07', 12_000_000),
  venta('c', '2026-03', 4_000_000),
  venta('a', '2025-08', 15_000_000),
]

const METAS = [
  presupuesto('2026-07', 45_000_000),
  presupuesto('2026-08', 50_000_000),
  presupuesto('2026-09', 50_000_000),
]

function resumen(extra: Partial<Parameters<typeof resumenDelPeriodo>[0]> = {}) {
  return resumenDelPeriodo({
    periodo: '2026-08',
    clientes: CLIENTES,
    ventas: VENTAS,
    presupuestos: METAS,
    config: CONFIGURACION_POR_DEFECTO,
    hoy: HOY,
    ...extra,
  })
}

describe('resumenDelPeriodo', () => {
  it('los totales del panel coinciden exactamente con la suma de las ventas', () => {
    const r = resumen()
    const sumaManual = VENTAS.filter((v) => v.periodo === '2026-08').reduce(
      (t, v) => t + v.valor,
      0,
    )
    expect(r.mes.vendido).toBe(sumaManual)
    expect(r.mes.vendido).toBe(39_200_000)
  })

  it('el acumulado del año coincide con la suma manual de enero a agosto', () => {
    const r = resumen()
    // 39,2 (agosto) + 30 (julio) + 4 (marzo). No incluye la venta de 2025.
    expect(r.anio.vendido).toBe(73_200_000)
    expect(r.anio.meta).toBe(95_000_000)
  })

  it('el último punto de la serie coincide con el vendido del mes', () => {
    const r = resumen()
    expect(r.serie[11]?.vendido).toBe(r.mes.vendido)
    expect(r.serie[11]?.periodo).toBe('2026-08')
  })

  it('la suma del top no puede superar el vendido del mes', () => {
    const r = resumen()
    const sumaTop = r.top.reduce((t, c) => t + c.ventaPeriodo, 0)
    expect(sumaTop).toBeLessThanOrEqual(r.mes.vendido)
  })

  it('la cobertura cuadra con los clientes que aparecen con venta', () => {
    const r = resumen()
    const conVenta = r.clientes.filter((c) => c.ventaPeriodo > 0).length
    expect(r.cobertura.conCompra).toBe(conVenta)
    expect(r.cobertura.conCompra).toBe(2)
    expect(r.cobertura.activos).toBe(4)
  })

  it('marca las alertas de quien dejó de comprar', () => {
    const r = resumen()
    const ids = r.alertas.map((a) => a.cliente.id)
    expect(ids).toContain('c') // última compra en marzo
    expect(ids).toContain('d') // nunca compró
    expect(ids).not.toContain('a')
  })

  it('el semáforo refleja el cumplimiento', () => {
    expect(resumen().semaforoMes).toBe('rojo') // 78,4 %
    expect(resumen({ presupuestos: [presupuesto('2026-08', 39_200_000)] }).semaforoMes).toBe('verde')
    expect(resumen({ presupuestos: [presupuesto('2026-08', 43_000_000)] }).semaforoMes).toBe('ambar')
    expect(resumen({ presupuestos: [] }).semaforoMes).toBe('sin_meta')
  })

  it('detecta que no hay datos cargados', () => {
    expect(resumen({ ventas: [] }).sinDatos).toBe(true)
    expect(resumen().sinDatos).toBe(false)
  })

  it('sin ventas nada explota y todo queda en cero o null', () => {
    const r = resumen({ ventas: [] })
    expect(r.mes.vendido).toBe(0)
    expect(r.anio.vendido).toBe(0)
    expect(r.top).toHaveLength(0)
    expect(r.cobertura.conCompra).toBe(0)
    expect(r.serie.every((p) => p.vendido === 0)).toBe(true)
  })

  it('sin clientes ni ventas la cobertura no divide por cero', () => {
    const r = resumen({ clientes: [], ventas: [] })
    expect(r.cobertura.fraccion).toBeNull()
  })

  it('es determinista: la misma entrada da el mismo resultado', () => {
    expect(resumen()).toEqual(resumen())
  })

  it('no modifica las listas que recibe', () => {
    const ventas = structuredClone(VENTAS)
    const clientes = structuredClone(CLIENTES)
    resumen({ ventas, clientes })
    expect(ventas).toEqual(VENTAS)
    expect(clientes).toEqual(CLIENTES)
  })
})
