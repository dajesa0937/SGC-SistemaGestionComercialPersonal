import { describe, expect, it } from 'vitest'
import type { Zona } from './zona.entity'
import { indexarZonasPorMunicipio, municipiosEnConflicto } from './zona.entity'

function zona(nombre: string, municipios: string[]): Zona {
  return {
    id: `id-${nombre}`,
    nombre,
    municipios,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
  }
}

const MAGDALENA = zona('Magdalena Medio', ['68081', '68575', '05579'])
const SABANAS = zona('Sabanas de Sucre', ['70713', '70708'])

describe('indexarZonasPorMunicipio', () => {
  it('resuelve la zona de cada municipio', () => {
    const indice = indexarZonasPorMunicipio([MAGDALENA, SABANAS])
    expect(indice.get('68081')?.nombre).toBe('Magdalena Medio')
    expect(indice.get('70708')?.nombre).toBe('Sabanas de Sucre')
  })

  it('un municipio que ninguna zona reclama no tiene zona', () => {
    const indice = indexarZonasPorMunicipio([MAGDALENA])
    expect(indice.get('11001')).toBeUndefined()
  })

  it('ante un conflicto elige siempre la misma zona, venga como venga la lista', () => {
    // Sin esto, el mismo cliente cambiaría de zona entre dos cargas de pantalla.
    const otra = zona('Antioquia Norte', ['05579'])
    const a = indexarZonasPorMunicipio([MAGDALENA, otra])
    const b = indexarZonasPorMunicipio([otra, MAGDALENA])
    expect(a.get('05579')?.nombre).toBe('Antioquia Norte')
    expect(b.get('05579')?.nombre).toBe('Antioquia Norte')
  })
})

describe('municipiosEnConflicto', () => {
  it('no hay conflicto cuando las zonas no se solapan', () => {
    expect(municipiosEnConflicto([MAGDALENA, SABANAS])).toEqual([])
  })

  it('señala el municipio que dos zonas reclaman', () => {
    expect(municipiosEnConflicto([MAGDALENA, zona('Otra', ['68081'])])).toEqual(['68081'])
  })

  it('un municipio repetido dentro de la misma zona no es conflicto', () => {
    expect(municipiosEnConflicto([zona('Rara', ['68081', '68081'])])).toEqual([])
  })
})
