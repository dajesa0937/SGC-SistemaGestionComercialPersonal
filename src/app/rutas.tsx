import { lazy } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LayoutPrincipal } from './layouts/LayoutPrincipal'
import { LimiteDeError } from './LimiteDeError'

// Carga diferida por modulo: el paquete inicial solo trae el armazon (RNF-12).
const PaginaPanel = lazy(() => import('@/presentation/features/panel/PaginaPanel'))
const PaginaClientes = lazy(() => import('@/presentation/features/clientes/PaginaClientes'))
const PaginaPresupuesto = lazy(
  () => import('@/presentation/features/presupuesto/PaginaPresupuesto'),
)
const PaginaImportacion = lazy(
  () => import('@/presentation/features/importacion/PaginaImportacion'),
)
const PaginaReportes = lazy(() => import('@/presentation/features/reportes/PaginaReportes'))
const PaginaConfiguracion = lazy(
  () => import('@/presentation/features/configuracion/PaginaConfiguracion'),
)
const PaginaNoEncontrada = lazy(() => import('./PaginaNoEncontrada'))

/**
 * Cada ruta va envuelta en su propio limite de error.
 *
 * La `key` con la ruta actual es deliberada: sin ella, una pantalla que fallo
 * seguiria mostrando el error al volver a entrar, porque el limite conserva su
 * estado. Cambiar la clave lo remonta limpio en cada navegacion.
 */
function Ruta({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  return <LimiteDeError key={pathname}>{children}</LimiteDeError>
}

export function Rutas() {
  return (
    <Routes>
      <Route element={<LayoutPrincipal />}>
        <Route
          index
          element={
            <Ruta>
              <PaginaPanel />
            </Ruta>
          }
        />
        <Route
          path="clientes"
          element={
            <Ruta>
              <PaginaClientes />
            </Ruta>
          }
        />
        <Route
          path="presupuesto"
          element={
            <Ruta>
              <PaginaPresupuesto />
            </Ruta>
          }
        />
        <Route
          path="importar"
          element={
            <Ruta>
              <PaginaImportacion />
            </Ruta>
          }
        />
        <Route
          path="reportes"
          element={
            <Ruta>
              <PaginaReportes />
            </Ruta>
          }
        />
        <Route
          path="configuracion"
          element={
            <Ruta>
              <PaginaConfiguracion />
            </Ruta>
          }
        />
        <Route path="panel" element={<Navigate to="/" replace />} />
        <Route
          path="*"
          element={
            <Ruta>
              <PaginaNoEncontrada />
            </Ruta>
          }
        />
      </Route>
    </Routes>
  )
}
