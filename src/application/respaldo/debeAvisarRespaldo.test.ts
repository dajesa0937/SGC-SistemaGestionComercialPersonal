import { describe, expect, it } from 'vitest'
import { motivoAvisoRespaldo } from './debeAvisarRespaldo'

const CON_DATOS = { ultimo: null, diasDesdeUltimo: null, hayDatos: true }

describe('motivoAvisoRespaldo', () => {
  it('no avisa cuando la base está vacía, aunque nunca se haya respaldado', () => {
    expect(motivoAvisoRespaldo({ ...CON_DATOS, hayDatos: false }, 15)).toBeNull()
  })

  it('avisa cuando hay datos y nunca se respaldó', () => {
    expect(motivoAvisoRespaldo(CON_DATOS, 15)).toBe('nunca')
  })

  it('deja de avisar el mismo día en que se respalda', () => {
    const recien = { ultimo: '2026-08-28T10:00:00.000Z', diasDesdeUltimo: 0, hayDatos: true }
    expect(motivoAvisoRespaldo(recien, 15)).toBeNull()
  })

  it('no avisa mientras no se cumpla el umbral', () => {
    const ayer = { ultimo: '2026-08-13T10:00:00.000Z', diasDesdeUltimo: 14, hayDatos: true }
    expect(motivoAvisoRespaldo(ayer, 15)).toBeNull()
  })

  it('avisa justo al cumplirse el umbral', () => {
    const justo = { ultimo: '2026-08-13T10:00:00.000Z', diasDesdeUltimo: 15, hayDatos: true }
    expect(motivoAvisoRespaldo(justo, 15)).toBe('vencido')
  })

  it('sigue avisando muy pasado el umbral', () => {
    const viejo = { ultimo: '2025-01-01T10:00:00.000Z', diasDesdeUltimo: 604, hayDatos: true }
    expect(motivoAvisoRespaldo(viejo, 15)).toBe('vencido')
  })
})
