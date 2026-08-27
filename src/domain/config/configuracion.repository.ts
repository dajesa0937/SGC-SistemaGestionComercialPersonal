import type { ConfiguracionNegocio } from './configuracion.entity'

export interface ConfiguracionRepository {
  leerNegocio(): Promise<ConfiguracionNegocio>
  guardarNegocio(config: ConfiguracionNegocio): Promise<void>
  leerValor<T>(clave: string): Promise<T | undefined>
  guardarValor<T>(clave: string, valor: T): Promise<void>
}
