import { useState } from 'react'
import { Download, FlaskConical, Trash2 } from 'lucide-react'
import { generarDemo } from '@/application/demo/generarDemo'
import { construirRespaldo, serializarRespaldo } from '@/application/respaldo/construirRespaldo'
import { validarRespaldo } from '@/application/respaldo/validarRespaldo'
import { hoyISO } from '@/domain/shared/types'
import { Boton } from '@/presentation/components/shared/Boton'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import { useAccionesRespaldo, useEstadoRespaldo } from '@/presentation/hooks/data/useRespaldo'
import { useDemo } from '@/presentation/hooks/data/useDemo'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'
import { formatearFecha, formatearNumero } from '@/lib/formato'

/**
 * Cargar y quitar la base de demostracion.
 *
 * Dos decisiones que sostienen todo lo demas:
 *
 * 1. **Reemplaza, no mezcla.** La demostracion entra por el mismo camino que un
 *    respaldo, asi que sustituye la base entera. Mezclar clientes inventados con
 *    reales seria irreversible en la practica: nadie separa despues cuarenta
 *    clientes de ochenta a mano.
 * 2. **Se pide el respaldo antes, no despues.** El boton de cargar no aparece
 *    hasta que el usuario haya bajado su respaldo o diga expresamente que ya lo
 *    tiene. Un aviso que se puede ignorar con un clic no es una salvaguarda.
 */
export function DatosDeDemostracion() {
  const marca = useDemo()
  const estado = useEstadoRespaldo()
  const { exportar, restaurar, borrarTodo } = useAccionesRespaldo()
  const { mostrar } = useAvisos()

  const [paso, setPaso] = useState<'inicio' | 'respaldo' | 'listo'>('inicio')
  const [ocupado, setOcupado] = useState(false)
  const [confirmandoSalida, setConfirmandoSalida] = useState(false)

  const hayDatos = estado?.hayDatos ?? false

  const respaldarYSeguir = async () => {
    setOcupado(true)
    try {
      const registros = await exportar()
      mostrar(`Respaldo descargado con ${formatearNumero(registros)} registros`, 'exito')
      setPaso('listo')
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo generar el respaldo', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const cargar = async () => {
    setOcupado(true)
    try {
      // Se pasa por serializar y validar a proposito: la demostracion recorre
      // exactamente el mismo camino que un respaldo del usuario, incluida la
      // validacion. Si algun dia el generador produjera algo que la aplicacion
      // no sabe leer, falla aqui y no dentro de la base.
      const demo = generarDemo(hoyISO())
      const resultado = validarRespaldo(serializarRespaldo(construirRespaldo(demo.contenido)))
      if (!resultado.valido) {
        mostrar(`La base de demostración no es válida: ${resultado.motivo}`, 'error')
        return
      }
      await restaurar(resultado.respaldo.datos)
      mostrar(
        `Demostración cargada · ${formatearNumero(demo.resumen.clientes)} clientes · ` +
          `${formatearNumero(demo.resumen.periodos)} meses de ventas · ` +
          `${formatearNumero(demo.resumen.visitas)} visitas · ${demo.resumen.cortes} cortes de cartera`,
        'exito',
      )
      setPaso('inicio')
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo cargar la demostración', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const salir = async () => {
    setOcupado(true)
    try {
      await borrarTodo()
      setConfirmandoSalida(false)
      mostrar('Demostración eliminada. La base quedó vacía: restaura tu respaldo.', 'exito')
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo borrar', 'error')
    } finally {
      setOcupado(false)
    }
  }

  // --- Ya está cargada
  if (marca?.esDemo) {
    return (
      <Tarjeta data-demo-cargada>
        <div className="flex items-center justify-between gap-4 border-b border-borde-suave px-5 py-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-medium text-texto">
              <FlaskConical className="size-4 text-acento" aria-hidden="true" />
              Base de demostración cargada
            </h2>
            <p className="mt-0.5 text-xs text-suave">
              Generada el {formatearFecha(marca.generadaEn)}. Ninguna cifra es real.
            </p>
          </div>
          {confirmandoSalida ? (
            <div className="flex items-center gap-2">
              <Boton onClick={() => setConfirmandoSalida(false)}>Cancelar</Boton>
              <Boton
                onClick={() => void salir()}
                disabled={ocupado}
                className="border-peligro text-peligro"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Sí, borrar la demostración
              </Boton>
            </div>
          ) : (
            <Boton onClick={() => setConfirmandoSalida(true)} disabled={ocupado}>
              <Trash2 className="size-4" aria-hidden="true" />
              Quitar la demostración
            </Boton>
          )}
        </div>
        <div className="px-5 py-3">
          <p className="text-sm text-texto">
            Para volver a tus datos, <strong className="font-medium">restaura tu respaldo</strong> en
            la sección de arriba: eso reemplaza la demostración por lo tuyo de una vez. «Quitar la
            demostración» solo borra, y te deja la base vacía.
          </p>
        </div>
      </Tarjeta>
    )
  }

  // --- Todavía no está cargada
  return (
    <Tarjeta data-demo-cargar>
      <div className="border-b border-borde-suave px-5 py-3">
        <h2 className="text-sm font-medium text-texto">Base de demostración</h2>
        <p className="mt-0.5 text-xs text-suave">
          Una cartera inventada con 18 meses de ventas, visitas y dos cortes de cartera, para ver la
          aplicación llena sin usar datos reales.
        </p>
      </div>

      <div className="px-5 py-4">
        {paso === 'inicio' ? (
          <>
            <p className="mb-3 text-sm text-texto">
              Cargarla <strong className="font-medium">reemplaza la base entera</strong>, igual que
              restaurar un respaldo. No se mezcla con lo tuyo — precisamente para que puedas volver
              atrás.
            </p>
            <Boton
              variante="primario"
              onClick={() => setPaso(hayDatos ? 'respaldo' : 'listo')}
              disabled={ocupado}
            >
              <FlaskConical className="size-4" aria-hidden="true" />
              Cargar la demostración
            </Boton>
          </>
        ) : null}

        {paso === 'respaldo' ? (
          <div className="rounded-panel border-l-2 border-alerta bg-alerta-suave px-4 py-3">
            <p className="text-sm text-texto">
              Tienes {formatearNumero(estado?.totalRegistros ?? 0)} registros en la base. Baja tu
              respaldo primero: es lo que te va a devolver a tus datos cuando termines de mirar.
            </p>
            <p className="mt-1 text-xs text-suave">
              {estado?.ultimo
                ? `Tu último respaldo es del ${formatearFecha(estado.ultimo)}.`
                : 'Nunca has descargado un respaldo.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Boton variante="primario" onClick={() => void respaldarYSeguir()} disabled={ocupado}>
                <Download className="size-4" aria-hidden="true" />
                Descargar respaldo y continuar
              </Boton>
              <Boton onClick={() => setPaso('listo')} disabled={ocupado}>
                Ya tengo mi respaldo
              </Boton>
              <Boton onClick={() => setPaso('inicio')} disabled={ocupado}>
                Cancelar
              </Boton>
            </div>
          </div>
        ) : null}

        {paso === 'listo' ? (
          <div className="rounded-panel border border-borde bg-superficie-alt px-4 py-3">
            <p className="text-sm text-texto">
              Se va a reemplazar todo lo que hay en la base por la demostración. Mientras esté
              cargada, la aplicación lo avisa en pantalla y sella todo lo que imprimas.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Boton onClick={() => setPaso('inicio')} disabled={ocupado}>
                Cancelar
              </Boton>
              <Boton variante="primario" onClick={() => void cargar()} disabled={ocupado}>
                <FlaskConical className="size-4" aria-hidden="true" />
                {ocupado ? 'Cargando…' : 'Reemplazar todo con la demostración'}
              </Boton>
            </div>
          </div>
        ) : null}
      </div>
    </Tarjeta>
  )
}
