import { describe, expect, it } from 'vitest'
import {
  calcularAcumuladoAnual,
  calcularCumplimiento,
  metaAnual,
  semaforo,
  sumarVentas,
} from './calcularCumplimiento'
import { presupuesto, venta } from './ayudasParaPruebas'

const UMBRALES = { umbralVerde: 1, umbralAmbar: 0.85 }

describe('sumarVentas', () => {
  it('suma en pesos enteros sin errores de coma flotante', () => {
    const total = sumarVentas([
      venta('a', '2026-08', 1_200_100),
      venta('b', '2026-08', 2_300_200),
      venta('c', '2026-08', 3_400_300),
    ])
    expect(total).toBe(6_900_600)
    expect(Number.isInteger(total)).toBe(true)
  })

  it('la lista vacía suma cero', () => {
    expect(sumarVentas([])).toBe(0)
  })
})

describe('calcularCumplimiento', () => {
  const ventas = [
    venta('a', '2026-08', 20_000_000),
    venta('b', '2026-08', 19_200_000),
    venta('a', '2026-07', 99_000_000),
  ]

  it('solo cuenta el periodo pedido', () => {
    const r = calcularCumplimiento(ventas, [presupuesto('2026-08', 50_000_000)], '2026-08')
    expect(r.vendido).toBe(39_200_000)
  })

  it('calcula porcentaje y faltante', () => {
    const r = calcularCumplimiento(ventas, [presupuesto('2026-08', 50_000_000)], '2026-08')
    expect(r.cumplimiento).toBeCloseTo(0.784, 5)
    expect(r.faltante).toBe(10_800_000)
    expect(r.hayMeta).toBe(true)
  })

  it('sin meta devuelve null, nunca cero ni infinito', () => {
    const r = calcularCumplimiento(ventas, [], '2026-08')
    expect(r.cumplimiento).toBeNull()
    expect(r.hayMeta).toBe(false)
    expect(r.meta).toBe(0)
  })

  it('una meta de cero se trata como meta ausente', () => {
    const r = calcularCumplimiento(ventas, [presupuesto('2026-08', 0)], '2026-08')
    expect(r.cumplimiento).toBeNull()
  })

  it('superar la meta deja el faltante en cero, no en negativo', () => {
    const r = calcularCumplimiento(ventas, [presupuesto('2026-08', 30_000_000)], '2026-08')
    expect(r.faltante).toBe(0)
    expect(r.cumplimiento).toBeGreaterThan(1)
  })

  it('un periodo sin ventas da cero vendido y el faltante completo', () => {
    const r = calcularCumplimiento(ventas, [presupuesto('2026-09', 40_000_000)], '2026-09')
    expect(r.vendido).toBe(0)
    expect(r.faltante).toBe(40_000_000)
  })
})

describe('calcularAcumuladoAnual', () => {
  const ventas = [
    venta('a', '2025-12', 80_000_000), // año anterior: no cuenta
    venta('a', '2026-01', 10_000_000),
    venta('a', '2026-07', 20_000_000),
    venta('a', '2026-08', 30_000_000),
    venta('a', '2026-09', 40_000_000), // posterior al periodo: no cuenta
  ]
  const metas = [
    presupuesto('2025-12', 99_000_000),
    presupuesto('2026-01', 15_000_000),
    presupuesto('2026-07', 25_000_000),
    presupuesto('2026-08', 30_000_000),
    presupuesto('2026-09', 35_000_000),
  ]

  it('acumula desde enero hasta el periodo, ambos incluidos', () => {
    const r = calcularAcumuladoAnual(ventas, metas, '2026-08')
    expect(r.vendido).toBe(60_000_000)
    expect(r.meta).toBe(70_000_000)
  })

  it('excluye el año anterior y los meses futuros', () => {
    const r = calcularAcumuladoAnual(ventas, metas, '2026-08')
    expect(r.vendido).not.toBe(140_000_000)
  })
})

describe('metaAnual', () => {
  it('suma los doce meses del año', () => {
    const metas = [presupuesto('2026-01', 10), presupuesto('2026-12', 20), presupuesto('2027-01', 99)]
    expect(metaAnual(metas, 2026)).toBe(30)
  })
})

describe('semaforo', () => {
  it('verde al cumplir o superar la meta', () => {
    expect(semaforo(1, UMBRALES)).toBe('verde')
    expect(semaforo(1.2, UMBRALES)).toBe('verde')
  })

  it('ámbar entre el umbral y la meta', () => {
    expect(semaforo(0.85, UMBRALES)).toBe('ambar')
    expect(semaforo(0.99, UMBRALES)).toBe('ambar')
  })

  it('rojo por debajo del umbral', () => {
    expect(semaforo(0.8499, UMBRALES)).toBe('rojo')
    expect(semaforo(0, UMBRALES)).toBe('rojo')
  })

  it('sin meta no enciende ningún color', () => {
    expect(semaforo(null, UMBRALES)).toBe('sin_meta')
  })
})
