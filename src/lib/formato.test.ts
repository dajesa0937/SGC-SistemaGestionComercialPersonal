import { describe, expect, it } from 'vitest'
import {
  formatearDecimal,
  formatearFecha,
  formatearPesos,
  formatearPesosCorto,
  formatearPorcentaje,
  formatearVariacion,
  normalizarParaConciliar,
} from './formato'

describe('formatearPesos', () => {
  it('usa separador de miles y no muestra decimales', () => {
    expect(formatearPesos(8_200_000)).toContain('8.200.000')
    expect(formatearPesos(8_200_000)).not.toContain(',00')
  })

  it('maneja el cero', () => {
    expect(formatearPesos(0)).toContain('0')
  })
})

describe('formatearPesosCorto', () => {
  it('abrevia millones', () => {
    expect(formatearPesosCorto(8_200_000)).toBe('$ 8,2 M')
  })

  it('quita el decimal cuando es cero', () => {
    expect(formatearPesosCorto(5_000_000)).toBe('$ 5 M')
  })

  it('omite decimales por encima de cien millones', () => {
    expect(formatearPesosCorto(312_000_000)).toBe('$ 312 M')
  })

  it('abrevia miles', () => {
    expect(formatearPesosCorto(45_000)).toBe('$ 45 K')
  })

  it('conserva el signo negativo', () => {
    expect(formatearPesosCorto(-8_200_000)).toBe('-$ 8,2 M')
  })

  it('no abrevia cifras pequenas', () => {
    expect(formatearPesosCorto(850)).toBe('$ 850')
  })
})

describe('formatearPorcentaje', () => {
  it('usa coma decimal', () => {
    expect(formatearPorcentaje(0.784)).toBe('78,4 %')
  })
})

describe('formatearVariacion', () => {
  it('antepone el signo mas cuando es positiva', () => {
    expect(formatearVariacion(0.15)).toBe('+15,0 %')
  })

  it('conserva el signo menos', () => {
    expect(formatearVariacion(-0.08)).toBe('-8,0 %')
  })

  it('muestra un guion cuando no hay base de comparacion', () => {
    expect(formatearVariacion(null)).toBe('—')
    expect(formatearVariacion(Infinity)).toBe('—')
  })
})

describe('normalizarParaConciliar', () => {
  it('iguala variantes del mismo nombre', () => {
    const a = normalizarParaConciliar('Ferretería El Tornillo S.A.S.')
    const b = normalizarParaConciliar('FERRETERIA EL TORNILLO SAS')
    const c = normalizarParaConciliar('  ferreteria   el tornillo  ')
    expect(a).toBe(b)
    expect(b).toBe(c)
  })

  it('quita tildes y pasa a mayusculas', () => {
    expect(normalizarParaConciliar('Agroinsumos del Sur')).toBe('AGROINSUMOS DEL SUR')
  })

  it('no colapsa clientes que si son distintos', () => {
    expect(normalizarParaConciliar('Maquinaria Tolima')).not.toBe(
      normalizarParaConciliar('Maquinaria Huila'),
    )
  })
})

describe('formatearFecha con marcas de tiempo', () => {
  it('formatea una fecha simple sin desplazarla de día', () => {
    expect(formatearFecha('2026-08-28')).toBe('28 de agosto de 2026')
  })

  it('formatea una marca de tiempo completa en vez de devolverla cruda', () => {
    // El historial de importaciones guarda instantes ISO, no fechas sueltas:
    // antes se mostraba «2026-08-28T19:44:01.816Z» tal cual en pantalla.
    const formateada = formatearFecha('2026-08-28T19:44:01.816Z')
    expect(formateada).not.toContain('T')
    expect(formateada).toContain('2026')
  })

  it('devuelve el texto original si no es una fecha', () => {
    expect(formatearFecha('pendiente')).toBe('pendiente')
    expect(formatearFecha('no-es-T-fecha')).toBe('no-es-T-fecha')
  })
})

describe('formatearDecimal', () => {
  it('usa la coma decimal del español, no el punto', () => {
    expect(formatearDecimal(1.01)).toBe('1,01')
    expect(formatearDecimal(1.71)).toBe('1,71')
  })

  it('respeta los decimales pedidos', () => {
    expect(formatearDecimal(2.5, 1)).toBe('2,5')
    expect(formatearDecimal(2, 0)).toBe('2')
  })
})
