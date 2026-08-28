import type { Periodo, Pesos } from '@/domain/shared/types'
import { anioDe, mesDe } from '@/domain/shared/periodo'
import { diasHabilesDelMes } from '@/lib/diasHabiles'

export interface ProyeccionCierre {
  readonly diasTotales: number
  readonly diasTranscurridos: number
  readonly diasRestantes: number
  /** Promedio vendido por día hábil transcurrido. `null` si aún no ha pasado ninguno. */
  readonly promedioDiario: Pesos | null
  /** Venta estimada al cierre si se mantiene el ritmo. `null` si no hay base para estimar. */
  readonly proyeccion: Pesos | null
  /** Cumplimiento estimado al cierre. `null` sin meta o sin base. */
  readonly cumplimientoProyectado: number | null
  /** Lo que hay que vender cada día hábil restante para cumplir. */
  readonly ritmoRequerido: Pesos | null
  /** El mes ya cerró: no hay nada que proyectar. */
  readonly periodoCerrado: boolean
}

/**
 * Proyecta el cierre del mes a partir del ritmo de venta por día hábil.
 *
 * Se usan días hábiles y no días naturales porque un mes con dos festivos y un
 * fin de semana largo tiene mucha menos capacidad de venta que uno corriente,
 * y proyectar sobre días naturales exagera lo que falta.
 */
export function proyectarCierre(
  vendido: Pesos,
  faltante: Pesos,
  meta: Pesos,
  periodo: Periodo,
  hoy: Date,
): ProyeccionCierre {
  const dias = diasHabilesDelMes(anioDe(periodo), mesDe(periodo), hoy)
  const periodoCerrado = dias.restantes === 0

  const promedioDiario = dias.transcurridos > 0 ? vendido / dias.transcurridos : null
  const proyeccion =
    promedioDiario === null ? null : Math.round(promedioDiario * dias.totales)

  return {
    diasTotales: dias.totales,
    diasTranscurridos: dias.transcurridos,
    diasRestantes: dias.restantes,
    promedioDiario: promedioDiario === null ? null : Math.round(promedioDiario),
    proyeccion,
    cumplimientoProyectado: proyeccion !== null && meta > 0 ? proyeccion / meta : null,
    // Sin días restantes no existe un ritmo alcanzable: devolver una cifra
    // sería sugerir que todavía se puede hacer algo.
    ritmoRequerido: dias.restantes > 0 ? Math.ceil(faltante / dias.restantes) : null,
    periodoCerrado,
  }
}
