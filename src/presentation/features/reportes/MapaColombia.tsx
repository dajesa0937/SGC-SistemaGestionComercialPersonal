import { useId } from 'react'
import { DEPARTAMENTOS_MAPA, VISTA_MAPA } from '@/domain/geografia/mapa.generado'
import type { CoberturaTerritorial } from '@/application/indicadores/coberturaTerritorial'
import { nivelDeMapa, tramosDeLeyenda } from '@/application/indicadores/coberturaTerritorial'
import { formatearNumero } from '@/lib/formato'
import { separarEtiquetas } from './separarEtiquetas'

const RELLENO = [
  'var(--color-mapa-0)',
  'var(--color-mapa-1)',
  'var(--color-mapa-2)',
  'var(--color-mapa-3)',
  'var(--color-mapa-4)',
] as const

interface Props {
  cobertura: CoberturaTerritorial
  /** En impresión no hay cursor, así que tampoco hay títulos emergentes. */
  paraImprimir?: boolean
}

/**
 * Mapa de cobertura: los departamentos coloreados según cuántos clientes hay.
 *
 * Coroplético y no puntos porque no existe la coordenada de cada municipio en
 * ninguna fuente libre, y colocarlos a ojo sería un mapa que se ve bien y
 * miente. El detalle por municipio vive en la tabla de al lado, que es exacto.
 *
 * Las cifras van dentro de una pastilla del color de la superficie y no
 * directamente sobre el relleno: así su legibilidad no depende del tono que le
 * haya tocado al departamento, ni en claro ni en oscuro.
 *
 * Geometría: «Map of Colombia» de VictorCazanave/svg-maps, CC BY 4.0. El
 * crédito es obligatorio y se muestra bajo el mapa.
 */
export function MapaColombia({ cobertura, paraImprimir = false }: Props) {
  const idTitulo = useId()
  const porCodigo = new Map(cobertura.departamentos.map((d) => [d.clave, d]))
  const tramos = tramosDeLeyenda(cobertura.maximoPorDepartamento)

  // Los seis departamentos de la costa caribe son pequeños y están pegados: sin
  // separar, sus cifras se montan unas sobre otras.
  const etiquetas = separarEtiquetas(
    DEPARTAMENTOS_MAPA.filter((d) => (porCodigo.get(d.codigo)?.clientes ?? 0) > 0).map(
      (departamento) => {
        const fila = porCodigo.get(departamento.codigo)!
        const texto = formatearNumero(fila.clientes)
        return {
          clave: departamento.codigo,
          x: departamento.cx,
          y: departamento.cy,
          ancho: 18 + texto.length * 8,
          alto: 24,
          peso: fila.clientes,
        }
      },
    ),
  )

  return (
    <figure className="m-0 flex flex-col gap-3">
      <svg
        viewBox={VISTA_MAPA}
        className="mx-auto w-full max-w-sm"
        role="img"
        aria-labelledby={idTitulo}
      >
        <title id={idTitulo}>
          Mapa de Colombia con los clientes por departamento.{' '}
          {cobertura.departamentos
            .map((d) => `${d.nombre}: ${d.clientes}`)
            .join('. ')}
        </title>

        {DEPARTAMENTOS_MAPA.map((departamento) => {
          const fila = porCodigo.get(departamento.codigo)
          const nivel = nivelDeMapa(fila?.clientes ?? 0, cobertura.maximoPorDepartamento)
          return (
            <path
              key={departamento.codigo}
              d={departamento.path}
              fill={RELLENO[nivel]}
              stroke="var(--color-mapa-borde)"
              strokeWidth={0.8}
              strokeLinejoin="round"
            >
              {paraImprimir || !fila ? null : (
                <title>{`${fila.nombre}: ${formatearNumero(fila.clientes)} clientes`}</title>
              )}
            </path>
          )
        })}

        {/* Solo se etiqueta lo que tiene datos: poner los 33 números convierte
            el mapa en una sopa de cifras y esconde justo lo que importa. */}
        {etiquetas.map((etiqueta) => {
          const fila = porCodigo.get(etiqueta.clave)!
          return (
            <g key={`etiqueta-${etiqueta.clave}`}>
              <rect
                x={etiqueta.x - etiqueta.ancho / 2}
                y={etiqueta.y - etiqueta.alto / 2}
                width={etiqueta.ancho}
                height={etiqueta.alto}
                rx={etiqueta.alto / 2}
                fill="var(--color-superficie)"
                stroke="var(--color-borde)"
                strokeWidth={1}
              />
              <text
                x={etiqueta.x}
                y={etiqueta.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={15}
                fontWeight={600}
                fill="var(--color-texto)"
              >
                {formatearNumero(fila.clientes)}
              </text>
            </g>
          )
        })}
      </svg>

      {tramos.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-suave">
          <span className="whitespace-nowrap">Clientes</span>
          {tramos.map((tramo, indice) => (
            <span key={tramo} className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="inline-block size-3 rounded-sm border border-borde"
                style={{ background: RELLENO[indice + 1] }}
                aria-hidden="true"
              />
              {tramo}
            </span>
          ))}
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className="inline-block size-3 rounded-sm border border-borde"
              style={{ background: RELLENO[0] }}
              aria-hidden="true"
            />
            sin clientes
          </span>
        </div>
      ) : null}

      <figcaption className="text-center text-xs text-tenue">
        Geometría del mapa:{' '}
        <a
          href="https://github.com/VictorCazanave/svg-maps"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          VictorCazanave/svg-maps
        </a>
        , licencia CC BY 4.0.
      </figcaption>
    </figure>
  )
}
