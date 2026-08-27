import { BrowserRouter } from 'react-router-dom'
import { Avisos } from '@/presentation/components/shared/Avisos'
import { Proveedores } from './providers'
import { Rutas } from './rutas'

export function App() {
  return (
    <BrowserRouter>
      <Proveedores>
        <Rutas />
        <Avisos />
      </Proveedores>
    </BrowserRouter>
  )
}
