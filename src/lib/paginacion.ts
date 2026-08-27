export interface Pagina<T> {
  readonly items: readonly T[]
  readonly pagina: number
  readonly totalPaginas: number
  readonly totalItems: number
  readonly desde: number
  readonly hasta: number
}

/**
 * Corta una lista en paginas.
 *
 * Corrige la pagina fuera de rango en lugar de devolver vacio: al filtrar
 * estando en la pagina 4 es normal quedarse sin resultados, y mostrar una
 * tabla vacia cuando si hay coincidencias es desconcertante.
 */
export function paginar<T>(items: readonly T[], pagina: number, porPagina: number): Pagina<T> {
  const totalItems = items.length
  const totalPaginas = Math.max(1, Math.ceil(totalItems / porPagina))
  const actual = Math.min(Math.max(1, Math.trunc(pagina) || 1), totalPaginas)
  const inicio = (actual - 1) * porPagina

  return {
    items: items.slice(inicio, inicio + porPagina),
    pagina: actual,
    totalPaginas,
    totalItems,
    desde: totalItems === 0 ? 0 : inicio + 1,
    hasta: Math.min(inicio + porPagina, totalItems),
  }
}
