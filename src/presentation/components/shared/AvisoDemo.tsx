import { FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDemo } from '@/presentation/hooks/data/useDemo'
import { formatearFecha } from '@/lib/formato'

/**
 * Aviso de base de demostracion.
 *
 * No se puede descartar, igual que el de respaldo, y por un motivo mas fuerte:
 * el riesgo aqui no es perder datos sino **llevar cifras inventadas a una
 * reunion**. Mientras la demostracion este cargada tiene que ser imposible
 * mirar una pantalla y no saberlo.
 */
export function AvisoDemo() {
  const marca = useDemo()
  if (!marca?.esDemo) return null

  return (
    <div
      data-aviso-demo
      className="mb-5 flex items-start gap-2.5 rounded-panel border-l-2 border-acento bg-acento-suave px-4 py-3 no-imprimir"
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-acento" aria-hidden="true" />
      <p className="text-sm text-texto">
        <strong className="font-medium">Estás viendo la base de demostración</strong>, generada el{' '}
        {formatearFecha(marca.generadaEn)}. Ninguna de estas cifras es real y todo lo que imprimas
        sale sellado como demostración.{' '}
        <Link to="/configuracion" className="font-medium text-acento hover:underline">
          Volver a mis datos
        </Link>
      </p>
    </div>
  )
}
