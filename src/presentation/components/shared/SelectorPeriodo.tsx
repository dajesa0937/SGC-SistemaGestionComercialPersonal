import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  formatearPeriodoCorto,
  periodoActual,
  sumarMeses,
  ultimosPeriodos,
} from '@/domain/shared/periodo'
import { usePeriodoSeleccionado } from '@/presentation/hooks/ui/contexto-periodo'

/**
 * Selector de periodo global.
 *
 * Se limita a periodos ya transcurridos mas el mes en curso: seleccionar un mes
 * futuro solo puede producir indicadores vacios y confusion.
 */
export function SelectorPeriodo() {
  const { periodo, cambiarPeriodo } = usePeriodoSeleccionado()
  const actual = periodoActual()
  const disponibles = [...ultimosPeriodos(actual, 36)].reverse()
  const esElMasReciente = periodo >= actual

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-borde bg-superficie p-0.5">
      <button
        type="button"
        aria-label="Mes anterior"
        onClick={() => cambiarPeriodo(sumarMeses(periodo, -1))}
        className="flex size-7 items-center justify-center rounded text-tenue transition-colors duration-150 hover:bg-superficie-alt hover:text-texto"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      <label className="sr-only" htmlFor="selector-periodo">
        Periodo
      </label>
      <select
        id="selector-periodo"
        value={periodo}
        onChange={(evento) => cambiarPeriodo(evento.target.value)}
        className="cifra h-7 cursor-pointer rounded bg-transparent px-2 text-sm font-medium text-texto outline-none"
      >
        {disponibles.map((p) => (
          <option key={p} value={p}>
            {formatearPeriodoCorto(p)}
          </option>
        ))}
      </select>

      <button
        type="button"
        aria-label="Mes siguiente"
        disabled={esElMasReciente}
        onClick={() => cambiarPeriodo(sumarMeses(periodo, 1))}
        className="flex size-7 items-center justify-center rounded text-tenue transition-colors duration-150 hover:bg-superficie-alt hover:text-texto disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
