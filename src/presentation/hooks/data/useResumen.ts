import { useMemo } from 'react'
import { resumenDelPeriodo, type ResumenDelPeriodo } from '@/application/indicadores/resumenDelPeriodo'
import { usePeriodoSeleccionado } from '@/presentation/hooks/ui/contexto-periodo'
import { useRepositorios } from './contexto-repositorios'
import { useConsulta } from './useConsulta'

/**
 * Resumen completo del periodo seleccionado.
 *
 * Trae los datos crudos una sola vez y deja todo el calculo en la funcion pura
 * `resumenDelPeriodo`. Con menos de cien clientes esto es instantaneo, y a
 * cambio los numeros del panel son exactamente los que cubren las pruebas.
 */
export function useResumen(): ResumenDelPeriodo | undefined {
  const repositorios = useRepositorios()
  const { periodo } = usePeriodoSeleccionado()

  const datos = useConsulta(async () => {
    const [clientes, ventas, presupuestos, config, zonas, movimientos, notas] = await Promise.all([
      repositorios.clientes.listar({ incluirArchivados: true }),
      repositorios.ventas.listarTodas(),
      repositorios.presupuestos.listarTodos(),
      repositorios.configuracion.leerNegocio(),
      repositorios.zonas.listar(),
      repositorios.movimientos.listarTodos(),
      repositorios.clientes.listarTodasLasNotas(),
    ])
    return { clientes, ventas, presupuestos, config, zonas, movimientos, notas }
  }, [repositorios])

  return useMemo(
    () => (datos ? resumenDelPeriodo({ ...datos, periodo, hoy: new Date() }) : undefined),
    [datos, periodo],
  )
}
