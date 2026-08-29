import type { Periodo, Pesos } from '@/domain/shared/types'
import { anioDe, mesDe, sumarMeses, ultimosPeriodos } from '@/domain/shared/periodo'

export type Tendencia = 'crece' | 'estable' | 'cae' | 'sin_base'

export interface Crecimiento {
  /** Venta de los ultimos tres meses, incluido el periodo consultado. */
  readonly reciente: Pesos
  /** Venta de los tres meses anteriores a esos. */
  readonly previo: Pesos
  /** `0.25` significa +25 %. `null` cuando no hay base con la que comparar. */
  readonly variacion: number | null
  readonly tendencia: Tendencia
}

export interface Proyeccion {
  /** Vendido en lo que va del ano. */
  readonly acumulado: Pesos
  /** Cierre estimado del ano al ritmo reciente. */
  readonly estimado: Pesos
  /** Meses del ano que aun no han pasado. */
  readonly mesesRestantes: number
  /**
   * `false` cuando el cliente tiene demasiado poca historia para que la
   * proyeccion signifique algo. Se muestra igual, pero marcada: un numero sin
   * base no deja de ser un numero, y por eso hay que decirlo.
   */
  readonly confiable: boolean
  /** Meses del ano en los que compro. Es lo que sostiene —o no— la proyeccion. */
  readonly mesesConCompra: number
}

/** Ventas de un cliente indexadas por periodo. */
export type SerieCliente = ReadonlyMap<Periodo, Pesos>

function sumar(serie: SerieCliente, periodos: readonly Periodo[]): Pesos {
  let total = 0
  for (const periodo of periodos) total += serie.get(periodo) ?? 0
  return total
}

/**
 * Compara los ultimos tres meses contra los tres anteriores.
 *
 * Tres y no uno porque un solo mes no distingue una caida de una compra que se
 * corrio dos semanas, y en este negocio eso pasa todo el tiempo. Tres y no doce
 * porque el objetivo es detectar el cambio a tiempo, no describir el ano.
 *
 * `umbral` es la variacion a partir de la cual deja de considerarse ruido.
 */
export function calcularCrecimiento(
  serie: SerieCliente,
  periodo: Periodo,
  umbral = 0.15,
): Crecimiento {
  const reciente = sumar(serie, ultimosPeriodos(periodo, 3))
  const previo = sumar(serie, ultimosPeriodos(sumarMeses(periodo, -3), 3))

  if (previo <= 0) {
    // Sin base no se puede hablar de crecimiento. Que haya vendido algo
    // reciente sin nada antes no es «crece un infinito por ciento»: es que
    // acaba de empezar, y eso es otra cosa.
    return { reciente, previo, variacion: null, tendencia: 'sin_base' }
  }

  const variacion = (reciente - previo) / previo
  const tendencia: Tendencia =
    variacion >= umbral ? 'crece' : variacion <= -umbral ? 'cae' : 'estable'

  return { reciente, previo, variacion, tendencia }
}

/**
 * Proyecta el cierre del ano al ritmo de los ultimos meses.
 *
 * Se usa el promedio de los ultimos tres meses y no el del ano completo porque
 * un cliente que arranco en junio no tiene por que arrastrar sus ceros de enero.
 *
 * La proyeccion se marca como no confiable cuando el cliente compro en menos de
 * tres meses del ano: con una o dos compras sueltas, multiplicar el promedio por
 * los meses que faltan es adivinar con decimales.
 */
export function proyectarClienteAlCierre(serie: SerieCliente, periodo: Periodo): Proyeccion {
  const anio = anioDe(periodo)
  const mes = mesDe(periodo)

  let acumulado = 0
  let mesesConCompra = 0
  for (const [p, valor] of serie) {
    if (anioDe(p) === anio && p <= periodo && valor > 0) {
      acumulado += valor
      mesesConCompra += 1
    }
  }

  const promedioReciente = sumar(serie, ultimosPeriodos(periodo, 3)) / 3
  const mesesRestantes = 12 - mes

  return {
    acumulado,
    estimado: Math.round(acumulado + promedioReciente * mesesRestantes),
    mesesRestantes,
    confiable: mesesConCompra >= 3,
    mesesConCompra,
  }
}
