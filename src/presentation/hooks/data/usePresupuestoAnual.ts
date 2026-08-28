import { useMemo } from 'react'
import type { Periodo, Pesos } from '@/domain/shared/types'
import { periodosDelAnio } from '@/domain/shared/periodo'
import { useRepositorios } from './contexto-repositorios'
import { useConsulta } from './useConsulta'

export interface MesDelAnio {
  readonly periodo: Periodo
  readonly meta: Pesos
  readonly vendido: Pesos
  readonly cumplimiento: number | null
}

export interface PresupuestoAnual {
  readonly meses: readonly MesDelAnio[]
  readonly totalMeta: Pesos
  readonly totalVendido: Pesos
  readonly cumplimiento: number | null
}

export function usePresupuestoAnual(anio: number): PresupuestoAnual | undefined {
  const repositorios = useRepositorios()

  const datos = useConsulta(async () => {
    const [presupuestos, ventas] = await Promise.all([
      repositorios.presupuestos.listarPorAnio(anio),
      repositorios.ventas.listarPorRango(`${anio}-01`, `${anio}-12`),
    ])
    return { presupuestos, ventas }
  }, [repositorios, anio])

  return useMemo(() => {
    if (!datos) return undefined

    const metas = new Map(datos.presupuestos.map((p) => [p.periodo, p.meta]))
    const vendidos = new Map<Periodo, Pesos>()
    for (const venta of datos.ventas) {
      vendidos.set(venta.periodo, (vendidos.get(venta.periodo) ?? 0) + venta.valor)
    }

    const meses = periodosDelAnio(anio).map((periodo) => {
      const meta = metas.get(periodo) ?? 0
      const vendido = vendidos.get(periodo) ?? 0
      return { periodo, meta, vendido, cumplimiento: meta > 0 ? vendido / meta : null }
    })

    const totalMeta = meses.reduce((t, m) => t + m.meta, 0)
    const totalVendido = meses.reduce((t, m) => t + m.vendido, 0)

    return {
      meses,
      totalMeta,
      totalVendido,
      cumplimiento: totalMeta > 0 ? totalVendido / totalMeta : null,
    }
  }, [datos, anio])
}
