import { describe, expect, it } from 'vitest'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import { analizarMaestroClientes, cambiosDesdeArchivo } from './analizarMaestroClientes'
import type { MapeoDetectado } from './detectarColumnas'

/**
 * Mapeo del maestro real: «Identificación (Obligatorio) | Razón social
 * (Obligatorio) | Dirección | CIUDAD | Teléfono principal».
 */
const MAPEO: MapeoDetectado = {
  identificacion: 0,
  nombre: 1,
  direccion: 2,
  municipio: 3,
  telefono: 4,
  codigo: null,
}

const ENCABEZADO = [
  'Identificación (Obligatorio)',
  'Razón social (Obligatorio)',
  'Dirección',
  'CIUDAD',
  'Teléfono principal',
]

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

describe('analizarMaestroClientes · formato real del maestro', () => {
  it('clasifica altas, cambios y filas iguales conciliando por identificación', () => {
    const rejilla = [
      ENCABEZADO,
      ['900509567', 'VETERINARIA LA RED S.A.S.', 'CRA 18 NO. 29-40', '68001', '3156126689'],
      ['901265633', 'TECNIGUADAÑAS DEL SUR S.A.S', 'CALLE 16 N. 13-2', '13670', '3143203764'],
      ['85271331', 'ALIUT JOSE LEAL PEDROZO', 'CRA 3 N. 13-56', '47245', '3215190384'],
    ]
    const previa = analizarMaestroClientes(rejilla, MAPEO, 1, [
      existente({
        codigo: '900509567',
        identificacion: '900509567',
        nombre: 'VETERINARIA LA RED S.A.S.',
        direccion: 'CRA 18 NO. 29-40',
        municipio: '68001',
        telefono: '3156126689',
      }),
      existente({
        codigo: '901265633',
        identificacion: '901265633',
        nombre: 'TECNIGUADAÑAS DEL SUR S.A.S',
        direccion: 'CALLE 16 N. 13-2',
        municipio: '13001',
        telefono: '3143203764',
      }),
    ])

    expect(previa.totalFilas).toBe(3)
    expect(previa.sinCambios).toBe(1)
    expect(previa.actualizados.map((a) => a.actual.identificacion)).toEqual(['901265633'])
    expect(previa.nuevos.map((n) => n.datos.identificacion)).toEqual(['85271331'])
    expect(previa.errores).toEqual([])
  })

  it('conserva el cero inicial del código DANE', () => {
    // Excel entrega «5001» cuando la celda quedó numérica. Sin el cero,
    // Medellín deja de existir.
    const previa = analizarMaestroClientes(
      [ENCABEZADO, ['901509516', 'TEKNOFINCA CJ S.A.S', 'CALLE 44', '5001', '3127808706']],
      MAPEO,
      1,
      [],
    )
    expect(previa.nuevos[0]?.datos.municipio).toBe('05001')
  })

  it('acepta un municipio escrito con nombre y no adivina si es ambiguo', () => {
    const previa = analizarMaestroClientes(
      [
        ENCABEZADO,
        ['111', 'Cliente Claro', '', 'Bucaramanga', ''],
        ['222', 'Cliente Ambiguo', '', 'San Pablo', ''],
      ],
      MAPEO,
      1,
      [],
    )
    expect(previa.nuevos[0]?.datos.municipio).toBe('68001')
    expect(previa.nuevos[1]?.datos.municipio).toBeUndefined()
  })

  it('normaliza la identificación con dígito de verificación', () => {
    const previa = analizarMaestroClientes(
      [ENCABEZADO, ['901593129-3', 'AGROBORDA COLOMBIA SAS', '', '68001', '']],
      MAPEO,
      1,
      [existente({ codigo: 'X', identificacion: '901593129', nombre: 'AGROBORDA COLOMBIA SAS' })],
    )
    // Es el mismo cliente: no debe aparecer como alta.
    expect(previa.nuevos).toHaveLength(0)
  })

  it('usa la identificación como código cuando el archivo no trae uno', () => {
    const previa = analizarMaestroClientes(
      [ENCABEZADO, ['85272248', 'JOSE ELADIO QUIROZ MARTINEZ', '', '47245', '']],
      MAPEO,
      1,
      [],
    )
    expect(previa.nuevos[0]?.datos.codigo).toBe('85272248')
  })

  it('no escribe nada: es una función pura', () => {
    const existentes = [existente({ codigo: 'C-001', nombre: 'Original' })]
    const copia = structuredClone(existentes)
    analizarMaestroClientes([ENCABEZADO, ['111', 'Cambiado', '', '', '']], MAPEO, 1, existentes)
    expect(existentes).toEqual(copia)
  })

  it('rechaza filas sin identificación ni código, indicando la fila de Excel', () => {
    const previa = analizarMaestroClientes(
      [ENCABEZADO, ['', 'Sin identificación', '', '', '']],
      MAPEO,
      1,
      [],
    )
    expect(previa.errores).toEqual([
      { numeroFila: 2, motivo: 'Sin identificación ni código de cliente' },
    ])
    expect(previa.nuevos).toHaveLength(0)
  })

  it('rechaza filas sin nombre', () => {
    const previa = analizarMaestroClientes([ENCABEZADO, ['111', '', '', '', '']], MAPEO, 1, [])
    expect(previa.errores[0]?.motivo).toContain('Sin nombre')
  })

  it('detecta identificaciones repetidas dentro del mismo archivo', () => {
    const previa = analizarMaestroClientes(
      [ENCABEZADO, ['111', 'Uno', '', '', ''], ['111', 'Otro', '', '', '']],
      MAPEO,
      1,
      [],
    )
    expect(previa.nuevos).toHaveLength(1)
    expect(previa.errores[0]?.motivo).toContain('repetido')
  })

  it('ignora las filas completamente vacías sin contarlas ni marcarlas como error', () => {
    const previa = analizarMaestroClientes(
      [ENCABEZADO, ['111', 'Uno', '', '', ''], ['', '', '', '', ''], ['222', 'Dos', '', '', '']],
      MAPEO,
      1,
      [],
    )
    expect(previa.totalFilas).toBe(2)
    expect(previa.errores).toEqual([])
  })

  it('una columna ausente no borra el dato ya registrado', () => {
    // El archivo no trae teléfono: el que estaba a mano debe conservarse.
    const sinTelefono: MapeoDetectado = { ...MAPEO, telefono: null }
    const previa = analizarMaestroClientes(
      [ENCABEZADO, ['111', 'Uno', 'Calle 1', '68001']],
      sinTelefono,
      1,
      [
        existente({
          codigo: '111',
          identificacion: '111',
          nombre: 'Uno',
          direccion: 'Calle 1',
          municipio: '68001',
          telefono: '3001112233',
        }),
      ],
    )
    expect(previa.sinCambios).toBe(1)
    expect(previa.actualizados).toHaveLength(0)
  })

  it('respeta la fila de encabezado indicada', () => {
    const rejilla = [
      ['REPORTE DE CLIENTES'],
      ['Generado el 26/08/2026'],
      ENCABEZADO,
      ['111', 'Uno', '', '68001', ''],
    ]
    const previa = analizarMaestroClientes(rejilla, MAPEO, 3, [])
    expect(previa.totalFilas).toBe(1)
    expect(previa.nuevos[0]?.numeroFila).toBe(4)
  })
})

describe('analizarMaestroClientes · archivos que solo traen código', () => {
  const POR_CODIGO: MapeoDetectado = { codigo: 0, nombre: 1, telefono: 2, identificacion: null }
  const CABECERA = ['codigo', 'nombre', 'telefono']

  it('concilia el código sin distinguir mayúsculas ni espacios', () => {
    const previa = analizarMaestroClientes(
      [CABECERA, [' c-001 ', 'Agroinsumos del Sur', '']],
      POR_CODIGO,
      1,
      [existente({ codigo: 'C-001', nombre: 'Agroinsumos del Sur' })],
    )
    expect(previa.nuevos).toHaveLength(0)
  })
})

describe('cambiosDesdeArchivo', () => {
  it('solo propone los campos mapeados', () => {
    const cambios = cambiosDesdeArchivo(
      {
        codigo: '111',
        nombre: 'Nuevo Nombre',
        municipio: '68001',
        telefono: '300',
        estadoManual: 'cliente',
      },
      { ...MAPEO, telefono: null },
    )
    expect(cambios).toEqual({ nombre: 'Nuevo Nombre', municipio: '68001' })
    expect(cambios).not.toHaveProperty('telefono')
  })
})
