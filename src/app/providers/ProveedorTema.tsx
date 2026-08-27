import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Tema } from '@/domain/config/configuracion.entity'
import { ContextoTema, type EstadoTema } from '@/presentation/hooks/ui/contexto-tema'

const CLAVE = 'sgc.tema'

function leerTemaGuardado(): Tema {
  try {
    const valor = localStorage.getItem(CLAVE)
    if (valor === 'claro' || valor === 'oscuro' || valor === 'sistema') return valor
  } catch {
    /* almacenamiento no disponible */
  }
  return 'sistema'
}

function prefiereOscuro(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ProveedorTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(leerTemaGuardado)
  const [oscuroSistema, setOscuroSistema] = useState(prefiereOscuro)

  // El tema "sistema" tiene que reaccionar si el usuario cambia la preferencia
  // del sistema operativo con la aplicacion abierta.
  useEffect(() => {
    const consulta = window.matchMedia('(prefers-color-scheme: dark)')
    const alCambiar = (evento: MediaQueryListEvent) => setOscuroSistema(evento.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])

  const oscuroEfectivo = tema === 'oscuro' || (tema === 'sistema' && oscuroSistema)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuroEfectivo)
  }, [oscuroEfectivo])

  const cambiarTema = useCallback((nuevo: Tema) => {
    setTema(nuevo)
    try {
      localStorage.setItem(CLAVE, nuevo)
    } catch {
      /* la preferencia no persistira, pero la sesion actual funciona */
    }
  }, [])

  const valor = useMemo<EstadoTema>(
    () => ({ tema, oscuroEfectivo, cambiarTema }),
    [tema, oscuroEfectivo, cambiarTema],
  )

  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>
}
