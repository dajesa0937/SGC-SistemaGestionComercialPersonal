import type { ClasificacionABC, ClienteEnriquecido, NotaCliente } from '@/domain/cliente/cliente.entity'
import type { ConfiguracionNegocio } from '@/domain/config/configuracion.entity'
import type { FechaISO, Id } from '@/domain/shared/types'
import type { Crecimiento, Proyeccion, Tendencia } from './crecimiento'

export type EstadoVisita = 'nunca' | 'al_dia' | 'por_vencer' | 'vencida'

export interface ClienteDelPlan {
  readonly cliente: ClienteEnriquecido
  readonly ultimaVisita?: FechaISO
  readonly diasDesdeVisita: number | null
  readonly frecuencia: number
  readonly estado: EstadoVisita
  /** Dias que lleva de retraso. Negativo si aun no toca. */
  readonly retraso: number
  readonly crecimiento: Crecimiento
  readonly proyeccion: Proyeccion
  readonly prioridad: number
  readonly motivo: string
}

export interface PlanDeVisitas {
  /** Todos los que tocan, ordenados por prioridad. */
  readonly pendientes: readonly ClienteDelPlan[]
  /** Los que caben esta semana segun la capacidad declarada. */
  readonly estaSemana: readonly ClienteDelPlan[]
  readonly capacidadSemanal: number
  /** Visitas al mes que exigirian las frecuencias configuradas. */
  readonly requeridasPorMes: number
  readonly capacidadMensual: number
  /** Cuantas visitas al mes faltan para cumplir las frecuencias. */
  readonly deficit: number
  readonly alDia: number
  readonly nuncaVisitados: number
  /** Las frecuencias vigentes, para poder explicarlas donde se muestre el plan. */
  readonly frecuencias: { readonly A: number; readonly B: number; readonly C: number }
}

export function frecuenciaDe(
  clasificacion: ClasificacionABC,
  config: ConfiguracionNegocio,
): number {
  switch (clasificacion) {
    case 'A':
      return config.diasVisitaA
    case 'B':
      return config.diasVisitaB
    case 'C':
      return config.diasVisitaC
    default:
      return config.diasVisitaSinHistoria
  }
}

function diasEntre(desde: FechaISO, hasta: Date): number {
  const [anio, mes, dia] = desde.split('-').map(Number)
  if (!anio || !mes || !dia) return 0
  const inicio = new Date(anio, mes - 1, dia)
  const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate())
  return Math.round((fin.getTime() - inicio.getTime()) / 86_400_000)
}

/**
 * Peso de la clase en la prioridad.
 *
 * Un cliente A pesa cuatro veces lo que un C. No es una escala fina a
 * proposito: la clase dice «cuanto vale», y afinarla mas seria fingir una
 * precision que el Pareto no tiene.
 */
const PESO_CLASE: Record<ClasificacionABC, number> = {
  A: 4,
  B: 2,
  C: 1,
  SIN_HISTORIA: 2,
}

/**
 * Peso de la tendencia.
 *
 * Caer pesa mas que crecer, y es deliberado: recuperar a un cliente que se esta
 * yendo vale mas que acompanar a uno que ya va solo. Un cliente A que cae tiene
 * que aparecer por encima de un A estable, que es justo lo que una clasificacion
 * por tamano no distingue.
 */
const PESO_TENDENCIA: Record<Tendencia, number> = {
  cae: 3,
  sin_base: 1.5,
  crece: 1.2,
  estable: 1,
}

function describir(estado: EstadoVisita, retraso: number, crecimiento: Crecimiento): string {
  if (crecimiento.tendencia === 'cae') {
    return estado === 'nunca'
      ? 'Está cayendo y nunca lo has visitado'
      : `Está cayendo y lleva ${retraso > 0 ? `${retraso} días de retraso` : 'la visita al día'}`
  }
  if (estado === 'nunca') return 'Nunca lo has visitado'
  if (estado === 'vencida') return `${retraso} días de retraso`
  if (crecimiento.tendencia === 'crece') return 'Viene creciendo: hay con qué empujar'
  return 'Toca esta semana'
}

/**
 * Arma el plan de visitas.
 *
 * Dos ideas lo sostienen:
 *
 * 1. **La prioridad combina valor y tendencia.** Ordenar solo por clase hace
 *    visitar de mas a los grandes tranquilos y perderse las caidas; ordenar solo
 *    por tiempo sin visitar gasta lo mismo en un cliente de trescientos mil que
 *    en uno de once millones.
 * 2. **La lista se corta por capacidad.** Un plan que no cabe en la semana del
 *    usuario no es un plan. Y el hueco entre lo que exigen las frecuencias y lo
 *    que cabe se muestra, en vez de esconderlo: es la senal de que hay que
 *    ajustar las frecuencias o de que la cartera esta demasiado plana.
 */
export function construirPlanDeVisitas(
  clientes: readonly ClienteEnriquecido[],
  notas: readonly NotaCliente[],
  config: ConfiguracionNegocio,
  analisis: ReadonlyMap<Id, { crecimiento: Crecimiento; proyeccion: Proyeccion }>,
  hoy: Date,
): PlanDeVisitas {
  const ultimaVisita = new Map<Id, FechaISO>()
  for (const nota of notas) {
    if (nota.tipo !== 'visita') continue
    const actual = ultimaVisita.get(nota.clienteId)
    if (!actual || nota.fecha > actual) ultimaVisita.set(nota.clienteId, nota.fecha)
  }

  const filas: ClienteDelPlan[] = []
  let requeridasPorMes = 0
  let alDia = 0
  let nuncaVisitados = 0

  for (const cliente of clientes) {
    if (cliente.archivado) continue

    const frecuencia = frecuenciaDe(cliente.clasificacion, config)
    requeridasPorMes += 30 / frecuencia

    const visita = ultimaVisita.get(cliente.id)
    const diasDesdeVisita = visita ? diasEntre(visita, hoy) : null
    const retraso = diasDesdeVisita === null ? frecuencia : diasDesdeVisita - frecuencia

    const estado: EstadoVisita =
      diasDesdeVisita === null
        ? 'nunca'
        : retraso >= 0
          ? 'vencida'
          : retraso >= -Math.max(1, Math.round(frecuencia * 0.2))
            ? 'por_vencer'
            : 'al_dia'

    if (estado === 'al_dia') alDia += 1
    if (estado === 'nunca') nuncaVisitados += 1

    const datos = analisis.get(cliente.id)
    const crecimiento: Crecimiento = datos?.crecimiento ?? {
      reciente: 0,
      previo: 0,
      variacion: null,
      tendencia: 'sin_base',
    }
    const proyeccion: Proyeccion = datos?.proyeccion ?? {
      acumulado: 0,
      estimado: 0,
      mesesRestantes: 0,
      confiable: false,
      mesesConCompra: 0,
    }

    // El retraso entra como fraccion de la frecuencia y no en dias crudos: diez
    // dias de retraso en un cliente quincenal aprietan mucho mas que diez en uno
    // semestral.
    const urgencia = 1 + Math.max(0, retraso) / frecuencia
    const prioridad =
      PESO_CLASE[cliente.clasificacion] * PESO_TENDENCIA[crecimiento.tendencia] * urgencia

    filas.push({
      cliente,
      ultimaVisita: visita,
      diasDesdeVisita,
      frecuencia,
      estado,
      retraso,
      crecimiento,
      proyeccion,
      prioridad: Math.round(prioridad * 100) / 100,
      motivo: describir(estado, retraso, crecimiento),
    })
  }

  const pendientes = filas
    .filter((f) => f.estado !== 'al_dia')
    .sort(
      (a, b) =>
        b.prioridad - a.prioridad ||
        b.cliente.venta12Meses - a.cliente.venta12Meses ||
        a.cliente.nombre.localeCompare(b.cliente.nombre, 'es-CO'),
    )

  const capacidadMensual = config.visitasPorSemana * 4

  return {
    pendientes,
    estaSemana: pendientes.slice(0, config.visitasPorSemana),
    capacidadSemanal: config.visitasPorSemana,
    requeridasPorMes: Math.round(requeridasPorMes),
    capacidadMensual,
    deficit: Math.max(0, Math.round(requeridasPorMes) - capacidadMensual),
    alDia,
    nuncaVisitados,
    frecuencias: { A: config.diasVisitaA, B: config.diasVisitaB, C: config.diasVisitaC },
  }
}
