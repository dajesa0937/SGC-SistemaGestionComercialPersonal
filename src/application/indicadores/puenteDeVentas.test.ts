import { describe, expect, it } from 'vitest'
import type { VentaMensual } from '@/domain/venta/venta.entity'
import { construirPuenteDeVentas } from './puenteDeVentas'

const venta = (clienteId: string, periodo: string, valor: number): VentaMensual => ({
  id: `${clienteId}-${periodo}`,
  clienteId,
  periodo,
  valor,
  origen: 'importacion',
  actualizadoEn: '2026-01-01T00:00:00.000Z',
})

describe('construirPuenteDeVentas', () => {
  it('la identidad se cumple: la suma de los tramos da el mes actual', () => {
    const ventas = [
      venta('sigue', '2026-07', 1_000_000),
      venta('sigue', '2026-08', 1_400_000),
      venta('cae', '2026-07', 2_000_000),
      venta('cae', '2026-08', 1_200_000),
      venta('perdido', '2026-07', 800_000),
      venta('nuevo', '2026-08', 500_000),
      venta('recuperado', '2026-03', 300_000),
      venta('recuperado', '2026-08', 900_000),
    ]
    const p = construirPuenteDeVentas(ventas, '2026-08', '2026-07')

    const suma = p.base + p.nuevos + p.recuperados + p.crecimiento + p.contraccion + p.perdidos
    expect(suma).toBe(p.final)
    expect(p.base).toBe(3_800_000)
    expect(p.final).toBe(4_000_000)
    expect(p.variacion).toBe(200_000)
  })

  it('separa cada tramo por su causa', () => {
    const ventas = [
      venta('sigue', '2026-07', 1_000_000),
      venta('sigue', '2026-08', 1_400_000),
      venta('cae', '2026-07', 2_000_000),
      venta('cae', '2026-08', 1_200_000),
      venta('perdido', '2026-07', 800_000),
      venta('nuevo', '2026-08', 500_000),
      venta('recuperado', '2026-03', 300_000),
      venta('recuperado', '2026-08', 900_000),
    ]
    const p = construirPuenteDeVentas(ventas, '2026-08', '2026-07')

    expect(p.crecimiento).toBe(400_000)
    expect(p.contraccion).toBe(-800_000)
    expect(p.perdidos).toBe(-800_000)
    expect(p.nuevos).toBe(500_000)
    expect(p.recuperados).toBe(900_000)
  })

  it('no confunde a quien vuelve con un cliente nuevo', () => {
    // Contarlos juntos infla los «nuevos» mes tras mes con los de siempre.
    const ventas = [
      venta('viejo', '2026-01', 100_000),
      venta('viejo', '2026-08', 200_000),
      venta('primerizo', '2026-08', 300_000),
    ]
    const p = construirPuenteDeVentas(ventas, '2026-08', '2026-07')
    expect(p).toMatchObject({
      recuperados: 200_000,
      clientesRecuperados: 1,
      nuevos: 300_000,
      clientesNuevos: 1,
    })
  })

  it('cuenta los clientes de cada tramo, no solo los pesos', () => {
    const ventas = [
      venta('a', '2026-07', 100),
      venta('b', '2026-07', 200),
      venta('c', '2026-08', 300),
    ]
    const p = construirPuenteDeVentas(ventas, '2026-08', '2026-07')
    expect(p).toMatchObject({ clientesPerdidos: 2, clientesNuevos: 1, clientesRecuperados: 0 })
  })

  it('una venta en cero no cuenta como compra', () => {
    // Si contara, un cliente en cero pasaría por «activo» y nunca aparecería
    // como perdido.
    const ventas = [venta('a', '2026-07', 500_000), venta('a', '2026-08', 0)]
    const p = construirPuenteDeVentas(ventas, '2026-08', '2026-07')
    expect(p.clientesPerdidos).toBe(1)
    expect(p.perdidos).toBe(-500_000)
    expect(p.final).toBe(0)
  })

  it('un mes sin nada antes deja todo en «nuevos»', () => {
    const p = construirPuenteDeVentas([venta('a', '2026-08', 900_000)], '2026-08', '2026-07')
    expect(p).toMatchObject({ base: 0, nuevos: 900_000, final: 900_000, variacion: 900_000 })
  })

  it('sin ventas no divide entre cero ni inventa tramos', () => {
    const p = construirPuenteDeVentas([], '2026-08', '2026-07')
    expect(p).toMatchObject({ base: 0, final: 0, variacion: 0, nuevos: 0, perdidos: 0 })
  })
})
