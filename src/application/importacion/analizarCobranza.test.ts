import { describe, expect, it } from 'vitest'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import { totalDe, vencidoDe } from '@/domain/cobranza/cobranza.entity'
import { analizarCobranza, faltantesCartera } from './analizarCobranza'
import { claveDePendiente, esPendiente } from './analizarVentas'
import { detectarCabeceraCorte, interpretarFechaDeProceso } from './detectarCorte'
import type { MapeoDetectado } from './detectarColumnas'

/** Columnas del reporte real: A..M, encabezado en la fila 7. */
const MAPEO: MapeoDetectado = {
  identificacion: 0,
  nombre: 1,
  documento: 2,
  fechaVencimiento: 3,
  vencido1a30: 4,
  vencido31a60: 5,
  vencido61a90: 6,
  vencido91mas: 7,
  porVencer: 8,
  saldoAFavor: 9,
  total: 10,
  contacto: 11,
  telefono: 12,
}

const ENCABEZADO = [
  'Identificación',
  'Cliente',
  'Documento',
  'Fecha vencimiento',
  'Vencido 1 a 30',
  'Vencido 31 a 60',
  'Vencido 61 a 90',
  'Vencido más de 91',
  'Saldo por vencer',
  'Saldo a favor',
  'Total cartera',
  'CONTACTO',
  'TELEFONO',
]

const CORTE = '2026-05-25'

/** Cinco filas copiadas del reporte de mayo de 2026, sin retocar. */
const FILAS = [
  ['901409413', 'AGROMOTORS SAS', 'FV-2-3292', '11/04/2026', '0', '1648997.93', '0', '0', '0', '0', '1648997.93', '', ''],
  ['901934931', 'AGROPAI S.A.S.', 'FV-2-3533', '24/06/2026', '0', '0', '0', '0', '990005.92', '0', '990005.92', 'LUIS FERNANDO GIL', '3013335964'],
  ['18856796', 'VALMIRO GAZABON HERAZO', 'FV-2569', '02/09/2025', '0', '0', '0', '518686', '0', '0', '518686', '', ''],
  ['1099553018', 'YONATAN OLAVE', 'FV-2-3129', '11/03/2026', '0', '0', '3718.84', '0', '0', '0', '3718.84', '', ''],
  // Fila de saldo a favor: el archivo la reporta en positivo en su columna y en
  // negativo en el total. Vence antes del corte y aun asi no esta vencida.
  ['13370999', 'FERNANDO QUINTERO', 'RC-1-735', '14/05/2026', '0', '0', '0', '0', '0', '100000', '-100000', '', ''],
]

const rejilla = (filas: string[][] = FILAS) => [
  [],
  ['Cuentas por cobrar detallada por documento'],
  ['AGROBORDA COLOMBIA SAS'],
  ['901593129-3'],
  [],
  [],
  ENCABEZADO,
  ...filas,
  [],
  ['Procesado en: Mayo 25 2026 13:48'],
]

const cliente = (id: string, identificacion: string, nombre: string): Cliente => ({
  id,
  codigo: identificacion,
  nombre,
  identificacion,
  estadoManual: 'cliente',
  archivado: false,
  creadoEn: '2026-01-01T00:00:00.000Z',
  actualizadoEn: '2026-01-01T00:00:00.000Z',
})

describe('detectarCabeceraCorte', () => {
  it('saca la fecha, la empresa y el NIT del bloque de título y del pie', () => {
    const cabecera = detectarCabeceraCorte(rejilla(), 6)
    expect(cabecera.fecha).toBe('2026-05-25')
    expect(cabecera.empresa).toBe('AGROBORDA COLOMBIA SAS')
    expect(cabecera.nit).toBe('901593129-3')
    expect(cabecera.procesadoEn).toBe('Procesado en: Mayo 25 2026 13:48')
  })

  it('entiende el mes escrito en español, con o sin tilde', () => {
    expect(interpretarFechaDeProceso('Procesado en: Mayo 25 2026 13:48')).toBe('2026-05-25')
    expect(interpretarFechaDeProceso('Procesado en: Diciembre 1 2025 08:00')).toBe('2025-12-01')
    expect(interpretarFechaDeProceso('Procesado en: 25/05/2026')).toBe('2026-05-25')
  })

  it('no inventa fecha cuando el pie no está', () => {
    expect(detectarCabeceraCorte([ENCABEZADO, ...FILAS], 0).fecha).toBeUndefined()
  })
})

describe('analizarCobranza', () => {
  it('lee el corte y lo reparte por tramos', () => {
    const previa = analizarCobranza(rejilla(), MAPEO, 7, CORTE, [])

    expect(previa.totalFilas).toBe(5)
    expect(previa.documentos).toHaveLength(5)
    expect(previa.errores).toEqual([])
    expect(previa.porTramo.v31_60).toBe(164_899_793)
    expect(previa.porTramo.por_vencer).toBe(99_000_592)
    expect(previa.porTramo.v91_mas).toBe(51_868_600)
    expect(previa.porTramo.v61_90).toBe(371_884)
    expect(previa.porTramo.a_favor).toBe(-10_000_000)
  })

  it('la suma de los tramos es exactamente el total del corte', () => {
    const previa = analizarCobranza(rejilla(), MAPEO, 7, CORTE, [])
    expect(totalDe(previa.porTramo)).toBe(previa.total)
    // Y el total es el que sale de sumar los importes del archivo en centavos.
    expect(previa.total).toBe(164_899_793 + 99_000_592 + 51_868_600 + 371_884 - 10_000_000)
    expect(vencidoDe(previa.porTramo)).toBe(164_899_793 + 51_868_600 + 371_884)
  })

  it('guarda el importe con signo una sola vez, sin columna aparte de saldo a favor', () => {
    const previa = analizarCobranza(rejilla(), MAPEO, 7, CORTE, [])
    const anticipo = previa.documentos.find((d) => d.documento === 'RC-1-735')!
    expect(anticipo.valor).toBe(-10_000_000)
  })

  it('no marca descuadre cuando el archivo está bien: el tramo derivado coincide', () => {
    expect(analizarCobranza(rejilla(), MAPEO, 7, CORTE, []).descuadres).toEqual([])
  })

  it('avisa cuando las columnas de edades no suman el total de la fila', () => {
    const rota = [...FILAS.map((f) => [...f])]
    rota[0]![10] = '2000000' // el total ya no es lo que dicen las edades
    const previa = analizarCobranza(rejilla(rota), MAPEO, 7, CORTE, [])
    expect(previa.descuadres.map((d) => d.documento)).toContain('FV-2-3292')
    // Aun asi la fila se importa: el aviso no descarta el dato.
    expect(previa.documentos).toHaveLength(5)
  })

  it('avisa cuando la fecha del corte no es la que el archivo supone', () => {
    // Con un corte tres meses posterior, casi todo envejece de tramo.
    const previa = analizarCobranza(rejilla(), MAPEO, 7, '2026-08-25', [])
    expect(previa.descuadres.length).toBeGreaterThan(0)
  })

  it('concilia por identificación y deja pendientes los clientes que no existen', () => {
    const existentes = [cliente('c1', '901409413', 'AGROMOTORS SAS')]
    const previa = analizarCobranza(rejilla(), MAPEO, 7, CORTE, existentes)

    const conocido = previa.documentos.find((d) => d.documento === 'FV-2-3292')!
    expect(conocido.clienteId).toBe('c1')

    const nuevo = previa.documentos.find((d) => d.documento === 'FV-2-3533')!
    expect(esPendiente(nuevo.clienteId!)).toBe(true)
    expect(claveDePendiente(nuevo.clienteId!)).toBe('901934931')

    expect(previa.clientesPorCrear).toHaveLength(4)
    const agropai = previa.clientesPorCrear.find((c) => c.clave === '901934931')!
    expect(agropai.datos.contactoPrincipal).toBe('LUIS FERNANDO GIL')
    expect(agropai.saldo).toBe(99_000_592)
  })

  it('el documento conserva nombre e identificación aunque no haya ficha de cliente', () => {
    const previa = analizarCobranza(rejilla(), MAPEO, 7, CORTE, [])
    const doc = previa.documentos.find((d) => d.documento === 'FV-2569')!
    expect(doc.nombre).toBe('VALMIRO GAZABON HERAZO')
    expect(doc.identificacion).toBe('18856796')
  })

  it('ignora el pie del reporte, que no es una fila de datos', () => {
    const previa = analizarCobranza(rejilla(), MAPEO, 7, CORTE, [])
    expect(previa.totalFilas).toBe(5)
  })

  it('rechaza la fila sin fecha de vencimiento en vez de suponerle una', () => {
    const rota = FILAS.map((f) => [...f])
    rota[2]![3] = ''
    const previa = analizarCobranza(rejilla(rota), MAPEO, 7, CORTE, [])
    expect(previa.errores).toHaveLength(1)
    expect(previa.errores[0]!.motivo).toContain('Sin fecha de vencimiento')
    expect(previa.documentos).toHaveLength(4)
  })
})

describe('faltantesCartera', () => {
  it('exige cliente, vencimiento y total', () => {
    expect(faltantesCartera({})).toHaveLength(3)
    expect(faltantesCartera(MAPEO)).toEqual([])
  })
})
