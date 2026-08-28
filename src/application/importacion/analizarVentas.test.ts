import { describe, expect, it } from 'vitest'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import { analizarVentas, claveDePendiente, esPendiente, faltantesVentas } from './analizarVentas'
import type { MapeoDetectado } from './detectarColumnas'

/** Mapeo del archivo real: Fecha | Cliente | Identificación | Ciudad | Categoría | Producto | Cantidad | Valor Unitario | Valor Total */
const DETALLADO: MapeoDetectado = {
  fecha: 0,
  nombre: 1,
  identificacion: 2,
  municipio: 3,
  categoria: 4,
  producto: 5,
  cantidad: 6,
  valorUnitario: 7,
  valor: 8,
  periodo: null,
}

const ENCABEZADO = [
  'Fecha',
  'Cliente',
  'Identificación',
  'Ciudad',
  'Categoría',
  'Producto',
  'Cantidad',
  'Valor Unitario',
  'Valor Total',
]

function cliente(parcial: Partial<Cliente> & { nombre: string }): Cliente {
  return {
    id: `id-${parcial.identificacion ?? parcial.nombre}`,
    codigo: parcial.identificacion ?? '',
    estadoManual: 'cliente',
    archivado: false,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...parcial,
  }
}

const VETERINARIA = cliente({
  nombre: 'VETERINARIA LA RED S.A.S.',
  identificacion: '900509567',
  municipio: '68001',
})

// Filas literales del archivo de ventas real.
const FILAS = [
  ['2026-04-07', 'VETERINARIA LA RED S.A.S.', '900509567', '68001', 'Motobombas', 'Motobomba 2"', '4', '690000', '2760000'],
  ['2026-04-06', 'VETERINARIA LA RED S.A.S.', '900509567', '68001', 'Motosierras', 'Motosierra 18"', '4', '780000', '3120000'],
  ['2026-01-23', 'TEKNOFINCA CJ S.A.S', '901509516', '05001', 'Motores', 'Motor diésel 10 HP', '5', '2100000', '10500000'],
]

describe('analizarVentas · archivo detallado', () => {
  it('reconoce el grano línea a línea', () => {
    const previa = analizarVentas([ENCABEZADO, ...FILAS], DETALLADO, 1, [VETERINARIA])
    expect(previa.modo).toBe('detallado')
    expect(previa.totalFilas).toBe(3)
    expect(previa.filasAplicadas).toBe(3)
    expect(previa.errores).toEqual([])
  })

  it('deriva el periodo de la fecha y suma el total exacto', () => {
    const previa = analizarVentas([ENCABEZADO, ...FILAS], DETALLADO, 1, [VETERINARIA])
    expect(previa.periodos).toEqual(['2026-01', '2026-04'])
    expect(previa.valorTotal).toBe(16_380_000)
  })

  it('agrupa en un solo total las dos líneas del mismo cliente y mes', () => {
    const previa = analizarVentas([ENCABEZADO, ...FILAS], DETALLADO, 1, [VETERINARIA])
    const abril = previa.totales.find((t) => t.periodo === '2026-04')
    expect(abril).toMatchObject({ clienteId: VETERINARIA.id, valor: 5_880_000, unidades: 8 })
  })

  it('conserva producto, categoría, cantidad y unitario de cada línea', () => {
    const previa = analizarVentas([ENCABEZADO, ...FILAS], DETALLADO, 1, [VETERINARIA])
    expect(previa.movimientos[0]).toMatchObject({
      fecha: '2026-04-07',
      periodo: '2026-04',
      categoria: 'Motobombas',
      producto: 'Motobomba 2"',
      cantidad: 4,
      valorUnitario: 690_000,
      valor: 2_760_000,
    })
  })

  it('concilia por identificación aunque el nombre venga distinto', () => {
    const previa = analizarVentas(
      [ENCABEZADO, ['2026-04-07', 'VETERINARIA LA RED SAS', '900509567', '68001', '', '', '1', '', '100']],
      DETALLADO,
      1,
      [VETERINARIA],
    )
    expect(previa.clientesPorCrear).toHaveLength(0)
    expect(previa.movimientos[0]?.clienteId).toBe(VETERINARIA.id)
  })

  it('concilia por nombre cuando no hay identificación', () => {
    const sinNit: MapeoDetectado = { ...DETALLADO, identificacion: null }
    const previa = analizarVentas(
      [ENCABEZADO, ['2026-04-07', 'veterinaria la red s.a.s.', '', '', '', '', '1', '', '100']],
      sinNit,
      1,
      [VETERINARIA],
    )
    expect(previa.movimientos[0]?.clienteId).toBe(VETERINARIA.id)
  })

  it('anota los clientes que hay que crear en vez de inventarlos en silencio', () => {
    const previa = analizarVentas([ENCABEZADO, ...FILAS], DETALLADO, 1, [VETERINARIA])
    expect(previa.clientesPorCrear).toHaveLength(1)
    expect(previa.clientesPorCrear[0]).toMatchObject({
      clave: '901509516',
      lineas: 1,
      datos: { nombre: 'TEKNOFINCA CJ S.A.S', identificacion: '901509516', municipio: '05001' },
    })
    const pendiente = previa.movimientos[2]!.clienteId
    expect(esPendiente(pendiente)).toBe(true)
    expect(claveDePendiente(pendiente)).toBe('901509516')
  })

  it('cuenta juntas todas las líneas de un mismo cliente por crear', () => {
    const previa = analizarVentas(
      [ENCABEZADO, FILAS[2]!, FILAS[2]!],
      DETALLADO,
      1,
      [],
    )
    expect(previa.clientesPorCrear).toHaveLength(1)
    expect(previa.clientesPorCrear[0]?.lineas).toBe(2)
  })
})

describe('analizarVentas · errores por fila', () => {
  const conError = (fila: string[]) =>
    analizarVentas([ENCABEZADO, fila], DETALLADO, 1, [VETERINARIA]).errores[0]

  it('señala la fila sin fecha', () => {
    expect(conError(['', 'VETERINARIA LA RED S.A.S.', '900509567', '', '', '', '', '', '100'])).toEqual({
      numeroFila: 2,
      motivo: 'Sin fecha ni periodo',
    })
  })

  it('señala una fecha que no entiende, mostrando lo que leyó', () => {
    expect(
      conError(['primer trimestre', 'VETERINARIA LA RED S.A.S.', '900509567', '', '', '', '', '', '100'])?.motivo,
    ).toBe('No se entiende la fecha «primer trimestre»')
  })

  it('señala un valor que no es número', () => {
    expect(
      conError(['2026-04-07', 'VETERINARIA LA RED S.A.S.', '900509567', '', '', '', '', '', 'pendiente'])?.motivo,
    ).toBe('El valor «pendiente» no es un número')
  })

  it('señala la fila sin cliente', () => {
    expect(conError(['2026-04-07', '', '', '', '', '', '', '', '100'])?.motivo).toBe(
      'Sin cliente: no hay identificación ni nombre',
    )
  })

  it('una fila con error no arrastra a las demás', () => {
    const previa = analizarVentas(
      [ENCABEZADO, ['', '', '', '', '', '', '', '', ''], ...FILAS],
      DETALLADO,
      1,
      [VETERINARIA],
    )
    // La fila totalmente vacía es un separador, no un error.
    expect(previa.errores).toEqual([])
    expect(previa.filasAplicadas).toBe(3)
  })

  it('no escribe nada: es una función pura', () => {
    const existentes = [VETERINARIA]
    const copia = structuredClone(existentes)
    analizarVentas([ENCABEZADO, ...FILAS], DETALLADO, 1, existentes)
    expect(existentes).toEqual(copia)
  })
})

describe('analizarVentas · archivo agregado por cliente y mes', () => {
  const AGREGADO: MapeoDetectado = {
    periodo: 0,
    nombre: 1,
    identificacion: 2,
    valor: 3,
    fecha: null,
  }
  const CABECERA = ['Mes', 'Cliente', 'NIT', 'Venta']

  it('reconoce el grano agregado y no guarda movimientos', () => {
    const previa = analizarVentas(
      [
        CABECERA,
        ['2026-04', 'VETERINARIA LA RED S.A.S.', '900509567', '5.880.000'],
        ['Ene 2026', 'VETERINARIA LA RED S.A.S.', '900509567', '$ 1.200.000'],
      ],
      AGREGADO,
      1,
      [VETERINARIA],
    )
    expect(previa.modo).toBe('agregado')
    expect(previa.movimientos).toEqual([])
    expect(previa.periodos).toEqual(['2026-01', '2026-04'])
    expect(previa.valorTotal).toBe(7_080_000)
    expect(previa.totales).toHaveLength(2)
  })
})

describe('faltantesVentas', () => {
  it('acepta el archivo detallado', () => {
    expect(faltantesVentas(DETALLADO)).toEqual([])
  })

  it('acepta el archivo agregado, que no tiene fecha sino periodo', () => {
    expect(faltantesVentas({ periodo: 0, nombre: 1, valor: 2, fecha: null })).toEqual([])
  })

  it('exige saber cuándo, a quién y cuánto', () => {
    expect(faltantesVentas({})).toHaveLength(3)
  })

  it('explica qué falta en lugar de solo nombrar la columna', () => {
    expect(faltantesVentas({ nombre: 0, valor: 1 })[0]).toContain('fecha o la de periodo')
  })
})
