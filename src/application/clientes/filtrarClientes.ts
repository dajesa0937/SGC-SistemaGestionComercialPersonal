import type { Cliente, EstadoManualCliente } from '@/domain/cliente/cliente.entity'
import { normalizarParaConciliar } from '@/lib/formato'

export type OrdenClientes = 'nombre' | 'codigo' | 'zona'
export type DireccionOrden = 'asc' | 'desc'

export interface FiltrosClientes {
  /** Busqueda libre sobre nombre, nombre comercial, codigo y NIT. */
  texto: string
  /** Cadena vacia = todas las zonas. */
  zona: string
  /** Cadena vacia = todos los estados. */
  estado: EstadoManualCliente | ''
  incluirArchivados: boolean
  orden: OrdenClientes
  direccion: DireccionOrden
}

export const FILTROS_POR_DEFECTO: FiltrosClientes = {
  texto: '',
  zona: '',
  estado: '',
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
export function coincideConTexto(cliente: Cliente, texto: string): boolean {
  const consulta = normalizarParaConciliar(texto)
  if (consulta === '') return true

  const campos = [cliente.nombre, cliente.nombreComercial ?? '', cliente.codigo, cliente.nit ?? '']
  return campos.some((campo) => normalizarParaConciliar(campo).includes(consulta))
}

function comparar(a: Cliente, b: Cliente, orden: OrdenClientes): number {
  switch (orden) {
    case 'codigo':
      return a.codigo.localeCompare(b.codigo, 'es', { numeric: true })
    case 'zona':
      // Los clientes sin zona van al final, no al principio: son la excepcion.
      if (!a.zona && !b.zona) return a.nombre.localeCompare(b.nombre, 'es')
      if (!a.zona) return 1
      if (!b.zona) return -1
      return a.zona.localeCompare(b.zona, 'es') || a.nombre.localeCompare(b.nombre, 'es')
    case 'nombre':
    default:
      return a.nombre.localeCompare(b.nombre, 'es')
  }
}

export function filtrarClientes(
  clientes: readonly Cliente[],
  filtros: FiltrosClientes,
): Cliente[] {
  const resultado = clientes.filter((cliente) => {
    if (!filtros.incluirArchivados && cliente.archivado) return false
    if (filtros.zona !== '' && (cliente.zona ?? '') !== filtros.zona) return false
    if (filtros.estado !== '' && cliente.estadoManual !== filtros.estado) return false
    return coincideConTexto(cliente, filtros.texto)
  })

  const signo = filtros.direccion === 'desc' ? -1 : 1
  return resultado.sort((a, b) => signo * comparar(a, b, filtros.orden))
}

/** Zonas presentes en la cartera, ordenadas y sin repetir. */
export function zonasDisponibles(clientes: readonly Cliente[]): string[] {
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
    filtros.incluirArchivados
  )
}
