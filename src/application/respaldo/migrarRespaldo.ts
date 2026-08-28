import { VERSION_RESPALDO, type Respaldo } from '@/domain/respaldo/respaldo.entity'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import { normalizarIdentificacion } from '@/domain/cliente/identificacion'
import { municipioPorNombre, normalizarCodigoMunicipio } from '@/domain/geografia/geografia'
import type { Zona } from '@/domain/geografia/zona.entity'

/** Cliente tal como lo guardaba la version 1 del respaldo. */
interface ClienteV1 extends Cliente {
  nit?: string
  zona?: string
  ciudad?: string
}

/**
 * Lleva un respaldo de la version 1 a la actual.
 *
 * Traduce exactamente lo mismo que la migracion de la base (`schema.ts`), y por
 * la misma razon: un archivo guardado antes del cambio de modelo tiene que
 * poder restaurarse despues. Se aplica el mismo criterio conservador — un
 * nombre de municipio ambiguo se deja sin resolver antes que resolverlo mal.
 */
export function migrarRespaldo(respaldo: Respaldo): Respaldo {
  if (respaldo.version >= VERSION_RESPALDO) return respaldo

  const zonasPorNombre = new Map<string, Set<string>>()

  const clientes = respaldo.datos.clientes.map((crudo) => {
    const viejo = crudo as ClienteV1
    const municipio =
      viejo.municipio ??
      normalizarCodigoMunicipio(viejo.ciudad) ??
      (viejo.ciudad ? municipioPorNombre(viejo.ciudad) : undefined)

    const nombreZona = viejo.zona?.trim()
    if (nombreZona) {
      const municipios = zonasPorNombre.get(nombreZona) ?? new Set<string>()
      if (municipio) municipios.add(municipio)
      zonasPorNombre.set(nombreZona, municipios)
    }

    const { nit, zona, ciudad, ...resto } = viejo
    void nit
    void zona
    void ciudad

    return {
      ...resto,
      identificacion: viejo.identificacion ?? normalizarIdentificacion(nit),
      municipio,
    } satisfies Cliente
  })

  const ahora = respaldo.generadoEn
  const zonasDerivadas: Zona[] = [...zonasPorNombre.entries()].map(([nombre, municipios]) => ({
    id: crypto.randomUUID(),
    nombre,
    municipios: [...municipios],
    creadoEn: ahora,
    actualizadoEn: ahora,
  }))

  return {
    ...respaldo,
    version: VERSION_RESPALDO,
    datos: {
      ...respaldo.datos,
      clientes,
      zonas: respaldo.datos.zonas?.length ? respaldo.datos.zonas : zonasDerivadas,
    },
  }
}
