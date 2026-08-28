import { DEPARTAMENTOS, MUNICIPIOS } from './municipios.generado'

/**
 * Código DANE de municipio: cinco dígitos, con el cero inicial conservado.
 *
 * Se modela como texto y no como número por una razón que ya costó datos en
 * otros sistemas: `05001` (Medellín) leído como número es `5001`, que no existe.
 * El cero de Antioquia, Atlántico y Bogotá no es decorativo.
 */
export type CodigoMunicipio = string

/** Código de departamento: los dos primeros dígitos del código de municipio. */
export type CodigoDepartamento = string

export interface Municipio {
  readonly codigo: CodigoMunicipio
  readonly nombre: string
  readonly departamento: string
  readonly codigoDepartamento: CodigoDepartamento
  /** `false` cuando el código no está en el catálogo. Se conserva igual. */
  readonly conocido: boolean
}

/**
 * Normaliza lo que venga en la columna de ciudad de un archivo.
 *
 * Excel devuelve `5001` cuando la celda es numérica y `'05001'` cuando es
 * texto. Ambas se refieren a Medellín.
 */
export function normalizarCodigoMunicipio(valor: unknown): CodigoMunicipio | undefined {
  if (valor === null || valor === undefined) return undefined
  const digitos = String(valor).trim().replace(/\D/g, '')
  if (digitos.length === 0 || digitos.length > 5) return undefined
  return digitos.padStart(5, '0')
}

export function codigoDepartamentoDe(municipio: CodigoMunicipio): CodigoDepartamento {
  return municipio.slice(0, 2)
}

export function nombreDepartamento(codigo: CodigoDepartamento): string | undefined {
  return DEPARTAMENTOS[codigo]
}

/**
 * Resuelve un código a municipio.
 *
 * Un código desconocido **no es un error**: devuelve el municipio con
 * `conocido: false` y el código como nombre. La división político-administrativa
 * cambia — Belén de Bajirá (27086) nació en 2022 — y una aplicación que rechace
 * lo que no reconoce pierde clientes en silencio.
 */
export function resolverMunicipio(codigo: CodigoMunicipio): Municipio {
  const codigoDepartamento = codigoDepartamentoDe(codigo)
  const nombre = MUNICIPIOS[codigo]
  return {
    codigo,
    nombre: nombre ?? codigo,
    departamento: DEPARTAMENTOS[codigoDepartamento] ?? 'Departamento desconocido',
    codigoDepartamento,
    conocido: nombre !== undefined,
  }
}

/** «Medellín, Antioquia». Para un código desconocido, «05999 (sin identificar)». */
export function etiquetaMunicipio(codigo: CodigoMunicipio | undefined): string {
  if (!codigo) return 'Sin municipio'
  const m = resolverMunicipio(codigo)
  return m.conocido ? `${m.nombre}, ${m.departamento}` : `${codigo} (sin identificar)`
}

/** Texto sin tildes, en minúsculas, para comparar y buscar. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

let indiceNombres: Map<string, CodigoMunicipio> | null = null

/**
 * Busca un municipio por su nombre escrito.
 *
 * Sirve para migrar datos viejos donde la ciudad era texto libre. Solo acierta
 * cuando el nombre es inequívoco: hay municipios homónimos en departamentos
 * distintos y adivinar cuál era sería peor que no adivinar.
 */
export function municipioPorNombre(nombre: string): CodigoMunicipio | undefined {
  if (indiceNombres === null) {
    const cuenta = new Map<string, CodigoMunicipio[]>()
    for (const [codigo, n] of Object.entries(MUNICIPIOS)) {
      const clave = normalizarTexto(n)
      const lista = cuenta.get(clave)
      if (lista) lista.push(codigo)
      else cuenta.set(clave, [codigo])
    }
    indiceNombres = new Map()
    for (const [clave, codigos] of cuenta) {
      if (codigos.length === 1) indiceNombres.set(clave, codigos[0]!)
    }
  }
  return indiceNombres.get(normalizarTexto(nombre))
}

export interface OpcionMunicipio {
  readonly codigo: CodigoMunicipio
  readonly nombre: string
  readonly departamento: string
}

/**
 * Municipios que coinciden con lo que el usuario escribe, para un selector.
 *
 * Ordena los que empiezan por el texto antes que los que solo lo contienen:
 * quien escribe «san» busca «San Andrés» antes que «Villa de San Diego».
 */
export function buscarMunicipios(texto: string, limite = 20): readonly OpcionMunicipio[] {
  const q = normalizarTexto(texto)
  if (q.length === 0) return []
  const empiezan: OpcionMunicipio[] = []
  const contienen: OpcionMunicipio[] = []

  for (const [codigo, nombre] of Object.entries(MUNICIPIOS)) {
    const n = normalizarTexto(nombre)
    const donde = n.indexOf(q)
    if (donde === -1) continue
    const opcion: OpcionMunicipio = {
      codigo,
      nombre,
      departamento: DEPARTAMENTOS[codigo.slice(0, 2)] ?? '',
    }
    if (donde === 0) empiezan.push(opcion)
    else contienen.push(opcion)
    if (empiezan.length >= limite) break
  }

  const orden = (a: OpcionMunicipio, b: OpcionMunicipio) =>
    a.nombre.localeCompare(b.nombre, 'es-CO')
  return [...empiezan.sort(orden), ...contienen.sort(orden)].slice(0, limite)
}

/** Todos los departamentos, ordenados por nombre. Para filtros. */
export function listarDepartamentos(): readonly { codigo: string; nombre: string }[] {
  return Object.entries(DEPARTAMENTOS)
    .map(([codigo, nombre]) => ({ codigo, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-CO'))
}
