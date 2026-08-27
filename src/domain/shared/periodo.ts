import type { Periodo } from './types'
import { PeriodoInvalidoError } from './errores'

const PATRON = /^(\d{4})-(0[1-9]|1[0-2])$/

const NOMBRES_MES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

/** Indica si un texto tiene la forma de un periodo valido (`AAAA-MM`). */
export function esPeriodoValido(valor: string): valor is Periodo {
  return PATRON.test(valor)
}

/** Convierte un texto a periodo, o lanza `PeriodoInvalidoError`. */
export function aPeriodo(valor: string): Periodo {
  if (!esPeriodoValido(valor)) throw new PeriodoInvalidoError(valor)
  return valor
}

/** Construye un periodo a partir de ano y mes (mes de 1 a 12). */
export function crearPeriodo(anio: number, mes: number): Periodo {
  if (!Number.isInteger(anio) || anio < 1900 || anio > 9999) {
    throw new PeriodoInvalidoError(`${anio}-${mes}`)
  }
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new PeriodoInvalidoError(`${anio}-${mes}`)
  }
  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}`
}

/** Periodo al que pertenece una fecha, en hora local. */
export function periodoDeFecha(fecha: Date): Periodo {
  return crearPeriodo(fecha.getFullYear(), fecha.getMonth() + 1)
}

/** Periodo del mes en curso. */
export function periodoActual(): Periodo {
  return periodoDeFecha(new Date())
}

/** Ano de un periodo. */
export function anioDe(periodo: Periodo): number {
  const coincidencia = PATRON.exec(periodo)
  if (!coincidencia?.[1]) throw new PeriodoInvalidoError(periodo)
  return Number(coincidencia[1])
}

/** Mes de un periodo, de 1 a 12. */
export function mesDe(periodo: Periodo): number {
  const coincidencia = PATRON.exec(periodo)
  if (!coincidencia?.[2]) throw new PeriodoInvalidoError(periodo)
  return Number(coincidencia[2])
}

/** Desplaza un periodo en meses. Acepta desplazamientos negativos. */
export function sumarMeses(periodo: Periodo, meses: number): Periodo {
  const total = anioDe(periodo) * 12 + (mesDe(periodo) - 1) + meses
  return crearPeriodo(Math.floor(total / 12), (total % 12) + 1)
}

/** Compara dos periodos: negativo si `a` es anterior, 0 si son iguales. */
export function compararPeriodos(a: Periodo, b: Periodo): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Cantidad de meses entre dos periodos (`hasta - desde`). */
export function mesesEntre(desde: Periodo, hasta: Periodo): number {
  return anioDe(hasta) * 12 + mesDe(hasta) - (anioDe(desde) * 12 + mesDe(desde))
}

/** Lista continua de periodos, ambos extremos incluidos. */
export function rangoDePeriodos(desde: Periodo, hasta: Periodo): Periodo[] {
  const total = mesesEntre(desde, hasta)
  if (total < 0) return []
  return Array.from({ length: total + 1 }, (_, i) => sumarMeses(desde, i))
}

/** Los `n` periodos que terminan en `hasta`, en orden cronologico. */
export function ultimosPeriodos(hasta: Periodo, n: number): Periodo[] {
  if (n <= 0) return []
  return rangoDePeriodos(sumarMeses(hasta, -(n - 1)), hasta)
}

/** Los 12 periodos del ano de un periodo dado. */
export function periodosDelAnio(anio: number): Periodo[] {
  return Array.from({ length: 12 }, (_, i) => crearPeriodo(anio, i + 1))
}

/** Mismo mes del ano anterior. */
export function mismoMesAnioAnterior(periodo: Periodo): Periodo {
  return sumarMeses(periodo, -12)
}

/** `2026-08` -> `Agosto 2026`. */
export function formatearPeriodo(periodo: Periodo): string {
  const nombre = NOMBRES_MES[mesDe(periodo) - 1]
  if (!nombre) throw new PeriodoInvalidoError(periodo)
  return `${nombre} ${anioDe(periodo)}`
}

/** `2026-08` -> `Ago 2026`. */
export function formatearPeriodoCorto(periodo: Periodo): string {
  const nombre = NOMBRES_MES[mesDe(periodo) - 1]
  if (!nombre) throw new PeriodoInvalidoError(periodo)
  return `${nombre.slice(0, 3)} ${anioDe(periodo)}`
}

/** `2026-08` -> `Agosto`. */
export function nombreDelMes(periodo: Periodo): string {
  const nombre = NOMBRES_MES[mesDe(periodo) - 1]
  if (!nombre) throw new PeriodoInvalidoError(periodo)
  return nombre
}
