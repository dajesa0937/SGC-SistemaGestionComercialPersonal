import { describe, expect, it } from 'vitest'
import type { ClienteEnriquecido } from '@/domain/cliente/cliente.entity'
import {
  calcularCoberturaTerritorial,
  nivelDeMapa,
  tramosDeLeyenda,
} from './coberturaTerritorial'
import { DEPARTAMENTOS_MAPA } from '@/domain/geografia/mapa.generado'
import { DEPARTAMENTOS } from '@/domain/geografia/municipios.generado'

function cliente(parcial: Partial<ClienteEnriquecido> & { nombre: string }): ClienteEnriquecido {
  return {
    id: parcial.nombre,
    codigo: parcial.nombre,
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

// Municipios reales del territorio del usuario.
const CARTERA = [
  cliente({ nombre: 'Uno', municipio: '68001', ventaPeriodo: 1_000_000, ventaAnio: 5_000_000, zonaId: 'z1', zona: 'Magdalena Medio' }),
  cliente({ nombre: 'Dos', municipio: '68001', ventaAnio: 2_000_000, zonaId: 'z1', zona: 'Magdalena Medio' }),
  cliente({ nombre: 'Tres', municipio: '68081', ventaPeriodo: 500_000, ventaAnio: 900_000, zonaId: 'z1', zona: 'Magdalena Medio' }),
  cliente({ nombre: 'Cuatro', municipio: '70713', ventaAnio: 7_000_000, zonaId: 'z2', zona: 'Sabanas' }),
  cliente({ nombre: 'Cinco', municipio: '23001', ventaAnio: 100_000 }),
  cliente({ nombre: 'SinMunicipio', ventaAnio: 400_000 }),
  cliente({ nombre: 'Archivado', municipio: '68001', archivado: true, ventaAnio: 99_000_000 }),
]

describe('calcularCoberturaTerritorial', () => {
  const cobertura = calcularCoberturaTerritorial(CARTERA)

  it('agrupa por departamento con sus cifras', () => {
    const santander = cobertura.departamentos.find((d) => d.clave === '68')
    expect(santander).toMatchObject({
      nombre: 'Santander',
      clientes: 3,
      conCompra: 2,
      ventaPeriodo: 1_500_000,
      ventaAnio: 7_900_000,
    })
  })

  it('agrupa por municipio nombrando municipio y departamento', () => {
    const bucaramanga = cobertura.municipios.find((m) => m.clave === '68001')
    expect(bucaramanga).toMatchObject({ nombre: 'Bucaramanga, Santander', clientes: 2, conCompra: 1 })
  })

  it('agrupa por las zonas del usuario, no por las del DANE', () => {
    // Magdalena Medio va primero por venta del año ($ 7,9 M contra $ 7,0 M),
    // no por tener más clientes ni por orden alfabético.
    expect(cobertura.zonas.map((z) => [z.nombre, z.clientes, z.ventaAnio])).toEqual([
      ['Magdalena Medio', 3, 7_900_000],
      ['Sabanas', 1, 7_000_000],
    ])
  })

  it('deja fuera a los archivados: el mapa es dónde se está trabajando', () => {
    const santander = cobertura.departamentos.find((d) => d.clave === '68')
    expect(santander?.clientes).toBe(3)
    expect(santander?.ventaAnio).toBe(7_900_000)
  })

  it('cuenta aparte a quien no tiene municipio en vez de perderlo', () => {
    expect(cobertura.sinUbicacion).toBe(1)
    const enMapa = cobertura.departamentos.reduce((t, d) => t + d.clientes, 0)
    expect(enMapa + cobertura.sinUbicacion).toBe(cobertura.totalClientes)
  })

  it('ordena por peso comercial, no alfabéticamente', () => {
    // Sucre vende más que Santander aunque tenga un solo cliente.
    expect(cobertura.departamentos.map((d) => d.nombre)).toEqual([
      'Santander',
      'Sucre',
      'Córdoba',
    ])
  })

  it('expone el máximo para escalar el mapa', () => {
    expect(cobertura.maximoPorDepartamento).toBe(3)
  })

  it('con la cartera vacía no divide por cero', () => {
    const vacia = calcularCoberturaTerritorial([])
    expect(vacia).toMatchObject({ totalClientes: 0, maximoPorDepartamento: 0, sinUbicacion: 0 })
    expect(vacia.departamentos).toEqual([])
  })
})

describe('nivelDeMapa', () => {
  it('sin clientes es nivel 0, que se pinta neutro y no como «poquito»', () => {
    expect(nivelDeMapa(0, 10)).toBe(0)
  })

  it('reparte en cuatro tramos proporcionales al máximo', () => {
    expect(nivelDeMapa(1, 100)).toBe(1)
    expect(nivelDeMapa(25, 100)).toBe(1)
    expect(nivelDeMapa(26, 100)).toBe(2)
    expect(nivelDeMapa(50, 100)).toBe(2)
    expect(nivelDeMapa(75, 100)).toBe(3)
    expect(nivelDeMapa(76, 100)).toBe(4)
    expect(nivelDeMapa(100, 100)).toBe(4)
  })

  it('con un solo departamento no se rompe', () => {
    expect(nivelDeMapa(1, 1)).toBe(4)
  })

  it('un máximo inválido no produce color', () => {
    expect(nivelDeMapa(5, 0)).toBe(0)
  })
})

describe('tramosDeLeyenda', () => {
  it('describe los tramos con números reales', () => {
    expect(tramosDeLeyenda(100)).toEqual(['1–25', '26–50', '51–75', '76–100'])
  })

  it('no inventa tramos que no existen cuando hay pocos clientes', () => {
    // Con un máximo de 2, cuatro tramos serían tres de ellos vacíos.
    expect(tramosDeLeyenda(2)).toEqual(['1', '2'])
  })

  it('sin datos no hay leyenda', () => {
    expect(tramosDeLeyenda(0)).toEqual([])
  })
})

describe('el mapa cubre el país entero', () => {
  it('trae los 33 departamentos', () => {
    expect(DEPARTAMENTOS_MAPA).toHaveLength(33)
  })

  it('cada trazado corresponde a un departamento del catálogo DANE', () => {
    const huerfanos = DEPARTAMENTOS_MAPA.filter((d) => DEPARTAMENTOS[d.codigo] === undefined)
    expect(huerfanos).toEqual([])
  })

  it('no falta ningún departamento por dibujar', () => {
    const dibujados = new Set(DEPARTAMENTOS_MAPA.map((d) => d.codigo))
    expect(Object.keys(DEPARTAMENTOS).filter((c) => !dibujados.has(c))).toEqual([])
  })

  it('las etiquetas caen dentro del lienzo', () => {
    const [, , ancho, alto] = '0 0 613 694'.split(' ').map(Number)
    const fuera = DEPARTAMENTOS_MAPA.filter(
      (d) => d.cx < 0 || d.cy < 0 || d.cx > ancho! || d.cy > alto!,
    )
    expect(fuera).toEqual([])
  })
})
