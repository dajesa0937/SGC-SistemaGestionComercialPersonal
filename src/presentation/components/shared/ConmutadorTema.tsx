import { Monitor, Moon, Sun } from 'lucide-react'
import type { Tema } from '@/domain/config/configuracion.entity'
import { useTema } from '@/presentation/hooks/ui/contexto-tema'
import { cn } from '@/lib/cn'

const OPCIONES: ReadonlyArray<{ valor: Tema; etiqueta: string; icono: typeof Sun }> = [
  { valor: 'claro', etiqueta: 'Tema claro', icono: Sun },
  { valor: 'oscuro', etiqueta: 'Tema oscuro', icono: Moon },
  { valor: 'sistema', etiqueta: 'Seguir al sistema', icono: Monitor },
]

export function ConmutadorTema() {
  const { tema, cambiarTema } = useTema()

  return (
    <div
      role="group"
      aria-label="Tema de la interfaz"
      className="flex items-center gap-0.5 rounded-md border border-borde bg-superficie p-0.5"
    >
      {OPCIONES.map(({ valor, etiqueta, icono: Icono }) => (
        <button
          key={valor}
          type="button"
          title={etiqueta}
          aria-label={etiqueta}
          aria-pressed={tema === valor}
          onClick={() => cambiarTema(valor)}
          className={cn(
            'flex size-7 items-center justify-center rounded transition-colors duration-150',
            tema === valor
              ? 'bg-acento-suave text-acento'
              : 'text-tenue hover:bg-superficie-alt hover:text-texto',
          )}
        >
          <Icono className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
