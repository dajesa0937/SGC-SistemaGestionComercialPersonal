import { useCallback } from 'react'
import type { ConfiguracionNegocio } from '@/domain/config/configuracion.entity'
import { useRepositorios } from './contexto-repositorios'
import { useConsulta } from './useConsulta'

export function useConfiguracionNegocio() {
  const repositorios = useRepositorios()
  const config = useConsulta(() => repositorios.configuracion.leerNegocio(), [repositorios])

  const guardar = useCallback(
    async (cambios: Partial<ConfiguracionNegocio>) => {
      const actual = await repositorios.configuracion.leerNegocio()
      await repositorios.configuracion.guardarNegocio({ ...actual, ...cambios })
    },
    [repositorios],
  )

  return { config, guardar }
}
