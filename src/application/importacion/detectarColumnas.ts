import { normalizarTexto } from '@/lib/formato'

export interface CampoObjetivo {
  readonly clave: string
  readonly etiqueta: string
  readonly sinonimos: readonly string[]
  readonly requerido: boolean
}

/** Indice de columna asignado a cada campo. `null` = sin asignar. */
export type MapeoDetectado = Record<string, number | null>

/**
 * Propone una correspondencia entre los encabezados del archivo y los campos
 * del sistema.
 *
 * Es solo una propuesta: el usuario siempre puede corregirla. Jamas se lee una
 * columna por posicion fija, que es la causa numero uno de importadores que se
 * rompen el mes que la empresa cambia el formato (riesgo R-01).
 */
export function detectarColumnas(
  encabezados: readonly string[],
  campos: readonly CampoObjetivo[],
): MapeoDetectado {
  const normalizados = encabezados.map((e) => normalizarTexto(e ?? ''))

  // Se puntuan todas las combinaciones y se resuelven de mayor a menor, para
  // que "NOMBRE COMERCIAL" no le robe la columna a "NOMBRE" por ir antes.
  const candidatos: Array<{ campo: string; columna: number; puntaje: number }> = []

  for (const campo of campos) {
    for (let columna = 0; columna < normalizados.length; columna++) {
      const encabezado = normalizados[columna]
      if (!encabezado) continue

      let mejor = 0
      for (const sinonimo of campo.sinonimos) {
        const objetivo = normalizarTexto(sinonimo)
        if (encabezado === objetivo) mejor = Math.max(mejor, 100 + objetivo.length)
        else if (encabezado.startsWith(objetivo)) mejor = Math.max(mejor, 50 + objetivo.length)
        else if (encabezado.includes(objetivo)) mejor = Math.max(mejor, 10 + objetivo.length)
      }
      if (mejor > 0) candidatos.push({ campo: campo.clave, columna, puntaje: mejor })
    }
  }

  candidatos.sort((a, b) => b.puntaje - a.puntaje)

  const mapeo: MapeoDetectado = {}
  for (const campo of campos) mapeo[campo.clave] = null
  const columnasUsadas = new Set<number>()

  for (const candidato of candidatos) {
    if (mapeo[candidato.campo] !== null) continue
    if (columnasUsadas.has(candidato.columna)) continue
    mapeo[candidato.campo] = candidato.columna
    columnasUsadas.add(candidato.columna)
  }

  return mapeo
}

/** Campos requeridos que quedaron sin columna asignada. */
export function requeridosFaltantes(
  mapeo: MapeoDetectado,
  campos: readonly CampoObjetivo[],
): CampoObjetivo[] {
  return campos.filter((campo) => campo.requerido && mapeo[campo.clave] == null)
}

export const CAMPOS_MAESTRO_CLIENTES: readonly CampoObjetivo[] = [
  {
    clave: 'codigo',
    etiqueta: 'Código',
    sinonimos: ['codigo', 'codigo cliente', 'cod', 'cod cliente', 'id', 'id cliente'],
    requerido: true,
  },
  {
    clave: 'nombre',
    etiqueta: 'Nombre o razón social',
    sinonimos: ['nombre', 'razon social', 'cliente', 'nombre cliente'],
    requerido: true,
  },
  {
    clave: 'nombreComercial',
    etiqueta: 'Nombre comercial',
    sinonimos: ['nombre comercial', 'comercial', 'establecimiento'],
    requerido: false,
  },
  { clave: 'nit', etiqueta: 'NIT', sinonimos: ['nit', 'documento', 'identificacion'], requerido: false },
  { clave: 'zona', etiqueta: 'Zona', sinonimos: ['zona', 'ruta', 'territorio', 'sector'], requerido: false },
  {
    clave: 'ciudad',
    etiqueta: 'Ciudad',
    sinonimos: ['ciudad', 'municipio', 'poblacion'],
    requerido: false,
  },
  {
    clave: 'direccion',
    etiqueta: 'Dirección',
    sinonimos: ['direccion', 'dir'],
    requerido: false,
  },
  {
    clave: 'telefono',
    etiqueta: 'Teléfono',
    sinonimos: ['telefono', 'celular', 'movil', 'tel'],
    requerido: false,
  },
  {
    clave: 'email',
    etiqueta: 'Correo',
    sinonimos: ['email', 'correo', 'correo electronico', 'mail'],
    requerido: false,
  },
  {
    clave: 'contactoPrincipal',
    etiqueta: 'Contacto',
    sinonimos: ['contacto', 'contacto principal', 'responsable', 'encargado'],
    requerido: false,
  },
] as const
