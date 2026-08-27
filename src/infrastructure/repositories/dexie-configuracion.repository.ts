import type { ConfiguracionRepository } from '@/domain/config/configuracion.repository'
import {
  CONFIGURACION_POR_DEFECTO,
  type ConfiguracionNegocio,
} from '@/domain/config/configuracion.entity'
import type { BaseSGC } from '../db/schema'

const CLAVE_NEGOCIO = 'negocio'

export class DexieConfiguracionRepository implements ConfiguracionRepository {
  constructor(private readonly db: BaseSGC) {}

  async leerNegocio(): Promise<ConfiguracionNegocio> {
    const guardada = await this.leerValor<Partial<ConfiguracionNegocio>>(CLAVE_NEGOCIO)
    // Se combinan con los valores por defecto para que anadir un umbral nuevo
    // no rompa una base ya existente.
    return { ...CONFIGURACION_POR_DEFECTO, ...guardada }
  }

  async guardarNegocio(config: ConfiguracionNegocio): Promise<void> {
    await this.guardarValor(CLAVE_NEGOCIO, config)
  }

  async leerValor<T>(clave: string): Promise<T | undefined> {
    const fila = await this.db.configuracion.get(clave)
    return fila?.valor as T | undefined
  }

  async guardarValor<T>(clave: string, valor: T): Promise<void> {
    await this.db.configuracion.put({ clave, valor })
  }
}
