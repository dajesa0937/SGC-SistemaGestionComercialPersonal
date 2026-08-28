import type { ClasificacionABC, EstadoCliente } from '@/domain/cliente/cliente.entity'

/**
 * «Nuevo en el año» y no solo «Nuevo» a propósito.
 *
 * Hay dos nociones de cliente nuevo y confundirlas hacía que la ficha dijera
 * «Nuevo» mientras el informe decía «0 clientes nuevos»: el estado mira la
 * primera compra del AÑO, y el indicador del panel mira la del MES.
 */
export const ETIQUETA_ESTADO: Record<EstadoCliente, string> = {
  nuevo: 'Nuevo en el año',
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
