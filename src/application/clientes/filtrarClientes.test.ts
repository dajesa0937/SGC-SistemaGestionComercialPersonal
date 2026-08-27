import { describe, expect, it } from 'vitest'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import {
  FILTROS_POR_DEFECTO,
  coincideConTexto,
  filtrarClientes,
  hayFiltrosActivos,
  zonasDisponibles,
} from './filtrarClientes'

function cliente(parcial: Partial<Cliente> & { codigo: string; nombre: string }): Cliente {
  return {
    id: parcial.codigo,
    estadoManual: 'cliente',
    archivado: false,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...parcial,
  }
}

const CARTERA: Cliente[] = [
  cliente({ codigo: 'C-010', nombre: 'Ferretería El Tornillo', zona: 'Ibagué', nit: '900123456' }),
  cliente({ codigo: 'C-002', nombre: 'Agroinsumos del Sur', zona: 'Espinal' }),
  cliente({ codigo: 'C-100', nombre: 'Maquinaria Tolima', zona: 'Ibagué' }),
  cliente({ codigo: 'C-050', nombre: 'Distribuciones Ariza', estadoManual: 'prospecto' }),
  cliente({ codigo: 'C-999', nombre: 'Cliente Retirado', zona: 'Espinal', archivado: true }),
]

describe('coincideConTexto', () => {
  const objetivo = CARTERA[0]!

  it('encuentra sin tildes lo que esta escrito con tildes', () => {
    expect(coincideConTexto(objetivo, 'ferreteria')).toBe(true)
  })

  it('ignora mayusculas', () => {
    expect(coincideConTexto(objetivo, 'TORNILLO')).toBe(true)
  })

  it('busca tambien por codigo y por NIT', () => {
    expect(coincideConTexto(objetivo, 'C-010')).toBe(true)
    expect(coincideConTexto(objetivo, '900123')).toBe(true)
  })

  it('el texto vacio no descarta a nadie', () => {
    expect(coincideConTexto(objetivo, '   ')).toBe(true)
  })

  it('no devuelve falsos positivos', () => {
    expect(coincideConTexto(objetivo, 'maquinaria')).toBe(false)
  })
})

describe('filtrarClientes', () => {
  it('oculta los archivados por defecto', () => {
    const r = filtrarClientes(CARTERA, FILTROS_POR_DEFECTO)
    expect(r.map((c) => c.codigo)).not.toContain('C-999')
    expect(r).toHaveLength(4)
  })

  it('incluye los archivados cuando se pide', () => {
    const r = filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, incluirArchivados: true })
    expect(r).toHaveLength(5)
  })

  it('filtra por zona', () => {
    const r = filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, zona: 'Ibagué' })
    expect(r.map((c) => c.codigo)).toEqual(['C-010', 'C-100'])
  })

  it('filtra por estado', () => {
    const r = filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, estado: 'prospecto' })
    expect(r.map((c) => c.codigo)).toEqual(['C-050'])
  })

  it('combina busqueda y zona', () => {
    const r = filtrarClientes(CARTERA, {
      ...FILTROS_POR_DEFECTO,
      zona: 'Ibagué',
      texto: 'maquinaria',
    })
    expect(r.map((c) => c.codigo)).toEqual(['C-100'])
  })

  it('ordena por nombre respetando el alfabeto espanol', () => {
    const r = filtrarClientes(CARTERA, FILTROS_POR_DEFECTO)
    expect(r.map((c) => c.nombre)).toEqual([
      'Agroinsumos del Sur',
      'Distribuciones Ariza',
      'Ferretería El Tornillo',
      'Maquinaria Tolima',
    ])
  })

  it('invierte el orden', () => {
    const r = filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, direccion: 'desc' })
    expect(r[0]?.nombre).toBe('Maquinaria Tolima')
  })

  it('ordena por codigo de forma natural, no lexicografica', () => {
    const r = filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, orden: 'codigo' })
    // Lexicograficamente C-100 iria antes que C-050; numericamente no.
    expect(r.map((c) => c.codigo)).toEqual(['C-002', 'C-010', 'C-050', 'C-100'])
  })

  it('al ordenar por zona deja al final a quien no tiene zona', () => {
    const r = filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, orden: 'zona' })
    expect(r[r.length - 1]?.codigo).toBe('C-050')
  })

  it('no modifica la lista original', () => {
    const copia = [...CARTERA]
    filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, direccion: 'desc' })
    expect(CARTERA).toEqual(copia)
  })
})

describe('zonasDisponibles', () => {
  it('devuelve las zonas sin repetir y ordenadas', () => {
    expect(zonasDisponibles(CARTERA)).toEqual(['Espinal', 'Ibagué'])
  })

  it('ignora las zonas vacias', () => {
    expect(zonasDisponibles([cliente({ codigo: 'X', nombre: 'X', zona: '   ' })])).toEqual([])
  })
})

describe('hayFiltrosActivos', () => {
  it('es falso con los filtros por defecto', () => {
    expect(hayFiltrosActivos(FILTROS_POR_DEFECTO)).toBe(false)
  })

  it('no cuenta el orden como filtro', () => {
    expect(hayFiltrosActivos({ ...FILTROS_POR_DEFECTO, orden: 'codigo' })).toBe(false)
  })

  it('detecta una busqueda con solo espacios como inactiva', () => {
    expect(hayFiltrosActivos({ ...FILTROS_POR_DEFECTO, texto: '   ' })).toBe(false)
  })

  it('detecta un filtro real', () => {
    expect(hayFiltrosActivos({ ...FILTROS_POR_DEFECTO, zona: 'Ibagué' })).toBe(true)
  })
})
