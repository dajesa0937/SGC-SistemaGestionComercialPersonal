import type { FechaISO } from './types'

/**
 * Dias completos entre dos fechas `YYYY-MM-DD`.
 *
 * Se construyen en UTC a proposito. Con `new Date('2026-05-25')` el navegador
 * interpreta la cadena como medianoche UTC pero `new Date(2026, 4, 25)` la
 * interpreta como medianoche local; mezclar las dos formas produce diferencias
 * de un dia que aparecen solo en algunos husos horarios. Aqui las dos fechas
 * pasan por el mismo camino, asi que la resta es exacta.
 */
export function diasEntre(desde: FechaISO, hasta: FechaISO): number {
  const a = Date.parse(`${desde.slice(0, 10)}T00:00:00Z`)
  const b = Date.parse(`${hasta.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN
  return Math.round((b - a) / 86_400_000)
}
