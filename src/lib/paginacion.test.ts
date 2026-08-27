import { describe, expect, it } from 'vitest'
import { paginar } from './paginacion'

const LISTA = Array.from({ length: 23 }, (_, i) => i + 1)

describe('paginar', () => {
  it('corta la primera pagina', () => {
    const p = paginar(LISTA, 1, 10)
    expect(p.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(p.desde).toBe(1)
    expect(p.hasta).toBe(10)
    expect(p.totalPaginas).toBe(3)
  })

  it('la ultima pagina puede quedar incompleta', () => {
    const p = paginar(LISTA, 3, 10)
    expect(p.items).toEqual([21, 22, 23])
    expect(p.hasta).toBe(23)
  })

  it('corrige una pagina por encima del total', () => {
    expect(paginar(LISTA, 99, 10).pagina).toBe(3)
  })

  it('corrige una pagina por debajo de uno', () => {
    expect(paginar(LISTA, 0, 10).pagina).toBe(1)
    expect(paginar(LISTA, -5, 10).pagina).toBe(1)
  })

  it('con lista vacia devuelve una pagina vacia coherente', () => {
    const p = paginar([], 1, 10)
    expect(p.items).toEqual([])
    expect(p.totalPaginas).toBe(1)
    expect(p.desde).toBe(0)
    expect(p.hasta).toBe(0)
  })
})
