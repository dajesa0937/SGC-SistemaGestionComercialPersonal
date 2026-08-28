import type {
  ClasificacionABC,
  ClienteEnriquecido,
  EstadoCliente,
} from '@/domain/cliente/cliente.entity'
import { normalizarParaConciliar } from '@/lib/formato'

export type OrdenClientes =
  | 'nombre'
  | 'codigo'
  | 'zona'
  | 'ventaPeriodo'
  | 'ventaAnio'
  | 'ultimaCompra'

export type DireccionOrden = 'asc' | 'desc'

export interface FiltrosClientes {
  /** Busqueda libre sobre nombre, nombre comercial, codigo y NIT. */
  texto: string
  /** Cadena vacia = todas las zonas. */
  zona: string
  /**
   * Estado derivado del comportamiento de compra, no el asignado a mano.
   *
   * Es el que sirve para trabajar: "en riesgo" e "inactivo" son listas de
   * tareas, mientras que "prospecto" o "suspendido" son etiquetas
   * administrativas que se consultan en la ficha.
   */
  estado: EstadoCliente | ''
  clasificacion: ClasificacionABC | ''
  incluirArchivados: boolean
  orden: OrdenClientes
  direccion: DireccionOrden
}

export const FILTROS_POR_DEFECTO: FiltrosClientes = {
  texto: '',
  zona: '',
  estado: '',
  clasificacion: '',
  incluirArchivados: false,
  orden: 'nombre',
  direccion: 'asc',
}

/**
 * Indica si un cliente coincide con la busqueda libre.
 *
 * La comparacion es insensible a tildes y mayusculas: quien busca "ferreteria"
 * espera encontrar "Ferretería", y obligarlo a escribir la tilde seria
 * hostilidad gratuita.
 */
export function coincideConTexto(
  cliente: { nombre: string; nombreComercial?: string; codigo: string; nit?: string },
  texto: string,
): boolean {
  const consulta = normalizarParaConciliar(texto)
  if (consulta === '') return true

  const campos = [cliente.nombre, cliente.nombreComercial ?? '', cliente.codigo, cliente.nit ?? '']
  return campos.some((campo) => normalizarParaConciliar(campo).includes(consulta))
}

/**
 * Indica si un cliente no tiene valor para la columna por la que se ordena.
 *
 * Estos casos se tratan aparte y SIN aplicarles el signo del orden: quien no
 * tiene zona, o nunca ha comprado, debe quedar al final tanto ascendente como
 * descendente. Ordenar por "última compra" busca extremos reales, no huecos.
 */
function sinValor(cliente: ClienteEnriquecido, orden: OrdenClientes): boolean {
  if (orden === 'zona') return !cliente.zona
  if (orden === 'ultimaCompra') return !cliente.ultimaCompra
  return false
}

/** Comparación principal, sin desempates: de eso se encarga quien ordena. */
function comparar(a: ClienteEnriquecido, b: ClienteEnriquecido, orden: OrdenClientes): number {
  switch (orden) {
    case 'codigo':
      return a.codigo.localeCompare(b.codigo, 'es', { numeric: true })
    case 'zona':
      return (a.zona ?? '').localeCompare(b.zona ?? '', 'es')
    case 'ventaPeriodo':
      return a.ventaPeriodo - b.ventaPeriodo
    case 'ventaAnio':
      return a.ventaAnio - b.ventaAnio
    case 'ultimaCompra':
      return (a.ultimaCompra ?? '').localeCompare(b.ultimaCompra ?? '')
    case 'nombre':
    default:
      return a.nombre.localeCompare(b.nombre, 'es')
  }
}

export function filtrarClientes(
  clientes: readonly ClienteEnriquecido[],
  filtros: FiltrosClientes,
): ClienteEnriquecido[] {
  const resultado = clientes.filter((cliente) => {
    if (!filtros.incluirArchivados && cliente.archivado) return false
    if (filtros.zona !== '' && (cliente.zona ?? '') !== filtros.zona) return false
    if (filtros.estado !== '' && cliente.estado !== filtros.estado) return false
    if (filtros.clasificacion !== '' && cliente.clasificacion !== filtros.clasificacion) return false
    return coincideConTexto(cliente, filtros.texto)
  })

  const signo = filtros.direccion === 'desc' ? -1 : 1

  return resultado.sort((a, b) => {
    // 1. Los que no tienen valor van al final, pase lo que pase con el signo.
    const aVacio = sinValor(a, filtros.orden)
    const bVacio = sinValor(b, filtros.orden)
    if (aVacio !== bVacio) return aVacio ? 1 : -1

    // 2. La comparación principal sí respeta el sentido del orden.
    const diferencia = comparar(a, b, filtros.orden)
    if (diferencia !== 0) return signo * diferencia

    // 3. El desempate tampoco se invierte: dentro de un mismo valor la lista
    //    debe leerse siempre igual.
    return a.nombre.localeCompare(b.nombre, 'es')
  })
}

/** Zonas presentes en la cartera, ordenadas y sin repetir. */
export function zonasDisponibles(clientes: readonly { zona?: string }[]): string[] {
  const zonas = new Set<string>()
  for (const cliente of clientes) {
    const zona = cliente.zona?.trim()
    if (zona) zonas.add(zona)
  }
  return [...zonas].sort((a, b) => a.localeCompare(b, 'es'))
}

/** Indica si hay algun filtro activo, para decidir que estado vacio mostrar. */
export function hayFiltrosActivos(filtros: FiltrosClientes): boolean {
  return (
    filtros.texto.trim() !== '' ||
    filtros.zona !== '' ||
    filtros.estado !== '' ||
    filtros.clasificacion !== '' ||
    filtros.incluirArchivados
  )
}
