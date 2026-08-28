import { describe, expect, it } from 'vitest'
import { aY, ticksBonitos } from './escala'

describe('ticksBonitos', () => {
  it('sube al siguiente número redondo', () => {
    const { tope } = ticksBonitos(39_200_000)
    expect(tope).toBe(40_000_000)
  })

  it('los cortes son parejos y arrancan en cero', () => {
    const { ticks } = ticksBonitos(39_200_000)
    expect(ticks[0]).toBe(0)
    expect(ticks).toEqual([0, 10_000_000, 20_000_000, 30_000_000, 40_000_000])
  })

  it('el tope nunca queda por debajo del máximo', () => {
    for (const maximo of [1, 7, 99, 1234, 45_678_901, 3_000_000_000]) {
      expect(ticksBonitos(maximo).tope).toBeGreaterThanOrEqual(maximo)
    }
  })

  it('los cortes están igualmente espaciados', () => {
    const { ticks } = ticksBonitos(87_500_000)
    const pasos = ticks.slice(1).map((t, i) => t - (ticks[i] ?? 0))
    expect(new Set(pasos).size).toBe(1)
  })

  it('aguanta valores degenerados sin romperse', () => {
    expect(ticksBonitos(0).tope).toBe(1)
    expect(ticksBonitos(-5).tope).toBe(1)
    expect(ticksBonitos(Number.NaN).tope).toBe(1)
  })
})

describe('aY', () => {
  it('el cero queda en la base y el tope arriba', () => {
    expect(aY(0, 100, 200)).toBe(200)
    expect(aY(100, 100, 200)).toBe(0)
  })

  it('interpola de forma lineal', () => {
    expect(aY(50, 100, 200)).toBe(100)
  })

  it('respeta el margen superior', () => {
    expect(aY(100, 100, 200, 10)).toBe(10)
    expect(aY(0, 100, 200, 10)).toBe(210)
  })

  it('recorta los valores fuera de rango en vez de salirse del lienzo', () => {
    expect(aY(500, 100, 200)).toBe(0)
    expect(aY(-50, 100, 200)).toBe(200)
  })

  it('sin tope no divide por cero', () => {
    expect(Number.isFinite(aY(10, 0, 200))).toBe(true)
  })
})
