/**
 * Tipos primitivos del dominio.
 *
 * Son alias nominales por convencion, no por el sistema de tipos: la validacion
 * ocurre en las funciones constructoras de cada modulo (ver `periodo.ts`).
 */

/** Identificador unico. UUID v4 generado con `crypto.randomUUID()`. */
export type Id = string

/**
 * Periodo mensual en formato `YYYY-MM`.
 *
 * Se modela como texto y no como `Date` a proposito: es ordenable
 * lexicograficamente, indexable, comparable y no tiene ambiguedad de zona
 * horaria. Representar un mes con `Date` es una fuente clasica de errores
 * de un dia de diferencia.
 */
export type Periodo = string

/** Importe en pesos colombianos. Entero: el peso no usa centavos. */
export type Pesos = number

/** Fecha en formato `YYYY-MM-DD`. */
export type FechaISO = string

/** Marca de tiempo completa en ISO 8601. */
export type InstanteISO = string

/** Genera un identificador nuevo. */
export function nuevoId(): Id {
  return crypto.randomUUID()
}

/** Fecha de hoy en formato `YYYY-MM-DD`, en hora local. */
export function hoyISO(): FechaISO {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** Instante actual en ISO 8601. */
export function ahoraISO(): InstanteISO {
  return new Date().toISOString()
}
