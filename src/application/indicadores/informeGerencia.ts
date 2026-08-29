import type { ClienteEnriquecido, NotaCliente } from '@/domain/cliente/cliente.entity'
import type { MovimientoVenta } from '@/domain/venta/movimiento.entity'
import type { Id, Periodo, Pesos } from '@/domain/shared/types'
import { anioDe, mesDe } from '@/domain/shared/periodo'

export interface Comercial {
  /** Documentos distintos: un cliente y una fecha son un pedido. */
  readonly pedidos: number
  readonly ticketPromedio: Pesos
  readonly ticketMediano: Pesos
  /** Lineas por pedido. Mide venta cruzada dentro de una misma factura. */
  readonly lineasPorPedido: number
  /** Categorias distintas por cliente, en el ano. Mide venta cruzada en el tiempo. */
  readonly categoriasPorCliente: number
  readonly categoriasDisponibles: number
}

export interface PenetracionCategoria {
  readonly categoria: string
  readonly clientes: number
  /** Fraccion de la cartera activa que compra esa categoria. */
  readonly penetracion: number
  readonly venta: Pesos
}

export interface Concentracion {
  readonly top5: number
  readonly top10: number
  readonly clientesParaLaMitad: number
}

export interface EfectividadVisita {
  readonly visitas: number
  /** Visitas seguidas de un pedido de ESE cliente dentro de la ventana. */
  readonly conPedido: number
  /**
   * Fraccion de visitas que terminaron en pedido. Nunca pasa de 1.
   *
   * `null` si no se registro ninguna visita: cero visitas no es «cero por
   * ciento de efectividad», es que no se sabe.
   */
  readonly efectividad: number | null
  /** Dias que se le dan a una visita para convertirse en pedido. */
  readonly ventanaDias: number
}

export interface InformeGerencia {
  readonly comercial: Comercial
  readonly penetracion: readonly PenetracionCategoria[]
  readonly concentracion: Concentracion
  readonly efectividad: EfectividadVisita
  readonly compraronUnaVez: number
  readonly clientesActivos: number
}

/**
 * Dias que se le dan a una visita para convertirse en pedido.
 *
 * Treinta porque es el ciclo tipico de decision en maquinaria: menos dejaria
 * fuera ventas que si vinieron de la visita, y mas empezaria a atribuirle a la
 * visita pedidos que habrian entrado igual.
 */
const VENTANA_CONVERSION = 30

function diasEntre(desde: string, hasta: string): number {
  const [a1, m1, d1] = desde.split('-').map(Number)
  const [a2, m2, d2] = hasta.split('-').map(Number)
  if (!a1 || !m1 || !d1 || !a2 || !m2 || !d2) return Number.NaN
  return Math.round(
    (new Date(a2, m2 - 1, d2).getTime() - new Date(a1, m1 - 1, d1).getTime()) / 86_400_000,
  )
}

function mediana(valores: readonly number[]): number {
  if (valores.length === 0) return 0
  const orden = [...valores].sort((a, b) => a - b)
  const medio = Math.floor(orden.length / 2)
  return orden.length % 2 === 0 ? Math.round((orden[medio - 1]! + orden[medio]!) / 2) : orden[medio]!
}

/**
 * Indicadores que un informe de gerencia pide y el panel diario no muestra.
 *
 * Se calculan sobre el ANO en curso hasta el periodo consultado, no sobre el
 * mes: un ticket promedio de un solo mes en una cartera que compra dos veces al
 * ano no significa nada. La excepcion es la efectividad de visita, que se mide
 * del mes porque es lo que se puede corregir la semana siguiente.
 */
export function construirInformeGerencia(
  clientes: readonly ClienteEnriquecido[],
  movimientos: readonly MovimientoVenta[],
  notas: readonly NotaCliente[],
  periodo: Periodo,
): InformeGerencia {
  const anio = anioDe(periodo)
  const delAnio = movimientos.filter((m) => anioDe(m.periodo) === anio && m.periodo <= periodo)

  // Un pedido es un cliente y una fecha. No hay numero de documento en el
  // archivo, y agrupar asi es lo mas cercano a la factura real sin inventarlo.
  const pedidos = new Map<string, { clienteId: Id; periodo: Periodo; valor: Pesos; lineas: number }>()
  for (const m of delAnio) {
    const clave = `${m.clienteId}|${m.fecha}`
    const actual =
      pedidos.get(clave) ?? { clienteId: m.clienteId, periodo: m.periodo, valor: 0, lineas: 0 }
    actual.valor += m.valor
    actual.lineas += 1
    pedidos.set(clave, actual)
  }

  const pedidosPorCliente = new Map<Id, number>()
  for (const pedido of pedidos.values()) {
    pedidosPorCliente.set(pedido.clienteId, (pedidosPorCliente.get(pedido.clienteId) ?? 0) + 1)
  }
  const valores = [...pedidos.values()].map((p) => p.valor)
  const lineas = [...pedidos.values()].reduce((t, p) => t + p.lineas, 0)

  const categoriasPorCliente = new Map<Id, Set<string>>()
  const clientesPorCategoria = new Map<string, Set<Id>>()
  const ventaPorCategoria = new Map<string, Pesos>()
  for (const m of delAnio) {
    const categoria = (m.categoria ?? '').trim() || 'Sin clasificar'
    const suyas = categoriasPorCliente.get(m.clienteId) ?? new Set()
    suyas.add(categoria)
    categoriasPorCliente.set(m.clienteId, suyas)

    const deEsa = clientesPorCategoria.get(categoria) ?? new Set()
    deEsa.add(m.clienteId)
    clientesPorCategoria.set(categoria, deEsa)

    ventaPorCategoria.set(categoria, (ventaPorCategoria.get(categoria) ?? 0) + m.valor)
  }

  const activos = clientes.filter((c) => !c.archivado)
  const denominador = activos.length || 1

  const penetracion: PenetracionCategoria[] = [...clientesPorCategoria.entries()]
    .map(([categoria, conjunto]) => ({
      categoria,
      clientes: conjunto.size,
      penetracion: conjunto.size / denominador,
      venta: ventaPorCategoria.get(categoria) ?? 0,
    }))
    .sort((a, b) => b.venta - a.venta || a.categoria.localeCompare(b.categoria, 'es-CO'))

  // Concentracion sobre los ultimos doce meses, que es el horizonte con el que
  // ya se clasifica el ABC: mezclar ventanas daria dos verdades distintas.
  const porVenta = [...activos].sort((a, b) => b.venta12Meses - a.venta12Meses)
  const total = porVenta.reduce((t, c) => t + c.venta12Meses, 0)
  const acumulado = (n: number) =>
    total === 0 ? 0 : porVenta.slice(0, n).reduce((t, c) => t + c.venta12Meses, 0) / total

  let acumulados = 0
  let clientesParaLaMitad = 0
  for (const cliente of porVenta) {
    if (total === 0 || acumulados / total >= 0.5) break
    acumulados += cliente.venta12Meses
    clientesParaLaMitad += 1
  }

  // Efectividad de visita: de las visitas hechas, cuantas fueron seguidas de un
  // pedido DE ESE cliente dentro de la ventana.
  //
  // Comparar los pedidos del mes contra las visitas del mes seria comparar dos
  // cosas que no se corresponden: los pedidos existen aunque no se haya visitado
  // a nadie, y el resultado puede pasar del 100 %, que en un indicador de
  // efectividad es la senal de que el denominador no cubre al numerador.
  const visitasDelMes = notas.filter(
    (n) =>
      n.tipo === 'visita' &&
      Number(n.fecha.slice(0, 4)) === anio &&
      Number(n.fecha.slice(5, 7)) === mesDe(periodo),
  )

  const fechasDeCompra = new Map<Id, string[]>()
  for (const pedido of pedidos.values()) {
    const fecha = [...delAnio].find(
      (m) => m.clienteId === pedido.clienteId && m.periodo === pedido.periodo,
    )?.fecha
    if (!fecha) continue
    const lista = fechasDeCompra.get(pedido.clienteId) ?? []
    lista.push(fecha)
    fechasDeCompra.set(pedido.clienteId, lista)
  }

  const conPedido = visitasDelMes.filter((visita) => {
    const compras = fechasDeCompra.get(visita.clienteId) ?? []
    return compras.some((fecha) => {
      const dias = diasEntre(visita.fecha, fecha)
      return dias >= 0 && dias <= VENTANA_CONVERSION
    })
  }).length

  const compraronUnaVez = [...pedidosPorCliente.values()].filter((n) => n === 1).length

  return {
    comercial: {
      pedidos: pedidos.size,
      ticketPromedio: pedidos.size === 0 ? 0 : Math.round(valores.reduce((a, b) => a + b, 0) / pedidos.size),
      ticketMediano: mediana(valores),
      lineasPorPedido: pedidos.size === 0 ? 0 : lineas / pedidos.size,
      categoriasPorCliente:
        categoriasPorCliente.size === 0
          ? 0
          : [...categoriasPorCliente.values()].reduce((t, s) => t + s.size, 0) /
            categoriasPorCliente.size,
      categoriasDisponibles: clientesPorCategoria.size,
    },
    penetracion,
    concentracion: {
      top5: acumulado(5),
      top10: acumulado(10),
      clientesParaLaMitad,
    },
    efectividad: {
      visitas: visitasDelMes.length,
      conPedido,
      efectividad: visitasDelMes.length === 0 ? null : conPedido / visitasDelMes.length,
      ventanaDias: VENTANA_CONVERSION,
    },
    compraronUnaVez,
    clientesActivos: activos.length,
  }
}
