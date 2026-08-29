import type { Id, Periodo, Pesos } from '@/domain/shared/types'
import type { VentaMensual } from '@/domain/venta/venta.entity'
import { compararPeriodos } from '@/domain/shared/periodo'

/**
 * Descomposicion de la variacion de la venta entre dos meses.
 *
 * Es el «puente»: se parte de lo vendido el mes anterior y se explica, sumando
 * y restando, como se llega a lo del mes actual. Un informe que solo dice
 * «bajamos catorce millones» no permite hacer nada; uno que dice «se perdieron
 * ocho por clientes que dejaron de comprar y seis por caida de los que siguen»
 * apunta a dos acciones distintas.
 *
 * La identidad se cumple siempre:
 *   base + nuevos + recuperados + crecimiento + contraccion + perdidos = final
 * (contraccion y perdidos son negativos o cero).
 */
export interface PuenteDeVentas {
  readonly periodoAnterior: Periodo
  readonly periodo: Periodo
  readonly base: Pesos
  /** Clientes que nunca habian comprado antes. */
  readonly nuevos: Pesos
  /** Compraron alguna vez, no el mes pasado, y volvieron. */
  readonly recuperados: Pesos
  /** Subida de los que compraron los dos meses. */
  readonly crecimiento: Pesos
  /** Caida de los que compraron los dos meses. Negativo. */
  readonly contraccion: Pesos
  /** Lo que aportaban los que compraron el mes pasado y este no. Negativo. */
  readonly perdidos: Pesos
  readonly final: Pesos
  readonly variacion: Pesos
  readonly clientesNuevos: number
  readonly clientesRecuperados: number
  readonly clientesPerdidos: number
}

function totalesPorCliente(
  ventas: readonly VentaMensual[],
  periodo: Periodo,
): Map<Id, Pesos> {
  const totales = new Map<Id, Pesos>()
  for (const venta of ventas) {
    if (venta.periodo !== periodo || venta.valor === 0) continue
    totales.set(venta.clienteId, (totales.get(venta.clienteId) ?? 0) + venta.valor)
  }
  return totales
}

export function construirPuenteDeVentas(
  ventas: readonly VentaMensual[],
  periodo: Periodo,
  periodoAnterior: Periodo,
): PuenteDeVentas {
  const actual = totalesPorCliente(ventas, periodo)
  const anterior = totalesPorCliente(ventas, periodoAnterior)

  // Quien compro en cualquier momento ANTES del mes pasado. Es lo que separa a
  // un cliente nuevo de uno que vuelve, y confundirlos infla los «nuevos» mes
  // tras mes con los mismos clientes de siempre.
  const historicos = new Set<Id>()
  for (const venta of ventas) {
    if (venta.valor === 0) continue
    if (compararPeriodos(venta.periodo, periodoAnterior) < 0) historicos.add(venta.clienteId)
  }

  let base = 0
  for (const valor of anterior.values()) base += valor

  let nuevos = 0
  let recuperados = 0
  let crecimiento = 0
  let contraccion = 0
  let perdidos = 0
  let clientesNuevos = 0
  let clientesRecuperados = 0
  let clientesPerdidos = 0

  for (const [clienteId, valor] of actual) {
    const previo = anterior.get(clienteId)
    if (previo === undefined) {
      if (historicos.has(clienteId)) {
        recuperados += valor
        clientesRecuperados += 1
      } else {
        nuevos += valor
        clientesNuevos += 1
      }
      continue
    }
    const diferencia = valor - previo
    if (diferencia >= 0) crecimiento += diferencia
    else contraccion += diferencia
  }

  for (const [clienteId, valor] of anterior) {
    if (!actual.has(clienteId)) {
      perdidos -= valor
      clientesPerdidos += 1
    }
  }

  let final = 0
  for (const valor of actual.values()) final += valor

  return {
    periodoAnterior,
    periodo,
    base,
    nuevos,
    recuperados,
    crecimiento,
    contraccion,
    perdidos,
    final,
    variacion: final - base,
    clientesNuevos,
    clientesRecuperados,
    clientesPerdidos,
  }
}
