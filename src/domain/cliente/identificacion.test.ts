import { describe, expect, it } from 'vitest'
import {
  digitoVerificacion,
  formatearIdentificacion,
  normalizarIdentificacion,
} from './identificacion'

describe('normalizarIdentificacion', () => {
  it('reconoce como el mismo cliente las tres formas que usan los reportes', () => {
    const formas = ['901593129-3', '901.593.129', ' 901593129 ', '901593129']
    const normalizadas = new Set(formas.map(normalizarIdentificacion))
    expect(normalizadas).toEqual(new Set(['901593129']))
  })

  it('acepta cédulas sin dígito de verificación', () => {
    expect(normalizarIdentificacion('85271331')).toBe('85271331')
    expect(normalizarIdentificacion(1066529773)).toBe('1066529773')
  })

  it('descarta lo que no contiene un solo dígito', () => {
    expect(normalizarIdentificacion('')).toBeUndefined()
    expect(normalizarIdentificacion('   ')).toBeUndefined()
    expect(normalizarIdentificacion('N/A')).toBeUndefined()
    expect(normalizarIdentificacion(null)).toBeUndefined()
    expect(normalizarIdentificacion(undefined)).toBeUndefined()
  })
})

describe('digitoVerificacion', () => {
  it('calcula el dígito de la DIAN', () => {
    // Agroborda Colombia SAS, tal como aparece en el encabezado del reporte.
    expect(digitoVerificacion('901593129')).toBe(3)
  })

  it('formatea el NIT completo', () => {
    expect(formatearIdentificacion('901593129')).toBe('901593129-3')
  })
})
