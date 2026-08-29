import { useCallback, useState } from 'react'
import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react'
import type { ArchivoTabular } from '@/domain/archivos/lector-tabular'
import { hoyISO } from '@/domain/shared/types'
import {
  CAMPOS_CARTERA,
  analizarCobranza,
  faltantesCartera,
  type PrevisualizacionCobranza,
} from '@/application/importacion/analizarCobranza'
import { detectarCabeceraCorte, type CabeceraCorte } from '@/application/importacion/detectarCorte'
import { detectarColumnas, type MapeoDetectado } from '@/application/importacion/detectarColumnas'
import { aplicarCartera } from '@/application/cobranza/aplicarCartera'
import { ETIQUETA_TRAMO, TRAMOS } from '@/domain/cobranza/cobranza.entity'
import { Boton } from '@/presentation/components/shared/Boton'
import { Campo, Entrada, Seleccion } from '@/presentation/components/shared/Campo'
import { PanelLateral } from '@/presentation/components/shared/PanelLateral'
import { useRepositorios } from '@/presentation/hooks/data/contexto-repositorios'
import { useServicios } from '@/presentation/hooks/data/contexto-servicios'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'
import { formatearCentavos, formatearFecha, formatearNumero } from '@/lib/formato'

type Paso = 1 | 2 | 3

interface Props {
  abierto: boolean
  onCerrar: () => void
}

const PASOS: ReadonlyArray<{ numero: Paso; titulo: string }> = [
  { numero: 1, titulo: 'Archivo' },
  { numero: 2, titulo: 'Mapeo' },
  { numero: 3, titulo: 'Revisión' },
]

function Indicador({ paso }: { paso: Paso }) {
  return (
    <ol className="mb-5 flex items-center gap-2 text-xs">
      {PASOS.map((item, indice) => (
        <li key={item.numero} className="flex items-center gap-2">
          <span
            className={
              'flex size-5 items-center justify-center rounded-full font-medium ' +
              (paso >= item.numero
                ? 'bg-acento text-acento-contraste'
                : 'bg-superficie-alt text-tenue')
            }
          >
            {item.numero}
          </span>
          <span className={paso >= item.numero ? 'text-texto' : 'text-tenue'}>{item.titulo}</span>
          {indice < PASOS.length - 1 ? (
            <span className="mx-1 h-px w-6 bg-borde" aria-hidden="true" />
          ) : null}
        </li>
      ))}
    </ol>
  )
}

function Contador({ valor, etiqueta, tono }: { valor: string; etiqueta: string; tono?: string }) {
  return (
    <div className="rounded-panel border border-borde bg-superficie px-3 py-2.5">
      <p className={'cifra text-lg font-semibold ' + (tono ?? 'text-texto')}>{valor}</p>
      <p className="text-xs text-suave">{etiqueta}</p>
    </div>
  )
}

export function AsistenteCartera({ abierto, onCerrar }: Props) {
  const repositorios = useRepositorios()
  const { lectorTabular } = useServicios()
  const { mostrar } = useAvisos()

  const [paso, setPaso] = useState<Paso>(1)
  const [archivo, setArchivo] = useState<ArchivoTabular | null>(null)
  const [hoja, setHoja] = useState('')
  const [filaEncabezado, setFilaEncabezado] = useState(1)
  const [encabezados, setEncabezados] = useState<string[]>([])
  const [rejilla, setRejilla] = useState<string[][]>([])
  const [mapeo, setMapeo] = useState<MapeoDetectado>({})
  const [cabecera, setCabecera] = useState<CabeceraCorte>({})
  const [fecha, setFecha] = useState(hoyISO())
  const [fechaDetectada, setFechaDetectada] = useState(false)
  const [crearClientes, setCrearClientes] = useState(true)
  const [previa, setPrevia] = useState<PrevisualizacionCobranza | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const cerrar = useCallback(() => {
    setPaso(1)
    setArchivo(null)
    setHoja('')
    setFilaEncabezado(1)
    setEncabezados([])
    setRejilla([])
    setMapeo({})
    setCabecera({})
    setFecha(hoyISO())
    setFechaDetectada(false)
    setCrearClientes(true)
    setPrevia(null)
    onCerrar()
  }, [onCerrar])

  const seleccionarArchivo = async (elegido: File) => {
    setOcupado(true)
    try {
      const abierto = await lectorTabular.abrir(elegido)
      setArchivo(abierto)
      setHoja(abierto.hojas[0] ?? '')
      // El reporte real trae el encabezado en la fila 7, bajo un bloque de
      // titulo con celdas combinadas. Se propone esa fila y el usuario la
      // corrige si la plantilla cambia.
      setFilaEncabezado(7)
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo abrir el archivo', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const irAMapeo = async () => {
    if (!archivo) return
    setOcupado(true)
    try {
      const filas = await archivo.leerHoja(hoja)
      const titulos = filas[filaEncabezado - 1] ?? []
      setRejilla(filas)
      setEncabezados(titulos)
      setMapeo(detectarColumnas(titulos, CAMPOS_CARTERA))

      const leida = detectarCabeceraCorte(filas, filaEncabezado - 1)
      setCabecera(leida)
      setFechaDetectada(leida.fecha !== undefined)
      if (leida.fecha) setFecha(leida.fecha)
      setPaso(2)
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo leer la hoja', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const irARevision = async () => {
    setOcupado(true)
    try {
      const clientes = await repositorios.clientes.listar({ incluirArchivados: true })
      setPrevia(analizarCobranza(rejilla, mapeo, filaEncabezado, fecha, clientes))
      setPaso(3)
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo analizar el archivo', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const aplicar = async () => {
    if (!previa || !archivo) return
    setOcupado(true)
    try {
      const resultado = await aplicarCartera(
        repositorios,
        previa,
        {
          archivo: archivo.nombre,
          empresa: cabecera.empresa,
          nit: cabecera.nit,
          procesadoEn: cabecera.procesadoEn,
        },
        crearClientes,
      )
      mostrar(
        `Corte del ${formatearFecha(previa.fecha)} guardado · ` +
          `${formatearNumero(resultado.documentosGuardados)} documentos` +
          (resultado.clientesCreados > 0
            ? ` · ${formatearNumero(resultado.clientesCreados)} clientes nuevos`
            : ''),
        'exito',
      )
      cerrar()
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo guardar el corte', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const faltantes = faltantesCartera(mapeo)

  return (
    <PanelLateral
      abierto={abierto}
      titulo="Importar cartera"
      onCerrar={cerrar}
      pie={
        <>
          {paso > 1 ? (
            <Boton onClick={() => setPaso((p) => (p - 1) as Paso)} className="mr-auto">
              Atrás
            </Boton>
          ) : null}
          <Boton onClick={cerrar}>Cancelar</Boton>
          {paso === 1 ? (
            <Boton
              variante="primario"
              disabled={!archivo || ocupado}
              onClick={() => void irAMapeo()}
            >
              Continuar
            </Boton>
          ) : paso === 2 ? (
            <Boton
              variante="primario"
              disabled={faltantes.length > 0 || ocupado}
              onClick={() => void irARevision()}
            >
              Ver qué va a pasar
            </Boton>
          ) : (
            <Boton
              variante="primario"
              disabled={ocupado || !previa || previa.documentos.length === 0}
              onClick={() => void aplicar()}
            >
              {ocupado ? 'Guardando…' : 'Guardar el corte'}
            </Boton>
          )}
        </>
      }
    >
      <Indicador paso={paso} />

      {paso === 1 ? (
        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-panel border border-dashed border-borde bg-superficie px-6 py-10 text-center transition-colors duration-150 hover:border-acento">
            <Upload className="mb-3 size-6 text-tenue" aria-hidden="true" />
            <span className="text-sm font-medium text-texto">
              {archivo ? archivo.nombre : 'Selecciona el reporte de cuentas por cobrar'}
            </span>
            <span className="mt-1 text-xs text-suave">Formatos .xlsx y .csv</span>
            <input
              type="file"
              accept=".xlsx,.csv,.txt"
              className="sr-only"
              onChange={(evento) => {
                const elegido = evento.target.files?.[0]
                if (elegido) void seleccionarArchivo(elegido)
              }}
            />
          </label>

          {archivo ? (
            <div className="grid grid-cols-2 gap-4">
              <Campo etiqueta="Hoja" htmlFor="hoja-cartera">
                <Seleccion
                  id="hoja-cartera"
                  value={hoja}
                  onChange={(evento) => setHoja(evento.target.value)}
                >
                  {archivo.hojas.map((nombre) => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </Seleccion>
              </Campo>
              <Campo
                etiqueta="Fila de encabezados"
                htmlFor="fila-encabezado-cartera"
                ayuda="En el reporte de la empresa es la 7"
              >
                <Entrada
                  id="fila-encabezado-cartera"
                  type="number"
                  min={1}
                  value={filaEncabezado}
                  onChange={(evento) => setFilaEncabezado(Math.max(1, Number(evento.target.value)))}
                />
              </Campo>
            </div>
          ) : (
            <p className="text-sm text-suave">
              Es el reporte «Cuentas por cobrar detallada por documento». Cada importación guarda un
              corte con su fecha, así que puedes compararlos mes a mes. El archivo se lee en tu
              equipo y no se envía a ningún servidor.
            </p>
          )}
        </div>
      ) : null}

      {paso === 2 ? (
        <div className="flex flex-col gap-4">
          <Campo
            etiqueta="Fecha del corte"
            htmlFor="fecha-corte"
            ayuda={
              fechaDetectada
                ? 'Se leyó del pie del reporte. Todas las edades se calculan contra esta fecha.'
                : 'No se encontró en el archivo. Escribe la fecha en que la empresa lo procesó: de ella dependen todos los tramos de vencimiento.'
            }
          >
            <Entrada
              id="fecha-corte"
              type="date"
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
            />
          </Campo>

          {cabecera.empresa ? (
            <p className="text-xs text-tenue">
              Emitido por {cabecera.empresa}
              {cabecera.nit ? ` · NIT ${cabecera.nit}` : ''}
            </p>
          ) : null}

          <p className="text-sm text-suave">
            Se detectaron {encabezados.length} columnas. Las de edades no son obligatorias: sirven
            para comprobar la lectura, porque el tramo se calcula con la fecha de vencimiento.
          </p>

          {faltantes.length > 0 ? (
            <div className="rounded-panel border-l-2 border-alerta bg-alerta-suave px-4 py-3">
              <ul className="flex flex-col gap-1 text-sm text-texto">
                {faltantes.map((falta) => (
                  <li key={falta}>{falta}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            {CAMPOS_CARTERA.map((campo) => (
              <Campo key={campo.clave} etiqueta={campo.etiqueta} htmlFor={`cartera-${campo.clave}`}>
                <Seleccion
                  id={`cartera-${campo.clave}`}
                  value={mapeo[campo.clave] ?? ''}
                  onChange={(evento) =>
                    setMapeo((previo) => ({
                      ...previo,
                      [campo.clave]: evento.target.value === '' ? null : Number(evento.target.value),
                    }))
                  }
                >
                  <option value="">— sin asignar —</option>
                  {encabezados.map((encabezado, indice) => (
                    <option key={indice} value={indice}>
                      {encabezado || `(columna ${indice + 1})`}
                    </option>
                  ))}
                </Seleccion>
              </Campo>
            ))}
          </div>
        </div>
      ) : null}

      {paso === 3 && previa ? (
        <div className="flex flex-col gap-4" data-previa-cartera>
          <p className="text-sm text-suave">
            Corte del{' '}
            <strong className="font-medium text-texto">{formatearFecha(previa.fecha)}</strong>. Si ya
            hay un corte de esa fecha, se reemplaza; los de otras fechas no se tocan.
          </p>

          <div className="grid grid-cols-4 gap-2">
            <Contador valor={formatearNumero(previa.totalFilas)} etiqueta="Filas leídas" />
            <Contador
              valor={formatearNumero(previa.documentos.length)}
              etiqueta="Documentos"
              tono="text-acento"
            />
            <Contador valor={formatearCentavos(previa.total)} etiqueta="Cartera total" />
            <Contador
              valor={formatearNumero(previa.errores.length)}
              etiqueta="Con error"
              tono={previa.errores.length > 0 ? 'text-alerta' : undefined}
            />
          </div>

          <div className="rounded-panel border border-borde bg-superficie px-4 py-3">
            <p className="mb-2 text-sm font-medium text-texto">Reparto por edad</p>
            <ul className="flex flex-col gap-1 text-xs">
              {TRAMOS.filter((tramo) => previa.porTramo[tramo] !== 0).map((tramo) => (
                <li key={tramo} className="flex items-center justify-between gap-4">
                  <span className="text-suave">{ETIQUETA_TRAMO[tramo]}</span>
                  <span className="cifra text-texto">{formatearCentavos(previa.porTramo[tramo])}</span>
                </li>
              ))}
            </ul>
          </div>

          {previa.descuadres.length > 0 ? (
            <div className="rounded-panel border border-alerta/40 bg-alerta-suave px-4 py-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-texto">
                <AlertTriangle className="size-4 text-alerta" aria-hidden="true" />
                {formatearNumero(previa.descuadres.length)}{' '}
                {previa.descuadres.length === 1 ? 'fila no cuadra' : 'filas no cuadran'} con lo que
                dice el archivo
              </p>
              <p className="mb-2 text-xs text-suave">
                Se importan igual. Suele significar que la fecha del corte no es la correcta o que la
                empresa cambió el formato del reporte.
              </p>
              <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto text-xs text-suave">
                {previa.descuadres.slice(0, 30).map((descuadre) => (
                  <li key={`${descuadre.numeroFila}-${descuadre.motivo}`}>
                    Fila {descuadre.numeroFila} ({descuadre.documento}): {descuadre.motivo}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-suave">
              <CheckCircle2 className="size-4 text-exito" aria-hidden="true" />
              Las {formatearNumero(previa.totalFilas)} filas cuadran: las columnas de edades suman su
              total y el tramo calculado por fecha es el que dice el archivo.
            </p>
          )}

          {previa.clientesPorCrear.length > 0 ? (
            <div className="rounded-panel border border-borde bg-superficie-alt px-4 py-3">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-acento"
                  checked={crearClientes}
                  onChange={(evento) => setCrearClientes(evento.target.checked)}
                />
                <span className="text-sm text-texto">
                  Crear los {formatearNumero(previa.clientesPorCrear.length)} clientes del reporte
                  que no están en tu cartera
                  <span className="mt-0.5 block text-xs text-suave">
                    Si no los creas, el corte se guarda igual y esos saldos aparecen sin ficha de
                    cliente: sin municipio, sin zona y sin historia de ventas.
                  </span>
                </span>
              </label>
              <ul className="mt-2 flex max-h-32 flex-col gap-0.5 overflow-y-auto text-xs text-suave">
                {previa.clientesPorCrear.map((cliente) => (
                  <li key={cliente.clave} className="flex justify-between gap-3">
                    <span>{cliente.datos.nombre}</span>
                    <span className="cifra shrink-0 text-tenue">
                      {formatearCentavos(cliente.saldo)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-suave">
              <CheckCircle2 className="size-4 text-exito" aria-hidden="true" />
              Todos los clientes del reporte ya están en tu cartera.
            </p>
          )}

          {previa.errores.length > 0 ? (
            <div className="rounded-panel border border-alerta/40 bg-alerta-suave px-4 py-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-texto">
                <AlertTriangle className="size-4 text-alerta" aria-hidden="true" />
                Estas filas se van a omitir
              </p>
              <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-xs text-suave">
                {previa.errores.slice(0, 40).map((error) => (
                  <li key={`${error.numeroFila}-${error.motivo}`}>
                    Fila {error.numeroFila}: {error.motivo}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </PanelLateral>
  )
}
