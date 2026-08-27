import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Periodo } from '@/domain/shared/types'
import { periodoActual } from '@/domain/shared/periodo'
import { ContextoPeriodo, type EstadoPeriodo } from '@/presentation/hooks/ui/contexto-periodo'

export function ProveedorPeriodo({ children }: { children: ReactNode }) {
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoActual())
  const cambiarPeriodo = useCallback((nuevo: Periodo) => setPeriodo(nuevo), [])
  const valor = useMemo<EstadoPeriodo>(
    () => ({ periodo, cambiarPeriodo }),
    [periodo, cambiarPeriodo],
  )
  return <ContextoPeriodo.Provider value={valor}>{children}</ContextoPeriodo.Provider>
}
