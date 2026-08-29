import type { Tendencia } from '@/application/visitas/crecimiento'
import type { EstadoVisita } from '@/application/visitas/planDeVisitas'

export const ETIQUETA_TENDENCIA: Record<Tendencia, string> = {
  crece: 'Creciendo',
  estable: 'Estable',
  cae: 'Cayendo',
  sin_base: 'Sin base',
}

export const TONO_TENDENCIA: Record<Tendencia, 'exito' | 'neutro' | 'peligro' | 'alerta'> = {
  crece: 'exito',
  estable: 'neutro',
  cae: 'peligro',
  sin_base: 'alerta',
}

export const ETIQUETA_VISITA: Record<EstadoVisita, string> = {
  nunca: 'Nunca visitado',
  al_dia: 'Al día',
  por_vencer: 'Por vencer',
  vencida: 'Vencida',
}
