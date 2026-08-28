import { describe, expect, it } from 'vitest'
import { construirSerie12Meses } from './construirSerie12Meses'
import { presupuesto, venta } from './ayudasParaPruebas'

describe('construirSerie12Meses', () => {
  const ventas = [
    venta('a', '2026-08', 30_000_000),
    venta('b', '2026-08', 9_200_000),
    venta('a', '2026-06', 25_000_000),
    venta('a', '2024-01', 99_000_000), // fuera de la ventana
  ]
  const metas = [presupuesto('2026-08', 50_000_000)]

  it('devuelve doce puntos en orden cronológico', () => {
    const serie = construirSerie12Meses(ventas, metas, '2026-08')
    expect(serie).toHaveLength(12)
    expect(serie[0]?.periodo).toBe('2025-09')
    expect(serie[11]?.periodo).toBe('2026-08')
  })

  it('suma todas las ventas de cada mes', () => {
    const serie = construirSerie12Meses(ventas, metas, '2026-08')
    expect(serie[11]?.vendido).toBe(39_200_000)
  })

  it('los meses sin venta valen cero, no se omiten', () => {
    const serie = construirSerie12Meses(ventas, metas, '2026-08')
    expect(serie[10]?.vendido).toBe(0)
    expect(serie.every((p) => typeof p.vendido === 'number')).toBe(true)
  })

  it('deja la meta en null cuando ese mes no tiene cuota', () => {
    const serie = construirSerie12Meses(ventas, metas, '2026-08')
    expect(serie[11]?.meta).toBe(50_000_000)
    expect(serie[10]?.meta).toBeNull()
    expect(serie[10]?.cumplimiento).toBeNull()
  })

  it('ignora lo que queda fuera de la ventana', () => {
    const serie = construirSerie12Meses(ventas, metas, '2026-08')
    expect(serie.some((p) => p.vendido === 99_000_000)).toBe(false)
  })

  it('trae la etiqueta lista para la gráfica', () => {
    const serie = construirSerie12Meses(ventas, metas, '2026-08')
    expect(serie[11]?.etiqueta).toBe('Ago 2026')
  })

  it('admite ventanas de otro tamaño', () => {
    expect(construirSerie12Meses(ventas, metas, '2026-08', 3)).toHaveLength(3)
  })
})
