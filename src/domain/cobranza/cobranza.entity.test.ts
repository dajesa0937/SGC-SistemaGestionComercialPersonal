import { describe, expect, it } from 'vitest'
import { diasDeMora, totalDe, tramoDe, tramosEnCero, vencidoDe } from './cobranza.entity'

const CORTE = '2026-05-25'

describe('tramoDe', () => {
  it('clasifica por dias de mora contra la fecha del corte', () => {
    // Las cuatro filas son documentos reales del reporte de mayo de 2026.
    expect(tramoDe(164_899_793, '2026-04-11', CORTE)).toBe('v31_60') // 44 dias
    expect(tramoDe(371_884, '2026-03-11', CORTE)).toBe('v61_90') // 75 dias
    expect(tramoDe(51_868_600, '2025-09-02', CORTE)).toBe('v91_mas') // 265 dias
    expect(tramoDe(99_000_592, '2026-06-24', CORTE)).toBe('por_vencer') // futuro
  })

  it('el que vence el mismo dia del corte todavia no esta vencido', () => {
    expect(tramoDe(1_000, CORTE, CORTE)).toBe('por_vencer')
    expect(tramoDe(1_000, '2026-05-24', CORTE)).toBe('v1_30')
  })

  it('respeta los limites exactos de cada tramo', () => {
    expect(tramoDe(1, '2026-04-25', CORTE)).toBe('v1_30') // 30 dias
    expect(tramoDe(1, '2026-04-24', CORTE)).toBe('v31_60') // 31 dias
    expect(tramoDe(1, '2026-03-26', CORTE)).toBe('v31_60') // 60 dias
    expect(tramoDe(1, '2026-03-25', CORTE)).toBe('v61_90') // 61 dias
    expect(tramoDe(1, '2026-02-24', CORTE)).toBe('v61_90') // 90 dias
    expect(tramoDe(1, '2026-02-23', CORTE)).toBe('v91_mas') // 91 dias
  })

  it('el signo manda sobre la fecha: un saldo a favor nunca esta vencido', () => {
    // RC-1-735 del reporte real: vence el 14/05/2026, once dias antes del
    // corte, y aun asi la empresa lo reporta como saldo a favor.
    expect(tramoDe(-10_000_000, '2026-05-14', CORTE)).toBe('a_favor')
    expect(diasDeMora(-10_000_000, '2026-05-14', CORTE)).toBe(0)
  })
})

describe('totalDe', () => {
  it('el saldo a favor resta, porque se guarda en negativo', () => {
    const tramos = { ...tramosEnCero(), v1_30: 500_000, por_vencer: 300_000, a_favor: -200_000 }
    expect(vencidoDe(tramos)).toBe(500_000)
    expect(totalDe(tramos)).toBe(600_000)
  })
})
