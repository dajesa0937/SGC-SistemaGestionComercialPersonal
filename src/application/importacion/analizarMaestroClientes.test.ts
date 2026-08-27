import { describe, expect, it } from 'vitest'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import { analizarMaestroClientes, cambiosDesdeArchivo } from './analizarMaestroClientes'
import type { MapeoDetectado } from './detectarColumnas'

const MAPEO: MapeoDetectado = { codigo: 0, nombre: 1, zona: 2, telefono: 3 }

const ENCABEZADO = ['codigo', 'nombre', 'zona', 'telefono']

function existente(parcial: Partial<Cliente> & { codigo: string; nombre: string }): Cliente {
  return {
    id: `id-${parcial.codigo}`,
    estadoManual: 'cliente',
    archivado: false,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...parcial,
  }
}

describe('analizarMaestroClientes', () => {
  it('clasifica altas, cambios y filas iguales', () => {
    const rejilla = [
      ENCABEZADO,
      ['C-001', 'Agroinsumos del Sur', 'Espinal', '3001112233'],
      ['C-002', 'Maquinaria Tolima', 'Ibagué', '3004445566'],
      ['C-003', 'Cliente Nuevo', 'Melgar', ''],
    ]
    const previa = analizarMaestroClientes(rejilla, MAPEO, 1, [
      existente({ codigo: 'C-001', nombre: 'Agroinsumos del Sur', zona: 'Espinal', telefono: '3001112233' }),
      existente({ codigo: 'C-002', nombre: 'Maquinaria Tolima', zona: 'Espinal' }),
    ])

    expect(previa.totalFilas).toBe(3)
    expect(previa.sinCambios).toBe(1)
    expect(previa.actualizados.map((a) => a.actual.codigo)).toEqual(['C-002'])
    expect(previa.nuevos.map((n) => n.datos.codigo)).toEqual(['C-003'])
    expect(previa.errores).toEqual([])
  })

  it('no escribe nada: es una funcion pura', () => {
    const existentes = [existente({ codigo: 'C-001', nombre: 'Original' })]
    const copia = structuredClone(existentes)
    analizarMaestroClientes([ENCABEZADO, ['C-001', 'Cambiado', '', '']], MAPEO, 1, existentes)
    expect(existentes).toEqual(copia)
  })

  it('rechaza filas sin codigo indicando el numero de fila de Excel', () => {
    const previa = analizarMaestroClientes(
      [ENCABEZADO, ['', 'Sin código', '', '']],
      MAPEO,
      1,
      [],
    )
    expect(previa.errores).toEqual([{ numeroFila: 2, motivo: 'Sin código de cliente' }])
    expect(previa.nuevos).toHaveLength(0)
  })

  it('rechaza filas sin nombre', () => {
    const previa = analizarMaestroClientes([ENCABEZADO, ['C-009', '', '', '']], MAPEO, 1, [])
    expect(previa.errores[0]?.motivo).toContain('Sin nombre')
  })

  it('detecta codigos repetidos dentro del mismo archivo', () => {
    const previa = analizarMaestroClientes(
      [ENCABEZADO, ['C-001', 'Uno', '', ''], ['c-001', 'Otro', '', '']],
      MAPEO,
      1,
      [],
    )
    expect(previa.nuevos).toHaveLength(1)
    expect(previa.errores[0]?.motivo).toContain('repetido')
  })

  it('ignora las filas completamente vacias sin contarlas ni marcarlas como error', () => {
    const previa = analizarMaestroClientes(
      [ENCABEZADO, ['C-001', 'Uno', '', ''], ['', '', '', ''], ['C-002', 'Dos', '', '']],
      MAPEO,
      1,
      [],
    )
    expect(previa.totalFilas).toBe(2)
    expect(previa.errores).toEqual([])
  })

  it('una columna ausente no borra el dato ya registrado', () => {
    // El archivo no trae telefono: el que estaba a mano debe conservarse.
    const sinTelefono: MapeoDetectado = { codigo: 0, nombre: 1, zona: 2, telefono: null }
    const previa = analizarMaestroClientes(
      [['codigo', 'nombre', 'zona'], ['C-001', 'Agroinsumos del Sur', 'Espinal']],
      sinTelefono,
      1,
      [
        existente({
          codigo: 'C-001',
          nombre: 'Agroinsumos del Sur',
          zona: 'Espinal',
          telefono: '3001112233',
        }),
      ],
    )
    expect(previa.sinCambios).toBe(1)
    expect(previa.actualizados).toHaveLength(0)
  })

  it('concilia el codigo sin distinguir mayusculas ni espacios', () => {
    const previa = analizarMaestroClientes(
      [ENCABEZADO, [' c-001 ', 'Agroinsumos del Sur', '', '']],
      MAPEO,
      1,
      [existente({ codigo: 'C-001', nombre: 'Agroinsumos del Sur' })],
    )
    expect(previa.nuevos).toHaveLength(0)
  })

  it('respeta la fila de encabezado indicada', () => {
    const rejilla = [
      ['REPORTE DE CLIENTES'],
      ['Generado el 26/08/2026'],
      ENCABEZADO,
      ['C-001', 'Uno', 'Espinal', ''],
    ]
    const previa = analizarMaestroClientes(rejilla, MAPEO, 3, [])
    expect(previa.totalFilas).toBe(1)
    expect(previa.nuevos[0]?.numeroFila).toBe(4)
  })
})

describe('cambiosDesdeArchivo', () => {
  it('solo propone los campos mapeados', () => {
    const cambios = cambiosDesdeArchivo(
      {
        codigo: 'C-001',
        nombre: 'Nuevo Nombre',
        zona: 'Melgar',
        telefono: '300',
        estadoManual: 'cliente',
      },
      { codigo: 0, nombre: 1, zona: 2, telefono: null },
    )
    expect(cambios).toEqual({ nombre: 'Nuevo Nombre', zona: 'Melgar' })
    expect(cambios).not.toHaveProperty('telefono')
  })
})
