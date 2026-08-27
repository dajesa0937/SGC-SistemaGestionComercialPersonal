import { createContext, useContext } from 'react'

export type TonoAviso = 'exito' | 'error' | 'info'

export interface Aviso {
  readonly id: string
  readonly tono: TonoAviso
  readonly mensaje: string
}

export interface EstadoAvisos {
  readonly avisos: readonly Aviso[]
  mostrar: (mensaje: string, tono?: TonoAviso) => void
  descartar: (id: string) => void
}

export const ContextoAvisos = createContext<EstadoAvisos | null>(null)

export function useAvisos(): EstadoAvisos {
  const estado = useContext(ContextoAvisos)
  if (!estado) throw new Error('useAvisos debe usarse dentro de <ProveedorAvisos>.')
  return estado
}
