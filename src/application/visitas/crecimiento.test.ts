import { describe, expect, it } from 'vitest'
import { calcularCrecimiento, proyectarClienteAlCierre } from './crecimiento'

const serie = (entradas: Record<string, number>) => new Map(Object.entries(entradas))

describe('calcularCrecimiento', () => {
  it('detecta que un cliente crece', () => {
    // Caso real de la cartera: Gader del Cristo pasó de $ 650.000 a $ 9,86 M.
    const r = calcularCrecimiento(
      serie({ '2026-03': 650_000, '2026-06': 4_000_000, '2026-07': 3_000_000, '2026-08': 2_860_000 }),
      '2026-08',
    )
    expect(r.tendencia).toBe('crece')
    expect(r.reciente).toBe(9_860_000)
    expect(r.previo).toBe(650_000)
  })

  it('detecta que un cliente cae, incluso a cero', () => {
    // Jorge Alberto Mahecha: $ 2,9 M y luego nada. Por tamaño sigue siendo A.
    const r = calcularCrecimiento(serie({ '2026-03': 1_500_000, '2026-05': 1_400_000 }), '2026-08')
    expect(r.tendencia).toBe('cae')
    expect(r.reciente).toBe(0)
    expect(r.variacion).toBe(-1)
  })

  it('una variación pequeña es estable, no una señal', () => {
    const r = calcularCrecimiento(
      serie({ '2026-03': 1_000_000, '2026-06': 1_050_000 }),
      '2026-08',
    )
    expect(r.tendencia).toBe('estable')
  })

  it('sin base no dice que crece un infinito por ciento', () => {
    // Vender por primera vez no es «crecer»: es empezar, y es otra cosa.
    const r = calcularCrecimiento(serie({ '2026-08': 5_000_000 }), '2026-08')
    expect(r.tendencia).toBe('sin_base')
    expect(r.variacion).toBeNull()
  })

  it('sin ninguna venta tampoco inventa una tendencia', () => {
    expect(calcularCrecimiento(serie({}), '2026-08').tendencia).toBe('sin_base')
  })

  it('respeta el umbral que se le pase', () => {
    const s = serie({ '2026-03': 1_000_000, '2026-06': 1_100_000 })
    expect(calcularCrecimiento(s, '2026-08', 0.05).tendencia).toBe('crece')
    expect(calcularCrecimiento(s, '2026-08', 0.5).tendencia).toBe('estable')
  })
})

describe('proyectarClienteAlCierre', () => {
  it('proyecta el cierre al ritmo de los últimos tres meses', () => {
    const r = proyectarClienteAlCierre(
      serie({ '2026-06': 3_000_000, '2026-07': 3_000_000, '2026-08': 3_000_000 }),
      '2026-08',
    )
    // 9 M acumulados + 3 M/mes × 4 meses que faltan.
    expect(r.acumulado).toBe(9_000_000)
    expect(r.mesesRestantes).toBe(4)
    expect(r.estimado).toBe(21_000_000)
    expect(r.confiable).toBe(true)
  })

  it('marca como poco confiable al que compró una o dos veces', () => {
    const r = proyectarClienteAlCierre(serie({ '2026-08': 12_000_000 }), '2026-08')
    expect(r.mesesConCompra).toBe(1)
    expect(r.confiable).toBe(false)
    // El número se calcula igual: se muestra marcado, no se esconde.
    expect(r.estimado).toBeGreaterThan(0)
  })

  it('no arrastra los ceros de principio de año de quien arrancó tarde', () => {
    // Solo compró en julio y agosto: el promedio sale de los últimos tres
    // meses, no de dividir entre ocho.
    const r = proyectarClienteAlCierre(serie({ '2026-07': 3_000_000, '2026-08': 3_000_000 }), '2026-08')
    expect(r.acumulado).toBe(6_000_000)
    expect(r.estimado).toBe(6_000_000 + Math.round((6_000_000 / 3) * 4))
  })

  it('no cuenta las ventas del año anterior en el acumulado', () => {
    const r = proyectarClienteAlCierre(
      serie({ '2025-11': 50_000_000, '2026-08': 1_000_000 }),
      '2026-08',
    )
    expect(r.acumulado).toBe(1_000_000)
  })

  it('en diciembre no queda nada por proyectar', () => {
    const r = proyectarClienteAlCierre(serie({ '2026-12': 1_000_000 }), '2026-12')
    expect(r.mesesRestantes).toBe(0)
    expect(r.estimado).toBe(1_000_000)
  })
})
