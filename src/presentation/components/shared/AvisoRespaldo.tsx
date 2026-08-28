import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motivoAvisoRespaldo } from '@/application/respaldo/debeAvisarRespaldo'
import { useConfiguracionNegocio } from '@/presentation/hooks/data/useConfiguracion'
import { useEstadoRespaldo } from '@/presentation/hooks/data/useRespaldo'

/**
 * Aviso de respaldo pendiente.
 *
 * Los datos viven en IndexedDB, dentro de este navegador. Limpiar los datos del
 * sitio los borra sin preguntar. El aviso no se puede descartar a propósito: es
 * el único recordatorio de un riesgo que no se ve hasta que ya pasó.
 */
export function AvisoRespaldo() {
  const estado = useEstadoRespaldo()
  const { config } = useConfiguracionNegocio()

  if (!estado || !config) return null

  const motivo = motivoAvisoRespaldo(estado, config.diasAvisoRespaldo)
  if (motivo === null) return null

  return (
    <div
      data-aviso-respaldo
      className="mb-5 flex items-start gap-2.5 rounded-panel border-l-2 border-alerta bg-alerta-suave px-4 py-3 no-imprimir"
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-alerta" aria-hidden="true" />
      <p className="text-sm text-texto">
        {motivo === 'nunca'
          ? 'Todavía no has descargado ningún respaldo. Tus datos viven solo en este navegador.'
          : `Han pasado ${estado.diasDesdeUltimo} días desde tu último respaldo.`}{' '}
        <Link to="/configuracion" className="font-medium text-acento hover:underline">
          Descargar respaldo
        </Link>
      </p>
    </div>
  )
}
