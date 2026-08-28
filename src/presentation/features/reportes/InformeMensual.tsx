import type { ResumenDelPeriodo } from '@/application/indicadores/resumenDelPeriodo'
import { formatearPeriodo } from '@/domain/shared/periodo'
import { formatearNumero, formatearPesos, formatearPorcentaje, formatearVariacion } from '@/lib/formato'
import { EncabezadoImpresion } from '@/presentation/components/shared/HojaImpresion'
import { BarrasEstaticas } from './BarrasEstaticas'

const ETIQUETA_SEMAFORO: Record<string, string> = {
  verde: 'Cumplida',
  ambar: 'Cerca de la meta',
  rojo: 'Por debajo de la meta',
  sin_meta: 'Sin meta definida',
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 no-cortar">
      <h2 className="mb-2 border-b border-borde-suave pb-1 text-xs font-semibold tracking-wider text-suave uppercase">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function Cifra({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div>
      <p className="text-xs text-tenue">{etiqueta}</p>
      <p className="cifra text-base font-semibold text-texto">{valor}</p>
      {nota ? <p className="text-xs text-suave">{nota}</p> : null}
    </div>
  )
}

/**
 * Informe mensual de gestión.
 *
 * Pensado para llevarlo impreso a una reunión de resultados: la primera página
 * responde sola «cómo voy», y el detalle por cliente va detrás.
 */
export function InformeMensual({ resumen }: { resumen: ResumenDelPeriodo }) {
  const { mes, anio, proyeccion, cobertura } = resumen

  return (
    <div className="hoja">
      <EncabezadoImpresion
        titulo="Informe mensual de gestión"
        subtitulo={formatearPeriodo(resumen.periodo)}
        detalle={`${proyeccion.diasTranscurridos} de ${proyeccion.diasTotales} días hábiles transcurridos`}
      />

      <Seccion titulo="Cumplimiento del mes">
        <div className="grid grid-cols-4 gap-4">
          <Cifra
            etiqueta="Vendido"
            valor={formatearPesos(mes.vendido)}
            nota={mes.hayMeta ? `Meta ${formatearPesos(mes.meta)}` : 'Sin meta definida'}
          />
          <Cifra
            etiqueta="Cumplimiento"
            valor={mes.cumplimiento === null ? '—' : formatearPorcentaje(mes.cumplimiento)}
            nota={ETIQUETA_SEMAFORO[resumen.semaforoMes]}
          />
          <Cifra
            etiqueta="Faltante"
            valor={mes.faltante === 0 ? 'Cumplida' : formatearPesos(mes.faltante)}
            nota={
              proyeccion.ritmoRequerido === null
                ? 'El mes ya cerró'
                : `${formatearPesos(proyeccion.ritmoRequerido)} por día hábil restante`
            }
          />
          <Cifra
            etiqueta="Proyección de cierre"
            valor={proyeccion.proyeccion === null ? '—' : formatearPesos(proyeccion.proyeccion)}
            nota={
              proyeccion.cumplimientoProyectado === null
                ? undefined
                : `${formatearPorcentaje(proyeccion.cumplimientoProyectado)} de la meta`
            }
          />
        </div>
      </Seccion>

      <Seccion titulo="Acumulado del año y cobertura">
        <div className="grid grid-cols-4 gap-4">
          <Cifra
            etiqueta="Vendido en el año"
            valor={formatearPesos(anio.vendido)}
            nota={`Meta acumulada ${formatearPesos(anio.meta)}`}
          />
          <Cifra
            etiqueta="Cumplimiento anual"
            valor={anio.cumplimiento === null ? '—' : formatearPorcentaje(anio.cumplimiento)}
            nota={`Meta del año ${formatearPesos(resumen.metaAnualCompleta)}`}
          />
          <Cifra
            etiqueta="Cobertura"
            valor={cobertura.fraccion === null ? '—' : formatearPorcentaje(cobertura.fraccion, 0)}
            nota={`${cobertura.conCompra} de ${cobertura.activos} clientes compraron`}
          />
          <Cifra
            etiqueta="Clientes nuevos del mes"
            valor={formatearNumero(resumen.nuevos.length)}
            nota={
              resumen.nuevos.length === 0
                ? 'Ninguna apertura este mes'
                : resumen.nuevos.map((c) => c.nombre).join(', ')
            }
          />
        </div>
      </Seccion>

      <Seccion titulo="Ventas contra meta · últimos 12 meses (cifras en millones)">
        <BarrasConTabla resumen={resumen} />
      </Seccion>

      <Seccion titulo={`Clientes del mes (${resumen.top.length})`}>
        {resumen.top.length === 0 ? (
          <p className="text-sm text-suave">Sin ventas registradas en el periodo.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-8 text-left text-xs text-tenue">#</th>
                <th className="text-left text-xs text-tenue">Cliente</th>
                <th className="text-left text-xs text-tenue">Zona</th>
                <th className="text-right text-xs text-tenue">Venta del mes</th>
                <th className="text-right text-xs text-tenue">vs. mes anterior</th>
                <th className="text-right text-xs text-tenue">Año</th>
              </tr>
            </thead>
            <tbody>
              {resumen.top.map((cliente, i) => (
                <tr key={cliente.id}>
                  <td className="cifra text-tenue">{i + 1}</td>
                  <td>{cliente.nombre}</td>
                  <td className="text-suave">{cliente.zona ?? '—'}</td>
                  <td className="cifra text-right">{formatearPesos(cliente.ventaPeriodo)}</td>
                  <td className="cifra text-right">
                    {formatearVariacion(cliente.variacionMesAnterior)}
                  </td>
                  <td className="cifra text-right text-suave">
                    {formatearPesos(cliente.ventaAnio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Seccion>

      <Seccion titulo={`Requieren atención (${resumen.alertas.length})`}>
        {resumen.alertas.length === 0 ? (
          <p className="text-sm text-suave">Ningún cliente en riesgo ni inactivo.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs text-tenue">Cliente</th>
                <th className="text-left text-xs text-tenue">Zona</th>
                <th className="text-left text-xs text-tenue">Motivo</th>
                <th className="text-right text-xs text-tenue">Últ. compra</th>
                <th className="text-right text-xs text-tenue">Últimos 12 meses</th>
              </tr>
            </thead>
            <tbody>
              {resumen.alertas.map((alerta) => (
                <tr key={alerta.cliente.id}>
                  <td>{alerta.cliente.nombre}</td>
                  <td className="text-suave">{alerta.cliente.zona ?? '—'}</td>
                  <td className="text-suave">{alerta.motivo}</td>
                  <td className="cifra text-right text-suave">
                    {alerta.cliente.ultimaCompra
                      ? formatearPeriodo(alerta.cliente.ultimaCompra)
                      : 'Nunca'}
                  </td>
                  <td className="cifra text-right">{formatearPesos(alerta.impacto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Seccion>
    </div>
  )
}

function BarrasConTabla({ resumen }: { resumen: ResumenDelPeriodo }) {
  return (
    <>
      <BarrasEstaticas serie={resumen.serie} />
      <table className="mt-2 w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="text-left text-tenue">Mes</th>
            {resumen.serie.map((p) => (
              <th key={p.periodo} className="cifra text-right text-tenue">
                {p.etiqueta.split(' ')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-suave">Vendido</td>
            {resumen.serie.map((p) => (
              <td key={p.periodo} className="cifra text-right">
                {p.vendido === 0 ? '—' : enMillones(p.vendido)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="text-suave">Meta</td>
            {resumen.serie.map((p) => (
              <td key={p.periodo} className="cifra text-right text-suave">
                {p.meta === null ? '—' : enMillones(p.meta)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="text-suave">Cumpl.</td>
            {resumen.serie.map((p) => (
              <td key={p.periodo} className="cifra text-right text-suave">
                {p.cumplimiento === null ? '—' : formatearPorcentaje(p.cumplimiento, 0)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </>
  )
}

/**
 * Millones sin símbolo ni sufijo.
 *
 * En una tabla de doce columnas repetir «$ … M» en cada celda roba el ancho que
 * necesitan las cifras. El encabezado de la sección ya dice que son millones.
 */
function enMillones(valor: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(valor / 1_000_000)
}
