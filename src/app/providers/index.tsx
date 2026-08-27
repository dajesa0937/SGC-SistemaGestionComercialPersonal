import type { ReactNode } from 'react'
import { ProveedorRepositorios } from './ProveedorRepositorios'
import { ProveedorTema } from './ProveedorTema'
import { ProveedorPeriodo } from './ProveedorPeriodo'

export function Proveedores({ children }: { children: ReactNode }) {
  return (
    <ProveedorTema>
      <ProveedorRepositorios>
        <ProveedorPeriodo>{children}</ProveedorPeriodo>
      </ProveedorRepositorios>
    </ProveedorTema>
  )
}
