import { AlertTriangle, ArrowDownRight, ArrowUpRight, FileUp, Target, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ClienteEnriquecido } from '@/domain/cliente/cliente.entity'
import type { Alerta } from '@/application/indicadores/analizarCartera'
import { formatearPeriodo } from '@/domain/shared/periodo'
import {
  formatearNumero,
  formatearPesos,
  formatearPesosCorto,
  formatearPorcentaje,
  formatearVariacion,
} from '@/lib/formato'
import { Boton } from '@/presentation/components/shared/Boton'
import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { EstadoVacio } from '@/presentation/components/shared/EstadoVacio'
import { TarjetaKPI } from '@/presentation/components/shared/TarjetaKPI'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import { useResumen } from '@/presentation/hooks/data/useResumen'
import { usePeriodoSeleccionado } from '@/presentation/hooks/ui/contexto-periodo'
import { GraficaAnual } from './GraficaAnual'

function Panel({ titulo, cantidad, children }: { titulo: string; cantidad?: number; children: React.ReactNode }) {
  return (
    <Tarjeta className="flex flex-col">
      <div className="flex items-baseline justify-between border-b border-borde-suave px-4 py-2.5">
        <h2 className="text-sm font-medium text-texto">{titulo}</h2>
        {cantidad !== undefined ? (
          <span className="cifra text-xs text-tenue">{formatearNumero(cantidad)}</span>
        ) : null}
      </div>
      <div className="flex-1">{children}</div>
    </Tarjeta>
  )
}

function FilaAlerta({ alerta }: { alerta: Alerta }) {
  return (
    <li className="flex items-start justify-between gap-3 border-b border-borde-suave px-4 py-2.5 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm text-texto">{alerta.cliente.nombre}</p>
        <p className="text-xs text-alerta">{alerta.motivo}</p>
      </div>
      <span className="cifra shrink-0 text-xs text-tenue" title="Facturación de los últimos 12 meses">
        {alerta.impacto > 0 ? formatearPesosCorto(alerta.impacto) : '—'}
      </span>
    </li>
  )
}

function FilaTop({ cliente, posicion }: { cliente: ClienteEnriquecido; posicion: number }) {
  const variacion = cliente.variacionMesAnterior
  const sube = variacion !== null && variacion >= 0
  const Flecha = sube ? ArrowUpRight : ArrowDownRight

  return (
    <li className="flex items-start justify-between gap-3 border-b border-borde-suave px-4 py-2.5 last:border-b-0">
      <div className="flex min-w-0 gap-2.5">
        <span className="cifra w-4 shrink-0 text-xs text-tenue">{posicion}</span>
        <div className="min-w-0">
          <p className="truncate text-sm text-texto">{cliente.nombre}</p>
          {variacion === null ? (
            <p className="text-xs text-tenue">Sin mes anterior para comparar</p>
          ) : (
            <p className={`flex items-center gap-0.5 text-xs ${sube ? 'text-exito' : 'text-peligro'}`}>
              <Flecha className="size-3" aria-hidden="true" />
              <span className="cifra">{formatearVariacion(variacion)}</span>
              <span className="text-tenue">vs. mes anterior</span>
            </p>
          )}
        </div>
      </div>
      <span className="cifra shrink-0 text-sm font-medium text-texto">
        {formatearPesos(cliente.ventaPeriodo)}
      </span>
    </li>
  )
}

export default function PaginaPanel() {
  const { periodo } = usePeriodoSeleccionado()
  const resumen = useResumen()

  if (!resumen) {
    return (
      <>
        <EncabezadoPagina titulo={`Panel · ${formatearPeriodo(periodo)}`} />
        <p className="text-sm text-tenue">Cargando indicadores…</p>
      </>
    )
  }

  if (resumen.sinDatos) {
    return (
      <>
        <EncabezadoPagina
          titulo={`Panel · ${formatearPeriodo(periodo)}`}
          descripcion="Cómo voy contra la cuota, sin abrir el Excel."
        />
        <EstadoVacio
          icono={FileUp}
          titulo="Todavía no hay ventas cargadas"
          descripcion="Los indicadores aparecen en cuanto registres la primera venta. Puedes capturarlas a mano mientras llega el importador de Excel."
          accion={
            <Link to="/importar">
              <Boton variante="primario">Registrar ventas</Boton>
            </Link>
          }
        />
      </>
    )
  }

  const { mes, anio, proyeccion, semaforoMes, cobertura } = resumen
  const avanceAnual = resumen.metaAnualCompleta > 0 ? anio.vendido / resumen.metaAnualCompleta : null

  return (
    <>
      <EncabezadoPagina
        titulo={`Panel · ${formatearPeriodo(periodo)}`}
        descripcion="Cómo voy contra la cuota, sin abrir el Excel."
      />

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TarjetaKPI
            etiqueta="Cumplimiento"
            valor={mes.cumplimiento === null ? 'Sin meta' : formatearPorcentaje(mes.cumplimiento)}
            semaforo={semaforoMes}
            avance={mes.cumplimiento}
            detalle={`${formatearPesosCorto(mes.vendido)} de ${formatearPesosCorto(mes.meta)}`}
            nota={mes.hayMeta ? undefined : 'Define la cuota en Presupuesto'}
          />

          <TarjetaKPI
            etiqueta="Faltante"
            valor={mes.faltante === 0 ? 'Cumplida' : formatearPesosCorto(mes.faltante)}
            detalle={
              proyeccion.ritmoRequerido === null
                ? 'El mes ya cerró'
                : `${formatearPesosCorto(proyeccion.ritmoRequerido)} por día hábil`
            }
            nota={
              proyeccion.diasRestantes === 1
                ? 'Queda 1 día hábil'
                : `Quedan ${proyeccion.diasRestantes} días hábiles`
            }
          />

          <TarjetaKPI
            etiqueta="Proyección de cierre"
            valor={
              proyeccion.cumplimientoProyectado === null
                ? proyeccion.proyeccion === null
                  ? '—'
                  : formatearPesosCorto(proyeccion.proyeccion)
                : formatearPorcentaje(proyeccion.cumplimientoProyectado)
            }
            detalle={
              proyeccion.proyeccion === null
                ? 'Sin días hábiles transcurridos'
                : `${formatearPesosCorto(proyeccion.proyeccion)} al ritmo actual`
            }
            nota={
              proyeccion.promedioDiario === null
                ? undefined
                : `${formatearPesosCorto(proyeccion.promedioDiario)} por día hábil`
            }
          />

          <TarjetaKPI
            etiqueta="Acumulado del año"
            valor={anio.cumplimiento === null ? 'Sin meta' : formatearPorcentaje(anio.cumplimiento)}
            avance={avanceAnual}
            detalle={`${formatearPesosCorto(anio.vendido)} de ${formatearPesosCorto(resumen.metaAnualCompleta)}`}
            nota="Meta de los doce meses"
          />
        </div>

        <GraficaAnual serie={resumen.serie} />

        <div className="grid grid-cols-3 gap-3">
          <Tarjeta className="px-4 py-3">
            <p className="text-xs tracking-wider text-tenue uppercase">Cobertura</p>
            <p className="cifra mt-1 text-lg font-semibold text-texto">
              {cobertura.fraccion === null ? '—' : formatearPorcentaje(cobertura.fraccion, 0)}
            </p>
            <p className="cifra mt-0.5 text-xs text-suave">
              {cobertura.conCompra} de {cobertura.activos} clientes compraron
            </p>
          </Tarjeta>
          <Tarjeta className="px-4 py-3">
            <p className="text-xs tracking-wider text-tenue uppercase">Clientes nuevos</p>
            <p className="cifra mt-1 text-lg font-semibold text-texto">
              {formatearNumero(resumen.nuevos.length)}
            </p>
            <p className="mt-0.5 truncate text-xs text-suave">
              {resumen.nuevos.length === 0
                ? 'Ninguna apertura este mes'
                : resumen.nuevos.map((c) => c.nombre).join(', ')}
            </p>
          </Tarjeta>
          <Tarjeta className="px-4 py-3">
            <p className="text-xs tracking-wider text-tenue uppercase">Días hábiles</p>
            <p className="cifra mt-1 text-lg font-semibold text-texto">
              {proyeccion.diasTranscurridos} / {proyeccion.diasTotales}
            </p>
            <p className="mt-0.5 text-xs text-suave">Transcurridos del mes</p>
          </Tarjeta>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Panel titulo="Requieren atención" cantidad={resumen.alertas.length}>
            {resumen.alertas.length === 0 ? (
              <p className="flex items-center gap-2 px-4 py-8 text-sm text-suave">
                <AlertTriangle className="size-4 text-tenue" aria-hidden="true" />
                Ningún cliente en riesgo ni inactivo.
              </p>
            ) : (
              <ul>
                {resumen.alertas.slice(0, 8).map((alerta) => (
                  <FilaAlerta key={alerta.cliente.id} alerta={alerta} />
                ))}
              </ul>
            )}
            {resumen.alertas.length > 8 ? (
              <div className="border-t border-borde-suave px-4 py-2 text-right no-imprimir">
                <Link to="/clientes" className="text-xs text-acento hover:underline">
                  Ver los {resumen.alertas.length} en Clientes →
                </Link>
              </div>
            ) : null}
          </Panel>

          <Panel titulo="Top clientes del mes" cantidad={resumen.top.length}>
            {resumen.top.length === 0 ? (
              <p className="flex items-center gap-2 px-4 py-8 text-sm text-suave">
                <Trophy className="size-4 text-tenue" aria-hidden="true" />
                Sin ventas registradas en este periodo.
              </p>
            ) : (
              <ul>
                {resumen.top.map((cliente, indice) => (
                  <FilaTop key={cliente.id} cliente={cliente} posicion={indice + 1} />
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {!mes.hayMeta ? (
          <p className="flex items-center gap-2 text-sm text-suave no-imprimir">
            <Target className="size-4 text-tenue" aria-hidden="true" />
            Este mes no tiene cuota asignada.{' '}
            <Link to="/presupuesto" className="text-acento hover:underline">
              Definirla en Presupuesto
            </Link>
          </p>
        ) : null}
      </div>
    </>
  )
}
