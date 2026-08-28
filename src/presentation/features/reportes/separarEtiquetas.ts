export interface EtiquetaColocada {
  readonly clave: string
  readonly x: number
  readonly y: number
  readonly ancho: number
  readonly alto: number
}

export interface EtiquetaPorColocar {
  readonly clave: string
  /** Posición ideal: el centro del departamento. */
  readonly x: number
  readonly y: number
  readonly ancho: number
  readonly alto: number
  /** A mayor peso, más derecho tiene a quedarse donde le toca. */
  readonly peso: number
}

function seSolapan(a: EtiquetaColocada, b: EtiquetaColocada, margen: number): boolean {
  return (
    Math.abs(a.x - b.x) * 2 < a.ancho + b.ancho + margen &&
    Math.abs(a.y - b.y) * 2 < a.alto + b.alto + margen
  )
}

/**
 * Aparta las etiquetas que se pisan.
 *
 * En la costa caribe hay seis departamentos pequeños y pegados, y sus etiquetas
 * se montan unas sobre otras. Corregirlo desplazando cada una a mano funcionaría
 * hoy y se rompería en cuanto el usuario abriera un cliente en un departamento
 * nuevo, así que se resuelve con una regla.
 *
 * La regla: se colocan primero las de más peso —las que más clientes
 * representan— y cada una que choque se empuja en la dirección contraria a la
 * que ya estaba, en pasos pequeños. Es determinista: los mismos datos dan
 * siempre el mismo mapa.
 *
 * El desplazamiento se limita para que la etiqueta no acabe lejos de su
 * departamento. Preferible un solape pequeño a una cifra señalando otro sitio.
 */
export function separarEtiquetas(
  etiquetas: readonly EtiquetaPorColocar[],
  { margen = 1, paso = 3, maximo = 26 } = {},
): readonly EtiquetaColocada[] {
  const ordenadas = [...etiquetas].sort(
    (a, b) => b.peso - a.peso || a.clave.localeCompare(b.clave),
  )
  const colocadas: EtiquetaColocada[] = []

  for (const etiqueta of ordenadas) {
    let x = etiqueta.x
    let y = etiqueta.y

    for (let intento = 0; intento < Math.ceil(maximo / paso); intento++) {
      const actual = { clave: etiqueta.clave, x, y, ancho: etiqueta.ancho, alto: etiqueta.alto }
      const choque = colocadas.find((otra) => seSolapan(actual, otra, margen))
      if (!choque) break

      const dx = x - choque.x
      const dy = y - choque.y
      // Si coinciden exactamente, se desempata hacia abajo: cualquier dirección
      // fija sirve mientras sea siempre la misma.
      const distancia = Math.hypot(dx, dy) || 1
      const ux = distancia === 1 && dx === 0 && dy === 0 ? 0 : dx / distancia
      const uy = distancia === 1 && dx === 0 && dy === 0 ? 1 : dy / distancia
      x += ux * paso
      y += uy * paso

      if (Math.hypot(x - etiqueta.x, y - etiqueta.y) > maximo) {
        x = etiqueta.x + (ux * maximo)
        y = etiqueta.y + (uy * maximo)
        break
      }
    }

    colocadas.push({
      clave: etiqueta.clave,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      ancho: etiqueta.ancho,
      alto: etiqueta.alto,
    })
  }

  return colocadas
}
