import type { ReactNode } from 'react'
import { ProveedorRepositorios } from './ProveedorRepositorios'
import { ProveedorServicios } from './ProveedorServicios'
import { ProveedorTema } from './ProveedorTema'
import { ProveedorPeriodo } from './ProveedorPeriodo'
import { ProveedorAvisos } from './ProveedorAvisos'

export function Proveedores({ children }: { children: ReactNode }) {
  return (
    <ProveedorTema>
      <ProveedorAvisos>
        <ProveedorRepositorios>
          <ProveedorServicios>
            <ProveedorPeriodo>{children}</ProveedorPeriodo>
          </ProveedorServicios>
        </ProveedorRepositorios>
      </ProveedorAvisos>
    </ProveedorTema>
  )
}
