import { useState } from 'react'
import { ChevronLeft, ChevronRight, CopyCheck, Target } from 'lucide-react'
import { anioDe, nombreDelMes, periodoActual } from '@/domain/shared/periodo'
import { formatearPesos, formatearPorcentaje } from '@/lib/formato'
import { Boton } from '@/presentation/components/shared/Boton'
import { CampoMoneda } from '@/presentation/components/shared/CampoMoneda'
import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import { usePresupuestoAnual } from '@/presentation/hooks/data/usePresupuestoAnual'
import { useRepositorios } from '@/presentation/hooks/data/contexto-repositorios'
import { usePeriodoSeleccionado } from '@/presentation/hooks/ui/contexto-periodo'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'

function colorCumplimiento(cumplimiento: number | null): string {
  if (cumplimiento === null) return 'text-tenue'
  if (cumplimiento >= 1) return 'text-exito'
  if (cumplimiento >= 0.85) return 'text-alerta'
  return 'text-peligro'
}

export default function PaginaPresupuesto() {
  const { periodo } = usePeriodoSeleccionado()
  const [anio, setAnio] = useState(() => anioDe(periodo))
  const repositorios = useRepositorios()
  const { mostrar } = useAvisos()
  const presupuesto = usePresupuestoAnual(anio)

  const mesActual = periodoActual()

  const guardarMeta = async (p: string, meta: number) => {
    try {
      await repositorios.presupuestos.guardar({ periodo: p, meta })
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo guardar la cuota', 'error')
    }
  }

  const replicarALosRestantes = async () => {
    if (!presupuesto) return
    const referencia = presupuesto.meses.find((m) => m.meta > 0)
    if (!referencia) {
      mostrar('Primero escribe la cuota de un mes para poder replicarla', 'info')
      return
    }
    const pendientes = presupuesto.meses.filter((m) => m.periodo > referencia.periodo)
    await repositorios.presupuestos.guardarLote(
      pendientes.map((m) => ({ periodo: m.periodo, meta: referencia.meta })),
    )
    mostrar(
      `${formatearPesos(referencia.meta)} replicado a ${pendientes.length} meses`,
      'exito',
    )
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Presupuesto"
        descripcion="Cuota mensual asignada. Sin meta no hay cumplimiento que medir."
        acciones={
          <>
            <div className="flex items-center gap-0.5 rounded-md border border-borde bg-superficie p-0.5">
              <button
                type="button"
                aria-label="Año anterior"
                onClick={() => setAnio((a) => a - 1)}
                className="flex size-7 items-center justify-center rounded text-tenue hover:bg-superficie-alt hover:text-texto"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <span className="cifra px-2 text-sm font-medium text-texto">{anio}</span>
              <button
                type="button"
                aria-label="Año siguiente"
                onClick={() => setAnio((a) => a + 1)}
                className="flex size-7 items-center justify-center rounded text-tenue hover:bg-superficie-alt hover:text-texto"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
            <Boton onClick={replicarALosRestantes} title="Copia la primera cuota definida a los meses siguientes">
              <CopyCheck className="size-4" aria-hidden="true" />
              Replicar
            </Boton>
          </>
        }
      />

      {!presupuesto ? (
        <p className="text-sm text-tenue">Cargando…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Tarjeta className="px-4 py-3">
              <p className="text-xs tracking-wide text-tenue uppercase">Meta del año</p>
              <p className="cifra mt-1 text-lg font-semibold text-texto">
                {formatearPesos(presupuesto.totalMeta)}
              </p>
            </Tarjeta>
            <Tarjeta className="px-4 py-3">
              <p className="text-xs tracking-wide text-tenue uppercase">Vendido</p>
              <p className="cifra mt-1 text-lg font-semibold text-texto">
                {formatearPesos(presupuesto.totalVendido)}
              </p>
            </Tarjeta>
            <Tarjeta className="px-4 py-3">
              <p className="text-xs tracking-wide text-tenue uppercase">Cumplimiento</p>
              <p
                className={`cifra mt-1 text-lg font-semibold ${colorCumplimiento(presupuesto.cumplimiento)}`}
              >
                {presupuesto.cumplimiento === null
                  ? 'Sin meta'
                  : formatearPorcentaje(presupuesto.cumplimiento)}
              </p>
            </Tarjeta>
          </div>

          <Tarjeta className="overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-borde">
                  <th className="px-3 py-2.5 text-left text-xs font-medium tracking-wide text-tenue uppercase">
                    Mes
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium tracking-wide text-tenue uppercase">
                    Cuota
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium tracking-wide text-tenue uppercase">
                    Vendido
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium tracking-wide text-tenue uppercase">
                    Cumplimiento
                  </th>
                </tr>
              </thead>
              <tbody>
                {presupuesto.meses.map((mes) => (
                  <tr
                    key={mes.periodo}
                    className={`border-b border-borde-suave last:border-b-0 ${
                      mes.periodo === mesActual ? 'bg-acento-suave/40' : ''
                    }`}
                  >
                    <td className="px-3 py-1.5 text-texto">
                      {nombreDelMes(mes.periodo)}
                      {mes.periodo === mesActual ? (
                        <span className="ml-2 text-xs text-acento">mes en curso</span>
                      ) : null}
                    </td>
                    <td className="w-44 px-3 py-1.5">
                      <CampoMoneda
                        aria-label={`Cuota de ${nombreDelMes(mes.periodo)}`}
                        valor={mes.meta}
                        onGuardar={(valor) => void guardarMeta(mes.periodo, valor)}
                      />
                    </td>
                    <td className="cifra px-3 py-1.5 text-right text-suave">
                      {mes.vendido === 0 ? '—' : formatearPesos(mes.vendido)}
                    </td>
                    <td
                      className={`cifra px-3 py-1.5 text-right font-medium ${colorCumplimiento(mes.cumplimiento)}`}
                    >
                      {mes.cumplimiento === null ? '—' : formatearPorcentaje(mes.cumplimiento)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tarjeta>

          {presupuesto.totalMeta === 0 ? (
            <p className="flex items-center gap-2 text-sm text-suave">
              <Target className="size-4 text-tenue" aria-hidden="true" />
              Escribe la cuota de un mes y usa «Replicar» para copiarla al resto del año.
            </p>
          ) : null}
        </div>
      )}
    </>
  )
}
