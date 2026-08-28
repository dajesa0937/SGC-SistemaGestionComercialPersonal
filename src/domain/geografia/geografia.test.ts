import { describe, expect, it } from 'vitest'
import {
  buscarMunicipios,
  codigoDepartamentoDe,
  etiquetaMunicipio,
  listarDepartamentos,
  municipioPorNombre,
  normalizarCodigoMunicipio,
  resolverMunicipio,
} from './geografia'
import { DEPARTAMENTOS, MUNICIPIOS } from './municipios.generado'

describe('catálogo', () => {
  it('cubre todo el país', () => {
    expect(Object.keys(MUNICIPIOS).length).toBeGreaterThanOrEqual(1120)
    expect(Object.keys(DEPARTAMENTOS)).toHaveLength(33)
  })

  it('todo municipio pertenece a un departamento conocido', () => {
    const huerfanos = Object.keys(MUNICIPIOS).filter((c) => DEPARTAMENTOS[c.slice(0, 2)] === undefined)
    expect(huerfanos).toEqual([])
  })

  it('todos los códigos tienen cinco dígitos', () => {
    expect(Object.keys(MUNICIPIOS).filter((c) => !/^\d{5}$/.test(c))).toEqual([])
  })
})

describe('normalizarCodigoMunicipio', () => {
  it('conserva el cero inicial que Excel se come', () => {
    // La misma celda llega como número o como texto según cómo se guardó.
    expect(normalizarCodigoMunicipio(5001)).toBe('05001')
    expect(normalizarCodigoMunicipio('05001')).toBe('05001')
    expect(normalizarCodigoMunicipio(' 5001 ')).toBe('05001')
  })

  it('descarta lo que no puede ser un código', () => {
    expect(normalizarCodigoMunicipio(undefined)).toBeUndefined()
    expect(normalizarCodigoMunicipio('')).toBeUndefined()
    expect(normalizarCodigoMunicipio('Bucaramanga')).toBeUndefined()
    expect(normalizarCodigoMunicipio('123456')).toBeUndefined()
  })
})

describe('resolverMunicipio', () => {
  it('resuelve los municipios reales del maestro', () => {
    const casos: [string, string, string][] = [
      ['68001', 'Bucaramanga', 'Santander'],
      ['70713', 'San Onofre', 'Sucre'],
      ['13430', 'Magangué', 'Bolívar'],
      ['47245', 'El Banco', 'Magdalena'],
      ['05250', 'El Bagre', 'Antioquia'],
      ['23675', 'San Bernardo del Viento', 'Córdoba'],
      ['94001', 'Inírida', 'Guainía'],
    ]
    for (const [codigo, nombre, departamento] of casos) {
      const m = resolverMunicipio(codigo)
      expect([m.nombre, m.departamento, m.conocido]).toEqual([nombre, departamento, true])
    }
  })

  it('conoce Belén de Bajirá, creado en 2022', () => {
    // Está en el maestro real. Un catálogo desactualizado lo perdería.
    expect(resolverMunicipio('27086')).toMatchObject({ nombre: 'Belén de Bajirá', departamento: 'Chocó' })
  })

  it('no rechaza un código desconocido: lo conserva y lo marca', () => {
    const m = resolverMunicipio('68999')
    expect(m.conocido).toBe(false)
    expect(m.codigo).toBe('68999')
    expect(m.nombre).toBe('68999')
    // El departamento sí se deduce, porque los dos primeros dígitos bastan.
    expect(m.departamento).toBe('Santander')
    expect(etiquetaMunicipio('68999')).toBe('68999 (sin identificar)')
  })

  it('deduce el departamento sin guardarlo', () => {
    expect(codigoDepartamentoDe('05001')).toBe('05')
    expect(codigoDepartamentoDe('11001')).toBe('11')
  })
})

describe('etiquetaMunicipio', () => {
  it('nombra municipio y departamento', () => {
    expect(etiquetaMunicipio('68081')).toBe('Barrancabermeja, Santander')
    expect(etiquetaMunicipio('11001')).toBe('Bogotá, D.C., Bogotá, D.C.')
  })

  it('dice «Sin municipio» cuando no hay ninguno', () => {
    expect(etiquetaMunicipio(undefined)).toBe('Sin municipio')
  })
})

describe('municipioPorNombre', () => {
  it('encuentra por nombre sin importar tildes ni mayúsculas', () => {
    expect(municipioPorNombre('MEDELLIN')).toBe('05001')
    expect(municipioPorNombre('  bucaramanga ')).toBe('68001')
  })

  it('no adivina cuando el nombre es ambiguo', () => {
    // «San Pablo» existe en Bolívar, Nariño y Antioquia: elegir sería inventar.
    expect(municipioPorNombre('San Pablo')).toBeUndefined()
  })

  it('devuelve indefinido para un nombre que no existe', () => {
    expect(municipioPorNombre('Villa Inventada')).toBeUndefined()
  })
})

describe('buscarMunicipios', () => {
  it('prefiere los que empiezan por el texto', () => {
    const r = buscarMunicipios('barran')
    expect(r[0]?.nombre.toLowerCase().startsWith('barran')).toBe(true)
    expect(r.some((m) => m.codigo === '68081')).toBe(true)
  })

  it('acompaña cada municipio con su departamento', () => {
    const [primero] = buscarMunicipios('Inírida')
    expect(primero).toMatchObject({ codigo: '94001', departamento: 'Guainía' })
  })

  it('con texto vacío no devuelve nada', () => {
    expect(buscarMunicipios('')).toEqual([])
  })

  it('respeta el límite', () => {
    expect(buscarMunicipios('san', 5)).toHaveLength(5)
  })
})

describe('listarDepartamentos', () => {
  it('van ordenados por nombre', () => {
    const d = listarDepartamentos()
    expect(d).toHaveLength(33)
    expect(d[0]?.nombre).toBe('Amazonas')
    expect(d.map((x) => x.nombre)).toEqual([...d.map((x) => x.nombre)].sort((a, b) => a.localeCompare(b, 'es-CO')))
  })
})
