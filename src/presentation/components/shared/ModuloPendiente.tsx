import { Construction } from 'lucide-react'
import { Tarjeta } from './Tarjeta'

interface Props {
  sprint: string
  objetivo: string
  incluye: readonly string[]
}

/**
 * Marcador honesto para los modulos que aun no existen.
 *
 * Se prefiere decir en que sprint llega cada cosa antes que mostrar una
 * pantalla vacia sin explicacion o, peor, datos de mentira.
 */
export function ModuloPendiente({ sprint, objetivo, incluye }: Props) {
  return (
    <Tarjeta className="p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-superficie-alt">
          <Construction className="size-4 text-tenue" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-acento">{sprint}</p>
          <p className="mt-1.5 text-sm text-texto">{objetivo}</p>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-suave">
            {incluye.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="text-tenue">
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Tarjeta>
  )
}
