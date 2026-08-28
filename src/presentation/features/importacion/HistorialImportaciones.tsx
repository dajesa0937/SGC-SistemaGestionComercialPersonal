import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { formatearPeriodo } from '@/domain/shared/periodo'
import { revertirImportacion } from '@/application/importacion/aplicarVentas'
import { Boton } from '@/presentation/components/shared/Boton'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import { useRepositorios } from '@/presentation/hooks/data/contexto-repositorios'
import { useConsultaConEstado } from '@/presentation/hooks/data/useConsulta'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'
import { formatearInstante, formatearNumero } from '@/lib/formato'

/**
 * Historial de importaciones con reversion de la ultima (RF-A08).
 *
 * Solo se puede deshacer la ultima. Deshacer una importacion intermedia
 * dejaria los meses en un estado que no corresponde a ningun archivo real, y
 * eso es peor que no poder deshacer.
 */
export function HistorialImportaciones() {
  const repositorios = useRepositorios()
  const { mostrar } = useAvisos()
  const [ocupado, setOcupado] = useState(false)

  const { datos: importaciones, resuelta } = useConsultaConEstado(
    () => repositorios.importaciones.listar(),
    [repositorios],
  )

  if (!resuelta || (importaciones ?? []).length === 0) return null

  const lista = [...(importaciones ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const ultimaAplicada = lista.find((i) => i.estado === 'aplicada')

  const revertir = async (id: string) => {
    setOcupado(true)
    try {
      await revertirImportacion(repositorios, id)
      mostrar('Importación revertida. Los meses volvieron a como estaban.', 'exito')
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo revertir', 'error')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Tarjeta>
      <div className="border-b border-borde-suave px-5 py-3">
        <h2 className="text-sm font-medium text-texto">Importaciones</h2>
        <p className="mt-0.5 text-xs text-suave">
          Solo se puede deshacer la última: revertir una intermedia dejaría los meses en un estado
          que no corresponde a ningún archivo.
        </p>
      </div>

      {lista.slice(0, 10).map((importacion) => (
        <div
          key={importacion.id}
          className="flex items-center justify-between gap-4 border-b border-borde-suave px-5 py-3 last:border-b-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-texto">
              {importacion.archivoNombre}
              {importacion.estado === 'revertida' ? (
                <span className="ml-2 text-xs font-normal text-tenue">revertida</span>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs text-suave">
              {formatearInstante(importacion.fecha)} · {formatearNumero(importacion.filasAplicadas)} de{' '}
              {formatearNumero(importacion.filasLeidas)} filas ·{' '}
              {importacion.periodos.map(formatearPeriodo).join(', ')}
              {importacion.clientesCreados > 0
                ? ` · ${formatearNumero(importacion.clientesCreados)} clientes nuevos`
                : ''}
            </p>
          </div>
          {importacion.id === ultimaAplicada?.id ? (
            <Boton tamano="sm" disabled={ocupado} onClick={() => void revertir(importacion.id)}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Deshacer
            </Boton>
          ) : null}
        </div>
      ))}
    </Tarjeta>
  )
}
