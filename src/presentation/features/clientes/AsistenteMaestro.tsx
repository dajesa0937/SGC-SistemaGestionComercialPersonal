import { useCallback, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react'
import type { ArchivoTabular } from '@/domain/archivos/lector-tabular'
import {
  analizarMaestroClientes,
  cambiosDesdeArchivo,
  type PrevisualizacionMaestro,
} from '@/application/importacion/analizarMaestroClientes'
import {
  CAMPOS_MAESTRO_CLIENTES,
  detectarColumnas,
  requeridosFaltantes,
  type MapeoDetectado,
} from '@/application/importacion/detectarColumnas'
import { Boton } from '@/presentation/components/shared/Boton'
import { Campo, Entrada, Seleccion } from '@/presentation/components/shared/Campo'
import { PanelLateral } from '@/presentation/components/shared/PanelLateral'
import { useRepositorios } from '@/presentation/hooks/data/contexto-repositorios'
import { useServicios } from '@/presentation/hooks/data/contexto-servicios'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'
import { formatearNumero } from '@/lib/formato'

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

function Contador({ valor, etiqueta, tono }: { valor: number; etiqueta: string; tono?: string }) {
  return (
    <div className="rounded-panel border border-borde bg-superficie px-3 py-2.5">
      <p className={'cifra text-lg font-semibold ' + (tono ?? 'text-texto')}>
        {formatearNumero(valor)}
      </p>
      <p className="text-xs text-suave">{etiqueta}</p>
    </div>
  )
}

export function AsistenteMaestro({ abierto, onCerrar }: Props) {
  const repositorios = useRepositorios()
  const { lectorTabular } = useServicios()
  const { mostrar } = useAvisos()

  const [paso, setPaso] = useState<Paso>(1)
  const [archivo, setArchivo] = useState<ArchivoTabular | null>(null)
  const [hoja, setHoja] = useState('')
  const [filaEncabezado, setFilaEncabezado] = useState(1)
  const [rejilla, setRejilla] = useState<string[][]>([])
  const [mapeo, setMapeo] = useState<MapeoDetectado>({})
  const [previa, setPrevia] = useState<PrevisualizacionMaestro | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const reiniciar = useCallback(() => {
    setPaso(1)
    setArchivo(null)
    setHoja('')
    setFilaEncabezado(1)
    setRejilla([])
    setMapeo({})
    setPrevia(null)
  }, [])

  const cerrar = () => {
    reiniciar()
    onCerrar()
  }

  const seleccionarArchivo = async (elegido: File) => {
    setOcupado(true)
    try {
      const abierto = await lectorTabular.abrir(elegido)
      setArchivo(abierto)
      setHoja(abierto.hojas[0] ?? '')
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo leer el archivo', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const irAMapeo = async () => {
    if (!archivo) return
    setOcupado(true)
    try {
      const filas = await archivo.leerHoja(hoja)
      setRejilla(filas)
      const encabezados = filas[filaEncabezado - 1] ?? []
      setMapeo(detectarColumnas(encabezados, CAMPOS_MAESTRO_CLIENTES))
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
      const existentes = await repositorios.clientes.listar({ incluirArchivados: true })
      setPrevia(analizarMaestroClientes(rejilla, mapeo, filaEncabezado, existentes))
      setPaso(3)
    } finally {
      setOcupado(false)
    }
  }

  const aplicar = async () => {
    if (!previa) return
    setOcupado(true)
    try {
      for (const fila of previa.nuevos) await repositorios.clientes.crear(fila.datos)
      for (const { fila, actual } of previa.actualizados) {
        await repositorios.clientes.actualizar(actual.id, cambiosDesdeArchivo(fila.datos, mapeo))
      }
      mostrar(
        `${previa.nuevos.length} clientes creados y ${previa.actualizados.length} actualizados`,
        'exito',
      )
      cerrar()
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo aplicar la importación', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const encabezados = rejilla[filaEncabezado - 1] ?? []
  const faltantes = requeridosFaltantes(mapeo, CAMPOS_MAESTRO_CLIENTES)

  return (
    <PanelLateral
      abierto={abierto}
      ancho="lg"
      titulo="Importar maestro de clientes"
      subtitulo={archivo?.nombre}
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
            <Boton variante="primario" disabled={!archivo || ocupado} onClick={irAMapeo}>
              Continuar
            </Boton>
          ) : paso === 2 ? (
            <Boton
              variante="primario"
              disabled={faltantes.length > 0 || ocupado}
              onClick={irARevision}
            >
              Ver qué va a pasar
            </Boton>
          ) : (
            <Boton
              variante="primario"
              disabled={ocupado || !previa || previa.nuevos.length + previa.actualizados.length === 0}
              onClick={aplicar}
            >
              {ocupado ? 'Aplicando…' : 'Aplicar importación'}
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
              {archivo ? archivo.nombre : 'Selecciona el archivo'}
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
              <Campo etiqueta="Hoja" htmlFor="hoja">
                <Seleccion
                  id="hoja"
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
                htmlFor="fila-encabezado"
                ayuda="La fila donde están los títulos de columna"
              >
                <Entrada
                  id="fila-encabezado"
                  type="number"
                  min={1}
                  value={filaEncabezado}
                  onChange={(evento) => setFilaEncabezado(Math.max(1, Number(evento.target.value)))}
                />
              </Campo>
            </div>
          ) : (
            <p className="text-sm text-suave">
              El archivo se lee en tu equipo. No se envía a ningún servidor.
            </p>
          )}
        </div>
      ) : null}

      {paso === 2 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-suave">
            Se detectaron {encabezados.length} columnas. Corrige lo que haga falta: las columnas
            nunca se leen por posición, siempre por lo que indiques aquí.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {CAMPOS_MAESTRO_CLIENTES.map((campo) => (
              <Campo
                key={campo.clave}
                etiqueta={campo.etiqueta}
                htmlFor={`mapeo-${campo.clave}`}
                requerido={campo.requerido}
                error={
                  campo.requerido && mapeo[campo.clave] == null
                    ? 'Falta asignar una columna'
                    : undefined
                }
              >
                <Seleccion
                  id={`mapeo-${campo.clave}`}
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
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-2">
            <Contador valor={previa.totalFilas} etiqueta="Filas leídas" />
            <Contador valor={previa.nuevos.length} etiqueta="Clientes nuevos" tono="text-acento" />
            <Contador valor={previa.actualizados.length} etiqueta="Se actualizan" />
            <Contador
              valor={previa.errores.length}
              etiqueta="Con error"
              tono={previa.errores.length > 0 ? 'text-alerta' : undefined}
            />
          </div>

          {previa.sinCambios > 0 ? (
            <p className="flex items-center gap-2 text-sm text-suave">
              <CheckCircle2 className="size-4 text-exito" aria-hidden="true" />
              {previa.sinCambios} filas ya coinciden con lo registrado y no se tocarán.
            </p>
          ) : null}

          {previa.errores.length > 0 ? (
            <div className="rounded-panel border border-alerta/40 bg-alerta-suave px-4 py-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-texto">
                <AlertTriangle className="size-4 text-alerta" aria-hidden="true" />
                Estas filas se van a omitir
              </p>
              <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-xs text-suave">
                {previa.errores.slice(0, 50).map((error) => (
                  <li key={error.numeroFila}>
                    Fila {error.numeroFila}: {error.motivo}
                  </li>
                ))}
              </ul>
              {previa.errores.length > 50 ? (
                <p className="mt-2 text-xs text-tenue">
                  y {previa.errores.length - 50} más. Corrígelas en el archivo y vuelve a importar.
                </p>
              ) : null}
            </div>
          ) : null}

          {previa.nuevos.length > 0 ? (
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-texto">
                <FileSpreadsheet className="size-4 text-tenue" aria-hidden="true" />
                Se van a crear
              </p>
              <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto text-sm text-suave">
                {previa.nuevos.slice(0, 30).map((fila) => (
                  <li key={fila.datos.codigo}>
                    <span className="cifra text-tenue">{fila.datos.codigo}</span> · {fila.datos.nombre}
                  </li>
                ))}
              </ul>
              {previa.nuevos.length > 30 ? (
                <p className="mt-1 text-xs text-tenue">y {previa.nuevos.length - 30} más</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </PanelLateral>
  )
}
