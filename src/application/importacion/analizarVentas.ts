import type { Cliente, NuevoCliente } from '@/domain/cliente/cliente.entity'
import { normalizarIdentificacion } from '@/domain/cliente/identificacion'
import { municipioPorNombre, normalizarCodigoMunicipio } from '@/domain/geografia/geografia'
import type { NuevoMovimiento, TotalDerivado } from '@/domain/venta/movimiento.entity'
import { agregarMovimientos } from '@/domain/venta/movimiento.entity'
import { interpretarFecha, interpretarPeriodo } from '@/domain/shared/interpretarPeriodo'
import { interpretarImporte } from '@/domain/shared/interpretarImporte'
import type { Id, Periodo } from '@/domain/shared/types'
import { compararPeriodos } from '@/domain/shared/periodo'
import { normalizarParaConciliar } from '@/lib/formato'
import type { MapeoDetectado } from './detectarColumnas'
import type { Rejilla, ErrorDeFila } from './analizarMaestroClientes'

/**
 * Grano del archivo de ventas.
 *
 * `detallado` es una fila por linea de factura, con producto y cantidad.
 * `agregado` es una fila por cliente y mes, que es como lo describia el usuario
 * al levantar los requisitos. Los dos existen y el importador acepta los dos:
 * no se sabe cual llegara cada mes.
 */
export type ModoVentas = 'detallado' | 'agregado'

/** Cliente del archivo que todavia no existe en la base. */
export interface ClientePorCrear {
  readonly clave: string
  readonly datos: NuevoCliente
  readonly lineas: number
}

export interface PrevisualizacionVentas {
  readonly modo: ModoVentas
  readonly totalFilas: number
  readonly filasAplicadas: number
  readonly periodos: readonly Periodo[]
  /** Vacio en modo agregado: ahi no hay linea de factura que guardar. */
  readonly movimientos: readonly NuevoMovimiento[]
  readonly totales: readonly TotalDerivado[]
  readonly clientesPorCrear: readonly ClientePorCrear[]
  readonly errores: readonly ErrorDeFila[]
  readonly valorTotal: number
}

/**
 * Marca temporal para los clientes que aun no existen.
 *
 * El analisis es puro y no puede generar identificadores definitivos: los
 * asigna el repositorio al crear el cliente. Hasta entonces el movimiento
 * apunta a esta clave y quien aplica la importacion la sustituye.
 */
export function clavePendiente(clave: string): Id {
  return `pendiente:${clave}`
}

export function esPendiente(clienteId: Id): boolean {
  return clienteId.startsWith('pendiente:')
}

export function claveDePendiente(clienteId: Id): string {
  return clienteId.slice('pendiente:'.length)
}

function celda(fila: readonly string[], columna: number | null | undefined): string {
  if (columna == null) return ''
  return (fila[columna] ?? '').trim()
}

/**
 * Analiza el archivo de ventas y describe que pasaria al aplicarlo.
 *
 * Funcion pura, igual que el analisis del maestro: la vista previa obligatoria
 * antes de tocar la base solo es creible si mirar no cambia nada.
 *
 * La conciliacion del cliente va por identificacion primero y por nombre
 * despues. Al reves seria fragil: los nombres cambian de un reporte a otro, el
 * numero no.
 */
export function analizarVentas(
  rejilla: Rejilla,
  mapeo: MapeoDetectado,
  filaEncabezado: number,
  existentes: readonly Cliente[],
): PrevisualizacionVentas {
  const modo: ModoVentas = mapeo['fecha'] != null ? 'detallado' : 'agregado'

  const porIdentificacion = new Map(
    existentes.filter((c) => c.identificacion).map((c) => [c.identificacion!, c]),
  )
  const porNombre = new Map(existentes.map((c) => [normalizarParaConciliar(c.nombre), c]))

  const movimientos: NuevoMovimiento[] = []
  const errores: ErrorDeFila[] = []
  const porCrear = new Map<string, { datos: NuevoCliente; lineas: number }>()
  const periodos = new Set<Periodo>()
  let totalFilas = 0
  let valorTotal = 0

  for (let indice = filaEncabezado; indice < rejilla.length; indice++) {
    const fila = rejilla[indice]
    if (!fila) continue
    if (fila.every((valor) => (valor ?? '').trim() === '')) continue

    totalFilas++
    const numeroFila = indice + 1

    // --- periodo
    const textoFecha = celda(fila, mapeo['fecha'])
    const textoPeriodo = celda(fila, mapeo['periodo'])
    const periodo = interpretarPeriodo(textoFecha) ?? interpretarPeriodo(textoPeriodo)
    if (!periodo) {
      const visto = textoFecha || textoPeriodo
      errores.push({
        numeroFila,
        motivo: visto === '' ? 'Sin fecha ni periodo' : `No se entiende la fecha «${visto}»`,
      })
      continue
    }

    // --- valor
    const valor = interpretarImporte(celda(fila, mapeo['valor']))
    if (valor === undefined) {
      const visto = celda(fila, mapeo['valor'])
      errores.push({
        numeroFila,
        motivo: visto === '' ? 'Sin valor de venta' : `El valor «${visto}» no es un número`,
      })
      continue
    }

    // --- cliente
    const identificacion = normalizarIdentificacion(celda(fila, mapeo['identificacion']))
    const nombre = celda(fila, mapeo['nombre'])
    if (identificacion === undefined && nombre === '') {
      errores.push({ numeroFila, motivo: 'Sin cliente: no hay identificación ni nombre' })
      continue
    }

    const existente =
      (identificacion ? porIdentificacion.get(identificacion) : undefined) ??
      (nombre ? porNombre.get(normalizarParaConciliar(nombre)) : undefined)

    let clienteId: Id
    if (existente) {
      clienteId = existente.id
    } else {
      // El archivo trae clientes que la base no tiene. Crearlos es correcto
      // —son ventas reales— pero nunca en silencio: la vista previa los cuenta.
      const clave = identificacion ?? normalizarParaConciliar(nombre)
      const anotado = porCrear.get(clave)
      if (anotado) {
        anotado.lineas++
      } else {
        porCrear.set(clave, {
          lineas: 1,
          datos: {
            codigo: identificacion ?? '',
            nombre: nombre || (identificacion ?? ''),
            identificacion,
            municipio: leerMunicipio(celda(fila, mapeo['municipio'])),
            estadoManual: 'cliente',
          },
        })
      }
      clienteId = clavePendiente(clave)
    }

    periodos.add(periodo)
    valorTotal += valor

    const cantidad = interpretarImporte(celda(fila, mapeo['cantidad']))
    movimientos.push({
      clienteId,
      fecha: interpretarFecha(textoFecha) ?? `${periodo}-01`,
      periodo,
      categoria: celda(fila, mapeo['categoria']) || undefined,
      producto: celda(fila, mapeo['producto']) || undefined,
      cantidad: cantidad === undefined ? undefined : cantidad,
      valorUnitario: interpretarImporte(celda(fila, mapeo['valorUnitario'])),
      valor,
    })
  }

  const totales = agregarMovimientos(movimientos)

  return {
    modo,
    totalFilas,
    filasAplicadas: movimientos.length,
    periodos: [...periodos].sort(compararPeriodos),
    movimientos: modo === 'detallado' ? movimientos : [],
    totales,
    clientesPorCrear: [...porCrear.entries()].map(([clave, v]) => ({ clave, ...v })),
    errores,
    valorTotal,
  }
}

function leerMunicipio(valor: string): string | undefined {
  if (valor === '') return undefined
  return normalizarCodigoMunicipio(valor) ?? municipioPorNombre(valor)
}

export const CAMPOS_VENTAS = [
  {
    clave: 'fecha',
    etiqueta: 'Fecha',
    sinonimos: ['fecha', 'fecha factura', 'fecha documento', 'fecha venta'],
    requerido: false,
  },
  {
    clave: 'periodo',
    etiqueta: 'Periodo o mes',
    sinonimos: ['periodo', 'mes', 'periodo venta', 'mes venta'],
    requerido: false,
  },
  {
    clave: 'nombre',
    etiqueta: 'Cliente',
    sinonimos: ['cliente', 'nombre', 'razon social', 'nombre cliente'],
    requerido: false,
  },
  {
    clave: 'identificacion',
    etiqueta: 'Identificación (NIT o cédula)',
    sinonimos: ['identificacion', 'nit', 'documento', 'cedula', 'cc'],
    requerido: false,
  },
  {
    clave: 'municipio',
    etiqueta: 'Municipio (código DANE)',
    sinonimos: ['ciudad', 'municipio', 'poblacion', 'codigo dane', 'dane'],
    requerido: false,
  },
  {
    clave: 'categoria',
    etiqueta: 'Categoría',
    sinonimos: ['categoria', 'linea', 'familia', 'grupo'],
    requerido: false,
  },
  {
    clave: 'producto',
    etiqueta: 'Producto',
    sinonimos: ['producto', 'descripcion', 'articulo', 'referencia', 'item'],
    requerido: false,
  },
  {
    clave: 'cantidad',
    etiqueta: 'Cantidad',
    sinonimos: ['cantidad', 'unidades', 'cant', 'qty'],
    requerido: false,
  },
  {
    clave: 'valorUnitario',
    etiqueta: 'Valor unitario',
    sinonimos: ['valor unitario', 'precio unitario', 'precio', 'unitario', 'vr unitario'],
    requerido: false,
  },
  {
    clave: 'valor',
    etiqueta: 'Valor total',
    sinonimos: ['valor total', 'total', 'valor', 'venta', 'importe', 'vr total', 'subtotal'],
    requerido: true,
  },
] as const

/**
 * Comprueba lo que ninguna columna sabe por si sola.
 *
 * Un archivo de ventas necesita saber CUANDO y a QUIEN, y eso puede venir de
 * dos columnas distintas en cada caso. Exigir una en concreto rechazaria
 * archivos perfectamente validos.
 */
export function faltantesVentas(mapeo: MapeoDetectado): string[] {
  const faltan: string[] = []
  if (mapeo['fecha'] == null && mapeo['periodo'] == null) {
    faltan.push('Falta la columna de fecha o la de periodo: sin eso no se sabe a qué mes va la venta')
  }
  if (mapeo['identificacion'] == null && mapeo['nombre'] == null) {
    faltan.push('Falta la identificación o el nombre del cliente')
  }
  if (mapeo['valor'] == null) {
    faltan.push('Falta la columna del valor de la venta')
  }
  return faltan
}
