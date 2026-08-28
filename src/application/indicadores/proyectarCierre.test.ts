import { describe, expect, it } from 'vitest'
import { proyectarCierre } from './proyectarCierre'

// Agosto 2026 tiene 19 días hábiles (festivos: 7 de agosto y 17 de agosto).
const META = 50_000_000

describe('proyectarCierre', () => {
  it('proyecta según el ritmo por día hábil transcurrido', () => {
    // Al 26 de agosto han pasado 16 días hábiles de 19.
    const p = proyectarCierre(32_000_000, 18_000_000, META, '2026-08', new Date(2026, 7, 26))
    expect(p.diasTotales).toBe(19)
    expect(p.diasTranscurridos).toBe(16)
    expect(p.diasRestantes).toBe(3)
    expect(p.promedioDiario).toBe(2_000_000)
    expect(p.proyeccion).toBe(38_000_000)
  })

  it('calcula el ritmo necesario para cumplir', () => {
    const p = proyectarCierre(32_000_000, 18_000_000, META, '2026-08', new Date(2026, 7, 26))
    expect(p.ritmoRequerido).toBe(6_000_000)
  })

  it('el cumplimiento proyectado usa la meta', () => {
    const p = proyectarCierre(32_000_000, 18_000_000, META, '2026-08', new Date(2026, 7, 26))
    expect(p.cumplimientoProyectado).toBeCloseTo(0.76, 5)
  })

  it('sin días transcurridos no inventa una proyección', () => {
    const p = proyectarCierre(0, META, META, '2026-08', new Date(2026, 6, 15))
    expect(p.diasTranscurridos).toBe(0)
    expect(p.promedioDiario).toBeNull()
    expect(p.proyeccion).toBeNull()
    expect(p.cumplimientoProyectado).toBeNull()
  })

  it('con el mes cerrado no hay ritmo alcanzable', () => {
    const p = proyectarCierre(40_000_000, 10_000_000, META, '2026-08', new Date(2026, 9, 1))
    expect(p.periodoCerrado).toBe(true)
    expect(p.diasRestantes).toBe(0)
    expect(p.ritmoRequerido).toBeNull()
  })

  it('sin meta no proyecta cumplimiento pero sí venta', () => {
    const p = proyectarCierre(32_000_000, 0, 0, '2026-08', new Date(2026, 7, 26))
    expect(p.proyeccion).toBe(38_000_000)
    expect(p.cumplimientoProyectado).toBeNull()
  })

  it('el ritmo requerido se redondea hacia arriba: quedarse corto no sirve', () => {
    const p = proyectarCierre(0, 10, 10, '2026-08', new Date(2026, 7, 26))
    expect(p.ritmoRequerido).toBe(4) // 10 / 3 días = 3,33 → 4
  })
})
