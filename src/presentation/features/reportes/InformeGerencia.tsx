import type { ResumenDelPeriodo } from '@/application/indicadores/resumenDelPeriodo'
import { formatearPeriodo, formatearPeriodoCorto } from '@/domain/shared/periodo'
import {
  formatearDecimal,
  formatearNumero,
  formatearPesos,
  formatearPesosCorto,
  formatearPorcentaje,
} from '@/lib/formato'
import { EncabezadoImpresion } from '@/presentation/components/shared/HojaImpresion'
import { PuenteDeVentas } from './PuenteDeVentas'

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-panel border border-borde px-3 py-2">
      <p className="text-xs tracking-wider text-tenue uppercase">{etiqueta}</p>
      <p className="cifra mt-0.5 text-base font-semibold text-texto">{valor}</p>
      {nota ? <p className="mt-0.5 text-xs text-suave">{nota}</p> : null}
    </div>
  )
}

/**
 * Informe de gerencia: una hoja para la reunión de resultados.
 *
 * El orden no es decorativo. Arriba va el cumplimiento, que es lo primero que
 * preguntan; justo debajo el puente de ventas, que es lo segundo —«¿y por qué?»—
 * y lo que ningún tablero suele responder. El resto es anexo: sirve cuando
 * alguien tira del hilo, y estorba si va antes.
 */
export function InformeGerencia({ resumen }: { resumen: ResumenDelPeriodo }) {
  const { mes, anio, proyeccion, cobertura, puente, gerencia, plan } = resumen
  const g = gerencia

  return (
    <div className="hoja">
      <EncabezadoImpresion
        titulo="Informe de gestión comercial"
        subtitulo={`${formatearNumero(g.clientesActivos)} clientes activos · ${formatearNumero(cobertura.conCompra)} compraron este mes`}
        detalle={formatearPeriodo(resumen.periodo)}
      />

      <section className="mb-4">
        <h3 className="mb-2 text-sm font-medium text-texto">Cumplimiento</h3>
        <div className="grid grid-cols-4 gap-2">
          <Dato
            etiqueta="Del mes"
            valor={mes.meta === 0 ? 'Sin meta' : formatearPorcentaje(mes.cumplimiento ?? 0)}
            nota={`${formatearPesosCorto(mes.vendido)} de ${formatearPesosCorto(mes.meta)}`}
          />
          <Dato
            etiqueta="Proyección de cierre"
            valor={
              proyeccion.proyeccion === null ? 'Sin base' : formatearPesosCorto(proyeccion.proyeccion)
            }
            nota={`${proyeccion.diasTranscurridos} de ${proyeccion.diasTotales} días hábiles`}
          />
          <Dato
            etiqueta="Acumulado del año"
            valor={anio.meta === 0 ? 'Sin meta' : formatearPorcentaje(anio.cumplimiento ?? 0)}
            nota={`${formatearPesosCorto(anio.vendido)} de ${formatearPesosCorto(anio.meta)}`}
          />
          <Dato
            etiqueta="Cobertura"
            valor={cobertura.fraccion === null ? '—' : formatearPorcentaje(cobertura.fraccion, 0)}
            nota={`${cobertura.conCompra} de ${cobertura.activos} clientes`}
          />
        </div>
      </section>

      <section className="mb-4 break-inside-avoid">
        <h3 className="text-sm font-medium text-texto">
          De dónde viene la diferencia contra {formatearPeriodoCorto(puente.periodoAnterior)}
        </h3>
        <p className="mb-1 text-xs text-suave">
          {puente.variacion === 0
            ? 'La venta quedó igual que el mes anterior.'
            : `${puente.variacion > 0 ? 'Subió' : 'Bajó'} ${formatearPesos(Math.abs(puente.variacion))}. Cada barra dice de dónde sale.`}
        </p>
        <PuenteDeVentas puente={puente} />
        <p className="text-xs text-suave">
          {formatearNumero(puente.clientesNuevos)} clientes nuevos ·{' '}
          {formatearNumero(puente.clientesRecuperados)} que volvieron ·{' '}
          {formatearNumero(puente.clientesPerdidos)} que dejaron de comprar.
        </p>
      </section>

      <section className="mb-4 break-inside-avoid">
        <h3 className="mb-2 text-sm font-medium text-texto">Comportamiento comercial · año en curso</h3>
        <div className="grid grid-cols-4 gap-2">
          <Dato
            etiqueta="Pedidos"
            valor={formatearNumero(g.comercial.pedidos)}
            nota={`${formatearNumero(g.compraronUnaVez)} clientes compraron una sola vez`}
          />
          <Dato
            etiqueta="Ticket promedio"
            valor={formatearPesosCorto(g.comercial.ticketPromedio)}
            nota={`Mediana ${formatearPesosCorto(g.comercial.ticketMediano)}`}
          />
          <Dato
            etiqueta="Líneas por pedido"
            valor={formatearDecimal(g.comercial.lineasPorPedido)}
            nota="Venta cruzada dentro de la factura"
          />
          <Dato
            etiqueta="Categorías por cliente"
            valor={`${formatearDecimal(g.comercial.categoriasPorCliente)} de ${g.comercial.categoriasDisponibles}`}
            nota="Venta cruzada en el año"
          />
        </div>
      </section>

      <section className="mb-4 break-inside-avoid">
        <h3 className="mb-2 text-sm font-medium text-texto">Gestión de calle</h3>
        <div className="grid grid-cols-4 gap-2">
          <Dato
            etiqueta="Visitas del mes"
            valor={formatearNumero(g.efectividad.visitas)}
            nota={`${formatearNumero(plan.pendientes.length)} clientes pendientes`}
          />
          <Dato
            etiqueta="Efectividad de visita"
            valor={
              g.efectividad.efectividad === null
                ? 'Sin datos'
                : formatearPorcentaje(g.efectividad.efectividad, 0)
            }
            nota={
              g.efectividad.efectividad === null
                ? 'No se registraron visitas'
                : `${g.efectividad.conPedido} de ${g.efectividad.visitas} visitas terminaron en pedido`
            }
          />
          <Dato
            etiqueta="Concentración"
            valor={formatearPorcentaje(g.concentracion.top5, 0)}
            nota={`En los 5 mayores · la mitad en ${g.concentracion.clientesParaLaMitad}`}
          />
          <Dato
            etiqueta="Plan de visitas"
            valor={`${formatearNumero(plan.requeridasPorMes)} / ${formatearNumero(plan.capacidadMensual)}`}
            nota={plan.deficit > 0 ? `Faltan ${formatearNumero(plan.deficit)} al mes` : 'La capacidad alcanza'}
          />
        </div>
      </section>

      {g.penetracion.length > 0 ? (
        <section className="break-inside-avoid">
          <h3 className="mb-1.5 text-sm font-medium text-texto">Penetración por línea · año en curso</h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs text-tenue">Línea</th>
                <th className="text-right text-xs whitespace-nowrap text-tenue">Clientes</th>
                <th className="text-right text-xs whitespace-nowrap text-tenue">Penetración</th>
                <th className="text-right text-xs whitespace-nowrap text-tenue">Venta</th>
                <th className="text-right text-xs whitespace-nowrap text-tenue">Mezcla</th>
              </tr>
            </thead>
            <tbody>
              {g.penetracion.map((linea) => {
                const total = g.penetracion.reduce((t, l) => t + l.venta, 0)
                return (
                  <tr key={linea.categoria}>
                    <td className="text-texto">{linea.categoria}</td>
                    <td className="cifra text-right">{formatearNumero(linea.clientes)}</td>
                    <td className="cifra text-right text-suave">
                      {formatearPorcentaje(linea.penetracion, 0)}
                    </td>
                    <td className="cifra text-right whitespace-nowrap">{formatearPesos(linea.venta)}</td>
                    <td className="cifra text-right text-suave">
                      {total === 0 ? '—' : formatearPorcentaje(linea.venta / total, 0)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  )
}
