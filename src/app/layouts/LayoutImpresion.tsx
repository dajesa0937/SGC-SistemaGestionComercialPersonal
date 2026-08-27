import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

/**
 * Layout sin navegacion, para las vistas previas de reporte.
 *
 * Lo que se ve en pantalla es exactamente lo que sale impreso: una sola
 * maquetacion para papel y para PDF.
 */
export function LayoutImpresion() {
  return (
    <div className="min-h-dvh bg-fondo py-8 print:bg-white print:py-0">
      <div className="mx-auto w-[21.6cm] max-w-full bg-superficie p-[1.5cm] shadow-sm print:w-auto print:bg-white print:p-0 print:shadow-none">
        <Suspense fallback={<p className="text-sm text-tenue">Cargando…</p>}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
