import type { PuenteDeVentas as Puente } from '@/application/indicadores/puenteDeVentas'
import { formatearPeriodoCorto } from '@/domain/shared/periodo'
import { formatearPesosCorto } from '@/lib/formato'

const ANCHO = 640
const ALTO = 170
const MARGEN = { arriba: 22, abajo: 28 }
const AREA = ALTO - MARGEN.arriba - MARGEN.abajo

interface Tramo {
  readonly etiqueta: string
  readonly valor: number
  readonly tipo: 'total' | 'suma' | 'resta'
}

/**
 * Puente de ventas: de lo del mes pasado a lo de este, tramo a tramo.
 *
 * Es un gráfico de cascada dibujado a mano, como el resto (ADR 0005). Las
 * barras intermedias flotan a la altura del acumulado, que es justo lo que
 * convierte una lista de cifras en una explicación: se ve de dónde sale cada
 * peso de la diferencia.
 *
 * Los aportes y las restas se distinguen por color Y por el signo escrito
 * encima, nunca solo por color.
 */
export function PuenteDeVentas({ puente }: { puente: Puente }) {
  const tramos: Tramo[] = [
    { etiqueta: formatearPeriodoCorto(puente.periodoAnterior), valor: puente.base, tipo: 'total' },
    { etiqueta: 'Nuevos', valor: puente.nuevos, tipo: 'suma' },
    { etiqueta: 'Volvieron', valor: puente.recuperados, tipo: 'suma' },
    { etiqueta: 'Crecieron', valor: puente.crecimiento, tipo: 'suma' },
    { etiqueta: 'Cayeron', valor: puente.contraccion, tipo: 'resta' },
    { etiqueta: 'Se fueron', valor: puente.perdidos, tipo: 'resta' },
    { etiqueta: formatearPeriodoCorto(puente.periodo), valor: puente.final, tipo: 'total' },
  ]

  // La escala tiene que cubrir el recorrido completo del acumulado, no solo los
  // extremos: un tramo intermedio puede subir por encima de los dos totales.
  let acumulado = 0
  const recorrido = [0]
  for (const tramo of tramos) {
    if (tramo.tipo === 'total') acumulado = tramo.valor
    else acumulado += tramo.valor
    recorrido.push(acumulado)
  }
  const tope = Math.max(...recorrido, 1)
  const y = (valor: number) => MARGEN.arriba + AREA - (valor / tope) * AREA
  const paso = ANCHO / tramos.length
  const ancho = paso * 0.58

  let cursor = 0

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" role="img" aria-label="Puente de ventas">
      <line
        x1={0}
        x2={ANCHO}
        y1={MARGEN.arriba + AREA}
        y2={MARGEN.arriba + AREA}
        stroke="var(--color-borde)"
        strokeWidth={1}
      />

      {tramos.map((tramo, i) => {
        const x = paso * i + (paso - ancho) / 2
        let desde: number
        let hasta: number

        if (tramo.tipo === 'total') {
          desde = 0
          hasta = tramo.valor
          cursor = tramo.valor
        } else {
          desde = cursor
          hasta = cursor + tramo.valor
          cursor = hasta
        }

        const arriba = Math.max(desde, hasta)
        const abajo = Math.min(desde, hasta)
        const alto = Math.max(1.5, y(abajo) - y(arriba))
        const relleno =
          tramo.tipo === 'total'
            ? 'var(--color-acento)'
            : tramo.tipo === 'suma'
              ? 'var(--color-exito)'
              : 'var(--color-peligro)'
        const signo = tramo.tipo === 'suma' ? '+' : tramo.tipo === 'resta' ? '−' : ''

        return (
          <g key={tramo.etiqueta}>
            <rect x={x} y={y(arriba)} width={ancho} height={alto} rx={2.5} fill={relleno} />
            <text
              x={x + ancho / 2}
              y={y(arriba) - 5}
              textAnchor="middle"
              fontSize={9.5}
              fill="var(--color-texto)"
            >
              {tramo.valor === 0 ? '—' : `${signo}${formatearPesosCorto(Math.abs(tramo.valor))}`}
            </text>
            <text
              x={x + ancho / 2}
              y={ALTO - 10}
              textAnchor="middle"
              fontSize={9}
              fill="var(--color-suave)"
            >
              {tramo.etiqueta}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
