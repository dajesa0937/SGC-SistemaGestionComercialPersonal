import { describe, expect, it } from 'vitest'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import type { DocumentoCartera } from '@/domain/cobranza/cobranza.entity'
import { totalDe } from '@/domain/cobranza/cobranza.entity'
import type { Zona } from '@/domain/geografia/zona.entity'
import {
  agruparCartera,
  carteraPorCliente,
  compararCortes,
  resumirCartera,
} from './indicadoresCartera'

const CORTE = '2026-05-25'

const doc = (
  documento: string,
  identificacion: string,
  nombre: string,
  fechaVencimiento: string,
  valor: number,
  clienteId?: string,
): DocumentoCartera => ({
  id: documento,
  corteId: 'corte',
  identificacion,
  nombre,
  documento,
  fechaVencimiento,
  valor,
  clienteId,
})

const cliente = (id: string, nombre: string, municipio?: string): Cliente => ({
  id,
  codigo: id,
  nombre,
  municipio,
  estadoManual: 'cliente',
  archivado: false,
  creadoEn: '2026-01-01T00:00:00.000Z',
  actualizadoEn: '2026-01-01T00:00:00.000Z',
})

/** 68081 Barrancabermeja (Santander), 23001 Montería (Córdoba). */
const CLIENTES = [cliente('c1', 'FERNANDO QUINTERO', '68081'), cliente('c2', 'AGROPAI', '23001')]

const ZONAS: Zona[] = [
  {
    id: 'z1',
    nombre: 'Magdalena Medio',
    municipios: ['68081'],
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
  },
]

const DOCUMENTOS = [
  doc('FV-1', '13370999', 'FERNANDO QUINTERO', '2025-09-02', 10_000_000, 'c1'), // 265 dias
  doc('FV-2', '13370999', 'FERNANDO QUINTERO', '2026-04-11', 4_000_000, 'c1'), // 44 dias
  doc('RC-1', '13370999', 'FERNANDO QUINTERO', '2026-05-14', -1_000_000, 'c1'), // a favor
  doc('FV-3', '901934931', 'AGROPAI', '2026-06-24', 6_000_000, 'c2'), // por vencer
  doc('FV-4', '18856796', 'VALMIRO GAZABON', '2026-03-11', 2_000_000), // sin ficha, 75 dias
]

describe('carteraPorCliente', () => {
  it('agrupa por identificación y ordena por saldo', () => {
    const porCliente = carteraPorCliente(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    expect(porCliente.map((c) => c.nombre)).toEqual([
      'FERNANDO QUINTERO',
      'AGROPAI',
      'VALMIRO GAZABON',
    ])
    expect(porCliente[0]!.total).toBe(13_000_000)
    expect(porCliente[0]!.vencido).toBe(14_000_000)
    expect(porCliente[0]!.documentos).toBe(3)
  })

  it('la mora máxima es la del documento más viejo del cliente', () => {
    const [fernando] = carteraPorCliente(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    expect(fernando!.moraMaxima).toBe(265)
  })

  it('marca al cliente que no tiene ficha en vez de descartarlo', () => {
    const porCliente = carteraPorCliente(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    const valmiro = porCliente.find((c) => c.identificacion === '18856796')!
    expect(valmiro.sinFicha).toBe(true)
    expect(valmiro.nombre).toBe('VALMIRO GAZABON')
    expect(valmiro.total).toBe(2_000_000)
  })

  it('hereda municipio, departamento y zona de la ficha del cliente', () => {
    const [fernando] = carteraPorCliente(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    expect(fernando!.departamento).toBe('Santander')
    expect(fernando!.zona).toBe('Magdalena Medio')
  })

  it('el porcentaje vencido puede pasar del 100 % si hay saldo a favor', () => {
    // No es un error: debe 14 M vencidos y tiene 1 M a favor, asi que su saldo
    // neto es menor que lo que tiene vencido. Recortarlo a 100 % escondería
    // justo el caso que hay que mirar.
    const [fernando] = carteraPorCliente(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    expect(fernando!.porcentajeVencido).toBeCloseTo(14 / 13, 4)
  })
})

describe('resumirCartera', () => {
  it('el total del resumen es la suma de los saldos de los clientes', () => {
    const resumen = resumirCartera(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    const porCliente = carteraPorCliente(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    expect(resumen.total).toBe(porCliente.reduce((s, c) => s + c.total, 0))
    expect(resumen.total).toBe(totalDe(resumen.porTramo))
    expect(resumen.total).toBe(21_000_000)
  })

  it('el vencido y su porcentaje salen del mismo total que se muestra', () => {
    const resumen = resumirCartera(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    expect(resumen.vencido).toBe(16_000_000)
    expect(resumen.porcentajeVencido).toBeCloseTo(16 / 21, 6)
  })

  it('la mora promedio se pondera por saldo, no por documento', () => {
    const resumen = resumirCartera(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    // (265×10 + 44×4 + 75×2) / 16 = 187,875
    expect(resumen.moraPromedioPonderada).toBeCloseTo((265 * 10 + 44 * 4 + 75 * 2) / 16, 3)
  })

  it('señala el documento más antiguo', () => {
    const resumen = resumirCartera(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    expect(resumen.documentoMasAntiguo).toEqual({
      documento: 'FV-1',
      nombre: 'FERNANDO QUINTERO',
      dias: 265,
    })
  })

  it('un corte vacío no divide por cero', () => {
    const resumen = resumirCartera([], CORTE, CLIENTES)
    expect(resumen.total).toBe(0)
    expect(resumen.porcentajeVencido).toBe(0)
    expect(resumen.concentracionTop5).toBe(0)
    expect(resumen.moraPromedioPonderada).toBe(0)
    expect(resumen.documentoMasAntiguo).toBeUndefined()
  })
})

describe('agruparCartera', () => {
  it('suma por departamento y deja aparte a los que no tienen ubicación', () => {
    const porCliente = carteraPorCliente(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    const porDepartamento = agruparCartera(porCliente, 'departamento')
    expect(porDepartamento.map((d) => [d.nombre, d.total])).toEqual([
      ['Santander', 13_000_000],
      ['Córdoba', 6_000_000],
      ['Sin ubicación', 2_000_000],
    ])
  })

  it('la suma de los grupos es el total del corte', () => {
    const porCliente = carteraPorCliente(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    const resumen = resumirCartera(DOCUMENTOS, CORTE, CLIENTES, ZONAS)
    for (const dimension of ['departamento', 'zona', 'municipio'] as const) {
      const suma = agruparCartera(porCliente, dimension).reduce((s, g) => s + g.total, 0)
      expect(suma).toBe(resumen.total)
    }
  })
})

describe('compararCortes', () => {
  const anteriores = [
    doc('FV-1', '13370999', 'FERNANDO QUINTERO', '2025-09-02', 10_000_000, 'c1'),
    doc('FV-9', '900111222', 'CLIENTE QUE SALDÓ', '2026-01-10', 3_000_000),
  ]

  const previo = {
    resumen: resumirCartera(anteriores, '2026-04-25', CLIENTES),
    porCliente: carteraPorCliente(anteriores, '2026-04-25', CLIENTES),
  }
  const actualCorte = {
    resumen: resumirCartera(DOCUMENTOS, CORTE, CLIENTES, ZONAS),
    porCliente: carteraPorCliente(DOCUMENTOS, CORTE, CLIENTES, ZONAS),
  }

  it('clasifica cada cliente por cómo se movió su saldo', () => {
    const comparacion = compararCortes(previo, actualCorte)
    const estados = new Map(comparacion.movimientos.map((m) => [m.nombre, m.estado]))
    expect(estados.get('FERNANDO QUINTERO')).toBe('sube')
    expect(estados.get('CLIENTE QUE SALDÓ')).toBe('saldado')
    expect(estados.get('AGROPAI')).toBe('nuevo')
    expect(estados.get('VALMIRO GAZABON')).toBe('nuevo')
  })

  it('la variación total es la diferencia entre los dos resúmenes', () => {
    const comparacion = compararCortes(previo, actualCorte)
    expect(comparacion.variacionTotal).toBe(actualCorte.resumen.total - previo.resumen.total)
    // Y cuadra con la suma de los movimientos cliente a cliente.
    const suma = comparacion.movimientos.reduce((s, m) => s + m.diferencia, 0)
    expect(suma).toBe(comparacion.variacionTotal)
  })

  it('cuenta los días entre los dos cortes', () => {
    expect(compararCortes(previo, actualCorte).diasEntreCortes).toBe(30)
  })

  it('ordena por el movimiento más grande, suba o baje', () => {
    const comparacion = compararCortes(previo, actualCorte)
    const magnitudes = comparacion.movimientos.map((m) => Math.abs(m.diferencia))
    expect([...magnitudes].sort((a, b) => b - a)).toEqual(magnitudes)
  })
})
