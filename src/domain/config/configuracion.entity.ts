/**
 * Configuracion de la aplicacion, en formato clave-valor.
 *
 * Los umbrales de negocio son configurables a proposito: lo que se considera
 * "en riesgo" depende del ciclo de compra del territorio, y ese criterio lo
 * tiene el usuario, no el desarrollador.
 */
export interface ConfiguracionNegocio {
  /** Meses sin comprar tras los cuales un cliente pasa a inactivo. */
  mesesParaInactivo: number
  /** Caida porcentual sobre el promedio reciente que marca a un cliente en riesgo. */
  umbralCaida: number
  /** Corte acumulado de Pareto para la clase A. */
  corteA: number
  /** Corte acumulado de Pareto para la clase B. */
  corteB: number
  /** Cumplimiento a partir del cual el indicador se muestra en verde. */
  umbralVerde: number
  /** Cumplimiento a partir del cual el indicador se muestra en ambar. */
  umbralAmbar: number
  /** Dias sin respaldar tras los cuales se muestra el aviso. */
  diasAvisoRespaldo: number

  /**
   * Cada cuantos dias deberia visitarse un cliente de cada clase.
   *
   * Es politica comercial del usuario, no una constante del sistema: depende
   * del ciclo de compra y de lo disperso que sea el territorio.
   */
  diasVisitaA: number
  diasVisitaB: number
  diasVisitaC: number
  /** Un cliente sin historia de compra tambien hay que ir a verlo. */
  diasVisitaSinHistoria: number
  /**
   * Visitas que el usuario alcanza a hacer en una semana.
   *
   * Es el limite que convierte una lista de deseos en un plan. Sin el, la
   * aplicacion propondria mas visitas de las que caben en el mes y el plan
   * seria papel mojado.
   */
  visitasPorSemana: number
}

export const CONFIGURACION_POR_DEFECTO: ConfiguracionNegocio = {
  mesesParaInactivo: 3,
  umbralCaida: 0.3,
  corteA: 0.8,
  corteB: 0.95,
  umbralVerde: 1,
  umbralAmbar: 0.85,
  diasAvisoRespaldo: 15,
  diasVisitaA: 15,
  diasVisitaB: 30,
  diasVisitaC: 60,
  diasVisitaSinHistoria: 45,
  visitasPorSemana: 15,
}

export type Tema = 'claro' | 'oscuro' | 'sistema'
