import type { CarteraAgrupada, CarteraDeCliente, ComparacionDeCortes, ResumenCartera } from '@/application/cobranza/indicadoresCartera'
import { ETIQUETA_TRAMO, type Tramo } from '@/domain/cobranza/cobranza.entity'
import { EncabezadoImpresion } from '@/presentation/components/shared/HojaImpresion'
import {
  formatearCentavos,
  formatearCentavosCorto,
  formatearDecimal,
  formatearFecha,
  formatearNumero,
  formatearPorcentaje,
} from '@/lib/formato'

interface Props {
  readonly resumen: ResumenCartera
  readonly porCliente: readonly CarteraDeCliente[]
  readonly porZona: readonly CarteraAgrupada[]
  /** Titulo de esa columna: dice «Zona» o «Departamento» segun lo que se agrupo. */
  readonly etiquetaGrupo: string
  readonly comparacion: ComparacionDeCortes | null
}

/**
 * Nombre que va en la hoja.
 *
 * NO es la razon social que trae el reporte —esa es la de la empresa que lo
 * emite— sino el nombre con el que el usuario presenta su gestion. La hoja la
 * firma el, no la empresa.
 */
const NOMBRE = 'Equipos Supra'

/** Orden de lectura: primero lo que hay que cobrar ya, al final lo que no urge. */
const ORDEN: readonly Tramo[] = ['v91_mas', 'v61_90', 'v31_60', 'v1_30', 'por_vencer', 'a_favor']

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 break-inside-avoid">
      <h2 className="mb-1.5 border-b border-borde-suave pb-1 text-xs font-semibold tracking-wider text-tenue uppercase">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-wide text-tenue uppercase">{etiqueta}</p>
      <p className="cifra text-sm font-semibold text-texto">{valor}</p>
      {nota ? <p className="text-[10px] text-suave">{nota}</p> : null}
    </div>
  )
}

/**
 * Hoja de cartera de una pagina.
 *
 * Se escribe una sola vez y se ve igual en papel y en PDF. El orden es el de la
 * conversacion que va a tener el usuario con su jefe: cuanto hay, cuanto esta
 * vencido, quien lo debe, desde donde, y que cambio desde el corte pasado.
 */
export function InformeCartera({
  resumen,
  porCliente,
  porZona,
  etiquetaGrupo,
  comparacion,
}: Props) {
  // Diez filas es lo que cabe en una pagina junto con todo lo demas, contando
  // el caso mas alto: dos cortes (el bloque de comparacion crece) y el sello de
  // demostracion. Si se alarga, la hoja deja de ser de una pagina.
  const conVencido = porCliente.filter((cliente) => cliente.vencido > 0).slice(0, 10)
  // Seis y seis: es lo que cabe en el hueco que deja la tabla de arriba sin
  // empujar el bloque entero a una segunda pagina.
  const movimientos = comparacion?.movimientos.slice(0, 6) ?? []

  return (
    <article className="mx-auto max-w-[19cm] p-6 text-sm">
      <EncabezadoImpresion
        titulo="Cartera por cobrar"
        subtitulo={`${NOMBRE} · Corte del ${formatearFecha(resumen.fecha)}`}
        detalle={`${formatearNumero(resumen.documentos)} documentos · ${formatearNumero(resumen.clientes)} clientes`}
      />

      <Bloque titulo="Dónde está la cartera">
        <div className="grid grid-cols-5 gap-3">
          {/* Cifra completa, no abreviada: en la misma hoja hay una tabla con
              el total al peso, y ver «$ 221 M» arriba y «$ 220.581.121» abajo
              hace dudar de las dos. */}
          <Dato etiqueta="Cartera total" valor={formatearCentavos(resumen.total)} />
          <Dato
            etiqueta="Vencido"
            valor={formatearCentavos(resumen.vencido)}
            nota={`${formatearPorcentaje(resumen.porcentajeVencido)} del total`}
          />
          <Dato
            etiqueta="Mora promedio"
            valor={`${formatearDecimal(resumen.moraPromedioPonderada, 0)} días`}
            nota="Ponderada por saldo"
          />
          <Dato
            etiqueta="Concentración"
            valor={formatearPorcentaje(resumen.concentracionTop5)}
            nota="Los 5 mayores saldos"
          />
          <Dato
            etiqueta="Más antiguo"
            valor={resumen.documentoMasAntiguo ? `${resumen.documentoMasAntiguo.dias} días` : '—'}
            nota={resumen.documentoMasAntiguo?.nombre}
          />
        </div>
      </Bloque>

      <Bloque titulo="Reparto por edad">
        <table className="tabla-compacta w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-borde-suave text-left text-tenue">
              <th className="py-1 font-medium">Tramo</th>
              <th className="py-1 text-right font-medium">Saldo</th>
              <th className="py-1 text-right font-medium">% del total</th>
            </tr>
          </thead>
          <tbody>
            {ORDEN.filter((tramo) => resumen.porTramo[tramo] !== 0).map((tramo) => (
              <tr key={tramo} className="border-b border-borde-suave last:border-b-0">
                <td className="py-1 text-texto">{ETIQUETA_TRAMO[tramo]}</td>
                <td className="cifra py-1 text-right text-texto">
                  {formatearCentavos(resumen.porTramo[tramo])}
                </td>
                <td className="cifra py-1 text-right text-suave">
                  {resumen.total === 0
                    ? '—'
                    : formatearPorcentaje(resumen.porTramo[tramo] / resumen.total)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-borde font-semibold">
              <td className="py-1 text-texto">Total</td>
              <td className="cifra py-1 text-right text-texto">
                {formatearCentavos(resumen.total)}
              </td>
              <td className="py-1" />
            </tr>
          </tbody>
        </table>
      </Bloque>

      <Bloque titulo="Quién debe lo vencido">
        <table className="tabla-compacta w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-borde-suave text-left text-tenue">
              <th className="py-1 font-medium">Cliente</th>
              <th className="py-1 font-medium">{etiquetaGrupo}</th>
              <th className="py-1 text-right font-medium">Saldo</th>
              <th className="py-1 text-right font-medium">Vencido</th>
              <th className="py-1 text-right font-medium">Mora</th>
              <th className="py-1 font-medium">Contacto</th>
            </tr>
          </thead>
          <tbody>
            {conVencido.map((cliente) => (
              <tr key={cliente.clave} className="border-b border-borde-suave last:border-b-0">
                <td className="py-1 text-texto">{cliente.nombre}</td>
                <td className="py-1 text-suave">{cliente.zona ?? cliente.departamento ?? '—'}</td>
                <td className="cifra py-1 text-right text-texto">
                  {formatearCentavos(cliente.total)}
                </td>
                <td className="cifra py-1 text-right text-texto">
                  {formatearCentavos(cliente.vencido)}
                </td>
                <td className="cifra py-1 text-right text-suave">{cliente.moraMaxima} d</td>
                <td className="py-1 text-suave">
                  {cliente.telefono ?? cliente.contacto ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Bloque>

      <div className="grid grid-cols-2 gap-5">
        <Bloque titulo={`Por ${etiquetaGrupo.toLowerCase()}`}>
          <table className="tabla-compacta w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-borde-suave text-left text-tenue">
                <th className="py-1 font-medium">{etiquetaGrupo}</th>
                <th className="py-1 text-right font-medium">Saldo</th>
                <th className="py-1 text-right font-medium">Vencido</th>
              </tr>
            </thead>
            <tbody>
              {porZona.slice(0, 6).map((grupo) => (
                <tr key={grupo.nombre} className="border-b border-borde-suave last:border-b-0">
                  <td className="py-1 text-texto">{grupo.nombre}</td>
                  <td className="cifra py-1 text-right text-texto">
                    {formatearCentavosCorto(grupo.total)}
                  </td>
                  <td className="cifra py-1 text-right text-suave">
                    {formatearCentavosCorto(grupo.vencido)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Bloque>

        <Bloque titulo="Qué cambió desde el corte anterior">
          {comparacion ? (
            <>
              <p className="mb-1.5 text-xs text-suave">
                {formatearDecimal(comparacion.diasEntreCortes, 0)} días desde el{' '}
                {formatearFecha(comparacion.anterior.fecha)}. La cartera{' '}
                {comparacion.variacionTotal >= 0 ? 'subió' : 'bajó'}{' '}
                <span className="cifra">
                  {formatearCentavosCorto(Math.abs(comparacion.variacionTotal))}
                </span>{' '}
                y lo vencido {comparacion.variacionVencido >= 0 ? 'subió' : 'bajó'}{' '}
                <span className="cifra">
                  {formatearCentavosCorto(Math.abs(comparacion.variacionVencido))}
                </span>
                .
              </p>
              <table className="tabla-compacta w-full border-collapse text-xs">
                <tbody>
                  {movimientos.map((movimiento) => (
                    <tr key={movimiento.clave} className="border-b border-borde-suave last:border-b-0">
                      <td className="py-1 text-texto">{movimiento.nombre}</td>
                      <td className="cifra py-1 text-right text-texto">
                        {movimiento.diferencia >= 0 ? '+' : '−'}
                        {formatearCentavosCorto(Math.abs(movimiento.diferencia))}
                      </td>
                      <td className="py-1 pl-2 text-right text-suave">{movimiento.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="text-xs text-suave">
              Es el primer corte importado. Al importar el del mes que viene, aquí aparece cliente por
              cliente qué subió y qué bajó.
            </p>
          )}
        </Bloque>
      </div>

      <p className="mt-4 border-t border-borde-suave pt-2 text-[10px] text-tenue">
        Los tramos se calculan con la fecha de vencimiento de cada documento contra la fecha del
        corte. Una bajada de saldo no es lo mismo que un pago: entre un corte y otro también se
        factura.
      </p>
    </article>
  )
}
