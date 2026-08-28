import { useState } from 'react'
import { Pencil, Plus, Printer, Trash2 } from 'lucide-react'
import type { ClienteEnriquecido } from '@/domain/cliente/cliente.entity'
import { formatearPeriodo, formatearPeriodoCorto, ultimosPeriodos } from '@/domain/shared/periodo'
import { hoyISO } from '@/domain/shared/types'
import { formatearFecha, formatearPesos, formatearVariacion } from '@/lib/formato'
import { aY, ticksBonitos } from '@/lib/escala'
import { Badge } from '@/presentation/components/shared/Badge'
import { Boton } from '@/presentation/components/shared/Boton'
import { Entrada } from '@/presentation/components/shared/Campo'
import { PanelLateral } from '@/presentation/components/shared/PanelLateral'
import { useHojaImpresion } from '@/presentation/components/shared/HojaImpresion'
import { FichaImprimible } from '../reportes/FichaImprimible'
import { useNotas, useVentasCliente } from '@/presentation/hooks/data/useClientes'
import { useRepositorios } from '@/presentation/hooks/data/contexto-repositorios'
import { usePeriodoSeleccionado } from '@/presentation/hooks/ui/contexto-periodo'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'
import { ETIQUETA_ABC, ETIQUETA_ESTADO, TONO_ESTADO } from './etiquetas'

type Pestana = 'resumen' | 'historico' | 'notas' | 'datos'

const PESTANAS: ReadonlyArray<{ clave: Pestana; titulo: string }> = [
  { clave: 'resumen', titulo: 'Resumen' },
  { clave: 'historico', titulo: 'Histórico' },
  { clave: 'notas', titulo: 'Notas' },
  { clave: 'datos', titulo: 'Datos' },
]

interface Props {
  cliente: ClienteEnriquecido | null
  onCerrar: () => void
  onEditar: (cliente: ClienteEnriquecido) => void
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  return (
    <div className="border-b border-borde-suave py-2 last:border-b-0">
      <p className="text-xs text-tenue">{etiqueta}</p>
      <p className="mt-0.5 text-sm text-texto">{valor?.trim() ? valor : '—'}</p>
    </div>
  )
}

function Metrica({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-md border border-borde bg-superficie px-3 py-2.5">
      <p className="text-xs tracking-wide text-tenue uppercase">{etiqueta}</p>
      <p className="cifra mt-1 text-base font-semibold text-texto">{valor}</p>
      {nota ? <p className="mt-0.5 text-xs text-suave">{nota}</p> : null}
    </div>
  )
}

/** Barras de los doce meses. Mismo criterio que el panel: SVG propio, sin librería. */
function BarrasDoceMeses({ serie, periodo }: { serie: readonly number[]; periodo: string }) {
  const ANCHO = 400
  const ALTO = 96
  const etiquetas = ultimosPeriodos(periodo, 12)
  const { tope } = ticksBonitos(Math.max(0, ...serie), 2)
  const paso = ANCHO / Math.max(1, serie.length)

  if (serie.every((v) => v === 0)) {
    return <p className="py-6 text-center text-sm text-tenue">Sin compras en los últimos 12 meses</p>
  }

  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO + 16}`}
      className="w-full"
      role="img"
      aria-label="Compras de los últimos doce meses"
    >
      {serie.map((valor, i) => {
        const y = aY(valor, tope, ALTO)
        return (
          <g key={etiquetas[i] ?? i}>
            {valor > 0 ? (
              <rect
                x={paso * i + paso * 0.2}
                y={y}
                width={paso * 0.6}
                height={Math.max(2, ALTO - y)}
                rx={3}
                fill="var(--sgc-acento)"
              />
            ) : null}
            <text
              x={paso * i + paso / 2}
              y={ALTO + 12}
              textAnchor="middle"
              fill="var(--sgc-texto-tenue)"
              fontSize={9}
            >
              {(etiquetas[i] ?? '').slice(5)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function FichaCliente({ cliente, onCerrar, onEditar }: Props) {
  const { periodo } = usePeriodoSeleccionado()
  const repositorios = useRepositorios()
  const { mostrar } = useAvisos()
  const [pestana, setPestana] = useState<Pestana>('resumen')
  const [nuevaNota, setNuevaNota] = useState('')
  const { imprimir, portal } = useHojaImpresion()

  const notas = useNotas(cliente?.id ?? null)
  const ventas = useVentasCliente(cliente?.id ?? null)

  if (!cliente) return null

  const agregarNota = async () => {
    const texto = nuevaNota.trim()
    if (texto === '') return
    try {
      await repositorios.clientes.crearNota({
        clienteId: cliente.id,
        fecha: hoyISO(),
        texto,
        tipo: 'general',
      })
      setNuevaNota('')
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo guardar la nota', 'error')
    }
  }

  return (
    <>
      {portal}
      <PanelLateral
      abierto
      ancho="lg"
      titulo={cliente.nombre}
      subtitulo={`${cliente.codigo}${cliente.zona ? ` · ${cliente.zona}` : ''}`}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton
            variante="fantasma"
            className="mr-auto"
            onClick={() =>
              imprimir(
                <FichaImprimible
                  cliente={cliente}
                  ventas={ventas ?? []}
                  notas={notas ?? []}
                  periodo={periodo}
                />,
              )
            }
          >
            <Printer className="size-4" aria-hidden="true" />
            Imprimir ficha
          </Boton>
          <Boton onClick={onCerrar}>Cerrar</Boton>
          <Boton variante="primario" onClick={() => onEditar(cliente)}>
            <Pencil className="size-4" aria-hidden="true" />
            Editar
          </Boton>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tono={cliente.clasificacion === 'A' ? 'acento' : 'neutro'}>
          Clase {ETIQUETA_ABC[cliente.clasificacion]}
        </Badge>
        <Badge tono={TONO_ESTADO[cliente.estado]}>{ETIQUETA_ESTADO[cliente.estado]}</Badge>
        {cliente.archivado ? <Badge tono="alerta">Archivado</Badge> : null}
      </div>

      <div role="tablist" className="mb-4 flex gap-1 border-b border-borde no-imprimir">
        {PESTANAS.map((item) => (
          <button
            key={item.clave}
            type="button"
            role="tab"
            aria-selected={pestana === item.clave}
            onClick={() => setPestana(item.clave)}
            className={
              '-mb-px border-b-2 px-3 py-2 text-sm transition-colors duration-150 ' +
              (pestana === item.clave
                ? 'border-acento font-medium text-acento'
                : 'border-transparent text-suave hover:text-texto')
            }
          >
            {item.titulo}
          </button>
        ))}
      </div>

      {pestana === 'resumen' ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2.5">
            <Metrica
              etiqueta={formatearPeriodoCorto(periodo)}
              valor={formatearPesos(cliente.ventaPeriodo)}
              nota={
                cliente.variacionMesAnterior === null
                  ? 'Sin mes anterior para comparar'
                  : `${formatearVariacion(cliente.variacionMesAnterior)} vs. mes anterior`
              }
            />
            <Metrica
              etiqueta="Año en curso"
              valor={formatearPesos(cliente.ventaAnio)}
              nota={
                cliente.variacionAnioAnterior === null
                  ? 'Sin año anterior para comparar'
                  : `${formatearVariacion(cliente.variacionAnioAnterior)} vs. mismo mes del año pasado`
              }
            />
            <Metrica
              etiqueta="Últimos 12 meses"
              valor={formatearPesos(cliente.venta12Meses)}
              nota="Base de la clasificación ABC"
            />
            <Metrica
              etiqueta="Última compra"
              valor={cliente.ultimaCompra ? formatearPeriodo(cliente.ultimaCompra) : 'Nunca'}
              nota={
                cliente.primeraCompra
                  ? `Primera compra en ${formatearPeriodo(cliente.primeraCompra)}`
                  : 'Sin historial de compras'
              }
            />
          </div>

          <div className="rounded-md border border-borde bg-superficie p-3">
            <p className="mb-2 text-xs tracking-wide text-tenue uppercase">Últimos 12 meses</p>
            <BarrasDoceMeses serie={cliente.serie12Meses} periodo={periodo} />
          </div>
        </div>
      ) : null}

      {pestana === 'historico' ? (
        ventas === undefined ? (
          <p className="text-sm text-tenue">Cargando…</p>
        ) : ventas.length === 0 ? (
          <p className="py-8 text-center text-sm text-tenue">
            Este cliente no tiene compras registradas.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-borde">
                <th className="py-2 text-left text-xs font-medium tracking-wide text-tenue uppercase">
                  Periodo
                </th>
                <th className="py-2 text-right text-xs font-medium tracking-wide text-tenue uppercase">
                  Venta
                </th>
                <th className="py-2 text-right text-xs font-medium tracking-wide text-tenue uppercase">
                  Origen
                </th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => (
                <tr key={venta.id} className="border-b border-borde-suave last:border-b-0">
                  <td className="py-1.5 text-texto">{formatearPeriodo(venta.periodo)}</td>
                  <td className="cifra py-1.5 text-right text-texto">
                    {formatearPesos(venta.valor)}
                  </td>
                  <td className="py-1.5 text-right text-xs text-tenue">
                    {venta.origen === 'manual' ? 'manual' : 'importado'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : null}

      {pestana === 'notas' ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 no-imprimir">
            <label className="sr-only" htmlFor="nueva-nota">
              Nueva nota
            </label>
            <Entrada
              id="nueva-nota"
              value={nuevaNota}
              placeholder="Qué se habló, qué quedó pendiente…"
              onChange={(evento) => setNuevaNota(evento.target.value)}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter') void agregarNota()
              }}
            />
            <Boton variante="primario" onClick={() => void agregarNota()} disabled={nuevaNota.trim() === ''}>
              <Plus className="size-4" aria-hidden="true" />
              Agregar
            </Boton>
          </div>

          {notas === undefined ? (
            <p className="text-sm text-tenue">Cargando…</p>
          ) : notas.length === 0 ? (
            <p className="py-8 text-center text-sm text-tenue">
              Todavía no hay notas. Lo que no se escribe se olvida.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {notas.map((nota) => (
                <li
                  key={nota.id}
                  className="group flex items-start justify-between gap-3 rounded-md border border-borde bg-superficie px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-tenue">{formatearFecha(nota.fecha)}</p>
                    <p className="mt-0.5 text-sm break-words text-texto">{nota.texto}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Eliminar nota"
                    onClick={() => void repositorios.clientes.eliminarNota(nota.id)}
                    className="shrink-0 text-tenue opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:text-peligro focus-visible:opacity-100 no-imprimir"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {pestana === 'datos' ? (
        <div className="flex flex-col">
          <Dato etiqueta="Razón social" valor={cliente.nombre} />
          <Dato etiqueta="Nombre comercial" valor={cliente.nombreComercial} />
          <Dato etiqueta="Código" valor={cliente.codigo} />
          <Dato etiqueta="NIT" valor={cliente.nit} />
          <Dato etiqueta="Zona" valor={cliente.zona} />
          <Dato etiqueta="Ciudad" valor={cliente.ciudad} />
          <Dato etiqueta="Dirección" valor={cliente.direccion} />
          <Dato etiqueta="Teléfono" valor={cliente.telefono} />
          <Dato etiqueta="Correo" valor={cliente.email} />
          <Dato etiqueta="Contacto principal" valor={cliente.contactoPrincipal} />
          <Dato
            etiqueta="Estado asignado"
            valor={
              cliente.estadoManual === 'cliente'
                ? 'Cliente'
                : cliente.estadoManual === 'prospecto'
                  ? 'Prospecto'
                  : 'Suspendido'
            }
          />
        </div>
      ) : null}
    </PanelLateral>
    </>
  )
}
