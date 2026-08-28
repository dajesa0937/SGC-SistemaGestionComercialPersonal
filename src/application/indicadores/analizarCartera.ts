import type { Id, Periodo, Pesos } from '@/domain/shared/types'
import type {
  ClasificacionABC,
  Cliente,
  ClienteEnriquecido,
  EstadoCliente,
} from '@/domain/cliente/cliente.entity'
import type { VentaMensual } from '@/domain/venta/venta.entity'
import type { ConfiguracionNegocio } from '@/domain/config/configuracion.entity'
import {
  anioDe,
  compararPeriodos,
  mesesEntre,
  mismoMesAnioAnterior,
  sumarMeses,
  ultimosPeriodos,
} from '@/domain/shared/periodo'

/** Ventas de un cliente indexadas por periodo. */
type VentasPorPeriodo = Map<Periodo, Pesos>

function agruparPorCliente(ventas: readonly VentaMensual[]): Map<Id, VentasPorPeriodo> {
  const porCliente = new Map<Id, VentasPorPeriodo>()
  for (const venta of ventas) {
    if (venta.valor === 0) continue
    let porPeriodo = porCliente.get(venta.clienteId)
    if (!porPeriodo) {
      porPeriodo = new Map()
      porCliente.set(venta.clienteId, porPeriodo)
    }
    porPeriodo.set(venta.periodo, (porPeriodo.get(venta.periodo) ?? 0) + venta.valor)
  }
  return porCliente
}

function variacion(actual: Pesos, base: Pesos): number | null {
  if (base <= 0) return null
  return (actual - base) / base
}

/**
 * Clasificación ABC por Pareto sobre los últimos doce meses.
 *
 * Se calcula, no se guarda: cambia con cada importación, y persistirla crearía
 * dos fuentes de verdad que se desincronizan.
 */
export function clasificarABC(
  ventasPorCliente: Map<Id, VentasPorPeriodo>,
  periodo: Periodo,
  config: ConfiguracionNegocio,
): Map<Id, ClasificacionABC> {
  const ventana = new Set(ultimosPeriodos(periodo, 12))

  const totales = [...ventasPorCliente.entries()]
    .map(([clienteId, porPeriodo]) => {
      let total = 0
      for (const [p, valor] of porPeriodo) if (ventana.has(p)) total += valor
      return { clienteId, total }
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)

  const granTotal = totales.reduce((suma, c) => suma + c.total, 0)
  const clasificacion = new Map<Id, ClasificacionABC>()
  if (granTotal === 0) return clasificacion

  // El corte se evalua sobre el acumulado ANTES de sumar al cliente. Mirarlo
  // despues tiene un efecto absurdo: el cliente que cruza el 80 % cae en B, y
  // con un solo cliente en la cartera ese cliente (que es el 100 % del negocio)
  // saldria clasificado como C.
  let acumulado = 0
  for (const { clienteId, total } of totales) {
    const participacionPrevia = acumulado / granTotal
    clasificacion.set(
      clienteId,
      participacionPrevia < config.corteA ? 'A' : participacionPrevia < config.corteB ? 'B' : 'C',
    )
    acumulado += total
  }
  return clasificacion
}

/**
 * Estado comercial derivado del comportamiento de compra.
 *
 * El orden de evaluación importa y es deliberado: las señales de alarma ganan
 * a la etiqueta informativa. Un cliente abierto este año que ya dejó de comprar
 * debe aparecer como inactivo, porque eso es lo accionable; llamarlo "nuevo"
 * escondería el problema.
 */
export function derivarEstado(
  porPeriodo: VentasPorPeriodo | undefined,
  periodo: Periodo,
  config: ConfiguracionNegocio,
): EstadoCliente {
  if (!porPeriodo || porPeriodo.size === 0) return 'inactivo'

  const periodos = [...porPeriodo.keys()].sort(compararPeriodos)
  const primera = periodos[0]
  const ultima = periodos[periodos.length - 1]
  if (!primera || !ultima) return 'inactivo'

  const mesesSinComprar = mesesEntre(ultima, periodo)
  if (mesesSinComprar >= config.mesesParaInactivo) return 'inactivo'

  const previos = [1, 2, 3].map((n) => porPeriodo.get(sumarMeses(periodo, -n)) ?? 0)
  const promedioPrevio = previos.reduce((a, b) => a + b, 0) / previos.length
  const actual = porPeriodo.get(periodo) ?? 0
  if (promedioPrevio > 0 && (promedioPrevio - actual) / promedioPrevio > config.umbralCaida) {
    return 'en_riesgo'
  }

  if (anioDe(primera) === anioDe(periodo)) return 'nuevo'
  return 'activo'
}

/** Combina cada cliente con sus indicadores calculados. */
export function enriquecerClientes(
  clientes: readonly Cliente[],
  ventas: readonly VentaMensual[],
  periodo: Periodo,
  config: ConfiguracionNegocio,
): ClienteEnriquecido[] {
  const porCliente = agruparPorCliente(ventas)
  const abc = clasificarABC(porCliente, periodo, config)
  const ventana12 = ultimosPeriodos(periodo, 12)
  const inicioAnio = `${anioDe(periodo)}-01`

  return clientes.map((cliente) => {
    const porPeriodo = porCliente.get(cliente.id)
    const periodos = porPeriodo ? [...porPeriodo.keys()].sort(compararPeriodos) : []

    const ventaPeriodo = porPeriodo?.get(periodo) ?? 0
    const mesAnterior = porPeriodo?.get(sumarMeses(periodo, -1)) ?? 0
    const anioAnterior = porPeriodo?.get(mismoMesAnioAnterior(periodo)) ?? 0

    let ventaAnio = 0
    let venta12Meses = 0
    if (porPeriodo) {
      for (const [p, valor] of porPeriodo) {
        if (p >= inicioAnio && p <= periodo) ventaAnio += valor
      }
      for (const p of ventana12) venta12Meses += porPeriodo.get(p) ?? 0
    }

    return {
      ...cliente,
      clasificacion: abc.get(cliente.id) ?? 'SIN_HISTORIA',
      estado: derivarEstado(porPeriodo, periodo, config),
      ventaPeriodo,
      ventaAnio,
      venta12Meses,
      ultimaCompra: periodos[periodos.length - 1],
      primeraCompra: periodos[0],
      variacionMesAnterior: variacion(ventaPeriodo, mesAnterior),
      variacionAnioAnterior: variacion(ventaPeriodo, anioAnterior),
      serie12Meses: ventana12.map((p) => porPeriodo?.get(p) ?? 0),
    }
  })
}

export interface Cobertura {
  readonly conCompra: number
  readonly activos: number
  /** Fracción de clientes activos que compraron. `null` si no hay activos. */
  readonly fraccion: number | null
}

/**
 * Cobertura del periodo.
 *
 * El denominador son los clientes no archivados, no todos los del histórico:
 * medirse contra clientes que uno mismo dio de baja no dice nada útil.
 */
export function calcularCobertura(
  clientes: readonly ClienteEnriquecido[],
): Cobertura {
  const activos = clientes.filter((c) => !c.archivado)
  const conCompra = activos.filter((c) => c.ventaPeriodo > 0).length
  return {
    conCompra,
    activos: activos.length,
    fraccion: activos.length > 0 ? conCompra / activos.length : null,
  }
}

/** Clientes cuya primera compra registrada cae en el periodo consultado. */
export function detectarClientesNuevos(
  clientes: readonly ClienteEnriquecido[],
  periodo: Periodo,
): ClienteEnriquecido[] {
  return clientes.filter((c) => c.primeraCompra === periodo)
}

export interface Alerta {
  readonly cliente: ClienteEnriquecido
  readonly motivo: string
  /** Facturación de los últimos doce meses: sirve para priorizar por impacto. */
  readonly impacto: Pesos
}

/**
 * Clientes que requieren atención, ordenados por impacto.
 *
 * Se ordenan por facturación y no por gravedad porque el tiempo del ejecutivo
 * es limitado: perder un cliente grande duele más que perder uno pequeño.
 */
export function detectarAlertas(
  clientes: readonly ClienteEnriquecido[],
  periodo: Periodo,
): Alerta[] {
  const alertas: Alerta[] = []

  for (const cliente of clientes) {
    if (cliente.archivado) continue

    if (cliente.estado === 'inactivo') {
      const meses = cliente.ultimaCompra ? mesesEntre(cliente.ultimaCompra, periodo) : null
      alertas.push({
        cliente,
        motivo:
          meses === null
            ? 'Sin compras registradas'
            : `Sin compras hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`,
        impacto: cliente.venta12Meses,
      })
    } else if (cliente.estado === 'en_riesgo') {
      alertas.push({
        cliente,
        motivo: 'Caída frente al promedio reciente',
        impacto: cliente.venta12Meses,
      })
    }
  }

  return alertas.sort((a, b) => b.impacto - a.impacto)
}

/** Mejores clientes del periodo, de mayor a menor. */
export function topClientes(
  clientes: readonly ClienteEnriquecido[],
  cuantos = 10,
): ClienteEnriquecido[] {
  return clientes
    .filter((c) => c.ventaPeriodo > 0)
    .sort((a, b) => b.ventaPeriodo - a.ventaPeriodo)
    .slice(0, cuantos)
}
