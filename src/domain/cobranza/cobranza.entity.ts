import type { Centavos } from '../shared/dinero'
import { diasEntre } from '../shared/fechas'
import type { FechaISO, Id, InstanteISO } from '../shared/types'

/**
 * Cartera por cobrar. En el codigo se llama «cobranza» y no «cartera» porque
 * `analizarCartera.ts` ya usa esa palabra con el otro sentido que tiene en la
 * calle: la cartera de clientes. En pantalla si dice «Cartera», que es como la
 * llama el usuario y como la llama el reporte que le envia la empresa.
 */

/** Tramo de edad de un saldo. El orden del arreglo es el orden de la tabla. */
export const TRAMOS = ['por_vencer', 'v1_30', 'v31_60', 'v61_90', 'v91_mas', 'a_favor'] as const

export type Tramo = (typeof TRAMOS)[number]

export const ETIQUETA_TRAMO: Record<Tramo, string> = {
  por_vencer: 'Por vencer',
  v1_30: 'Vencido 1 a 30',
  v31_60: 'Vencido 31 a 60',
  v61_90: 'Vencido 61 a 90',
  v91_mas: 'Vencido más de 91',
  a_favor: 'Saldo a favor',
}

/** Los cuatro tramos que son deuda vencida de verdad. */
export const TRAMOS_VENCIDOS = ['v1_30', 'v31_60', 'v61_90', 'v91_mas'] as const

/**
 * Un documento pendiente en un corte: una factura, un recibo, un anticipo.
 *
 * Guarda `identificacion` y `nombre` como texto ademas del `clienteId`
 * opcional. No es duplicacion: el corte es una foto del reporte de la empresa y
 * tiene que poder leerse entero aunque el cliente no exista en la base. En el
 * archivo real 10 de los 32 clientes con cartera no estan en el maestro.
 */
export interface DocumentoCartera {
  readonly id: Id
  readonly corteId: Id
  readonly identificacion: string
  readonly nombre: string
  readonly documento: string
  readonly fechaVencimiento: FechaISO
  /**
   * Saldo con signo, en centavos. Negativo = saldo a favor del cliente.
   *
   * El archivo lo trae en dos sitios: un numero positivo en la columna «Saldo a
   * favor» y el mismo numero en negativo en «Total cartera». Aqui hay un solo
   * importe con signo, que es lo que evita que las dos formas se separen.
   */
  readonly valor: Centavos
  clienteId?: Id
  contacto?: string
  telefono?: string
}

export type NuevoDocumento = Omit<DocumentoCartera, 'id' | 'corteId'>

/** Una importacion del reporte de cuentas por cobrar: la foto de una fecha. */
export interface CorteCartera {
  readonly id: Id
  /** Fecha del corte, `YYYY-MM-DD`. Es la fecha en que la empresa lo proceso. */
  readonly fecha: FechaISO
  /** Texto de la fila «Procesado en: …», tal cual viene. */
  procesadoEn?: string
  empresa?: string
  nit?: string
  archivo: string
  importadoEn: InstanteISO
  /** Cuadre del archivo: total del corte segun la suma de sus documentos. */
  total: Centavos
  documentos: number
}

/**
 * Tramo de un saldo dado el dia del corte.
 *
 * El signo manda sobre la fecha: un saldo a favor es saldo a favor aunque su
 * documento tenga fecha vencida. Esta es la regla del archivo real, no una
 * suposicion — las nueve filas donde el tramo derivado por fecha discrepaba del
 * que dice la empresa son exactamente las nueve filas con saldo a favor.
 *
 * `dias <= 0` es «por vencer», asi que un documento que vence el mismo dia del
 * corte todavia no esta vencido.
 */
export function tramoDe(valor: Centavos, fechaVencimiento: FechaISO, fechaCorte: FechaISO): Tramo {
  if (valor < 0) return 'a_favor'
  const dias = diasEntre(fechaVencimiento, fechaCorte)
  if (!Number.isFinite(dias) || dias <= 0) return 'por_vencer'
  if (dias <= 30) return 'v1_30'
  if (dias <= 60) return 'v31_60'
  if (dias <= 90) return 'v61_90'
  return 'v91_mas'
}

/** Dias de mora de un documento. Cero si aun no ha vencido o es saldo a favor. */
export function diasDeMora(
  valor: Centavos,
  fechaVencimiento: FechaISO,
  fechaCorte: FechaISO,
): number {
  if (valor < 0) return 0
  const dias = diasEntre(fechaVencimiento, fechaCorte)
  return Number.isFinite(dias) && dias > 0 ? dias : 0
}

export type PorTramo = Record<Tramo, Centavos>

export function tramosEnCero(): PorTramo {
  return { por_vencer: 0, v1_30: 0, v31_60: 0, v61_90: 0, v91_mas: 0, a_favor: 0 }
}

/** Suma de los cuatro tramos vencidos. */
export function vencidoDe(tramos: PorTramo): Centavos {
  return TRAMOS_VENCIDOS.reduce((suma, tramo) => suma + tramos[tramo], 0)
}

/** Total neto: lo vencido, mas lo que esta por vencer, menos lo que se le debe. */
export function totalDe(tramos: PorTramo): Centavos {
  return vencidoDe(tramos) + tramos.por_vencer + tramos.a_favor
}
