import { NavLink } from 'react-router-dom'
import { SECCION_CONFIGURACION, SECCIONES, type Seccion } from '@/app/navegacion'
import { cn } from '@/lib/cn'

function Enlace({ seccion }: { seccion: Seccion }) {
  const Icono = seccion.icono
  return (
    <NavLink
      to={seccion.ruta}
      end={seccion.ruta === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150',
          isActive
            ? 'bg-acento-suave font-medium text-acento'
            : 'text-suave hover:bg-superficie-alt hover:text-texto',
        )
      }
    >
      <Icono className="size-4 shrink-0" aria-hidden="true" />
      <span>{seccion.etiqueta}</span>
    </NavLink>
  )
}

export function BarraLateral() {
  return (
    <nav
      aria-label="Navegación principal"
      className="flex h-full w-56 shrink-0 flex-col border-r border-borde bg-superficie px-3 py-4"
    >
      <div className="mb-6 flex items-center gap-2.5 px-2.5">
        <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center rounded-md bg-acento"
        >
          <svg viewBox="0 0 32 32" className="size-4">
            <rect x="6" y="17" width="4" height="9" rx="1" fill="#fff" opacity=".6" />
            <rect x="14" y="11" width="4" height="15" rx="1" fill="#fff" opacity=".8" />
            <rect x="22" y="6" width="4" height="20" rx="1" fill="#fff" />
          </svg>
        </span>
        <span className="text-sm font-semibold tracking-tight text-texto">SGC Personal</span>
      </div>

      <div className="flex flex-col gap-0.5">
        {SECCIONES.map((seccion) => (
          <Enlace key={seccion.ruta} seccion={seccion} />
        ))}
      </div>

      <div className="mt-auto border-t border-borde-suave pt-3">
        <Enlace seccion={SECCION_CONFIGURACION} />
      </div>
    </nav>
  )
}
