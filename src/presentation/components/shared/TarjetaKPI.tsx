import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { SemaforoCumplimiento } from '@/application/indicadores/calcularCumplimiento'

const COLOR_SEMAFORO: Record<SemaforoCumplimiento, string> = {
  verde: 'text-exito',
  ambar: 'text-alerta',
  rojo: 'text-peligro',
  sin_meta: 'text-tenue',
}

const FONDO_BARRA: Record<SemaforoCumplimiento, string> = {
  verde: 'bg-exito',
  ambar: 'bg-alerta',
  rojo: 'bg-peligro',
  sin_meta: 'bg-borde',
}

interface Props {
  etiqueta: string
  valor: string
  /** Solo se colorea el valor cuando representa cumplimiento. */
  semaforo?: SemaforoCumplimiento
  /** Fracción de 0 a 1 para la barra de avance. */
  avance?: number | null
  detalle?: ReactNode
  nota?: ReactNode
}

export function TarjetaKPI({ etiqueta, valor, semaforo, avance, detalle, nota }: Props) {
  const tono = semaforo ?? 'sin_meta'

  return (
    <div className="rounded-panel border border-borde bg-superficie px-4 py-3.5 no-cortar">
      <p className="text-xs font-medium tracking-wider text-tenue uppercase">{etiqueta}</p>

      <p
        className={cn(
          'cifra mt-1.5 text-2xl leading-none font-semibold tracking-tight',
          semaforo ? COLOR_SEMAFORO[tono] : 'text-texto',
        )}
      >
        {valor}
      </p>

      {avance !== undefined && avance !== null ? (
        <div
          className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-superficie-alt"
          role="img"
          aria-label={`Avance ${Math.round(avance * 100)} %`}
        >
          <div
            className={cn('h-full rounded-full', FONDO_BARRA[tono])}
            style={{ width: `${Math.min(100, Math.max(0, avance * 100))}%` }}
          />
        </div>
      ) : null}

      {detalle ? <p className="cifra mt-2 text-sm text-suave">{detalle}</p> : null}
      {nota ? <p className="mt-0.5 text-xs text-tenue">{nota}</p> : null}
    </div>
  )
}
