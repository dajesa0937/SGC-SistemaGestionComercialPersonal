import { describe, expect, it } from 'vitest'
import {
  CAMPOS_MAESTRO_CLIENTES,
  detectarColumnas,
  requeridosFaltantes,
  type CampoObjetivo,
} from './detectarColumnas'

const CAMPOS: CampoObjetivo[] = [
  { clave: 'codigo', etiqueta: 'Código', sinonimos: ['codigo', 'cod'], requerido: true },
  { clave: 'nombre', etiqueta: 'Nombre', sinonimos: ['nombre', 'razon social'], requerido: true },
  { clave: 'zona', etiqueta: 'Zona', sinonimos: ['zona', 'ruta'], requerido: false },
]

describe('detectarColumnas', () => {
  it('empareja encabezados exactos', () => {
    expect(detectarColumnas(['codigo', 'nombre', 'zona'], CAMPOS)).toEqual({
      codigo: 0,
      nombre: 1,
      zona: 2,
    })
  })

  it('ignora tildes, mayusculas y guiones bajos', () => {
    expect(detectarColumnas(['CÓDIGO', 'Razón_Social', 'ZONA'], CAMPOS)).toEqual({
      codigo: 0,
      nombre: 1,
      zona: 2,
    })
  })

  it('deja en null lo que no reconoce', () => {
    const m = detectarColumnas(['codigo', 'nombre', 'saldo cartera'], CAMPOS)
    expect(m['zona']).toBeNull()
  })

  it('no asigna la misma columna a dos campos', () => {
    const m = detectarColumnas(['nombre'], CAMPOS)
    const asignadas = Object.values(m).filter((v) => v !== null)
    expect(new Set(asignadas).size).toBe(asignadas.length)
  })

  it('tolera columnas en desorden y columnas de sobra', () => {
    expect(detectarColumnas(['saldo', 'ZONA', 'x', 'Codigo', 'Nombre'], CAMPOS)).toEqual({
      codigo: 3,
      nombre: 4,
      zona: 1,
    })
  })

  it('tolera encabezados vacios', () => {
    const m = detectarColumnas(['', 'codigo', '', 'nombre'], CAMPOS)
    expect(m['codigo']).toBe(1)
    expect(m['nombre']).toBe(3)
  })

  it('el sinonimo mas especifico gana la columna', () => {
    // "NOMBRE COMERCIAL" no debe robarle la columna a "NOMBRE".
    const m = detectarColumnas(
      ['Codigo', 'Nombre', 'Nombre Comercial'],
      CAMPOS_MAESTRO_CLIENTES,
    )
    expect(m['nombre']).toBe(1)
    expect(m['nombreComercial']).toBe(2)
  })

  it('reconoce los encabezados habituales de un maestro real', () => {
    const m = detectarColumnas(
      ['COD. CLIENTE', 'RAZON SOCIAL', 'NIT', 'MUNICIPIO', 'RUTA', 'CELULAR'],
      CAMPOS_MAESTRO_CLIENTES,
    )
    expect(m['codigo']).toBe(0)
    expect(m['nombre']).toBe(1)
    expect(m['nit']).toBe(2)
    expect(m['ciudad']).toBe(3)
    expect(m['zona']).toBe(4)
    expect(m['telefono']).toBe(5)
  })
})

describe('requeridosFaltantes', () => {
  it('nombra los campos obligatorios sin columna', () => {
    const m = detectarColumnas(['nombre'], CAMPOS)
    expect(requeridosFaltantes(m, CAMPOS).map((c) => c.clave)).toEqual(['codigo'])
  })

  it('devuelve vacio cuando todo lo obligatorio esta cubierto', () => {
    const m = detectarColumnas(['codigo', 'nombre'], CAMPOS)
    expect(requeridosFaltantes(m, CAMPOS)).toEqual([])
  })
})
