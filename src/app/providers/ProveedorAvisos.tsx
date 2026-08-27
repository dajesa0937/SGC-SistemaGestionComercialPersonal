import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ContextoAvisos,
  type Aviso,
  type EstadoAvisos,
  type TonoAviso,
} from '@/presentation/hooks/ui/contexto-avisos'

const DURACION_MS = 4500

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const temporizadores = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const descartar = useCallback((id: string) => {
    const temporizador = temporizadores.current.get(id)
    if (temporizador) {
      clearTimeout(temporizador)
      temporizadores.current.delete(id)
    }
    setAvisos((previos) => previos.filter((a) => a.id !== id))
  }, [])

  const mostrar = useCallback(
    (mensaje: string, tono: TonoAviso = 'info') => {
      const id = crypto.randomUUID()
      setAvisos((previos) => [...previos, { id, tono, mensaje }])
      // Los errores no se van solos: si algo fallo, el usuario debe poder leerlo
      // con calma y cerrarlo el mismo.
      if (tono !== 'error') {
        temporizadores.current.set(id, setTimeout(() => descartar(id), DURACION_MS))
      }
    },
    [descartar],
  )

  const valor = useMemo<EstadoAvisos>(
    () => ({ avisos, mostrar, descartar }),
    [avisos, mostrar, descartar],
  )

  return <ContextoAvisos.Provider value={valor}>{children}</ContextoAvisos.Provider>
}
