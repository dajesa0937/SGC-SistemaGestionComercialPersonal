import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  abierto: boolean
  titulo: string
  subtitulo?: string
  onCerrar: () => void
  children: ReactNode
  pie?: ReactNode
  ancho?: 'md' | 'lg'
}

/**
 * Panel lateral.
 *
 * Se prefiere a un modal para editar registros: conserva a la vista el contexto
 * de la lista y permite revisar varios clientes seguidos sin perder el hilo.
 */
export function PanelLateral({
  abierto,
  titulo,
  subtitulo,
  onCerrar,
  children,
  pie,
  ancho = 'md',
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPulsar)

    // El foco entra al panel para que el teclado funcione de inmediato.
    const primero = contenedor.current?.querySelector<HTMLElement>(
      'input, select, textarea, button',
    )
    primero?.focus()

    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = overflowPrevio
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 no-imprimir" data-panel-lateral>
      {/* La capa de fondo se oculta a los lectores de pantalla: duplicaba el
          nombre accesible del botón «Cerrar» del pie y no aporta nada, porque
          para el teclado ya están la tecla Escape y la X del encabezado. */}
      <div
        aria-hidden="true"
        onClick={onCerrar}
        className="absolute inset-0 bg-black/25 dark:bg-black/50"
      />
      <div
        ref={contenedor}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={
          'absolute inset-y-0 right-0 flex w-full flex-col border-l border-borde bg-superficie shadow-xl ' +
          (ancho === 'lg' ? 'max-w-2xl' : 'max-w-lg')
        }
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-borde px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-texto">{titulo}</h2>
            {subtitulo ? <p className="mt-0.5 truncate text-sm text-suave">{subtitulo}</p> : null}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar panel"
            className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-md text-tenue transition-colors duration-150 hover:bg-superficie-alt hover:text-texto"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {pie ? (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-borde px-5 py-3">
            {pie}
          </footer>
        ) : null}
      </div>
    </div>
  )
}
