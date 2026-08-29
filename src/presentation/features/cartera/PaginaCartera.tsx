import { useMemo, useState } from 'react'
import { AlertTriangle, FileUp, Printer, Wallet } from 'lucide-react'
import { ETIQUETA_TRAMO, type Tramo } from '@/domain/cobranza/cobranza.entity'
import { agruparCartera } from '@/application/cobranza/indicadoresCartera'
import { Badge } from '@/presentation/components/shared/Badge'
import { Boton } from '@/presentation/components/shared/Boton'
import { Campo, Seleccion } from '@/presentation/components/shared/Campo'
import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { EstadoVacio } from '@/presentation/components/shared/EstadoVacio'
import { useHojaImpresion } from '@/presentation/components/shared/HojaImpresion'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import { useCartera } from '@/presentation/hooks/data/useCartera'
import {
  formatearCentavos,
  formatearCentavosCorto,
  formatearDecimal,
  formatearFecha,
  formatearNumero,
  formatearPorcentaje,
} from '@/lib/formato'
import { AsistenteCartera } from './AsistenteCartera'
import { InformeCartera } from './InformeCartera'

/** De lo más urgente a lo que no urge: es el orden en que se cobra. */
const ORDEN: readonly Tramo[] = ['v91_mas', 'v61_90', 'v31_60', 'v1_30', 'por_vencer', 'a_favor']

/**
 * Color de cada tramo.
 *
 * Es una rampa secuencial de un solo tono para lo vencido —cuanto más viejo,
 * más oscuro—, más dos colores aparte para lo que no es deuda vencida. Nunca se
 * usa el color solo: cada tramo lleva siempre su nombre escrito al lado.
 */
const COLOR: Record<Tramo, string> = {
  v91_mas: 'bg-alerta',
  v61_90: 'bg-alerta/70',
  v31_60: 'bg-alerta/45',
  v1_30: 'bg-alerta/25',
  por_vencer: 'bg-acento/60',
  a_favor: 'bg-exito/50',
}

function Cifra({
  valor,
  etiqueta,
  nota,
  tono,
}: {
  valor: string
  etiqueta: string
  nota?: string
  tono?: string
}) {
  return (
    <Tarjeta className="px-4 py-3">
      <p className="text-xs tracking-wider text-tenue uppercase">{etiqueta}</p>
      <p className={'cifra mt-1 text-lg font-semibold ' + (tono ?? 'text-texto')}>{valor}</p>
      {nota ? <p className="mt-0.5 text-xs text-suave">{nota}</p> : null}
    </Tarjeta>
  )
}

export default function PaginaCartera() {
  const [corteId, setCorteId] = useState<string | undefined>(undefined)
  const [asistente, setAsistente] = useState(false)
  const [dimension, setDimension] = useState<'zona' | 'departamento' | 'municipio'>('zona')
  const vista = useCartera(corteId)
  const { imprimir, portal } = useHojaImpresion()

  const porGrupo = useMemo(
    () => (vista ? agruparCartera(vista.porCliente, dimension) : []),
    [vista, dimension],
  )

  // Saldo que no cae en ningun municipio: ni el de los clientes sin ficha ni el
  // de los que tienen ficha pero sin municipio. Los dos casos tienen la misma
  // consecuencia —no aparecen en el mapa ni en las zonas— asi que se avisan
  // juntos. Separarlos escondia el segundo justo despues de crear los primeros.
  const sinUbicar = useMemo(
    () => (vista ? vista.porCliente.filter((cliente) => !cliente.municipio) : []),
    [vista],
  )
  const sinFicha = useMemo(() => sinUbicar.filter((cliente) => cliente.sinFicha), [sinUbicar])

  // Si el usuario todavia no ha definido zonas, agrupar por zona da una sola
  // fila que dice «Sin ubicación» y gasta media hoja sin decir nada. En ese
  // caso el informe agrupa por departamento, que siempre existe.
  const agrupacionDelInforme: 'zona' | 'departamento' = (vista?.porCliente ?? []).some(
    (cliente) => cliente.zona,
  )
    ? 'zona'
    : 'departamento'

  // Base bruta de la barra: todo lo facturado, sin restar los saldos a favor.
  // La barra reparte esa cifra y por eso llena el ancho; los porcentajes de la
  // leyenda van sobre la cartera neta, que es la que aparece arriba.
  const bruto = vista?.resumen
    ? vista.resumen.total + Math.abs(vista.resumen.porTramo.a_favor)
    : 0

  if (!vista) {
    return (
      <>
        <EncabezadoPagina titulo="Cartera" />
        <p className="text-sm text-tenue">Cargando…</p>
      </>
    )
  }

  const { corte, resumen, porCliente, comparacion, cortes } = vista

  if (!corte || !resumen) {
    return (
      <>
        <AsistenteCartera abierto={asistente} onCerrar={() => setAsistente(false)} />
        <EncabezadoPagina
          titulo="Cartera"
          descripcion="Cuánto te deben, desde cuándo y quién."
          acciones={
            <Boton variante="primario" onClick={() => setAsistente(true)}>
              <FileUp className="size-4" aria-hidden="true" />
              Importar el reporte
            </Boton>
          }
        />
        <EstadoVacio
          icono={Wallet}
          titulo="Todavía no has importado ningún corte"
          descripcion="Importa el reporte «Cuentas por cobrar detallada por documento» que te envía la empresa. Cada importación guarda un corte con su fecha, así que a partir del segundo podrás ver qué subió y qué bajó."
        />
      </>
    )
  }

  return (
    <>
      {portal}
      <AsistenteCartera abierto={asistente} onCerrar={() => setAsistente(false)} />

      <EncabezadoPagina
        titulo="Cartera"
        descripcion="Cuánto te deben, desde cuándo y quién."
        acciones={
          <>
            <Boton onClick={() => setAsistente(true)}>
              <FileUp className="size-4" aria-hidden="true" />
              Importar corte
            </Boton>
            <Boton
              variante="primario"
              onClick={() =>
                imprimir(
                  <InformeCartera
                    resumen={resumen}
                    porCliente={porCliente}
                    porZona={agruparCartera(porCliente, agrupacionDelInforme)}
                    etiquetaGrupo={agrupacionDelInforme === 'zona' ? 'Zona' : 'Departamento'}
                    comparacion={comparacion}
                  />,
                )
              }
            >
              <Printer className="size-4" aria-hidden="true" />
              Imprimir la cartera
            </Boton>
          </>
        }
      />

      {cortes.length > 1 ? (
        <div className="mb-4 max-w-xs">
          <Campo etiqueta="Corte" htmlFor="corte">
            <Seleccion
              id="corte"
              value={corte.id}
              onChange={(evento) => setCorteId(evento.target.value)}
            >
              {cortes.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatearFecha(c.fecha)} · {formatearCentavosCorto(c.total)}
                </option>
              ))}
            </Seleccion>
          </Campo>
        </div>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-cifras-cartera>
        <Cifra
          valor={formatearCentavos(resumen.total)}
          etiqueta="Cartera total"
          nota={`${formatearNumero(resumen.documentos)} documentos de ${formatearNumero(resumen.clientes)} clientes`}
        />
        <Cifra
          valor={formatearCentavos(resumen.vencido)}
          etiqueta="Vencido"
          nota={`${formatearPorcentaje(resumen.porcentajeVencido)} de la cartera`}
          tono={resumen.porcentajeVencido > 0.3 ? 'text-alerta' : undefined}
        />
        <Cifra
          valor={`${formatearDecimal(resumen.moraPromedioPonderada, 0)} días`}
          etiqueta="Mora promedio"
          nota="Ponderada por saldo, no por documento"
        />
        <Cifra
          valor={formatearPorcentaje(resumen.concentracionTop5)}
          etiqueta="Concentración"
          nota="Peso de los cinco mayores saldos"
        />
      </div>

      {comparacion ? (
        <div className="mb-5 rounded-panel border border-borde bg-superficie px-4 py-3 text-sm text-texto">
          Frente al corte del {formatearFecha(comparacion.anterior.fecha)}, hace{' '}
          {formatearNumero(comparacion.diasEntreCortes)} días: la cartera{' '}
          <strong className="font-medium">
            {comparacion.variacionTotal >= 0 ? 'subió' : 'bajó'}{' '}
            <span className="cifra">
              {formatearCentavos(Math.abs(comparacion.variacionTotal))}
            </span>
          </strong>{' '}
          y lo vencido {comparacion.variacionVencido >= 0 ? 'subió' : 'bajó'}{' '}
          <span className="cifra">{formatearCentavos(Math.abs(comparacion.variacionVencido))}</span>.
          <span className="mt-1 block text-xs text-suave">
            Que un saldo baje no significa que te hayan pagado esa cantidad: entre un corte y otro
            también se factura. Para saber lo recaudado hace falta el reporte de pagos.
          </span>
        </div>
      ) : null}

      <Tarjeta className="mb-5">
        <div className="border-b border-borde-suave px-5 py-3">
          <h2 className="text-sm font-medium text-texto">Reparto por edad</h2>
          <p className="mt-0.5 text-xs text-suave">
            Calculado con la fecha de vencimiento de cada documento contra la del corte.
          </p>
        </div>
        <div className="px-5 py-4">
          <div className="mb-2 flex h-3 w-full overflow-hidden rounded-full bg-superficie-alt">
            {ORDEN.filter((tramo) => resumen.porTramo[tramo] !== 0).map((tramo) => (
              <span
                key={tramo}
                className={COLOR[tramo] + ' h-full'}
                style={{ width: `${(Math.abs(resumen.porTramo[tramo]) / bruto) * 100}%` }}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="mb-3 text-xs text-tenue">
            La barra reparte los {formatearCentavos(bruto)} facturados. Los porcentajes de abajo son
            sobre la cartera neta de {formatearCentavos(resumen.total)}, que es la que te deben de
            verdad: por eso el saldo a favor sale en negativo y los seis suman 100 %.
          </p>
          <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2" data-tramos>
            {ORDEN.filter((tramo) => resumen.porTramo[tramo] !== 0).map((tramo) => (
              <li key={tramo} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-texto">
                  <span className={COLOR[tramo] + ' size-2.5 rounded-sm'} aria-hidden="true" />
                  {ETIQUETA_TRAMO[tramo]}
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="cifra text-texto">
                    {formatearCentavos(resumen.porTramo[tramo])}
                  </span>
                  <span className="cifra w-14 text-right text-xs text-tenue">
                    {formatearPorcentaje(resumen.porTramo[tramo] / resumen.total)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Tarjeta>

      <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Tarjeta>
          <div className="border-b border-borde-suave px-5 py-3">
            <h2 className="text-sm font-medium text-texto">Cliente por cliente</h2>
            <p className="mt-0.5 text-xs text-suave">
              Ordenados por saldo. La mora es la del documento más viejo que tenga sin pagar.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" data-tabla-cartera>
              <thead>
                <tr className="border-b border-borde-suave text-left text-xs text-tenue">
                  <th className="px-5 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Ubicación</th>
                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Saldo</th>
                  <th className="px-3 py-2 text-right font-medium">Vencido</th>
                  <th className="px-3 py-2 text-right font-medium">Mora</th>
                  <th className="px-5 py-2 text-right font-medium">Docs.</th>
                </tr>
              </thead>
              <tbody>
                {porCliente.map((cliente) => (
                  <tr key={cliente.clave} className="border-b border-borde-suave last:border-b-0">
                    <td className="px-5 py-2">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-texto">{cliente.nombre}</span>
                        {cliente.sinFicha ? <Badge tono="neutro">Sin ficha</Badge> : null}
                      </span>
                      {cliente.telefono ? (
                        <span className="cifra mt-0.5 block text-xs text-tenue">
                          {cliente.telefono}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-suave">
                      {cliente.zona ?? cliente.departamento ?? '—'}
                    </td>
                    <td className="cifra px-3 py-2 text-right whitespace-nowrap text-texto">
                      {formatearCentavos(cliente.total)}
                    </td>
                    <td
                      className={
                        'cifra px-3 py-2 text-right whitespace-nowrap ' +
                        (cliente.vencido > 0 ? 'text-alerta' : 'text-tenue')
                      }
                    >
                      {cliente.vencido > 0 ? formatearCentavos(cliente.vencido) : '—'}
                    </td>
                    <td className="cifra px-3 py-2 text-right whitespace-nowrap text-suave">
                      {cliente.moraMaxima > 0 ? `${cliente.moraMaxima} d` : '—'}
                    </td>
                    <td className="cifra px-5 py-2 text-right text-suave">{cliente.documentos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>

        <Tarjeta className="self-start">
          <div className="border-b border-borde-suave px-5 py-3">
            <h2 className="text-sm font-medium text-texto">Dónde está</h2>
            <div className="mt-2 flex gap-1 text-xs">
              {(['zona', 'departamento', 'municipio'] as const).map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => setDimension(opcion)}
                  className={
                    'rounded-md px-2 py-1 capitalize transition-colors duration-150 ' +
                    (dimension === opcion
                      ? 'bg-acento-suave font-medium text-acento'
                      : 'text-suave hover:bg-superficie-alt')
                  }
                >
                  {opcion}
                </button>
              ))}
            </div>
          </div>
          <ul className="flex flex-col" data-grupos-cartera>
            {porGrupo.map((grupo) => (
              <li
                key={grupo.nombre}
                className="flex items-center justify-between gap-3 border-b border-borde-suave px-5 py-2 text-sm last:border-b-0"
              >
                <span className="min-w-0 truncate text-texto">{grupo.nombre}</span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className="cifra text-texto">{formatearCentavosCorto(grupo.total)}</span>
                  {grupo.vencido > 0 ? (
                    <span className="cifra text-xs text-alerta">
                      {formatearCentavosCorto(grupo.vencido)}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>

      {sinUbicar.length > 0 ? (
        <div className="flex items-start gap-2.5 rounded-panel border-l-2 border-alerta bg-alerta-suave px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-alerta" aria-hidden="true" />
          <p className="text-sm text-texto" data-aviso-sin-ubicar>
            <strong className="font-medium">
              {formatearCentavos(sinUbicar.reduce((suma, c) => suma + c.total, 0))}
            </strong>{' '}
            de cartera, de {formatearNumero(sinUbicar.length)} clientes, no cae en ningún municipio:
            {sinFicha.length > 0
              ? ` ${formatearNumero(sinFicha.length)} sin ficha en la aplicación y `
              : ' '}
            {formatearNumero(sinUbicar.length - sinFicha.length)} con ficha pero sin municipio.
            Mientras sea así no entran en el mapa, ni en las zonas, ni en el plan de visitas. Se
            arregla poniéndoles el municipio en su ficha de cliente.
          </p>
        </div>
      ) : null}
    </>
  )
}
