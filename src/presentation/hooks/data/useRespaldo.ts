import { useCallback } from 'react'
import type { ContenidoRespaldo } from '@/domain/respaldo/respaldo.entity'
import { construirRespaldo, serializarRespaldo } from '@/application/respaldo/construirRespaldo'
import { descargarTexto, nombreConFecha } from '@/lib/descargar'
import { useRepositorios } from './contexto-repositorios'
import { useConsulta } from './useConsulta'

const CLAVE_ULTIMO = 'ultimoRespaldo'

export interface EstadoRespaldo {
  /** Fecha del último respaldo descargado. `null` si nunca se ha hecho uno. */
  readonly ultimo: string | null
  readonly diasDesdeUltimo: number | null
  readonly hayDatos: boolean
  readonly totalRegistros: number
}

export function useEstadoRespaldo(): EstadoRespaldo | undefined {
  const repositorios = useRepositorios()

  return useConsulta(async () => {
    const [ultimo, clientes, ventas] = await Promise.all([
      repositorios.configuracion.leerValor<string>(CLAVE_ULTIMO),
      repositorios.clientes.contar(),
      repositorios.ventas.listarTodas(),
    ])

    const diasDesdeUltimo =
      ultimo === undefined
        ? null
        : Math.floor((Date.now() - new Date(ultimo).getTime()) / 86_400_000)

    return {
      ultimo: ultimo ?? null,
      diasDesdeUltimo,
      hayDatos: clientes > 0 || ventas.length > 0,
      totalRegistros: clientes + ventas.length,
    }
  }, [repositorios])
}

export function useAccionesRespaldo() {
  const repositorios = useRepositorios()

  const exportar = useCallback(async (): Promise<number> => {
    const contenido = await repositorios.respaldo.exportar()
    const respaldo = construirRespaldo(contenido)
    descargarTexto(
      nombreConFecha('respaldo-sgc', 'json'),
      serializarRespaldo(respaldo),
      'application/json',
    )
    // Solo se marca como respaldado cuando el archivo ya se generó.
    await repositorios.configuracion.guardarValor(CLAVE_ULTIMO, respaldo.generadoEn)
    return contenido.clientes.length + contenido.ventas.length
  }, [repositorios])

  const restaurar = useCallback(
    async (contenido: ContenidoRespaldo) => {
      await repositorios.respaldo.reemplazar(contenido)
    },
    [repositorios],
  )

  const borrarTodo = useCallback(async () => {
    await repositorios.respaldo.borrarTodo()
  }, [repositorios])

  return { exportar, restaurar, borrarTodo }
}
