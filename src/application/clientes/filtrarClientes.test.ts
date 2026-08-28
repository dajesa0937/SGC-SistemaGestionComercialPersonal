import { describe, expect, it } from 'vitest'
import type { ClienteEnriquecido } from '@/domain/cliente/cliente.entity'
import {
  FILTROS_POR_DEFECTO,
  coincideConTexto,
  filtrarClientes,
  hayFiltrosActivos,
  zonasDisponibles,
} from './filtrarClientes'

function cliente(
  parcial: Partial<ClienteEnriquecido> & { codigo: string; nombre: string },
): ClienteEnriquecido {
  return {
    id: parcial.codigo,
    estadoManual: 'cliente',
    archivado: false,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    clasificacion: 'C',
    estado: 'activo',
    ventaPeriodo: 0,
    ventaAnio: 0,
    venta12Meses: 0,
    variacionMesAnterior: null,
    variacionAnioAnterior: null,
    serie12Meses: [],
    ...parcial,
  }
}

const CARTERA: ClienteEnriquecido[] = [
  cliente({
    codigo: 'C-010',
    nombre: 'Ferretería El Tornillo',
    zona: 'Ibagué',
    nit: '900123456',
    clasificacion: 'A',
    estado: 'activo',
    ventaPeriodo: 20_000_000,
    ventaAnio: 90_000_000,
    ultimaCompra: '2026-08',
  }),
  cliente({
    codigo: 'C-002',
    nombre: 'Agroinsumos del Sur',
    zona: 'Espinal',
    clasificacion: 'A',
    estado: 'nuevo',
    ventaPeriodo: 19_200_000,
    ventaAnio: 40_000_000,
    ultimaCompra: '2026-08',
  }),
  cliente({
    codigo: 'C-100',
    nombre: 'Maquinaria Tolima',
    zona: 'Ibagué',
    clasificacion: 'B',
    estado: 'en_riesgo',
    ventaPeriodo: 2_000_000,
    ventaAnio: 30_000_000,
    ultimaCompra: '2026-08',
  }),
  cliente({
    codigo: 'C-050',
    nombre: 'Distribuciones Ariza',
    clasificacion: 'C',
    estado: 'inactivo',
    ventaAnio: 5_000_000,
    ultimaCompra: '2026-03',
  }),
  cliente({
    codigo: 'C-999',
    nombre: 'Cliente Retirado',
    zona: 'Espinal',
    archivado: true,
    estado: 'inactivo',
  }),
]

describe('coincideConTexto', () => {
  const objetivo = CARTERA[0]!

  it('encuentra sin tildes lo que está escrito con tildes', () => {
    expect(coincideConTexto(objetivo, 'ferreteria')).toBe(true)
  })

  it('busca también por código y por NIT', () => {
    expect(coincideConTexto(objetivo, 'C-010')).toBe(true)
    expect(coincideConTexto(objetivo, '900123')).toBe(true)
  })

  it('el texto vacío no descarta a nadie', () => {
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

  it('filtra por zona', () => {
    const r = filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, zona: 'Ibagué' })
    expect(r.map((c) => c.codigo)).toEqual(['C-010', 'C-100'])
  })

  it('filtra por estado derivado', () => {
    const r = filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, estado: 'en_riesgo' })
    expect(r.map((c) => c.codigo)).toEqual(['C-100'])
  })

  it('filtra por clasificación ABC', () => {
    const r = filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, clasificacion: 'A' })
    expect(r).toHaveLength(2)
  })

  it('combina varios filtros', () => {
    const r = filtrarClientes(CARTERA, {
      ...FILTROS_POR_DEFECTO,
      zona: 'Ibagué',
      clasificacion: 'A',
    })
    expect(r.map((c) => c.codigo)).toEqual(['C-010'])
  })

  it('ordena por nombre respetando el alfabeto español', () => {
    const r = filtrarClientes(CARTERA, FILTROS_POR_DEFECTO)
    expect(r.map((c) => c.nombre)).toEqual([
      'Agroinsumos del Sur',
      'Distribuciones Ariza',
      'Ferretería El Tornillo',
      'Maquinaria Tolima',
    ])
  })

  it('ordena por venta del mes de mayor a menor', () => {
    const r = filtrarClientes(CARTERA, {
      ...FILTROS_POR_DEFECTO,
      orden: 'ventaPeriodo',
      direccion: 'desc',
    })
    expect(r.map((c) => c.codigo)).toEqual(['C-010', 'C-002', 'C-100', 'C-050'])
  })

  it('ordena por venta del año', () => {
    const r = filtrarClientes(CARTERA, {
      ...FILTROS_POR_DEFECTO,
      orden: 'ventaAnio',
      direccion: 'desc',
    })
    expect(r[0]?.codigo).toBe('C-010')
  })

  it('ordena por código de forma natural, no lexicográfica', () => {
    const r = filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, orden: 'codigo' })
    expect(r.map((c) => c.codigo)).toEqual(['C-002', 'C-010', 'C-050', 'C-100'])
  })

  it('al ordenar por zona deja al final a quien no tiene zona', () => {
    const r = filtrarClientes(CARTERA, { ...FILTROS_POR_DEFECTO, orden: 'zona' })
    expect(r[r.length - 1]?.codigo).toBe('C-050')
  })

  it('quien nunca compró queda al final aunque se invierta el orden', () => {
    const sinCompra = cliente({ codigo: 'C-777', nombre: 'Prospecto', estado: 'inactivo' })
    const asc = filtrarClientes([...CARTERA, sinCompra], {
      ...FILTROS_POR_DEFECTO,
      orden: 'ultimaCompra',
    })
    const desc = filtrarClientes([...CARTERA, sinCompra], {
      ...FILTROS_POR_DEFECTO,
      orden: 'ultimaCompra',
      direccion: 'desc',
    })
    expect(asc[asc.length - 1]?.codigo).toBe('C-777')
    expect(desc[desc.length - 1]?.codigo).toBe('C-777')
  })

  it('el desempate por nombre no se invierte al invertir el orden', () => {
    const empatados = [
      cliente({ codigo: 'X1', nombre: 'Beta', ventaPeriodo: 100 }),
      cliente({ codigo: 'X2', nombre: 'Alfa', ventaPeriodo: 100 }),
    ]
    const desc = filtrarClientes(empatados, {
      ...FILTROS_POR_DEFECTO,
      orden: 'ventaPeriodo',
      direccion: 'desc',
    })
    expect(desc.map((c) => c.nombre)).toEqual(['Alfa', 'Beta'])
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

  it('ignora las zonas vacías', () => {
    expect(zonasDisponibles([{ zona: '   ' }])).toEqual([])
  })
})

describe('hayFiltrosActivos', () => {
  it('es falso con los filtros por defecto', () => {
    expect(hayFiltrosActivos(FILTROS_POR_DEFECTO)).toBe(false)
  })

  it('no cuenta el orden como filtro', () => {
    expect(hayFiltrosActivos({ ...FILTROS_POR_DEFECTO, orden: 'codigo' })).toBe(false)
  })

  it('una búsqueda de solo espacios está inactiva', () => {
    expect(hayFiltrosActivos({ ...FILTROS_POR_DEFECTO, texto: '   ' })).toBe(false)
  })

  it('detecta la clasificación como filtro', () => {
    expect(hayFiltrosActivos({ ...FILTROS_POR_DEFECTO, clasificacion: 'A' })).toBe(true)
  })
})
