import { BrowserRouter } from 'react-router-dom'
import { Proveedores } from './providers'
import { Rutas } from './rutas'

export function App() {
  return (
    <BrowserRouter>
      <Proveedores>
        <Rutas />
      </Proveedores>
    </BrowserRouter>
  )
}
