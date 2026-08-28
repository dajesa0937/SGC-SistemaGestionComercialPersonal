import { describe, expect, it } from 'vitest'
import { aCsv, detectarSeparador, leerCsv } from './csv'

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

describe('aCsv', () => {
  it('usa punto y coma, que es lo que espera un Excel en español', () => {
    expect(aCsv([['a', 'b'], [1, 2]])).toBe('a;b\r\n1;2')
  })

  it('entrecomilla solo las celdas que lo necesitan', () => {
    expect(aCsv([['simple', 'con;separador']])).toBe('simple;"con;separador"')
  })

  it('duplica las comillas internas', () => {
    expect(aCsv([['Dijo "hola"']])).toBe('"Dijo ""hola"""')
  })

  it('entrecomilla los saltos de línea dentro de una celda', () => {
    expect(aCsv([['linea 1\nlinea 2']])).toBe('"linea 1\nlinea 2"')
  })

  it('los valores nulos quedan como celda vacía', () => {
    expect(aCsv([['a', null, undefined, 'd']])).toBe('a;;;d')
  })

  it('lo que genera se puede volver a leer', () => {
    const original = [
      ['Cliente', 'Zona', 'Venta'],
      ['Ferretería; El Tornillo', 'Ibagué', '20000000'],
      ['Dijo "sí"', 'Espinal', '0'],
    ]
    expect(leerCsv(aCsv(original))).toEqual(original)
  })

  it('admite otro separador', () => {
    expect(aCsv([['a', 'b']], ',')).toBe('a,b')
  })
})
