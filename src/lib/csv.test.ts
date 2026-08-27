import { describe, expect, it } from 'vitest'
import { detectarSeparador, leerCsv } from './csv'

describe('detectarSeparador', () => {
  it('detecta el punto y coma de los Excel en espanol', () => {
    expect(detectarSeparador('codigo;nombre;valor\n1;A;100')).toBe(';')
  })

  it('detecta la coma', () => {
    expect(detectarSeparador('codigo,nombre,valor')).toBe(',')
  })

  it('detecta el tabulador', () => {
    expect(detectarSeparador('codigo\tnombre\tvalor')).toBe('\t')
  })

  it('no cuenta separadores que estan dentro de comillas', () => {
    expect(detectarSeparador('"Apellido, Nombre";zona;valor')).toBe(';')
  })
})

describe('leerCsv', () => {
  it('lee una rejilla simple', () => {
    expect(leerCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('respeta el separador dentro de comillas', () => {
    expect(leerCsv('"Ferreteria, El Tornillo",Ibague')).toEqual([
      ['Ferreteria, El Tornillo', 'Ibague'],
    ])
  })

  it('interpreta la comilla doble escapada', () => {
    expect(leerCsv('"Dijo ""hola""",x')).toEqual([['Dijo "hola"', 'x']])
  })

  it('admite saltos de linea dentro de una celda', () => {
    expect(leerCsv('"linea 1\nlinea 2",b')).toEqual([['linea 1\nlinea 2', 'b']])
  })

  it('maneja finales de linea de Windows', () => {
    expect(leerCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('descarta el BOM que anteponen los Excel de Windows', () => {
    const filas = leerCsv('\uFEFFcodigo,nombre')
    expect(filas[0]?.[0]).toBe('codigo')
  })

  it('conserva las celdas vacias para no desalinear las columnas', () => {
    expect(leerCsv('a,,c')).toEqual([['a', '', 'c']])
  })

  it('no devuelve una fila fantasma por el salto final', () => {
    expect(leerCsv('a,b\n1,2\n')).toHaveLength(2)
  })

  it('devuelve vacio con texto vacio', () => {
    expect(leerCsv('')).toEqual([])
  })
})
