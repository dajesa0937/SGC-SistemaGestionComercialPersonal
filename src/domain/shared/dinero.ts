import type { Pesos } from './types'
import { interpretarImporte } from './interpretarImporte'

/**
 * Importe en centavos de peso, siempre entero.
 *
 * El resto de la aplicacion usa `Pesos` enteros porque el peso colombiano no
 * usa centavos en la practica comercial. El reporte de cuentas por cobrar es la
 * excepcion real: 35 de sus 62 filas traen decimales, y en el archivo se cumple
 * exactamente, fila por fila, que
 *
 *   Total = vencidos + saldo por vencer - saldo a favor
 *
 * Esa igualdad es la unica comprobacion independiente que tiene el importador
 * de que leyo bien el archivo. Sumar sesenta y dos importes en coma flotante la
 * rompe por centesimas y convierte una comprobacion util en ruido, asi que el
 * dinero de cartera se guarda en centavos enteros y se divide solo al mostrar.
 */
export type Centavos = number

/** Convierte a centavos enteros. `1648997.93` -> `164899793`. */
export function aCentavos(pesos: number): Centavos {
  return Math.round(pesos * 100)
}

/** Centavos a pesos con decimales, solo para mostrar o exportar. */
export function aPesos(centavos: Centavos): number {
  return centavos / 100
}

/** Centavos redondeados a pesos enteros, para mezclar con el resto del modelo. */
export function aPesosEnteros(centavos: Centavos): Pesos {
  return Math.round(centavos / 100)
}

/**
 * Interpreta un importe escrito y lo devuelve en centavos.
 *
 * Reutiliza `interpretarImporte`, que ya resuelve el punto y la coma de los
 * archivos reales; aqui solo se fija la unidad.
 */
export function interpretarCentavos(valor: string): Centavos | undefined {
  const pesos = interpretarImporte(valor)
  if (pesos === undefined) return undefined
  return aCentavos(pesos)
}
