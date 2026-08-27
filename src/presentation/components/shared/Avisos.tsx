import { AlertTriangle, Check, Info, X } from 'lucide-react'
import { useAvisos, type TonoAviso } from '@/presentation/hooks/ui/contexto-avisos'

const ESTILOS: Record<TonoAviso, { clase: string; icono: typeof Check }> = {
  exito: { clase: 'border-exito/40 bg-exito-suave text-texto', icono: Check },
  error: { clase: 'border-peligro/40 bg-peligro-suave text-texto', icono: AlertTriangle },
  info: { clase: 'border-borde bg-superficie text-texto', icono: Info },
}

export function Avisos() {
  const { avisos, descartar } = useAvisos()
  if (avisos.length === 0) return null

  return (
    <div
      aria-live="polite"
      // Arriba y centrado a proposito: abajo a la derecha tapaba los botones de
      // accion del panel lateral, que es justo donde el usuario esta mirando
      // cuando aparece el aviso.
      className="pointer-events-none fixed top-3 left-1/2 z-[60] flex w-80 -translate-x-1/2 flex-col gap-2 no-imprimir"
    >
      {avisos.map((aviso) => {
        const { clase, icono: Icono } = ESTILOS[aviso.tono]
        return (
          <div
            key={aviso.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-panel border px-3.5 py-3 shadow-lg ${clase}`}
          >
            <Icono className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="flex-1 text-sm">{aviso.mensaje}</p>
            <button
              type="button"
              onClick={() => descartar(aviso.id)}
              aria-label="Descartar aviso"
              className="-mr-1 -mt-0.5 flex size-6 shrink-0 items-center justify-center rounded text-tenue hover:text-texto"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
