import type { Periodo } from '@/domain/shared/types'
import { useRepositorios } from './contexto-repositorios'
import { useConsulta } from './useConsulta'

export interface ResumenBase {
  totalClientes: number
  periodosConDatos: Periodo[]
  totalPresupuestos: number
}

/** Estado general de la base local. Sirve para decidir que mostrar en cada pantalla. */
export function useResumenBase(): ResumenBase | undefined {
  const repositorios = useRepositorios()

  return useConsulta(async () => {
    const [totalClientes, periodosConDatos, presupuestos] = await Promise.all([
      repositorios.clientes.contar(),
      repositorios.ventas.periodosConDatos(),
      repositorios.presupuestos.listarTodos(),
    ])
    return { totalClientes, periodosConDatos, totalPresupuestos: presupuestos.length }
  }, [repositorios])
}
