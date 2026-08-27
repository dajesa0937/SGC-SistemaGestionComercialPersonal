import { createContext, useContext } from 'react'
import type { Tema } from '@/domain/config/configuracion.entity'

export interface EstadoTema {
  tema: Tema
  oscuroEfectivo: boolean
  cambiarTema: (tema: Tema) => void
}

export const ContextoTema = createContext<EstadoTema | null>(null)

export function useTema(): EstadoTema {
  const estado = useContext(ContextoTema)
  if (!estado) throw new Error('useTema debe usarse dentro de <ProveedorTema>.')
  return estado
}
