import type { ClienteDelPlan, PlanDeVisitas } from '@/application/visitas/planDeVisitas'
import { etiquetaMunicipio } from '@/domain/geografia/geografia'
import { EncabezadoImpresion } from '@/presentation/components/shared/HojaImpresion'
import { formatearFecha, formatearNumero, formatearPesos, formatearVariacion } from '@/lib/formato'
import { hoyISO } from '@/domain/shared/types'
import { ETIQUETA_ABC } from '../clientes/etiquetas'
import { ETIQUETA_TENDENCIA } from './etiquetas'

interface Props {
  filas: readonly ClienteDelPlan[]
  plan: PlanDeVisitas
}

/**
 * Hoja de ruta para llevar en la mano.
 *
 * Va agrupada por municipio y no por prioridad: en la calle el orden lo manda
 * la carretera. La prioridad ya decidió QUIÉNES entran a la hoja; una vez
 * decidido, ir saltando de un pueblo a otro para respetar un ranking es perder
 * la mañana conduciendo.
 *
 * Cada cliente lleva una línea en blanco para escribir lo que pase en la visita.
 */
export function HojaDeRuta({ filas, plan }: Props) {
  const porMunicipio = new Map<string, ClienteDelPlan[]>()
  for (const fila of filas) {
    const clave = etiquetaMunicipio(fila.cliente.municipio)
    const lista = porMunicipio.get(clave) ?? []
    lista.push(fila)
    porMunicipio.set(clave, lista)
  }

  const grupos = [...porMunicipio.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'es-CO'),
  )

  return (
    <div className="hoja">
      <EncabezadoImpresion
        titulo="Hoja de ruta"
        subtitulo={`${formatearNumero(filas.length)} visitas · agrupadas por municipio`}
        detalle={formatearFecha(hoyISO())}
      />

      {grupos.map(([municipio, clientes]) => (
        <section key={municipio} className="mb-4 break-inside-avoid">
          <h3 className="mb-1.5 border-b border-borde-suave pb-1 text-sm font-medium text-texto">
            {municipio}
            <span className="ml-2 text-xs font-normal text-tenue">
              {clientes.length} {clientes.length === 1 ? 'visita' : 'visitas'}
            </span>
          </h3>

          {clientes.map((fila) => (
            <div key={fila.cliente.id} className="mb-2.5 break-inside-avoid">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-texto">
                  {fila.cliente.nombre}
                  <span className="ml-2 text-xs font-normal text-suave">
                    {ETIQUETA_ABC[fila.cliente.clasificacion]} ·{' '}
                    {ETIQUETA_TENDENCIA[fila.crecimiento.tendencia]}
                    {fila.crecimiento.variacion !== null
                      ? ` ${formatearVariacion(fila.crecimiento.variacion, 0)}`
                      : ''}
                  </span>
                </p>
                <p className="cifra shrink-0 text-xs text-suave">
                  {fila.cliente.telefono ?? ''}
                </p>
              </div>
              <p className="text-xs text-suave">
                {fila.motivo} · Año <span className="cifra">{formatearPesos(fila.cliente.ventaAnio)}</span> ·
                Cierre estimado <span className="cifra">{formatearPesos(fila.proyeccion.estimado)}</span>
                {fila.proyeccion.confiable ? '' : ' (poca base)'}
              </p>
              {/* Espacio para escribir en la visita: es una hoja de trabajo,
                  no un informe de lectura. */}
              <div className="mt-1 h-6 border-b border-dashed border-borde" aria-hidden="true" />
            </div>
          ))}
        </section>
      ))}

      <p className="mt-4 text-xs text-tenue">
        Frecuencias: clase A cada {plan.frecuencias.A} días, B cada {plan.frecuencias.B}, C cada{' '}
        {plan.frecuencias.C}. El plan completo pide{' '}
        {formatearNumero(plan.requeridasPorMes)} visitas al mes y la capacidad declarada son{' '}
        {formatearNumero(plan.capacidadMensual)}.
      </p>
    </div>
  )
}
