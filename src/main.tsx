import '@fontsource-variable/inter'
import './styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { solicitarAlmacenamientoPersistente } from './lib/almacenamiento'

// Se pide desde el arranque para que el navegador no descarte la base local.
void solicitarAlmacenamientoPersistente()

const contenedor = document.getElementById('root')
if (!contenedor) throw new Error('No se encontro el elemento #root en index.html.')

createRoot(contenedor).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
