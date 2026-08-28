import { describe, expect, it } from 'vitest'
import { separarEtiquetas, type EtiquetaPorColocar } from './separarEtiquetas'

const base = (clave: string, x: number, y: number, peso = 1): EtiquetaPorColocar => ({
  clave,
  x,
  y,
  ancho: 30,
  alto: 24,
  peso,
})

describe('separarEtiquetas', () => {
  it('no mueve lo que no choca', () => {
    const r = separarEtiquetas([base('a', 100, 100), base('b', 300, 300)])
    expect(r.map((e) => [e.clave, e.x, e.y])).toEqual([
      ['a', 100, 100],
      ['b', 300, 300],
    ])
  })

  it('la de más peso se queda en su sitio y la otra se aparta', () => {
    const [primera, segunda] = separarEtiquetas([
      base('chica', 100, 102, 1),
      base('grande', 100, 100, 9),
    ])
    expect(primera).toMatchObject({ clave: 'grande', x: 100, y: 100 })
    expect(segunda?.clave).toBe('chica')
    expect(Math.abs(segunda!.y - 100)).toBeGreaterThan(20)
  })

  it('separa lo suficiente para que dejen de pisarse', () => {
    const r = separarEtiquetas([base('a', 100, 100, 2), base('b', 105, 100, 1)])
    const [a, b] = r
    const seSolapan =
      Math.abs(a!.x - b!.x) * 2 < a!.ancho + b!.ancho && Math.abs(a!.y - b!.y) * 2 < a!.alto + b!.alto
    expect(seSolapan).toBe(false)
  })

  it('es determinista: los mismos datos dan el mismo mapa', () => {
    const entrada = [base('a', 100, 100, 3), base('b', 104, 101, 3), base('c', 98, 103, 3)]
    const uno = separarEtiquetas(entrada)
    const dos = separarEtiquetas([...entrada].reverse())
    expect(uno).toEqual(dos)
  })

  it('no aleja una etiqueta más allá del límite', () => {
    // Cinco encimadas: prefiere un solape pequeño a una cifra señalando otro sitio.
    const amontonadas = ['a', 'b', 'c', 'd', 'e'].map((c, i) => base(c, 100, 100, 5 - i))
    const r = separarEtiquetas(amontonadas, { maximo: 20 })
    for (const e of r) {
      expect(Math.hypot(e.x - 100, e.y - 100)).toBeLessThanOrEqual(20.01)
    }
  })

  it('con dos exactamente encima desempata siempre igual', () => {
    const r = separarEtiquetas([base('a', 50, 50, 2), base('b', 50, 50, 1)])
    expect(r[0]).toMatchObject({ x: 50, y: 50 })
    expect(r[1]!.y).toBeGreaterThan(50)
    expect(r[1]!.x).toBe(50)
  })

  it('sin etiquetas devuelve una lista vacía', () => {
    expect(separarEtiquetas([])).toEqual([])
  })
})
