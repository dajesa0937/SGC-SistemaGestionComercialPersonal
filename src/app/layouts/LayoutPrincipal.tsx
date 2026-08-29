import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BarraLateral } from '@/presentation/components/shared/BarraLateral'
import { ConmutadorTema } from '@/presentation/components/shared/ConmutadorTema'
import { SelectorPeriodo } from '@/presentation/components/shared/SelectorPeriodo'
import { buscarSeccion } from '@/app/navegacion'
import { AvisoRespaldo } from '@/presentation/components/shared/AvisoRespaldo'
import { AvisoDemo } from '@/presentation/components/shared/AvisoDemo'

function Migas() {
  const { pathname } = useLocation()
  const seccion = buscarSeccion(pathname)
  return (
    <nav aria-label="Ruta de navegación" className="text-sm text-tenue">
      <span>SGC Personal</span>
      {seccion && seccion.ruta !== '/' ? (
        <>
          <span className="mx-1.5" aria-hidden="true">
            /
          </span>
          <span className="text-texto">{seccion.etiqueta}</span>
        </>
      ) : null}
    </nav>
  )
}

function Cargando() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-tenue" role="status">
      Cargando…
    </div>
  )
}

export function LayoutPrincipal() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="no-imprimir">
        <BarraLateral />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-imprimir flex h-14 shrink-0 items-center justify-between gap-4 border-b border-borde bg-superficie px-6">
          <Migas />
          <div className="flex items-center gap-2">
            <SelectorPeriodo />
            <ConmutadorTema />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-6xl">
            <AvisoDemo />
            <AvisoRespaldo />
            <Suspense fallback={<Cargando />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
