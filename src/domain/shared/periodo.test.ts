import { describe, expect, it } from 'vitest'
import { PeriodoInvalidoError } from './errores'
import {
  anioDe,
  aPeriodo,
  compararPeriodos,
  crearPeriodo,
  esPeriodoValido,
  formatearPeriodo,
  formatearPeriodoCorto,
  mesDe,
  mesesEntre,
  mismoMesAnioAnterior,
  periodoDeFecha,
  periodosDelAnio,
  rangoDePeriodos,
  sumarMeses,
  ultimosPeriodos,
} from './periodo'

describe('esPeriodoValido', () => {
  it('acepta periodos bien formados', () => {
    expect(esPeriodoValido('2026-01')).toBe(true)
    expect(esPeriodoValido('2026-12')).toBe(true)
  })

  it('rechaza meses fuera de rango', () => {
    expect(esPeriodoValido('2026-00')).toBe(false)
    expect(esPeriodoValido('2026-13')).toBe(false)
  })

  it('rechaza formatos incorrectos', () => {
    expect(esPeriodoValido('2026-1')).toBe(false)
    expect(esPeriodoValido('26-01')).toBe(false)
    expect(esPeriodoValido('2026/01')).toBe(false)
    expect(esPeriodoValido('')).toBe(false)
  })
})

describe('aPeriodo', () => {
  it('lanza un error de dominio con formato invalido', () => {
    expect(() => aPeriodo('agosto')).toThrow(PeriodoInvalidoError)
  })
})

describe('crearPeriodo', () => {
  it('rellena el mes con cero a la izquierda', () => {
    expect(crearPeriodo(2026, 3)).toBe('2026-03')
  })

  it('rechaza meses invalidos', () => {
    expect(() => crearPeriodo(2026, 0)).toThrow(PeriodoInvalidoError)
    expect(() => crearPeriodo(2026, 13)).toThrow(PeriodoInvalidoError)
  })
})

describe('periodoDeFecha', () => {
  it('usa la hora local, no UTC', () => {
    // 31 de diciembre a las 23:00 locales sigue siendo diciembre.
    expect(periodoDeFecha(new Date(2026, 11, 31, 23, 0, 0))).toBe('2026-12')
    // 1 de enero a las 00:30 locales ya es enero.
    expect(periodoDeFecha(new Date(2027, 0, 1, 0, 30, 0))).toBe('2027-01')
  })
})

describe('anioDe y mesDe', () => {
  it('descomponen el periodo', () => {
    expect(anioDe('2026-08')).toBe(2026)
    expect(mesDe('2026-08')).toBe(8)
  })
})

describe('sumarMeses', () => {
  it('avanza dentro del mismo ano', () => {
    expect(sumarMeses('2026-01', 5)).toBe('2026-06')
  })

  it('cruza el fin de ano hacia adelante', () => {
    expect(sumarMeses('2026-11', 3)).toBe('2027-02')
  })

  it('cruza el fin de ano hacia atras', () => {
    expect(sumarMeses('2026-02', -3)).toBe('2025-11')
  })

  it('retrocede doce meses exactos', () => {
    expect(sumarMeses('2026-08', -12)).toBe('2025-08')
  })

  it('es la identidad con desplazamiento cero', () => {
    expect(sumarMeses('2026-08', 0)).toBe('2026-08')
  })
})

describe('compararPeriodos', () => {
  it('ordena cronologicamente', () => {
    const desordenados = ['2026-03', '2025-12', '2026-01']
    expect([...desordenados].sort(compararPeriodos)).toEqual(['2025-12', '2026-01', '2026-03'])
  })
})

describe('mesesEntre', () => {
  it('cuenta hacia adelante', () => {
    expect(mesesEntre('2026-01', '2026-08')).toBe(7)
  })

  it('cuenta hacia atras con signo negativo', () => {
    expect(mesesEntre('2026-08', '2026-01')).toBe(-7)
  })

  it('es cero para el mismo periodo', () => {
    expect(mesesEntre('2026-08', '2026-08')).toBe(0)
  })
})

describe('rangoDePeriodos', () => {
  it('incluye ambos extremos', () => {
    expect(rangoDePeriodos('2026-01', '2026-04')).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
    ])
  })

  it('devuelve un solo elemento cuando los extremos coinciden', () => {
    expect(rangoDePeriodos('2026-05', '2026-05')).toEqual(['2026-05'])
  })

  it('devuelve vacio cuando el rango esta invertido', () => {
    expect(rangoDePeriodos('2026-05', '2026-01')).toEqual([])
  })
})

describe('ultimosPeriodos', () => {
  it('devuelve doce periodos en orden cronologico terminando en el dado', () => {
    const serie = ultimosPeriodos('2026-08', 12)
    expect(serie).toHaveLength(12)
    expect(serie[0]).toBe('2025-09')
    expect(serie[11]).toBe('2026-08')
  })

  it('devuelve vacio para cantidades no positivas', () => {
    expect(ultimosPeriodos('2026-08', 0)).toEqual([])
    expect(ultimosPeriodos('2026-08', -3)).toEqual([])
  })
})

describe('periodosDelAnio', () => {
  it('devuelve los doce meses del ano', () => {
    const meses = periodosDelAnio(2026)
    expect(meses).toHaveLength(12)
    expect(meses[0]).toBe('2026-01')
    expect(meses[11]).toBe('2026-12')
  })
})

describe('mismoMesAnioAnterior', () => {
  it('retrocede exactamente un ano', () => {
    expect(mismoMesAnioAnterior('2026-08')).toBe('2025-08')
  })
})

describe('formateo', () => {
  it('formatea en espanol', () => {
    expect(formatearPeriodo('2026-08')).toBe('Agosto 2026')
    expect(formatearPeriodoCorto('2026-08')).toBe('Ago 2026')
    expect(formatearPeriodo('2026-01')).toBe('Enero 2026')
    expect(formatearPeriodoCorto('2026-09')).toBe('Sep 2026')
  })
})
