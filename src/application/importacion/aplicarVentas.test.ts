import { describe, expect, it } from 'vitest'
import type { Repositorios } from '@/domain/repositorios'
import type { Cliente, NuevoCliente } from '@/domain/cliente/cliente.entity'
import type { Importacion, NuevaImportacion } from '@/domain/importacion/importacion.entity'
import type { MovimientoVenta, NuevoMovimiento } from '@/domain/venta/movimiento.entity'
import type { NuevaVenta, VentaMensual } from '@/domain/venta/venta.entity'
import type { Periodo } from '@/domain/shared/types'
import { analizarVentas } from './analizarVentas'
import { aplicarVentas, revertirImportacion } from './aplicarVentas'
import type { MapeoDetectado } from './detectarColumnas'

const MAPEO: MapeoDetectado = {
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
const ENCABEZADO = ['Fecha', 'Cliente', 'Identificación', 'Ciudad', 'Categoría', 'Producto', 'Cantidad', 'Valor Unitario', 'Valor Total']

const MAPEO_REGISTRO = { hoja: 'Ventas', filaEncabezado: 1, colCliente: 'Cliente', colValor: 'Valor Total' }

/**
 * Repositorios en memoria.
 *
 * Se prueba el servicio completo y no solo sus piezas porque el defecto que
 * este archivo vigila —deshacer dejaba totales sin las lineas que los
 * sustentan— solo aparece cuando los dos granos se mueven juntos.
 */
function crearRepositorios(clientes: Cliente[]) {
  const estado = {
    clientes: [...clientes],
    ventas: [] as VentaMensual[],
    movimientos: [] as MovimientoVenta[],
    importaciones: [] as Importacion[],
  }

  let n = 0
  const id = () => `gen-${++n}`

  const repositorios = {
    clientes: {
      listar: async () => estado.clientes,
      crear: async (datos: NuevoCliente) => {
        const cliente: Cliente = {
          ...datos,
          id: id(),
          archivado: false,
          creadoEn: '2026-01-01T00:00:00.000Z',
          actualizadoEn: '2026-01-01T00:00:00.000Z',
        }
        estado.clientes.push(cliente)
        return cliente
      },
    },
    ventas: {
      listarTodas: async () => estado.ventas,
      eliminarPorPeriodos: async (periodos: Periodo[]) => {
        estado.ventas = estado.ventas.filter((v) => !periodos.includes(v.periodo))
      },
      guardarLote: async (ventas: NuevaVenta[]) => {
        for (const venta of ventas) {
          estado.ventas.push({ ...venta, id: id(), actualizadoEn: '2026-01-01T00:00:00.000Z' })
        }
      },
    },
    movimientos: {
      listarTodos: async () => estado.movimientos,
      eliminarPorPeriodos: async (periodos: Periodo[]) => {
        estado.movimientos = estado.movimientos.filter((m) => !periodos.includes(m.periodo))
      },
      reemplazarPeriodos: async (periodos: Periodo[], movimientos: NuevoMovimiento[]) => {
        estado.movimientos = estado.movimientos.filter((m) => !periodos.includes(m.periodo))
        for (const movimiento of movimientos) {
          estado.movimientos.push({ ...movimiento, id: id(), actualizadoEn: '2026-01-01T00:00:00.000Z' })
        }
      },
    },
    importaciones: {
      registrar: async (datos: NuevaImportacion) => {
        const importacion: Importacion = { ...datos, id: id(), fecha: `2026-01-0${estado.importaciones.length + 1}T00:00:00.000Z` }
        estado.importaciones.push(importacion)
        return importacion
      },
      obtener: async (buscado: string) => estado.importaciones.find((i) => i.id === buscado),
      marcarRevertida: async (buscado: string) => {
        const encontrada = estado.importaciones.find((i) => i.id === buscado)
        if (encontrada) encontrada.estado = 'revertida'
      },
    },
  } as unknown as Repositorios

  return { repositorios, estado }
}

const CLIENTE: Cliente = {
  id: 'c1',
  codigo: '900509567',
  identificacion: '900509567',
  nombre: 'VETERINARIA LA RED S.A.S.',
  estadoManual: 'cliente',
  archivado: false,
  creadoEn: '2026-01-01T00:00:00.000Z',
  actualizadoEn: '2026-01-01T00:00:00.000Z',
}

const ABRIL = [
  ['2026-04-07', 'VETERINARIA LA RED S.A.S.', '900509567', '68001', 'Motobombas', 'Motobomba 2"', '4', '690000', '2760000'],
  ['2026-04-06', 'VETERINARIA LA RED S.A.S.', '900509567', '68001', 'Motosierras', 'Motosierra 18"', '4', '780000', '3120000'],
]
const ABRIL_CORREGIDO = [
  ['2026-04-07', 'VETERINARIA LA RED S.A.S.', '900509567', '68001', 'Motobombas', 'Motobomba 3"', '1', '890000', '890000'],
]

describe('aplicarVentas', () => {
  it('guarda las líneas y el total derivado de ellas', async () => {
    const { repositorios, estado } = crearRepositorios([CLIENTE])
    const previa = analizarVentas([ENCABEZADO, ...ABRIL], MAPEO, 1, [CLIENTE])
    await aplicarVentas(repositorios, previa, 'ventas.xlsx', MAPEO_REGISTRO)

    expect(estado.movimientos).toHaveLength(2)
    expect(estado.ventas).toHaveLength(1)
    expect(estado.ventas[0]).toMatchObject({ valor: 5_880_000, unidades: 8, origen: 'movimientos' })
  })

  it('crea los clientes que faltan y les cuelga sus ventas', async () => {
    const { repositorios, estado } = crearRepositorios([])
    const previa = analizarVentas([ENCABEZADO, ...ABRIL], MAPEO, 1, [])
    await aplicarVentas(repositorios, previa, 'ventas.xlsx', MAPEO_REGISTRO)

    expect(estado.clientes).toHaveLength(1)
    const creado = estado.clientes[0]!
    expect(creado.identificacion).toBe('900509567')
    // Ninguna venta puede quedar apuntando a la clave temporal.
    expect(estado.movimientos.every((m) => m.clienteId === creado.id)).toBe(true)
    expect(estado.ventas[0]?.clienteId).toBe(creado.id)
  })

  it('reimportar el mismo mes corrige en vez de duplicar', async () => {
    const { repositorios, estado } = crearRepositorios([CLIENTE])
    await aplicarVentas(repositorios, analizarVentas([ENCABEZADO, ...ABRIL], MAPEO, 1, [CLIENTE]), 'v1.xlsx', MAPEO_REGISTRO)
    await aplicarVentas(repositorios, analizarVentas([ENCABEZADO, ...ABRIL_CORREGIDO], MAPEO, 1, [CLIENTE]), 'v2.xlsx', MAPEO_REGISTRO)

    expect(estado.movimientos).toHaveLength(1)
    expect(estado.ventas).toHaveLength(1)
    expect(estado.ventas[0]?.valor).toBe(890_000)
  })

  it('no toca los meses que el archivo no menciona', async () => {
    const { repositorios, estado } = crearRepositorios([CLIENTE])
    const enero = [['2026-01-15', 'VETERINARIA LA RED S.A.S.', '900509567', '', '', '', '1', '', '1000000']]
    await aplicarVentas(repositorios, analizarVentas([ENCABEZADO, ...enero], MAPEO, 1, [CLIENTE]), 'ene.xlsx', MAPEO_REGISTRO)
    await aplicarVentas(repositorios, analizarVentas([ENCABEZADO, ...ABRIL], MAPEO, 1, [CLIENTE]), 'abr.xlsx', MAPEO_REGISTRO)

    expect(estado.ventas.map((v) => v.periodo).sort()).toEqual(['2026-01', '2026-04'])
    expect(estado.movimientos).toHaveLength(3)
  })
})

describe('revertirImportacion', () => {
  it('devuelve el mes exactamente a como estaba, con líneas y totales', async () => {
    const { repositorios, estado } = crearRepositorios([CLIENTE])
    await aplicarVentas(repositorios, analizarVentas([ENCABEZADO, ...ABRIL], MAPEO, 1, [CLIENTE]), 'v1.xlsx', MAPEO_REGISTRO)
    const segunda = await aplicarVentas(
      repositorios,
      analizarVentas([ENCABEZADO, ...ABRIL_CORREGIDO], MAPEO, 1, [CLIENTE]),
      'v2.xlsx',
      MAPEO_REGISTRO,
    )

    await revertirImportacion(repositorios, segunda.importacionId)

    // El defecto que esta prueba vigila: los totales volvian pero las lineas no,
    // dejando un mes con cifra de venta y sin nada detras.
    expect(estado.movimientos).toHaveLength(2)
    expect(estado.ventas).toHaveLength(1)
    expect(estado.ventas[0]?.valor).toBe(5_880_000)
    expect(estado.movimientos.reduce((s, m) => s + m.valor, 0)).toBe(5_880_000)
  })

  it('deshacer la primera importación deja el mes vacío, no a medias', async () => {
    const { repositorios, estado } = crearRepositorios([CLIENTE])
    const primera = await aplicarVentas(
      repositorios,
      analizarVentas([ENCABEZADO, ...ABRIL], MAPEO, 1, [CLIENTE]),
      'v1.xlsx',
      MAPEO_REGISTRO,
    )

    await revertirImportacion(repositorios, primera.importacionId)

    expect(estado.movimientos).toEqual([])
    expect(estado.ventas).toEqual([])
  })

  it('deshacer dos veces no hace nada la segunda', async () => {
    const { repositorios, estado } = crearRepositorios([CLIENTE])
    const primera = await aplicarVentas(
      repositorios,
      analizarVentas([ENCABEZADO, ...ABRIL], MAPEO, 1, [CLIENTE]),
      'v1.xlsx',
      MAPEO_REGISTRO,
    )
    await revertirImportacion(repositorios, primera.importacionId)
    await revertirImportacion(repositorios, primera.importacionId)

    expect(estado.movimientos).toEqual([])
    expect(estado.importaciones[0]?.estado).toBe('revertida')
  })
})
