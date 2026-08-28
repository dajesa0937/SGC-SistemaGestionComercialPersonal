import type { ClasificacionABC, EstadoCliente } from '@/domain/cliente/cliente.entity'

export const ETIQUETA_ESTADO: Record<EstadoCliente, string> = {
  nuevo: 'Nuevo',
  activo: 'Activo',
  en_riesgo: 'En riesgo',
  inactivo: 'Inactivo',
}

/** El estado se pinta con el tono de aviso solo cuando pide una acción. */
export const TONO_ESTADO: Record<EstadoCliente, 'neutro' | 'acento' | 'alerta'> = {
  nuevo: 'acento',
  activo: 'neutro',
  en_riesgo: 'alerta',
  inactivo: 'alerta',
}

export const ETIQUETA_ABC: Record<ClasificacionABC, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  SIN_HISTORIA: '—',
}
