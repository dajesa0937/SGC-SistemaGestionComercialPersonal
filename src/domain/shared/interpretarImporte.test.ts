import { describe, expect, it } from 'vitest'
import { interpretarImporte } from './interpretarImporte'

describe('interpretarImporte', () => {
  it('lee los valores del archivo real de ventas', () => {
    expect(interpretarImporte('2760000')).toBe(2_760_000)
    expect(interpretarImporte('690000')).toBe(690_000)
  })

  it('lee el formato colombiano con punto de miles y coma decimal', () => {
    expect(interpretarImporte('1.648.997,93')).toBeCloseTo(1_648_997.93, 2)
    expect(interpretarImporte('$ 2.760.000')).toBe(2_760_000)
    // Excel exporta la moneda con espacio duro, no con espacio normal.
    expect(interpretarImporte('$\u00a02.760.000')).toBe(2_760_000)
  })

  it('lee el formato inglés con coma de miles y punto decimal', () => {
    expect(interpretarImporte('1,648,997.93')).toBeCloseTo(1_648_997.93, 2)
  })

  it('resuelve el separador único de tres dígitos como miles', () => {
    // «1.648» en un archivo de importes colombiano son mil seiscientos.
    expect(interpretarImporte('1.648')).toBe(1648)
    expect(interpretarImporte('1,648')).toBe(1648)
  })

  it('un separador repetido son miles, porque el decimal aparece una sola vez', () => {
    expect(interpretarImporte('2.760.000')).toBe(2_760_000)
    expect(interpretarImporte('1,648,997')).toBe(1_648_997)
  })

  it('trata como decimal el separador que no deja tres dígitos', () => {
    expect(interpretarImporte('1.6')).toBeCloseTo(1.6, 5)
    expect(interpretarImporte('29238,33')).toBeCloseTo(29_238.33, 2)
  })

  it('entiende los negativos, con signo y entre paréntesis', () => {
    expect(interpretarImporte('-3000000')).toBe(-3_000_000)
    expect(interpretarImporte('(100000)')).toBe(-100_000)
  })

  it('rechaza lo que no es un importe', () => {
    expect(interpretarImporte('')).toBeUndefined()
    expect(interpretarImporte('   ')).toBeUndefined()
    expect(interpretarImporte('n/a')).toBeUndefined()
    expect(interpretarImporte('Motobomba 2"')).toBeUndefined()
  })
})
