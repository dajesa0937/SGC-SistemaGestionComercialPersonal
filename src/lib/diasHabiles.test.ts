import { describe, expect, it } from 'vitest'
import { diasHabilesDelMes, domingoDePascua, esDiaHabil, festivosDeColombia } from './diasHabiles'

function iso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

describe('domingoDePascua', () => {
  it('coincide con las fechas reales', () => {
    expect(iso(domingoDePascua(2024))).toBe('2024-03-31')
    expect(iso(domingoDePascua(2025))).toBe('2025-04-20')
    expect(iso(domingoDePascua(2026))).toBe('2026-04-05')
    expect(iso(domingoDePascua(2027))).toBe('2027-03-28')
  })
})

describe('festivosDeColombia', () => {
  it('coincide con el calendario oficial de 2026', () => {
    expect([...festivosDeColombia(2026)].sort()).toEqual([
      '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
      '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
      '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
      '2026-11-16', '2026-12-08', '2026-12-25',
    ])
  })

  it('coincide con el calendario oficial de 2025, que tiene 17 dias y no 18', () => {
    // El Sagrado Corazon y San Pedro y San Pablo caen ambos el lunes 30 de
    // junio de 2025: son dos festivos distintos en un mismo dia no laborable.
    // Los calendarios colombianos de 2025 publican por eso 17 fechas.
    expect([...festivosDeColombia(2025)].sort()).toEqual([
      '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
      '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
      '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
      '2025-12-08', '2025-12-25',
    ])
  })

  it('nunca hay menos de 17 ni mas de 18 fechas', () => {
    for (let anio = 2024; anio <= 2040; anio++) {
      const total = festivosDeColombia(anio).size
      expect(total).toBeGreaterThanOrEqual(17)
      expect(total).toBeLessThanOrEqual(18)
    }
  })

  it('incluye los festivos de fecha fija sin trasladar', () => {
    const f = festivosDeColombia(2026)
    expect(f.has('2026-01-01')).toBe(true)
    expect(f.has('2026-05-01')).toBe(true)
    expect(f.has('2026-07-20')).toBe(true)
    expect(f.has('2026-08-07')).toBe(true)
    expect(f.has('2026-12-08')).toBe(true)
    expect(f.has('2026-12-25')).toBe(true)
  })

  it('traslada al lunes los festivos de la ley Emiliani', () => {
    // Reyes 2026 cae martes 6 de enero: el festivo es el lunes 12.
    const f = festivosDeColombia(2026)
    expect(f.has('2026-01-06')).toBe(false)
    expect(f.has('2026-01-12')).toBe(true)
  })

  it('no mueve un festivo trasladable que ya cae lunes', () => {
    // San Jose 2029: el 19 de marzo es lunes.
    expect(new Date(2029, 2, 19).getDay()).toBe(1)
    expect(festivosDeColombia(2029).has('2029-03-19')).toBe(true)
  })

  it('incluye jueves y viernes santo sin trasladar', () => {
    // Pascua 2026 = 5 de abril. Jueves santo 2, viernes santo 3.
    const f = festivosDeColombia(2026)
    expect(f.has('2026-04-02')).toBe(true)
    expect(f.has('2026-04-03')).toBe(true)
  })
})

describe('esDiaHabil', () => {
  it('excluye sabados y domingos', () => {
    expect(esDiaHabil(new Date(2026, 7, 29))).toBe(false) // sábado
    expect(esDiaHabil(new Date(2026, 7, 30))).toBe(false) // domingo
  })

  it('excluye los festivos', () => {
    expect(esDiaHabil(new Date(2026, 7, 7))).toBe(false) // Batalla de Boyacá
  })

  it('acepta un martes corriente', () => {
    expect(esDiaHabil(new Date(2026, 7, 25))).toBe(true)
  })
})

describe('diasHabilesDelMes', () => {
  it('cuenta bien un mes con un festivo', () => {
    // Agosto 2026: 21 días de semana, menos el 7 (Boyacá) y el 17 (Asunción
    // trasladada desde el sábado 15) = 19 hábiles.
    const d = diasHabilesDelMes(2026, 8, new Date(2026, 7, 31))
    expect(d.totales).toBe(19)
  })

  it('cuenta el día de hoy como transcurrido', () => {
    const d = diasHabilesDelMes(2026, 8, new Date(2026, 7, 26))
    // Del 1 al 26 de agosto de 2026, hábiles: 16.
    expect(d.transcurridos).toBe(16)
    expect(d.restantes).toBe(d.totales - d.transcurridos)
  })

  it('con la referencia antes del mes no hay días transcurridos', () => {
    const d = diasHabilesDelMes(2026, 8, new Date(2026, 6, 15))
    expect(d.transcurridos).toBe(0)
    expect(d.restantes).toBe(d.totales)
  })

  it('con la referencia después del mes el mes está completo', () => {
    const d = diasHabilesDelMes(2026, 8, new Date(2026, 9, 1))
    expect(d.transcurridos).toBe(d.totales)
    expect(d.restantes).toBe(0)
  })

  it('los tres valores son coherentes entre sí', () => {
    const d = diasHabilesDelMes(2026, 2, new Date(2026, 1, 10))
    expect(d.transcurridos + d.restantes).toBe(d.totales)
  })
})
