import { useState } from 'react'
import { AlertTriangle, Download, RefreshCcw, Trash2, Upload } from 'lucide-react'
import type { ResultadoValidacion } from '@/application/respaldo/validarRespaldo'
import { validarRespaldo } from '@/application/respaldo/validarRespaldo'
import { formatearNumero } from '@/lib/formato'
import { Boton } from '@/presentation/components/shared/Boton'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import {
  useAccionesRespaldo,
  useEstadoRespaldo,
} from '@/presentation/hooks/data/useRespaldo'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'

function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-borde-suave px-5 py-3 last:border-b-0">
      <span className="text-sm text-suave">{etiqueta}</span>
      <span className="text-sm font-medium text-texto">{children}</span>
    </div>
  )
}

export function Respaldo() {
  const estado = useEstadoRespaldo()
  const { exportar, restaurar, borrarTodo } = useAccionesRespaldo()
  const { mostrar } = useAvisos()

  const [validacion, setValidacion] = useState<ResultadoValidacion | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  const alExportar = async () => {
    setOcupado(true)
    try {
      const registros = await exportar()
      mostrar(`Respaldo descargado con ${formatearNumero(registros)} registros`, 'exito')
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo generar el respaldo', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const alElegirArchivo = async (archivo: File) => {
    setValidacion(validarRespaldo(await archivo.text()))
  }

  const alRestaurar = async () => {
    if (!validacion?.valido) return
    setOcupado(true)
    try {
      await restaurar(validacion.respaldo.datos)
      mostrar('Respaldo restaurado. Todos los datos anteriores fueron reemplazados.', 'exito')
      setValidacion(null)
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo restaurar', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const alBorrar = async () => {
    setOcupado(true)
    try {
      await borrarTodo()
      setConfirmandoBorrado(false)
      mostrar('Todos los datos fueron eliminados', 'exito')
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo borrar', 'error')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Tarjeta>
        <div className="flex items-center justify-between gap-4 border-b border-borde-suave px-5 py-3">
          <div>
            <h2 className="text-sm font-medium text-texto">Respaldo</h2>
            <p className="mt-0.5 text-xs text-suave">
              Un archivo con absolutamente todo. Guárdalo fuera de este equipo.
            </p>
          </div>
          <Boton variante="primario" onClick={() => void alExportar()} disabled={ocupado}>
            <Download className="size-4" aria-hidden="true" />
            Descargar respaldo
          </Boton>
        </div>

        <Fila etiqueta="Último respaldo">
          {estado === undefined
            ? '—'
            : estado.ultimo === null
              ? 'Nunca'
              : fechaLarga(estado.ultimo)}
        </Fila>
        <Fila etiqueta="Registros en la base">
          <span className="cifra">
            {estado === undefined ? '—' : formatearNumero(estado.totalRegistros)}
          </span>
        </Fila>
      </Tarjeta>

      <Tarjeta>
        <div className="border-b border-borde-suave px-5 py-3">
          <h2 className="text-sm font-medium text-texto">Restaurar</h2>
          <p className="mt-0.5 text-xs text-suave">
            El archivo se revisa entero antes de tocar nada. Restaurar{' '}
            <strong className="font-medium text-texto">reemplaza todos los datos actuales</strong>.
          </p>
        </div>

        <div className="px-5 py-4">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-borde px-4 py-3 text-sm text-suave transition-colors duration-150 hover:border-acento hover:text-texto">
            <Upload className="size-4" aria-hidden="true" />
            Elegir archivo de respaldo
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(evento) => {
                const archivo = evento.target.files?.[0]
                if (archivo) void alElegirArchivo(archivo)
                evento.target.value = ''
              }}
            />
          </label>

          {validacion?.valido === false ? (
            <div className="mt-3 rounded-md border-l-2 border-peligro bg-peligro-suave px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-medium text-texto">
                <AlertTriangle className="size-4 text-peligro" aria-hidden="true" />
                {validacion.motivo}
              </p>
              <ul className="mt-1.5 flex flex-col gap-0.5 text-xs text-suave">
                {validacion.detalles.map((detalle) => (
                  <li key={detalle}>{detalle}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-tenue">No se modificó nada.</p>
            </div>
          ) : null}

          {validacion?.valido ? (
            <div className="mt-3 rounded-md border border-borde bg-superficie-alt px-4 py-3">
              <p className="text-sm font-medium text-texto">Esto es lo que se va a restaurar</p>
              <p className="mt-0.5 text-xs text-tenue">
                Generado el {fechaLarga(validacion.resumen.generadoEn)}
              </p>
              <div className="mt-2.5 grid grid-cols-4 gap-3">
                {(
                  [
                    ['Clientes', validacion.resumen.clientes],
                    ['Ventas', validacion.resumen.ventas],
                    ['Periodos', validacion.resumen.periodos],
                    ['Notas', validacion.resumen.notas],
                  ] as const
                ).map(([etiqueta, valor]) => (
                  <div key={etiqueta}>
                    <p className="cifra text-base font-semibold text-texto">
                      {formatearNumero(valor)}
                    </p>
                    <p className="text-xs text-suave">{etiqueta}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <Boton onClick={() => setValidacion(null)}>Cancelar</Boton>
                <Boton variante="primario" onClick={() => void alRestaurar()} disabled={ocupado}>
                  <RefreshCcw className="size-4" aria-hidden="true" />
                  {ocupado ? 'Restaurando…' : 'Reemplazar todo con este respaldo'}
                </Boton>
              </div>
            </div>
          ) : null}
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <div>
            <h2 className="text-sm font-medium text-texto">Empezar de cero</h2>
            <p className="mt-0.5 text-xs text-suave">
              Borra clientes, ventas, presupuesto y notas. No se puede deshacer.
            </p>
          </div>
          {confirmandoBorrado ? (
            <div className="flex items-center gap-2">
              <Boton onClick={() => setConfirmandoBorrado(false)}>Cancelar</Boton>
              <Boton
                onClick={() => void alBorrar()}
                disabled={ocupado}
                className="border-peligro text-peligro"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Sí, borrar todo
              </Boton>
            </div>
          ) : (
            <Boton onClick={() => setConfirmandoBorrado(true)} disabled={ocupado}>
              <Trash2 className="size-4" aria-hidden="true" />
              Borrar todos los datos
            </Boton>
          )}
        </div>
        {confirmandoBorrado ? (
          <div className="border-t border-borde-suave bg-peligro-suave px-5 py-3">
            <p className="text-sm text-texto">
              {estado?.ultimo
                ? `Tu último respaldo es del ${fechaLarga(estado.ultimo)}. Si es viejo, descarga uno antes.`
                : 'Nunca has descargado un respaldo. Descarga uno antes de borrar.'}
            </p>
          </div>
        ) : null}
      </Tarjeta>
    </div>
  )
}
