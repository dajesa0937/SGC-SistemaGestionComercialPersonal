import type { Cliente, NuevoCliente } from '@/domain/cliente/cliente.entity'
import { normalizarIdentificacion } from '@/domain/cliente/identificacion'
import { municipioPorNombre, normalizarCodigoMunicipio } from '@/domain/geografia/geografia'
import type { MapeoDetectado } from './detectarColumnas'

/** Rejilla del archivo: filas de celdas ya convertidas a texto. */
export type Rejilla = readonly (readonly string[])[]

export interface FilaMaestro {
  /** Numero de fila tal como lo ve el usuario en Excel (empieza en 1). */
  readonly numeroFila: number
  readonly datos: NuevoCliente
}

export interface ErrorDeFila {
  readonly numeroFila: number
  readonly motivo: string
}

export interface PrevisualizacionMaestro {
  readonly totalFilas: number
  readonly nuevos: readonly FilaMaestro[]
  readonly actualizados: readonly { fila: FilaMaestro; actual: Cliente }[]
  readonly sinCambios: number
  readonly errores: readonly ErrorDeFila[]
}

const CAMPOS_TEXTO = [
  'nombreComercial',
  'identificacion',
  'municipio',
  'direccion',
  'telefono',
  'email',
  'contactoPrincipal',
] as const

function celda(fila: readonly string[], columna: number | null | undefined): string {
  if (columna == null) return ''
  return (fila[columna] ?? '').trim()
}

function opcional(valor: string): string | undefined {
  return valor === '' ? undefined : valor
}

/**
 * Lee la columna de municipio, venga como esta o como se llame.
 *
 * El maestro real trae el codigo DANE («68001»); otros archivos traen el nombre
 * escrito. Se aceptan los dos, pero un nombre ambiguo —«San Pablo» existe en
 * tres departamentos— se deja sin resolver antes que resolverlo mal.
 */
function leerMunicipio(valor: string): string | undefined {
  if (valor === '') return undefined
  return normalizarCodigoMunicipio(valor) ?? municipioPorNombre(valor)
}

/**
 * Analiza la rejilla del archivo y describe que pasaria al aplicarla.
 *
 * Es una funcion pura: no escribe nada. La vista previa obligatoria antes de
 * tocar la base es la salvaguarda central del modulo de importacion, y solo es
 * creible si el analisis no tiene efectos.
 */
export function analizarMaestroClientes(
  rejilla: Rejilla,
  mapeo: MapeoDetectado,
  filaEncabezado: number,
  existentes: readonly Cliente[],
): PrevisualizacionMaestro {
  // La identificacion manda sobre el codigo: es la llave que sobrevivio al
  // cruce de los archivos reales de la empresa. El codigo queda de respaldo
  // para archivos que no traigan NIT.
  const porIdentificacion = new Map(
    existentes.filter((c) => c.identificacion).map((c) => [c.identificacion!, c]),
  )
  const porCodigo = new Map(existentes.map((c) => [c.codigo.trim().toUpperCase(), c]))
  const clavesEnArchivo = new Set<string>()

  const nuevos: FilaMaestro[] = []
  const actualizados: { fila: FilaMaestro; actual: Cliente }[] = []
  const errores: ErrorDeFila[] = []
  let sinCambios = 0
  let totalFilas = 0

  for (let indice = filaEncabezado; indice < rejilla.length; indice++) {
    const fila = rejilla[indice]
    if (!fila) continue

    // Las filas completamente vacias son separadores, no errores.
    if (fila.every((valor) => (valor ?? '').trim() === '')) continue

    totalFilas++
    const numeroFila = indice + 1

    const identificacion = normalizarIdentificacion(celda(fila, mapeo['identificacion']))
    const codigoArchivo = celda(fila, mapeo['codigo'])
    const nombre = celda(fila, mapeo['nombre'])

    if (identificacion === undefined && codigoArchivo === '') {
      errores.push({ numeroFila, motivo: 'Sin identificación ni código de cliente' })
      continue
    }
    if (nombre === '') {
      const referencia = identificacion ?? codigoArchivo
      errores.push({ numeroFila, motivo: `Sin nombre (${referencia})` })
      continue
    }

    // Cuando el archivo no trae codigo propio, la identificacion hace de codigo:
    // asi el cliente siempre tiene una referencia visible.
    const codigo = codigoArchivo !== '' ? codigoArchivo : (identificacion ?? '')

    const clave = identificacion ?? codigo.toUpperCase()
    if (clavesEnArchivo.has(clave)) {
      errores.push({ numeroFila, motivo: `${clave} aparece repetido en el archivo` })
      continue
    }
    clavesEnArchivo.add(clave)

    const datos: NuevoCliente = {
      codigo,
      nombre,
      nombreComercial: opcional(celda(fila, mapeo['nombreComercial'])),
      identificacion,
      municipio: leerMunicipio(celda(fila, mapeo['municipio'])),
      direccion: opcional(celda(fila, mapeo['direccion'])),
      telefono: opcional(celda(fila, mapeo['telefono'])),
      email: opcional(celda(fila, mapeo['email'])),
      contactoPrincipal: opcional(celda(fila, mapeo['contactoPrincipal'])),
      estadoManual: 'cliente',
    }

    const actual =
      (identificacion ? porIdentificacion.get(identificacion) : undefined) ??
      porCodigo.get(codigo.toUpperCase())
    if (!actual) {
      nuevos.push({ numeroFila, datos })
      continue
    }

    if (sonEquivalentes(actual, datos, mapeo)) sinCambios++
    else actualizados.push({ fila: { numeroFila, datos }, actual })
  }

  return { totalFilas, nuevos, actualizados, sinCambios, errores }
}

/**
 * Compara solo los campos que el archivo trae mapeados.
 *
 * Un archivo que no incluye la columna de teléfono no debe borrar los teléfonos
 * ya registrados a mano: la ausencia de una columna significa "no sé", no
 * "está vacío".
 */
function sonEquivalentes(actual: Cliente, entrante: NuevoCliente, mapeo: MapeoDetectado): boolean {
  if (actual.nombre.trim() !== entrante.nombre.trim()) return false

  for (const campo of CAMPOS_TEXTO) {
    if (mapeo[campo] == null) continue
    if ((actual[campo] ?? '') !== (entrante[campo] ?? '')) return false
  }
  return true
}

/**
 * Cambios que hay que aplicar a un cliente existente.
 *
 * Solo incluye los campos que el archivo trae mapeados: los demas se conservan
 * tal como estan, por la misma razon que en `sonEquivalentes`.
 */
export function cambiosDesdeArchivo(
  entrante: NuevoCliente,
  mapeo: MapeoDetectado,
): Partial<NuevoCliente> {
  const cambios: Partial<NuevoCliente> = { nombre: entrante.nombre }
  for (const campo of CAMPOS_TEXTO) {
    if (mapeo[campo] == null) continue
    cambios[campo] = entrante[campo]
  }
  return cambios
}
