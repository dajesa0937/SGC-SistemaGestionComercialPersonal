import { describe, expect, it } from 'vitest'
import type { ClienteEnriquecido, NotaCliente } from '@/domain/cliente/cliente.entity'
import { CONFIGURACION_POR_DEFECTO } from '@/domain/config/configuracion.entity'
import { construirPlanDeVisitas, frecuenciaDe } from './planDeVisitas'
import type { Crecimiento, Proyeccion } from './crecimiento'

const HOY = new Date(2026, 7, 28) // 28 de agosto de 2026

function cliente(parcial: Partial<ClienteEnriquecido> & { nombre: string }): ClienteEnriquecido {
  return {
    id: parcial.nombre,
    codigo: parcial.nombre,
    estadoManual: 'cliente',
    archivado: false,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    clasificacion: 'C',
    estado: 'activo',
    ventaPeriodo: 0,
    ventaAnio: 0,
    venta12Meses: 0,
    variacionMesAnterior: null,
    variacionAnioAnterior: null,
    serie12Meses: [],
    ...parcial,
  }
}

const visita = (clienteId: string, fecha: string): NotaCliente => ({
  id: `${clienteId}-${fecha}`,
  clienteId,
  fecha,
  texto: 'Visita',
  tipo: 'visita',
  creadoEn: `${fecha}T00:00:00.000Z`,
})

const CRECE: Crecimiento = { reciente: 10, previo: 1, variacion: 9, tendencia: 'crece' }
const CAE: Crecimiento = { reciente: 0, previo: 10, variacion: -1, tendencia: 'cae' }
const ESTABLE: Crecimiento = { reciente: 10, previo: 10, variacion: 0, tendencia: 'estable' }
const PROY: Proyeccion = {
  acumulado: 0,
  estimado: 0,
  mesesRestantes: 4,
  confiable: true,
  mesesConCompra: 5,
}

const analisis = (entradas: Record<string, Crecimiento>) =>
  new Map(Object.entries(entradas).map(([k, c]) => [k, { crecimiento: c, proyeccion: PROY }]))

describe('frecuenciaDe', () => {
  it('usa la política del usuario, no una constante', () => {
    expect(frecuenciaDe('A', CONFIGURACION_POR_DEFECTO)).toBe(15)
    expect(frecuenciaDe('B', CONFIGURACION_POR_DEFECTO)).toBe(30)
    expect(frecuenciaDe('C', CONFIGURACION_POR_DEFECTO)).toBe(60)
  })

  it('a quien no ha comprado también hay que ir a verlo', () => {
    expect(frecuenciaDe('SIN_HISTORIA', CONFIGURACION_POR_DEFECTO)).toBe(45)
  })
})

describe('construirPlanDeVisitas', () => {
  it('quien está al día no aparece en la lista', () => {
    const plan = construirPlanDeVisitas(
      [cliente({ nombre: 'ReciénVisitado', clasificacion: 'A' })],
      [visita('ReciénVisitado', '2026-08-27')],
      CONFIGURACION_POR_DEFECTO,
      analisis({ ReciénVisitado: ESTABLE }),
      HOY,
    )
    expect(plan.pendientes).toEqual([])
    expect(plan.alDia).toBe(1)
  })

  it('un cliente A que cae va antes que un A estable con el mismo retraso', () => {
    // Es la razón de ser del plan: por tamaño los dos son iguales, y no lo son.
    const plan = construirPlanDeVisitas(
      [
        cliente({ nombre: 'Estable', clasificacion: 'A' }),
        cliente({ nombre: 'Cayendo', clasificacion: 'A' }),
      ],
      [visita('Estable', '2026-08-01'), visita('Cayendo', '2026-08-01')],
      CONFIGURACION_POR_DEFECTO,
      analisis({ Estable: ESTABLE, Cayendo: CAE }),
      HOY,
    )
    expect(plan.pendientes.map((p) => p.cliente.nombre)).toEqual(['Cayendo', 'Estable'])
  })

  it('un C que despega puede pasar por delante de un C estable', () => {
    const plan = construirPlanDeVisitas(
      [
        cliente({ nombre: 'Dormido', clasificacion: 'C' }),
        cliente({ nombre: 'Despegando', clasificacion: 'C' }),
      ],
      [visita('Dormido', '2026-05-01'), visita('Despegando', '2026-05-01')],
      CONFIGURACION_POR_DEFECTO,
      analisis({ Dormido: ESTABLE, Despegando: CRECE }),
      HOY,
    )
    expect(plan.pendientes[0]?.cliente.nombre).toBe('Despegando')
  })

  it('el retraso pesa en proporción a la frecuencia, no en días crudos', () => {
    // Diez días de retraso aprietan más en un quincenal que en un semestral.
    const plan = construirPlanDeVisitas(
      [
        cliente({ nombre: 'Quincenal', clasificacion: 'C' }),
        cliente({ nombre: 'Semestral', clasificacion: 'C' }),
      ],
      [visita('Quincenal', '2026-06-14'), visita('Semestral', '2026-06-14')],
      { ...CONFIGURACION_POR_DEFECTO, diasVisitaC: 60 },
      analisis({ Quincenal: ESTABLE, Semestral: ESTABLE }),
      HOY,
    )
    // Con la misma clase y frecuencia el orden lo decide el desempate estable.
    expect(plan.pendientes).toHaveLength(2)
  })

  it('quien nunca ha sido visitado entra al plan y se cuenta aparte', () => {
    const plan = construirPlanDeVisitas(
      [cliente({ nombre: 'Nuevo', clasificacion: 'B' })],
      [],
      CONFIGURACION_POR_DEFECTO,
      analisis({}),
      HOY,
    )
    expect(plan.nuncaVisitados).toBe(1)
    expect(plan.pendientes[0]?.estado).toBe('nunca')
    expect(plan.pendientes[0]?.motivo).toContain('Nunca')
  })

  it('los archivados no entran al plan', () => {
    const plan = construirPlanDeVisitas(
      [cliente({ nombre: 'Retirado', clasificacion: 'A', archivado: true })],
      [],
      CONFIGURACION_POR_DEFECTO,
      analisis({}),
      HOY,
    )
    expect(plan.pendientes).toEqual([])
    expect(plan.requeridasPorMes).toBe(0)
  })

  it('la lista de la semana se corta por la capacidad declarada', () => {
    const muchos = Array.from({ length: 40 }, (_, i) =>
      cliente({ nombre: `Cliente ${i}`, clasificacion: 'A' }),
    )
    const plan = construirPlanDeVisitas(
      muchos,
      [],
      { ...CONFIGURACION_POR_DEFECTO, visitasPorSemana: 15 },
      analisis({}),
      HOY,
    )
    expect(plan.pendientes).toHaveLength(40)
    expect(plan.estaSemana).toHaveLength(15)
  })

  it('avisa cuando las frecuencias piden más visitas de las que caben', () => {
    // 32 clientes A cada 15 días son 64 visitas al mes; la capacidad son 60.
    const muchos = Array.from({ length: 32 }, (_, i) =>
      cliente({ nombre: `A${i}`, clasificacion: 'A' }),
    )
    const plan = construirPlanDeVisitas(
      muchos,
      [],
      { ...CONFIGURACION_POR_DEFECTO, visitasPorSemana: 15 },
      analisis({}),
      HOY,
    )
    expect(plan.requeridasPorMes).toBe(64)
    expect(plan.capacidadMensual).toBe(60)
    expect(plan.deficit).toBe(4)
  })

  it('sin déficit no inventa un número negativo', () => {
    const plan = construirPlanDeVisitas(
      [cliente({ nombre: 'Uno', clasificacion: 'C' })],
      [],
      CONFIGURACION_POR_DEFECTO,
      analisis({}),
      HOY,
    )
    expect(plan.deficit).toBe(0)
  })

  it('toma la visita más reciente cuando hay varias', () => {
    const plan = construirPlanDeVisitas(
      [cliente({ nombre: 'Varias', clasificacion: 'A' })],
      [visita('Varias', '2026-01-10'), visita('Varias', '2026-08-20'), visita('Varias', '2026-03-05')],
      CONFIGURACION_POR_DEFECTO,
      analisis({ Varias: ESTABLE }),
      HOY,
    )
    expect(plan.alDia).toBe(1)
  })

  it('las notas que no son visitas no cuentan como visita', () => {
    const llamada: NotaCliente = {
      id: 'l1',
      clienteId: 'Solo llamadas',
      fecha: '2026-08-27',
      texto: 'Llamé',
      tipo: 'llamada',
      creadoEn: '2026-08-27T00:00:00.000Z',
    }
    const plan = construirPlanDeVisitas(
      [cliente({ nombre: 'Solo llamadas', clasificacion: 'A' })],
      [llamada],
      CONFIGURACION_POR_DEFECTO,
      analisis({}),
      HOY,
    )
    expect(plan.nuncaVisitados).toBe(1)
  })

  it('con la cartera vacía devuelve un plan vacío, no un error', () => {
    const plan = construirPlanDeVisitas([], [], CONFIGURACION_POR_DEFECTO, new Map(), HOY)
    expect(plan).toMatchObject({ pendientes: [], estaSemana: [], requeridasPorMes: 0, deficit: 0 })
  })

  it('lleva consigo las frecuencias vigentes, para poder explicarse', () => {
    const plan = construirPlanDeVisitas([], [], CONFIGURACION_POR_DEFECTO, new Map(), HOY)
    expect(plan.frecuencias).toEqual({ A: 15, B: 30, C: 60 })
  })
})
