import { describe, expect, it } from 'vitest'
import { interpretarFecha, interpretarPeriodo } from './interpretarPeriodo'

describe('interpretarPeriodo', () => {
  it('lee la fecha completa del archivo real de ventas', () => {
    expect(interpretarPeriodo('2026-04-07')).toBe('2026-04')
    expect(interpretarPeriodo('2026-01-02')).toBe('2026-01')
  })

  it('acepta el periodo ya escrito', () => {
    expect(interpretarPeriodo('2026-04')).toBe('2026-04')
  })

  it('lee el formato de fecha colombiano, día primero', () => {
    expect(interpretarPeriodo('07/04/2026')).toBe('2026-04')
    expect(interpretarPeriodo('31-12-2025')).toBe('2025-12')
  })

  it('lee mes y año sueltos', () => {
    expect(interpretarPeriodo('04/2026')).toBe('2026-04')
    expect(interpretarPeriodo('4-2026')).toBe('2026-04')
  })

  it('lee los meses escritos en español, con y sin tilde', () => {
    for (const texto of ['Abr 2026', 'abril 2026', 'ABRIL de 2026', 'abril-2026', '2026 Abr']) {
      expect(interpretarPeriodo(texto)).toBe('2026-04')
    }
    expect(interpretarPeriodo('Dic 2025')).toBe('2025-12')
    expect(interpretarPeriodo('setiembre 2026')).toBe('2026-09')
  })

  it('rescata la fecha cuando Excel la dejó como número de serie', () => {
    // 46119 es el 7 de abril de 2026 en el calendario de Excel.
    expect(interpretarPeriodo('46119')).toBe('2026-04')
  })

  it('no confunde un importe con una fecha', () => {
    // Un valor de venta en la columna equivocada no debe convertirse en un mes.
    expect(interpretarPeriodo('2760000')).toBeUndefined()
    expect(interpretarPeriodo('19500')).toBeUndefined()
  })

  it('devuelve indefinido antes que adivinar', () => {
    expect(interpretarPeriodo('')).toBeUndefined()
    expect(interpretarPeriodo('   ')).toBeUndefined()
    expect(interpretarPeriodo('primer trimestre')).toBeUndefined()
    expect(interpretarPeriodo('2026-13')).toBeUndefined()
    expect(interpretarPeriodo('2026-00')).toBeUndefined()
    expect(interpretarPeriodo('13/13/2026')).toBeUndefined()
  })
})

describe('interpretarFecha', () => {
  it('conserva el día cuando el archivo lo trae', () => {
    expect(interpretarFecha('2026-04-07')).toBe('2026-04-07')
    expect(interpretarFecha('7/4/2026')).toBe('2026-04-07')
    expect(interpretarFecha('46119')).toBe('2026-04-07')
  })

  it('no inventa un día cuando solo hay mes y año', () => {
    expect(interpretarFecha('2026-04')).toBeUndefined()
    expect(interpretarFecha('Abr 2026')).toBeUndefined()
  })

  it('rechaza días imposibles', () => {
    expect(interpretarFecha('2026-04-40')).toBeUndefined()
  })
})
