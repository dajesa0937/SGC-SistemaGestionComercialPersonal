import { useState } from 'react'
import type { PuntoSerie } from '@/application/indicadores/construirSerie12Meses'
import { aY, ticksBonitos } from '@/lib/escala'
import { formatearPesos, formatearPesosCorto, formatearPorcentaje } from '@/lib/formato'

interface Props {
  serie: readonly PuntoSerie[]
}

// Lienzo en coordenadas fijas: el SVG escala solo con viewBox, sin necesidad de
// medir el contenedor ni de una librería de gráficas.
const ANCHO = 720
const ALTO = 240
const MARGEN = { arriba: 8, derecha: 4, abajo: 22, izquierda: 58 }
const AREA_ANCHO = ANCHO - MARGEN.izquierda - MARGEN.derecha
const AREA_ALTO = ALTO - MARGEN.arriba - MARGEN.abajo

/**
 * Ventas mensuales contra la meta, dibujada a mano en SVG.
 *
 * Se dibuja a mano y no con una librería de gráficas por la misma razón que las
 * minigráficas de la tabla: traer cien kilobytes comprimidos para doce barras y
 * una línea es un mal negocio en una aplicación que precachea todo para
 * funcionar sin conexión. Ver ADR 0005.
 *
 * Las dos magnitudes están en pesos y comparten un único eje: un segundo eje
 * con otra escala haría que dos alturas iguales significaran cosas distintas.
 *
 * La meta se distingue por forma —línea discontinua frente a barras— y no por
 * color: el acento y el gris del tema no son distinguibles bajo protanopía, así
 * que la identidad no puede depender del tono.
 */
export function GraficaAnual({ serie }: Props) {
  const [activo, setActivo] = useState<number | null>(null)

  const maximo = Math.max(0, ...serie.map((p) => Math.max(p.vendido, p.meta ?? 0)))
  const { tope, ticks } = ticksBonitos(maximo)

  const paso = AREA_ANCHO / Math.max(1, serie.length)
  const anchoBarra = Math.min(34, paso * 0.6)

  const xCentro = (i: number) => MARGEN.izquierda + paso * i + paso / 2
  const y = (valor: number) => aY(valor, tope, AREA_ALTO, MARGEN.arriba)

  // La meta se traza como escalón: cada mes tiene su propia cuota y una línea
  // suave insinuaría valores intermedios que no existen.
  const tramosMeta = serie
    .map((punto, i) =>
      punto.meta === null
        ? null
        : `M ${MARGEN.izquierda + paso * i} ${y(punto.meta)} H ${MARGEN.izquierda + paso * (i + 1)}`,
    )
    .filter((t): t is string => t !== null)
    .join(' ')

  const punto = activo === null ? undefined : serie[activo]

  return (
    <div className="rounded-panel border border-borde bg-superficie p-4 no-cortar">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-texto">Ventas contra meta · últimos 12 meses</h2>
        <div className="flex items-center gap-4 text-xs text-suave">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-2.5 w-3 rounded-sm bg-acento" />
            Vendido
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="18" height="3" aria-hidden="true">
              <line
                x1="0"
                y1="1.5"
                x2="18"
                y2="1.5"
                stroke="var(--sgc-texto)"
                strokeWidth="2"
                strokeDasharray="5 3"
              />
            </svg>
            Meta
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="w-full"
          role="img"
          aria-label="Ventas mensuales contra la meta de los últimos doce meses"
          onMouseLeave={() => setActivo(null)}
        >
          {ticks.map((valor) => (
            <g key={valor}>
              <line
                x1={MARGEN.izquierda}
                x2={ANCHO - MARGEN.derecha}
                y1={y(valor)}
                y2={y(valor)}
                stroke="var(--sgc-borde-suave)"
                strokeWidth={1}
              />
              <text
                x={MARGEN.izquierda - 8}
                y={y(valor)}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--sgc-texto-tenue)"
                fontSize={11}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {valor === 0 ? '0' : formatearPesosCorto(valor)}
              </text>
            </g>
          ))}

          {serie.map((p, i) => (
            <g key={p.periodo}>
              {/* Zona sensible del ancho completo de la columna: apuntar a una
                  barra baja sería innecesariamente difícil. */}
              <rect
                x={MARGEN.izquierda + paso * i}
                y={MARGEN.arriba}
                width={paso}
                height={AREA_ALTO}
                fill="transparent"
                onMouseEnter={() => setActivo(i)}
              />
              {p.vendido > 0 ? (
                <rect
                  x={xCentro(i) - anchoBarra / 2}
                  y={y(p.vendido)}
                  width={anchoBarra}
                  height={Math.max(2, MARGEN.arriba + AREA_ALTO - y(p.vendido))}
                  rx={4}
                  fill="var(--sgc-acento)"
                  opacity={activo === null || activo === i ? 1 : 0.55}
                  pointerEvents="none"
                />
              ) : null}
              <text
                x={xCentro(i)}
                y={ALTO - 6}
                textAnchor="middle"
                fill={activo === i ? 'var(--sgc-texto)' : 'var(--sgc-texto-tenue)'}
                fontSize={11}
                pointerEvents="none"
              >
                {p.etiqueta.split(' ')[0]}
              </text>
            </g>
          ))}

          {tramosMeta ? (
            <path
              d={tramosMeta}
              fill="none"
              stroke="var(--sgc-texto)"
              strokeWidth={2}
              strokeDasharray="5 3"
              strokeLinecap="round"
              pointerEvents="none"
            />
          ) : null}

          <line
            x1={MARGEN.izquierda}
            x2={ANCHO - MARGEN.derecha}
            y1={MARGEN.arriba + AREA_ALTO}
            y2={MARGEN.arriba + AREA_ALTO}
            stroke="var(--sgc-borde)"
            strokeWidth={1}
          />
        </svg>

        {punto ? (
          <div
            role="status"
            className="pointer-events-none absolute top-2 rounded-md border border-borde bg-superficie px-3 py-2 shadow-lg"
            style={{
              left: `${((xCentro(activo ?? 0) / ANCHO) * 100).toFixed(2)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-xs font-medium whitespace-nowrap text-texto">{punto.etiqueta}</p>
            <p className="cifra mt-0.5 text-sm whitespace-nowrap text-texto">
              {formatearPesos(punto.vendido)}
            </p>
            {punto.meta === null ? (
              <p className="text-xs whitespace-nowrap text-tenue">Sin meta definida</p>
            ) : (
              <p className="cifra text-xs whitespace-nowrap text-suave">
                Meta {formatearPesos(punto.meta)}
                {punto.cumplimiento === null ? '' : ` · ${formatearPorcentaje(punto.cumplimiento)}`}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Los mismos datos en tabla: la gráfica no puede ser la única vía de
          acceso a la información, y además es lo que sale al imprimir. */}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs text-tenue hover:text-texto">
          Ver los datos en tabla
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-borde">
                <th className="py-1.5 pr-3 text-left font-medium text-tenue">Mes</th>
                <th className="py-1.5 pr-3 text-right font-medium text-tenue">Vendido</th>
                <th className="py-1.5 pr-3 text-right font-medium text-tenue">Meta</th>
                <th className="py-1.5 text-right font-medium text-tenue">Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {serie.map((p) => (
                <tr key={p.periodo} className="border-b border-borde-suave last:border-b-0">
                  <td className="py-1 pr-3 text-texto">{p.etiqueta}</td>
                  <td className="cifra py-1 pr-3 text-right text-suave">
                    {formatearPesos(p.vendido)}
                  </td>
                  <td className="cifra py-1 pr-3 text-right text-suave">
                    {p.meta === null ? '—' : formatearPesos(p.meta)}
                  </td>
                  <td className="cifra py-1 text-right text-suave">
                    {p.cumplimiento === null ? '—' : formatearPorcentaje(p.cumplimiento)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
