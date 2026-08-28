import type { Pesos } from '@/domain/shared/types'

const MONEDA = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const ENTERO = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

/** `8200000` -> `$ 8.200.000`. Cero decimales siempre. */
export function formatearPesos(valor: Pesos): string {
  return MONEDA.format(valor).replace(/\u00a0/g, ' ')
}

/**
 * Version abreviada para tarjetas de indicador: `8200000` -> `$ 8,2 M`.
 *
 * Se usa solo donde el espacio manda; en tablas siempre va la cifra completa,
 * porque el usuario necesita poder comparar y sumar mentalmente.
 */
export function formatearPesosCorto(valor: Pesos): string {
  const signo = valor < 0 ? '-' : ''
  const abs = Math.abs(valor)
  if (abs >= 1_000_000_000) return `${signo}$ ${redondear(abs / 1_000_000_000)} MM`
  if (abs >= 1_000_000) return `${signo}$ ${redondear(abs / 1_000_000)} M`
  if (abs >= 1_000) return `${signo}$ ${redondear(abs / 1_000)} K`
  return `${signo}$ ${ENTERO.format(abs)}`
}

function redondear(valor: number): string {
  const decimales = valor >= 100 ? 0 : 1
  return valor.toFixed(decimales).replace('.', ',').replace(/,0$/, '')
}

/** `0.784` -> `78,4 %`. */
export function formatearPorcentaje(fraccion: number, decimales = 1): string {
  return `${(fraccion * 100).toFixed(decimales).replace('.', ',')} %`
}

/** `0.15` -> `+15,0 %`, `-0.08` -> `-8,0 %`. */
export function formatearVariacion(fraccion: number | null, decimales = 1): string {
  if (fraccion === null || !Number.isFinite(fraccion)) return '—'
  const signo = fraccion > 0 ? '+' : ''
  return `${signo}${(fraccion * 100).toFixed(decimales).replace('.', ',')} %`
}

/** Numero entero con separador de miles. */
export function formatearNumero(valor: number): string {
  return ENTERO.format(valor)
}

/** `2026-08-27` -> `27 de agosto de 2026`. */
export function formatearFecha(fechaISO: string): string {
  // Una marca de tiempo completa esta en UTC: hay que convertirla a hora local
  // antes de quedarse con el dia. Cortar los diez primeros caracteres mostraria
  // el 28 para algo ocurrido el 27 a las nueve de la noche en Colombia.
  if (fechaISO.includes('T')) {
    const instante = new Date(fechaISO)
    if (Number.isNaN(instante.getTime())) return fechaISO
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(instante)
  }

  const [anio, mes, dia] = fechaISO.split('-').map(Number)
  if (!anio || !mes || !dia) return fechaISO
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(anio, mes - 1, dia))
}

/** Fecha y hora de una marca de tiempo, en hora local. */
export function formatearInstante(instanteISO: string): string {
  const instante = new Date(instanteISO)
  if (Number.isNaN(instante.getTime())) return instanteISO
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(instante)
}

/**
 * Quita tildes, pasa a mayusculas, sustituye la puntuacion por espacios y los
 * colapsa. Base comun para comparar encabezados de columna y para buscar.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[.,;:()"'_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normaliza un nombre para conciliar clientes entre el archivo y la base.
 *
 * Ademas de lo anterior elimina los sufijos societarios mas comunes, que son
 * la causa habitual de que un mismo cliente aparezca escrito de dos formas
 * distintas en el archivo que envia la empresa.
 */
export function normalizarParaConciliar(texto: string): string {
  return normalizarTexto(texto)
    .replace(/\b(S\s?A\s?S|SAS|LTDA|S\s?A|E\s?U|SCA|CIA|Y\s?CIA)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
