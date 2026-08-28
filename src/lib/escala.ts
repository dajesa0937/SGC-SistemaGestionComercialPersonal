/** Geometría de ejes para gráficas dibujadas a mano. */

/**
 * Elige un tope de eje y unos cortes "redondos".
 *
 * Un eje que termina en 39.200.000 y marca 9.800.000 obliga a leer cifras que
 * nadie tiene en la cabeza. Se sube al siguiente número redondo (1, 2, 2,5 o 5
 * por potencia de diez) para que los cortes sean legibles de un vistazo.
 */
export function ticksBonitos(maximo: number, cantidad = 4): { tope: number; ticks: number[] } {
  if (!Number.isFinite(maximo) || maximo <= 0) {
    return { tope: 1, ticks: [0, 1] }
  }

  const pasoCrudo = maximo / cantidad
  const magnitud = 10 ** Math.floor(Math.log10(pasoCrudo))
  const normalizado = pasoCrudo / magnitud

  const multiplicador = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 2.5 ? 2.5 : normalizado <= 5 ? 5 : 10
  const paso = multiplicador * magnitud
  const tope = Math.ceil(maximo / paso) * paso

  const ticks: number[] = []
  for (let valor = 0; valor <= tope + paso / 2; valor += paso) {
    ticks.push(Math.round(valor))
  }

  return { tope: Math.round(tope), ticks }
}

/** Convierte un valor a coordenada vertical dentro del área de dibujo. */
export function aY(valor: number, tope: number, alto: number, margenSuperior = 0): number {
  if (tope <= 0) return alto + margenSuperior
  const proporcion = Math.min(1, Math.max(0, valor / tope))
  return margenSuperior + alto - proporcion * alto
}
