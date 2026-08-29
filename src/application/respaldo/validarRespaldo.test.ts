import { describe, expect, it } from 'vitest'
import { construirRespaldo, serializarRespaldo } from './construirRespaldo'
import { validarRespaldo } from './validarRespaldo'

const CONTENIDO = {
  clientes: [
    {
      id: 'c1',
      codigo: 'C-001',
      nombre: 'Ferretería El Tornillo',
      identificacion: '900123456',
      municipio: '68081',
      estadoManual: 'cliente' as const,
      archivado: false,
      creadoEn: '2026-01-01T00:00:00.000Z',
      actualizadoEn: '2026-01-01T00:00:00.000Z',
    },
  ],
  aliases: [{ id: 'a1', clienteId: 'c1', textoOriginal: 'FERRETERIA EL TORNILLO' }],
  notas: [
    {
      id: 'n1',
      clienteId: 'c1',
      fecha: '2026-08-01',
      texto: 'Pidió cotización',
      tipo: 'general' as const,
      creadoEn: '2026-08-01T00:00:00.000Z',
    },
  ],
  ventas: [
    {
      id: 'v1',
      clienteId: 'c1',
      periodo: '2026-08',
      valor: 20_000_000,
      origen: 'manual' as const,
      actualizadoEn: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'v2',
      clienteId: 'c1',
      periodo: '2026-07',
      valor: 18_000_000,
      origen: 'manual' as const,
      actualizadoEn: '2026-07-01T00:00:00.000Z',
    },
  ],
  presupuestos: [
    { id: 'p1', periodo: '2026-08', meta: 50_000_000, actualizadoEn: '2026-08-01T00:00:00.000Z' },
  ],
  movimientos: [],
  importaciones: [],
  zonas: [],
  cortes: [],
  documentosCartera: [],
  configuracion: [{ clave: 'negocio', valor: { mesesParaInactivo: 3 } }],
}

const ARCHIVO = serializarRespaldo(construirRespaldo(CONTENIDO))

describe('ida y vuelta', () => {
  it('lo que se exporta se puede restaurar', () => {
    const r = validarRespaldo(ARCHIVO)
    expect(r.valido).toBe(true)
    if (!r.valido) return
    expect(r.respaldo.datos.clientes).toEqual(CONTENIDO.clientes)
    expect(r.respaldo.datos.ventas).toEqual(CONTENIDO.ventas)
    expect(r.respaldo.datos.presupuestos).toEqual(CONTENIDO.presupuestos)
  })

  it('el resumen cuenta lo que hay dentro', () => {
    const r = validarRespaldo(ARCHIVO)
    if (!r.valido) throw new Error('debería ser válido')
    expect(r.resumen.clientes).toBe(1)
    expect(r.resumen.ventas).toBe(2)
    expect(r.resumen.periodos).toBe(2)
    expect(r.resumen.notas).toBe(1)
  })

  it('el archivo lleva sangría, para poder abrirlo y leerlo', () => {
    expect(ARCHIVO.split('\n').length).toBeGreaterThan(10)
  })
})

describe('rechazo de archivos que no sirven', () => {
  it('rechaza un texto que no es JSON', () => {
    const r = validarRespaldo('esto no es json {{{')
    expect(r.valido).toBe(false)
    if (r.valido) return
    expect(r.motivo).toContain('JSON')
  })

  it('rechaza el JSON de otra aplicación y lo dice claro', () => {
    const r = validarRespaldo(JSON.stringify({ aplicacion: 'otra-cosa', version: 1, datos: {} }))
    expect(r.valido).toBe(false)
    if (r.valido) return
    expect(r.motivo).toContain('no es un respaldo de SGC Personal')
  })

  it('rechaza un respaldo de una versión más nueva', () => {
    const futuro = JSON.parse(ARCHIVO)
    futuro.version = 99
    const r = validarRespaldo(JSON.stringify(futuro))
    expect(r.valido).toBe(false)
    if (r.valido) return
    expect(r.motivo).toContain('más nueva')
  })

  it('rechaza una venta con periodo inválido y señala dónde', () => {
    const roto = JSON.parse(ARCHIVO)
    roto.datos.ventas[0].periodo = 'agosto'
    const r = validarRespaldo(JSON.stringify(roto))
    expect(r.valido).toBe(false)
    if (r.valido) return
    expect(r.detalles.some((d) => d.includes('ventas.0.periodo'))).toBe(true)
  })

  it('rechaza una venta con valor no numérico', () => {
    const roto = JSON.parse(ARCHIVO)
    roto.datos.ventas[1].valor = 'mucho'
    expect(validarRespaldo(JSON.stringify(roto)).valido).toBe(false)
  })

  it('rechaza un cliente sin identificador', () => {
    const roto = JSON.parse(ARCHIVO)
    roto.datos.clientes[0].id = ''
    expect(validarRespaldo(JSON.stringify(roto)).valido).toBe(false)
  })

  it('rechaza que falte una tabla entera', () => {
    const roto = JSON.parse(ARCHIVO)
    delete roto.datos.clientes
    expect(validarRespaldo(JSON.stringify(roto)).valido).toBe(false)
  })

  it('rechaza un archivo vacío', () => {
    expect(validarRespaldo('').valido).toBe(false)
    expect(validarRespaldo('{}').valido).toBe(false)
  })

  it('no revienta con un JSON de tipo inesperado', () => {
    expect(validarRespaldo('null').valido).toBe(false)
    expect(validarRespaldo('[]').valido).toBe(false)
    expect(validarRespaldo('42').valido).toBe(false)
  })

  it('limita cuántos detalles muestra: una lista de cien errores no ayuda', () => {
    const roto = JSON.parse(ARCHIVO)
    roto.datos.ventas = Array.from({ length: 50 }, () => ({ id: '', periodo: 'x' }))
    const r = validarRespaldo(JSON.stringify(roto))
    if (r.valido) throw new Error('debería fallar')
    expect(r.detalles.length).toBeLessThanOrEqual(6)
  })
})

describe('tolerancia razonable', () => {
  it('un respaldo antiguo sin importaciones ni configuración se acepta', () => {
    const antiguo = JSON.parse(ARCHIVO)
    delete antiguo.datos.importaciones
    delete antiguo.datos.configuracion
    const r = validarRespaldo(JSON.stringify(antiguo))
    expect(r.valido).toBe(true)
    if (!r.valido) return
    expect(r.respaldo.datos.importaciones).toEqual([])
  })

  it('acepta que un cliente no tenga los campos opcionales', () => {
    const minimo = JSON.parse(ARCHIVO)
    minimo.datos.clientes[0] = {
      id: 'c9',
      codigo: 'C-009',
      nombre: 'Mínimo',
      estadoManual: 'prospecto',
      archivado: false,
      creadoEn: '2026-01-01T00:00:00.000Z',
      actualizadoEn: '2026-01-01T00:00:00.000Z',
    }
    expect(validarRespaldo(JSON.stringify(minimo)).valido).toBe(true)
  })
})

describe('respaldos de versiones anteriores', () => {
  it('un respaldo v3, anterior al módulo de cartera, se restaura sin cartera', () => {
    // Se construye quitando los dos campos nuevos, que es exactamente como sale
    // un archivo guardado antes del Sprint 11.
    const crudo = JSON.parse(ARCHIVO) as {
      version: number
      datos: Record<string, unknown>
    }
    crudo.version = 3
    delete crudo.datos['cortes']
    delete crudo.datos['documentosCartera']

    const r = validarRespaldo(JSON.stringify(crudo))
    expect(r.valido).toBe(true)
    if (!r.valido) return
    expect(r.respaldo.datos.cortes).toEqual([])
    expect(r.respaldo.datos.documentosCartera).toEqual([])
    // Y no pierde nada de lo que sí traía.
    expect(r.respaldo.datos.clientes).toEqual(CONTENIDO.clientes)
    expect(r.respaldo.datos.ventas).toEqual(CONTENIDO.ventas)
  })
})

describe('los tres orígenes de venta se restauran', () => {
  it('una venta derivada de movimientos NO invalida el respaldo', () => {
    // Regresión del defecto que dejó irrestaurables los respaldos hechos
    // después de importar un archivo de ventas detallado: el esquema aceptaba
    // solo «importacion» y «manual», y el importador escribe «movimientos».
    const conMovimientos = {
      ...CONTENIDO,
      ventas: [
        ...CONTENIDO.ventas,
        {
          id: 'v3',
          clienteId: 'c1',
          periodo: '2026-08',
          valor: 4_500_000,
          origen: 'movimientos' as const,
          actualizadoEn: '2026-08-10T00:00:00.000Z',
        },
      ],
      movimientos: [
        {
          id: 'm1',
          clienteId: 'c1',
          fecha: '2026-08-10',
          periodo: '2026-08',
          categoria: 'Motosierras',
          producto: 'Motosierra 18 pulgadas',
          cantidad: 3,
          valorUnitario: 1_500_000,
          valor: 4_500_000,
          actualizadoEn: '2026-08-10T00:00:00.000Z',
        },
      ],
    }

    const r = validarRespaldo(serializarRespaldo(construirRespaldo(conMovimientos)))
    expect(r.valido).toBe(true)
    if (!r.valido) return
    expect(r.respaldo.datos.ventas).toHaveLength(3)
    expect(r.respaldo.datos.movimientos).toHaveLength(1)
  })
})
