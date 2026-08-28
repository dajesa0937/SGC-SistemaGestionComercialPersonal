interface Props {
  valores: readonly number[]
  ancho?: number
  alto?: number
  titulo?: string
}

/**
 * Minigráfica de tendencia en SVG puro.
 *
 * No usa la librería de gráficas a propósito: instanciar un componente de
 * Recharts en cada fila de una tabla de cien clientes es un desperdicio de
 * renderizado para dibujar una polilínea de doce puntos.
 */
export function MiniGrafica({ valores, ancho = 72, alto = 20, titulo }: Props) {
  if (valores.length < 2) return <span className="text-tenue">—</span>

  const maximo = Math.max(...valores)
  if (maximo <= 0) return <span className="text-tenue">—</span>

  const paso = ancho / (valores.length - 1)
  const margen = 2
  const util = alto - margen * 2

  const puntos = valores
    .map((valor, i) => `${(i * paso).toFixed(1)},${(margen + util - (valor / maximo) * util).toFixed(1)}`)
    .join(' ')

  const ultimo = valores[valores.length - 1] ?? 0

  return (
    <svg
      width={ancho}
      height={alto}
      viewBox={`0 0 ${ancho} ${alto}`}
      role="img"
      aria-label={titulo ?? 'Tendencia de los últimos doce meses'}
      className="overflow-visible"
    >
      <polyline
        points={puntos}
        fill="none"
        stroke="var(--sgc-acento)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* El extremo se resalta: es el mes que se está mirando. */}
      <circle
        cx={ancho}
        cy={margen + util - (ultimo / maximo) * util}
        r={2}
        fill="var(--sgc-acento)"
      />
    </svg>
  )
}
