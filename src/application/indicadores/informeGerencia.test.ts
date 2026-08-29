import { describe, expect, it } from 'vitest'
import type { ClienteEnriquecido, NotaCliente } from '@/domain/cliente/cliente.entity'
import type { MovimientoVenta } from '@/domain/venta/movimiento.entity'
import { construirInformeGerencia } from './informeGerencia'

function cliente(nombre: string, venta12Meses = 0, archivado = false): ClienteEnriquecido {
  return {
    id: nombre,
    codigo: nombre,
    nombre,
    estadoManual: 'cliente',
    archivado,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    clasificacion: 'C',
    estado: 'activo',
    ventaPeriodo: 0,
    ventaAnio: 0,
    venta12Meses,
    variacionMesAnterior: null,
    variacionAnioAnterior: null,
    serie12Meses: [],
  }
}

const mov = (
  clienteId: string,
  fecha: string,
  valor: number,
  categoria?: string,
): MovimientoVenta => ({
  id: `${clienteId}-${fecha}-${categoria ?? ''}-${valor}`,
  clienteId,
  fecha,
  periodo: fecha.slice(0, 7),
  categoria,
  valor,
  actualizadoEn: '2026-01-01T00:00:00.000Z',
})

const visita = (clienteId: string, fecha: string): NotaCliente => ({
  id: `${clienteId}-${fecha}`,
  clienteId,
  fecha,
  texto: 'Visita',
  tipo: 'visita',
  creadoEn: `${fecha}T00:00:00.000Z`,
})

describe('construirInformeGerencia', () => {
  const CLIENTES = [cliente('uno', 6_000_000), cliente('dos', 3_000_000), cliente('tres', 1_000_000)]
  const MOVIMIENTOS = [
    // Un pedido de dos líneas: mismo cliente, misma fecha.
    mov('uno', '2026-08-05', 1_000_000, 'Motores'),
    mov('uno', '2026-08-05', 500_000, 'Repuestos'),
    // Otro pedido del mismo cliente, otro día.
    mov('uno', '2026-07-10', 2_000_000, 'Motores'),
    mov('dos', '2026-08-12', 900_000, 'Motosierras'),
    mov('tres', '2026-03-01', 600_000, 'Motores'),
  ]

  const informe = construirInformeGerencia(CLIENTES, MOVIMIENTOS, [], '2026-08')

  it('un pedido es un cliente y una fecha, no una línea', () => {
    expect(informe.comercial.pedidos).toBe(4)
    expect(informe.comercial.lineasPorPedido).toBeCloseTo(5 / 4, 5)
  })

  it('calcula ticket promedio y mediana', () => {
    // Pedidos: 1.500.000 · 2.000.000 · 900.000 · 600.000
    expect(informe.comercial.ticketPromedio).toBe(1_250_000)
    expect(informe.comercial.ticketMediano).toBe(1_200_000)
  })

  it('mide la venta cruzada como categorías distintas por cliente', () => {
    // uno compra 2 categorías, dos compra 1, tres compra 1 → 4/3
    expect(informe.comercial.categoriasPorCliente).toBeCloseTo(4 / 3, 5)
    expect(informe.comercial.categoriasDisponibles).toBe(3)
  })

  it('la penetración se mide sobre la cartera activa, no sobre quien compró', () => {
    const motores = informe.penetracion.find((p) => p.categoria === 'Motores')
    expect(motores).toMatchObject({ clientes: 2, venta: 3_600_000 })
    expect(motores?.penetracion).toBeCloseTo(2 / 3, 5)
  })

  it('ordena las categorías por venta, no alfabéticamente', () => {
    expect(informe.penetracion.map((p) => p.categoria)).toEqual([
      'Motores',
      'Motosierras',
      'Repuestos',
    ])
  })

  it('mide la concentración sobre los últimos doce meses', () => {
    expect(informe.concentracion.top5).toBe(1)
    // 6 M de 10 M ya pasa la mitad con un solo cliente.
    expect(informe.concentracion.clientesParaLaMitad).toBe(1)
  })

  it('cuenta a los que compraron una sola vez en el año', () => {
    expect(informe.compraronUnaVez).toBe(2)
  })

  it('la efectividad de visita es null cuando no se registró ninguna', () => {
    // Cero visitas no es «cero por ciento de efectividad»: es que no se sabe.
    expect(informe.efectividad).toMatchObject({ visitas: 0, efectividad: null })
  })

  it('la efectividad cuenta visitas que terminaron en pedido, no pedidos sueltos', () => {
    const conVisitas = construirInformeGerencia(
      CLIENTES,
      MOVIMIENTOS,
      [
        visita('uno', '2026-08-05'), // ese día compró
        visita('dos', '2026-08-12'), // ese día compró
        visita('tres', '2026-08-20'), // no compró después
        visita('uno', '2026-07-01'), // otro mes, no cuenta
      ],
      '2026-08',
    )
    expect(conVisitas.efectividad).toMatchObject({ visitas: 3, conPedido: 2 })
    expect(conVisitas.efectividad.efectividad).toBeCloseTo(2 / 3, 5)
  })

  it('la efectividad nunca pasa del 100 %', () => {
    // El defecto que esta prueba vigila: dividir los pedidos del mes entre las
    // visitas del mes daba 500 %, porque los pedidos existen aunque no se haya
    // visitado a nadie. Un indicador de efectividad por encima de 100 es la
    // señal de que el denominador no cubre al numerador.
    const conUnaVisita = construirInformeGerencia(
      CLIENTES,
      MOVIMIENTOS,
      [visita('uno', '2026-08-05')],
      '2026-08',
    )
    expect(conUnaVisita.efectividad.efectividad).toBeLessThanOrEqual(1)
    expect(conUnaVisita.efectividad).toMatchObject({ visitas: 1, conPedido: 1 })
  })

  it('una compra anterior a la visita no se le atribuye a la visita', () => {
    const despues = construirInformeGerencia(
      CLIENTES,
      MOVIMIENTOS,
      [visita('uno', '2026-08-25')], // compró el 5, la visita fue el 25
      '2026-08',
    )
    expect(despues.efectividad.conPedido).toBe(0)
  })

  it('una compra fuera de la ventana tampoco cuenta', () => {
    const lejos = construirInformeGerencia(
      [cliente('lento', 1_000_000)],
      [mov('lento', '2026-08-31', 500_000, 'Motores')],
      [visita('lento', '2026-06-01')],
      '2026-06',
    )
    expect(lejos.efectividad).toMatchObject({ visitas: 1, conPedido: 0, ventanaDias: 30 })
  })

  it('los archivados no cuentan en la cartera activa', () => {
    const con = construirInformeGerencia(
      [...CLIENTES, cliente('retirado', 99_000_000, true)],
      MOVIMIENTOS,
      [],
      '2026-08',
    )
    expect(con.clientesActivos).toBe(3)
    expect(con.concentracion.top5).toBe(1)
  })

  it('no cuenta las ventas de otros años', () => {
    const con = construirInformeGerencia(
      CLIENTES,
      [...MOVIMIENTOS, mov('uno', '2025-08-05', 50_000_000, 'Motores')],
      [],
      '2026-08',
    )
    expect(con.comercial.pedidos).toBe(4)
  })

  it('sin ventas no divide entre cero', () => {
    const vacio = construirInformeGerencia([], [], [], '2026-08')
    expect(vacio.comercial).toMatchObject({ pedidos: 0, ticketPromedio: 0, lineasPorPedido: 0 })
    expect(vacio.concentracion.top5).toBe(0)
  })
})
