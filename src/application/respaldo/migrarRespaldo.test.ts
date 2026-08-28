import { describe, expect, it } from 'vitest'
import { VERSION_RESPALDO, type Respaldo } from '@/domain/respaldo/respaldo.entity'
import { migrarRespaldo } from './migrarRespaldo'
import { validarRespaldo } from './validarRespaldo'

/** Respaldo tal como lo generaba la versión 1, con `nit`, `zona` y `ciudad`. */
const RESPALDO_V1 = {
  aplicacion: 'sgc-personal',
  version: 1,
  generadoEn: '2026-08-28T02:00:00.000Z',
  datos: {
    clientes: [
      {
        id: 'c1',
        codigo: 'C-001',
        nombre: 'Ferretería El Tornillo',
        nit: '900123456-7',
        zona: 'Magdalena Medio',
        ciudad: 'Barrancabermeja',
        estadoManual: 'cliente',
        archivado: false,
        creadoEn: '2026-01-01T00:00:00.000Z',
        actualizadoEn: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'c2',
        codigo: 'C-002',
        nombre: 'Agro San Pablo',
        zona: 'Magdalena Medio',
        // Nombre ambiguo: existe en Bolívar, Nariño y Antioquia.
        ciudad: 'San Pablo',
        estadoManual: 'cliente',
        archivado: false,
        creadoEn: '2026-01-01T00:00:00.000Z',
        actualizadoEn: '2026-01-01T00:00:00.000Z',
      },
    ],
    aliases: [],
    notas: [],
    ventas: [],
    presupuestos: [],
    importaciones: [],
    configuracion: [],
  },
}

describe('migrarRespaldo', () => {
  it('traduce nit, ciudad y zona a la forma nueva', () => {
    const migrado = migrarRespaldo(RESPALDO_V1 as unknown as Respaldo)
    const [uno] = migrado.datos.clientes

    expect(migrado.version).toBe(VERSION_RESPALDO)
    expect(uno?.identificacion).toBe('900123456')
    expect(uno?.municipio).toBe('68081')
    expect(uno).not.toHaveProperty('nit')
    expect(uno).not.toHaveProperty('ciudad')
    expect(uno).not.toHaveProperty('zona')
  })

  it('convierte las zonas de texto libre en zonas de verdad', () => {
    const migrado = migrarRespaldo(RESPALDO_V1 as unknown as Respaldo)
    expect(migrado.datos.zonas).toHaveLength(1)
    expect(migrado.datos.zonas[0]).toMatchObject({
      nombre: 'Magdalena Medio',
      municipios: ['68081'],
    })
  })

  it('no inventa un municipio cuando el nombre es ambiguo', () => {
    const migrado = migrarRespaldo(RESPALDO_V1 as unknown as Respaldo)
    expect(migrado.datos.clientes[1]?.municipio).toBeUndefined()
  })

  it('no toca un respaldo que ya está en la versión actual', () => {
    const actual = { ...RESPALDO_V1, version: VERSION_RESPALDO } as unknown as Respaldo
    expect(migrarRespaldo(actual)).toBe(actual)
  })
})

describe('un respaldo v2, sin movimientos, se acepta y se completa', () => {
  const V2 = {
    ...RESPALDO_V1,
    version: 2,
    datos: {
      ...RESPALDO_V1.datos,
      clientes: [
        {
          id: 'c9',
          codigo: 'C-009',
          nombre: 'Cliente ya migrado',
          identificacion: '901265633',
          municipio: '13670',
          estadoManual: 'cliente',
          archivado: false,
          creadoEn: '2026-01-01T00:00:00.000Z',
          actualizadoEn: '2026-01-01T00:00:00.000Z',
        },
      ],
      zonas: [
        {
          id: 'z1',
          nombre: 'Sabanas',
          municipios: ['70713'],
          creadoEn: '2026-01-01T00:00:00.000Z',
          actualizadoEn: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
  }

  it('no pierde lo ya migrado ni inventa movimientos', () => {
    const r = validarRespaldo(JSON.stringify(V2))
    expect(r.valido).toBe(true)
    if (!r.valido) return
    expect(r.respaldo.version).toBe(VERSION_RESPALDO)
    expect(r.respaldo.datos.clientes[0]?.identificacion).toBe('901265633')
    expect(r.respaldo.datos.clientes[0]?.municipio).toBe('13670')
    expect(r.respaldo.datos.zonas.map((z) => z.nombre)).toEqual(['Sabanas'])
    expect(r.respaldo.datos.movimientos).toEqual([])
  })
})

describe('validarRespaldo con un archivo de la versión anterior', () => {
  it('lo acepta y lo entrega ya migrado', () => {
    // Es la garantía de que el respaldo descargado ayer sigue sirviendo hoy.
    const r = validarRespaldo(JSON.stringify(RESPALDO_V1))
    expect(r.valido).toBe(true)
    if (!r.valido) return
    expect(r.respaldo.version).toBe(VERSION_RESPALDO)
    expect(r.respaldo.datos.clientes[0]?.identificacion).toBe('900123456')
    expect(r.respaldo.datos.zonas[0]?.nombre).toBe('Magdalena Medio')
  })
})
