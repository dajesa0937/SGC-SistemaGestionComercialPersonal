import { useCallback } from 'react'
import type { Id } from '@/domain/shared/types'
import type { NuevaZona, Zona } from '@/domain/geografia/zona.entity'
import { useRepositorios } from './contexto-repositorios'
import { useConsultaConEstado } from './useConsulta'

export function useZonas(): { zonas: readonly Zona[]; cargando: boolean } {
  const repositorios = useRepositorios()
  const { datos, cargando } = useConsultaConEstado(
    () => repositorios.zonas.listar(),
    [repositorios],
  )
  return { zonas: datos ?? [], cargando }
}

export function useAccionesZonas() {
  const repositorios = useRepositorios()

  const crear = useCallback(
    (zona: NuevaZona) => repositorios.zonas.crear(zona),
    [repositorios],
  )
  const actualizar = useCallback(
    (id: Id, cambios: Partial<NuevaZona>) => repositorios.zonas.actualizar(id, cambios),
    [repositorios],
  )
  const eliminar = useCallback((id: Id) => repositorios.zonas.eliminar(id), [repositorios])

  return { crear, actualizar, eliminar }
}
