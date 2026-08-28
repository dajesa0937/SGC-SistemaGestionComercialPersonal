import { describe, expect, it } from 'vitest'
import { CONFIGURACION_POR_DEFECTO } from '@/domain/config/configuracion.entity'
import {
  calcularCobertura,
  detectarAlertas,
  detectarClientesNuevos,
  enriquecerClientes,
  topClientes,
} from './analizarCartera'
import { cliente, venta } from './ayudasParaPruebas'

const CONFIG = CONFIGURACION_POR_DEFECTO
const P = '2026-08'

describe('enriquecerClientes · agregados', () => {
  const clientes = [cliente('a'), cliente('b')]
  const ventas = [
    venta('a', '2026-08', 30_000_000),
    venta('a', '2026-07', 20_000_000),
    venta('a', '2026-01', 10_000_000),
    venta('a', '2025-08', 15_000_000),
    venta('a', '2025-11', 5_000_000),
    venta('b', '2026-08', 9_200_000),
  ]

  it('venta del periodo, del año y de doce meses', () => {
    const [a] = enriquecerClientes(clientes, ventas, P, CONFIG)
    expect(a?.ventaPeriodo).toBe(30_000_000)
    expect(a?.ventaAnio).toBe(60_000_000) // enero + julio + agosto
    expect(a?.venta12Meses).toBe(65_000_000) // + noviembre de 2025
  })

  it('primera y última compra', () => {
    const [a] = enriquecerClientes(clientes, ventas, P, CONFIG)
    expect(a?.primeraCompra).toBe('2025-08')
    expect(a?.ultimaCompra).toBe('2026-08')
  })

  it('variación contra el mes anterior y contra el mismo mes del año pasado', () => {
    const [a] = enriquecerClientes(clientes, ventas, P, CONFIG)
    expect(a?.variacionMesAnterior).toBeCloseTo(0.5, 5) // 30 vs 20
    expect(a?.variacionAnioAnterior).toBeCloseTo(1, 5) // 30 vs 15
  })

  it('sin base de comparación la variación es null, no infinito', () => {
    const [, b] = enriquecerClientes(clientes, ventas, P, CONFIG)
    expect(b?.variacionMesAnterior).toBeNull()
    expect(b?.variacionAnioAnterior).toBeNull()
  })

  it('la serie de doce meses tiene doce posiciones en orden', () => {
    const [a] = enriquecerClientes(clientes, ventas, P, CONFIG)
    expect(a?.serie12Meses).toHaveLength(12)
    expect(a?.serie12Meses[11]).toBe(30_000_000)
  })
})

describe('clasificación ABC', () => {
  it('reparte por Pareto sobre los últimos doce meses', () => {
    const clientes = [cliente('grande'), cliente('mediano'), cliente('chico')]
    const ventas = [
      venta('grande', P, 80_000_000),
      venta('mediano', P, 15_000_000),
      venta('chico', P, 5_000_000),
    ]
    const r = enriquecerClientes(clientes, ventas, P, CONFIG)
    expect(r.find((c) => c.id === 'grande')?.clasificacion).toBe('A')
    expect(r.find((c) => c.id === 'mediano')?.clasificacion).toBe('B')
    expect(r.find((c) => c.id === 'chico')?.clasificacion).toBe('C')
  })

  it('sin ventas en la ventana el cliente no se clasifica', () => {
    const r = enriquecerClientes([cliente('x')], [venta('x', '2020-01', 100)], P, CONFIG)
    expect(r[0]?.clasificacion).toBe('SIN_HISTORIA')
  })

  it('con un único cliente, ese cliente es A', () => {
    const r = enriquecerClientes([cliente('u')], [venta('u', P, 1_000)], P, CONFIG)
    expect(r[0]?.clasificacion).toBe('A')
  })
})

describe('estado derivado', () => {
  const estadoDe = (ventas: ReturnType<typeof venta>[], id = 'x') =>
    enriquecerClientes([cliente(id)], ventas, P, CONFIG)[0]?.estado

  it('sin compras nunca: inactivo', () => {
    expect(estadoDe([])).toBe('inactivo')
  })

  it('sin comprar durante los meses del umbral: inactivo', () => {
    expect(estadoDe([venta('x', '2026-04', 1_000_000)])).toBe('inactivo')
  })

  it('comprando de forma estable: activo', () => {
    expect(
      estadoDe([
        venta('x', '2024-05', 1_000_000),
        venta('x', '2026-06', 1_000_000),
        venta('x', '2026-07', 1_000_000),
        venta('x', '2026-08', 1_000_000),
      ]),
    ).toBe('activo')
  })

  it('con una caída fuerte frente al promedio reciente: en riesgo', () => {
    expect(
      estadoDe([
        venta('x', '2024-01', 1_000_000),
        venta('x', '2026-05', 10_000_000),
        venta('x', '2026-06', 10_000_000),
        venta('x', '2026-07', 10_000_000),
        venta('x', '2026-08', 1_000_000),
      ]),
    ).toBe('en_riesgo')
  })

  it('con la primera compra en el año en curso: nuevo', () => {
    expect(estadoDe([venta('x', '2026-07', 1_000_000), venta('x', '2026-08', 1_000_000)])).toBe(
      'nuevo',
    )
  })

  it('la alarma gana a la etiqueta informativa: un cliente nuevo que dejó de comprar sale inactivo', () => {
    expect(estadoDe([venta('x', '2026-02', 5_000_000)])).toBe('inactivo')
  })
})

describe('calcularCobertura', () => {
  it('mide los que compraron sobre los activos', () => {
    const clientes = [cliente('a'), cliente('b'), cliente('c'), cliente('d')]
    const ventas = [venta('a', P, 100), venta('b', P, 200)]
    const c = calcularCobertura(enriquecerClientes(clientes, ventas, P, CONFIG))
    expect(c.conCompra).toBe(2)
    expect(c.activos).toBe(4)
    expect(c.fraccion).toBeCloseTo(0.5, 5)
  })

  it('los archivados no cuentan en el denominador', () => {
    const clientes = [cliente('a'), cliente('z', { archivado: true })]
    const c = calcularCobertura(enriquecerClientes(clientes, [venta('a', P, 100)], P, CONFIG))
    expect(c.activos).toBe(1)
    expect(c.fraccion).toBe(1)
  })

  it('sin clientes activos la cobertura es null, no cero', () => {
    expect(calcularCobertura([]).fraccion).toBeNull()
  })
})

describe('detectarClientesNuevos', () => {
  it('solo cuenta a quien estrena su primera compra en el periodo', () => {
    const clientes = [cliente('viejo'), cliente('estreno')]
    const ventas = [
      venta('viejo', '2025-03', 100),
      venta('viejo', P, 100),
      venta('estreno', P, 100),
    ]
    const nuevos = detectarClientesNuevos(enriquecerClientes(clientes, ventas, P, CONFIG), P)
    expect(nuevos.map((c) => c.id)).toEqual(['estreno'])
  })
})

describe('detectarAlertas', () => {
  it('ordena por facturación de doce meses, no por gravedad', () => {
    const clientes = [cliente('chico'), cliente('grande')]
    const ventas = [
      venta('chico', '2026-03', 1_000_000),
      venta('grande', '2026-03', 90_000_000),
    ]
    const alertas = detectarAlertas(enriquecerClientes(clientes, ventas, P, CONFIG), P)
    expect(alertas.map((a) => a.cliente.id)).toEqual(['grande', 'chico'])
  })

  it('explica cuántos meses lleva sin comprar', () => {
    const alertas = detectarAlertas(
      enriquecerClientes([cliente('x')], [venta('x', '2026-04', 100)], P, CONFIG),
      P,
    )
    expect(alertas[0]?.motivo).toBe('Sin compras hace 4 meses')
  })

  it('usa el singular con un solo mes', () => {
    const config = { ...CONFIG, mesesParaInactivo: 1 }
    const alertas = detectarAlertas(
      enriquecerClientes([cliente('x')], [venta('x', '2026-07', 100)], P, config),
      P,
    )
    expect(alertas[0]?.motivo).toBe('Sin compras hace 1 mes')
  })

  it('no alerta sobre clientes archivados', () => {
    const alertas = detectarAlertas(
      enriquecerClientes([cliente('z', { archivado: true })], [], P, CONFIG),
      P,
    )
    expect(alertas).toHaveLength(0)
  })

  it('no alerta sobre un cliente que va bien', () => {
    const ventas = [
      venta('x', '2024-01', 1_000_000),
      venta('x', '2026-06', 1_000_000),
      venta('x', '2026-07', 1_000_000),
      venta('x', '2026-08', 1_000_000),
    ]
    expect(detectarAlertas(enriquecerClientes([cliente('x')], ventas, P, CONFIG), P)).toHaveLength(0)
  })
})

describe('topClientes', () => {
  it('ordena de mayor a menor y excluye a quien no compró', () => {
    const clientes = [cliente('a'), cliente('b'), cliente('c')]
    const ventas = [venta('a', P, 100), venta('b', P, 300)]
    const top = topClientes(enriquecerClientes(clientes, ventas, P, CONFIG))
    expect(top.map((c) => c.id)).toEqual(['b', 'a'])
  })

  it('respeta el límite pedido', () => {
    const clientes = Array.from({ length: 20 }, (_, i) => cliente(`c${i}`))
    const ventas = clientes.map((c, i) => venta(c.id, P, (i + 1) * 1000))
    expect(topClientes(enriquecerClientes(clientes, ventas, P, CONFIG), 5)).toHaveLength(5)
  })
})
