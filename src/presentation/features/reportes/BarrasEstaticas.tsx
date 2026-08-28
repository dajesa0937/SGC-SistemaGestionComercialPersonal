import type { PuntoSerie } from '@/application/indicadores/construirSerie12Meses'
import { aY, ticksBonitos } from '@/lib/escala'
import { formatearPesosCorto } from '@/lib/formato'

const ANCHO = 700
const ALTO = 150
const MARGEN = { arriba: 6, abajo: 18, izquierda: 54 }
const AREA_ALTO = ALTO - MARGEN.arriba - MARGEN.abajo
const AREA_ANCHO = ANCHO - MARGEN.izquierda

/**
 * Versión sin interacción de la gráfica del panel, para papel.
 *
 * En impresión no hay cursor: los tramos de meta y las cifras exactas viven en
 * la tabla que acompaña al gráfico, no en un tooltip que nadie podrá abrir.
 */
export function BarrasEstaticas({ serie }: { serie: readonly PuntoSerie[] }) {
  const maximo = Math.max(0, ...serie.map((p) => Math.max(p.vendido, p.meta ?? 0)))
  const { tope, ticks } = ticksBonitos(maximo, 3)
  const paso = AREA_ANCHO / Math.max(1, serie.length)
  const y = (valor: number) => aY(valor, tope, AREA_ALTO, MARGEN.arriba)

  const tramosMeta = serie
    .map((p, i) =>
      p.meta === null
        ? null
        : `M ${MARGEN.izquierda + paso * i} ${y(p.meta)} H ${MARGEN.izquierda + paso * (i + 1)}`,
    )
    .filter((t): t is string => t !== null)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" role="img" aria-label="Ventas contra meta">
      {ticks.map((valor) => (
        <g key={valor}>
          <line
            x1={MARGEN.izquierda}
            x2={ANCHO}
            y1={y(valor)}
            y2={y(valor)}
            stroke="#d8d8d8"
            strokeWidth={0.75}
          />
          <text x={MARGEN.izquierda - 6} y={y(valor)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#666">
            {valor === 0 ? '0' : formatearPesosCorto(valor)}
          </text>
        </g>
      ))}

      {serie.map((p, i) =>
        p.vendido > 0 ? (
          <rect
            key={p.periodo}
            x={MARGEN.izquierda + paso * i + paso * 0.22}
            y={y(p.vendido)}
            width={paso * 0.56}
            height={Math.max(1.5, MARGEN.arriba + AREA_ALTO - y(p.vendido))}
            rx={2}
            fill="#0e6a62"
          />
        ) : null,
      )}

      {tramosMeta ? (
        <path d={tramosMeta} fill="none" stroke="#111" strokeWidth={1.4} strokeDasharray="4 2.5" />
      ) : null}

      {serie.map((p, i) => (
        <text
          key={`e-${p.periodo}`}
          x={MARGEN.izquierda + paso * i + paso / 2}
          y={ALTO - 5}
          textAnchor="middle"
          fontSize={8.5}
          fill="#666"
        >
          {p.etiqueta.split(' ')[0]}
        </text>
      ))}
    </svg>
  )
}
