import { describe, expect, it } from 'vitest'
import type { MovimientoVenta, NuevoMovimiento } from './movimiento.entity'
import { agregarMovimientos, calcularMezcla } from './movimiento.entity'

function linea(parcial: Partial<MovimientoVenta> & { valor: number }): MovimientoVenta {
  return {
    id: crypto.randomUUID(),
    clienteId: 'c1',
    fecha: '2026-04-07',
    periodo: '2026-04',
    actualizadoEn: '2026-04-07T00:00:00.000Z',
    ...parcial,
  }
}

describe('agregarMovimientos', () => {
  it('suma las líneas del mismo cliente y mes en un solo total', () => {
    const movimientos: NuevoMovimiento[] = [
      linea({ valor: 2_760_000, cantidad: 4 }),
      linea({ valor: 3_120_000, cantidad: 4 }),
    ]
    expect(agregarMovimientos(movimientos)).toEqual([
      { clienteId: 'c1', periodo: '2026-04', valor: 5_880_000, unidades: 8 },
    ])
  })

  it('separa clientes y periodos distintos', () => {
    const r = agregarMovimientos([
      linea({ valor: 100, clienteId: 'c1', periodo: '2026-01' }),
      linea({ valor: 200, clienteId: 'c1', periodo: '2026-02' }),
      linea({ valor: 300, clienteId: 'c2', periodo: '2026-01' }),
    ])
    expect(r).toHaveLength(3)
    expect(r.map((t) => t.valor).reduce((a, b) => a + b)).toBe(600)
  })

  it('una línea sin cantidad no rompe el conteo de unidades', () => {
    const r = agregarMovimientos([linea({ valor: 500 }), linea({ valor: 500, cantidad: 2 })])
    expect(r[0]).toMatchObject({ valor: 1000, unidades: 2 })
  })

  it('sin movimientos no hay totales', () => {
    expect(agregarMovimientos([])).toEqual([])
  })
})

describe('calcularMezcla', () => {
  // Proporciones del archivo real de ventas, a escala.
  const MOVIMIENTOS = [
    linea({ valor: 76_700_000, categoria: 'Motores', producto: 'Motor 13 HP', cantidad: 10 }),
    linea({ valor: 60_540_000, categoria: 'Motosierras', producto: 'Motosierra 18"', cantidad: 20 }),
    linea({ valor: 50_720_000, categoria: 'Guadañadoras', producto: 'Guadañadora 52cc', cantidad: 15 }),
    linea({ valor: 47_800_000, categoria: 'Motobombas', producto: 'Motobomba 3"', cantidad: 12 }),
    linea({ valor: 3_812_000, categoria: 'Repuestos', producto: 'Carburador', cantidad: 30 }),
  ]

  it('ordena de mayor a menor y reparte el 100 %', () => {
    const mezcla = calcularMezcla(MOVIMIENTOS)
    expect(mezcla.map((m) => m.nombre)).toEqual([
      'Motores',
      'Motosierras',
      'Guadañadoras',
      'Motobombas',
      'Repuestos',
    ])
    const suma = mezcla.reduce((total, m) => total + m.participacion, 0)
    expect(suma).toBeCloseTo(1, 10)
  })

  it('calcula la participación real de cada categoría', () => {
    const mezcla = calcularMezcla(MOVIMIENTOS)
    expect((mezcla[0]!.participacion * 100).toFixed(1)).toBe('32.0')
    expect((mezcla[4]!.participacion * 100).toFixed(1)).toBe('1.6')
  })

  it('puede desglosar por producto en vez de por categoría', () => {
    const mezcla = calcularMezcla(MOVIMIENTOS, 'producto')
    expect(mezcla[0]?.nombre).toBe('Motor 13 HP')
  })

  it('agrupa lo que no tiene categoría en vez de descartarlo', () => {
    // Si se descartara, la mezcla dejaría de sumar la venta total y el usuario
    // vería dos cifras distintas para lo mismo.
    const mezcla = calcularMezcla([
      linea({ valor: 1000, categoria: 'Motores' }),
      linea({ valor: 500 }),
      linea({ valor: 500, categoria: '   ' }),
    ])
    expect(mezcla.map((m) => [m.nombre, m.valor])).toEqual([
      ['Motores', 1000],
      ['Sin clasificar', 1000],
    ])
    expect(mezcla.reduce((t, m) => t + m.valor, 0)).toBe(2000)
  })

  it('cuenta líneas y unidades además del valor', () => {
    const mezcla = calcularMezcla(MOVIMIENTOS)
    expect(mezcla[4]).toMatchObject({ lineas: 1, unidades: 30 })
  })

  it('sin movimientos devuelve una mezcla vacía, no un cero dividido', () => {
    expect(calcularMezcla([])).toEqual([])
  })
})
