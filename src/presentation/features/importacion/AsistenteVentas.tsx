import { useCallback, useState } from 'react'
import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react'
import type { ArchivoTabular } from '@/domain/archivos/lector-tabular'
import type { MapeoColumnas } from '@/domain/importacion/importacion.entity'
import { formatearPeriodo } from '@/domain/shared/periodo'
import {
  CAMPOS_VENTAS,
  analizarVentas,
  faltantesVentas,
  type PrevisualizacionVentas,
} from '@/application/importacion/analizarVentas'
import { aplicarVentas } from '@/application/importacion/aplicarVentas'
import { detectarColumnas, type MapeoDetectado } from '@/application/importacion/detectarColumnas'
import { Boton } from '@/presentation/components/shared/Boton'
import { Campo, Entrada, Seleccion } from '@/presentation/components/shared/Campo'
import { PanelLateral } from '@/presentation/components/shared/PanelLateral'
import { useRepositorios } from '@/presentation/hooks/data/contexto-repositorios'
import { useServicios } from '@/presentation/hooks/data/contexto-servicios'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'
import { formatearNumero, formatearPesos } from '@/lib/formato'

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

export function AsistenteVentas({ abierto, onCerrar }: Props) {
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
  const [previa, setPrevia] = useState<PrevisualizacionVentas | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const cerrar = useCallback(() => {
    setPaso(1)
    setArchivo(null)
    setHoja('')
    setFilaEncabezado(1)
    setEncabezados([])
    setRejilla([])
    setMapeo({})
    setPrevia(null)
    onCerrar()
  }, [onCerrar])

  const seleccionarArchivo = async (elegido: File) => {
    setOcupado(true)
    try {
      const abierto = await lectorTabular.abrir(elegido)
      setArchivo(abierto)
      setHoja(abierto.hojas[0] ?? '')
      setFilaEncabezado(1)
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
      const cabecera = filas[filaEncabezado - 1] ?? []
      setRejilla(filas)
      setEncabezados(cabecera)
      setMapeo(detectarColumnas(cabecera, CAMPOS_VENTAS))
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
      setPrevia(analizarVentas(rejilla, mapeo, filaEncabezado, clientes))
      setPaso(3)
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo analizar el archivo', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const nombreColumna = (clave: string) => {
    const indice = mapeo[clave]
    return indice == null ? undefined : (encabezados[indice] ?? undefined)
  }

  const aplicar = async () => {
    if (!previa || !archivo) return
    setOcupado(true)
    try {
      const registro: MapeoColumnas = {
        hoja,
        filaEncabezado,
        colCliente: nombreColumna('nombre') ?? '',
        colValor: nombreColumna('valor') ?? '',
        colPeriodo: nombreColumna('periodo'),
        colFecha: nombreColumna('fecha'),
        colIdentificacion: nombreColumna('identificacion'),
        colMunicipio: nombreColumna('municipio'),
        colCategoria: nombreColumna('categoria'),
        colProducto: nombreColumna('producto'),
        colUnidades: nombreColumna('cantidad'),
        colValorUnitario: nombreColumna('valorUnitario'),
      }
      const resultado = await aplicarVentas(repositorios, previa, archivo.nombre, registro)
      mostrar(
        `${formatearNumero(previa.filasAplicadas)} ventas importadas` +
          (resultado.clientesCreados > 0
            ? ` · ${formatearNumero(resultado.clientesCreados)} clientes nuevos`
            : ''),
        'exito',
      )
      cerrar()
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo aplicar la importación', 'error')
    } finally {
      setOcupado(false)
    }
  }

  const faltantes = faltantesVentas(mapeo)

  return (
    <PanelLateral
      abierto={abierto}
      titulo="Importar ventas"
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
            <Boton variante="primario" disabled={!archivo || ocupado} onClick={() => void irAMapeo()}>
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
              disabled={ocupado || !previa || previa.filasAplicadas === 0}
              onClick={() => void aplicar()}
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
              {archivo ? archivo.nombre : 'Selecciona el archivo de ventas'}
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
              <Campo etiqueta="Hoja" htmlFor="hoja-ventas">
                <Seleccion
                  id="hoja-ventas"
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
                htmlFor="fila-encabezado-ventas"
                ayuda="La fila donde están los títulos de columna"
              >
                <Entrada
                  id="fila-encabezado-ventas"
                  type="number"
                  min={1}
                  value={filaEncabezado}
                  onChange={(evento) => setFilaEncabezado(Math.max(1, Number(evento.target.value)))}
                />
              </Campo>
            </div>
          ) : (
            <p className="text-sm text-suave">
              Sirve tanto el archivo detallado, una fila por línea de factura, como el agregado por
              cliente y mes. El archivo se lee en tu equipo y no se envía a ningún servidor.
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
            {CAMPOS_VENTAS.map((campo) => (
              <Campo key={campo.clave} etiqueta={campo.etiqueta} htmlFor={`mapeo-${campo.clave}`}>
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
          <p className="text-sm text-suave">
            Archivo{' '}
            <strong className="font-medium text-texto">
              {previa.modo === 'detallado' ? 'detallado, línea a línea' : 'agregado por cliente y mes'}
            </strong>
            .{' '}
            {previa.modo === 'detallado'
              ? 'Se guardará cada línea, y el total de cada mes se calculará a partir de ellas.'
              : 'Se guardará el total de cada cliente y mes.'}
          </p>

          <div className="grid grid-cols-4 gap-2">
            <Contador valor={formatearNumero(previa.totalFilas)} etiqueta="Filas leídas" />
            <Contador
              valor={formatearNumero(previa.filasAplicadas)}
              etiqueta="Se van a aplicar"
              tono="text-acento"
            />
            <Contador valor={formatearPesos(previa.valorTotal)} etiqueta="Venta total" />
            <Contador
              valor={formatearNumero(previa.errores.length)}
              etiqueta="Con error"
              tono={previa.errores.length > 0 ? 'text-alerta' : undefined}
            />
          </div>

          <div className="rounded-panel border border-borde bg-superficie px-4 py-3">
            <p className="text-sm font-medium text-texto">
              Se reemplazan {previa.periodos.length}{' '}
              {previa.periodos.length === 1 ? 'periodo' : 'periodos'}
            </p>
            <p className="mt-1 text-xs text-suave">
              {previa.periodos.map(formatearPeriodo).join(' · ')}
            </p>
            <p className="mt-2 text-xs text-tenue">
              Lo que ya hubiera en esos meses se sustituye por el archivo. Reimportar corrige, no
              duplica.
            </p>
          </div>

          {previa.clientesPorCrear.length > 0 ? (
            <div className="rounded-panel border border-borde bg-superficie-alt px-4 py-3">
              <p className="mb-1.5 text-sm font-medium text-texto">
                {formatearNumero(previa.clientesPorCrear.length)} clientes del archivo no están en tu
                cartera y se van a crear
              </p>
              <ul className="flex max-h-32 flex-col gap-0.5 overflow-y-auto text-xs text-suave">
                {previa.clientesPorCrear.map((cliente) => (
                  <li key={cliente.clave}>
                    {cliente.datos.nombre}
                    <span className="cifra ml-1.5 text-tenue">{cliente.clave}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-suave">
              <CheckCircle2 className="size-4 text-exito" aria-hidden="true" />
              Todos los clientes del archivo ya están en tu cartera.
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
