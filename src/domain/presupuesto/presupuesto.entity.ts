import type { Id, InstanteISO, Periodo, Pesos } from '../shared/types'

/** Cuota asignada para un periodo. Cifra global en pesos. */
export interface Presupuesto {
  readonly id: Id
  readonly periodo: Periodo
  meta: Pesos
  nota?: string
  actualizadoEn: InstanteISO
}

export type NuevoPresupuesto = Omit<Presupuesto, 'id' | 'actualizadoEn'>
