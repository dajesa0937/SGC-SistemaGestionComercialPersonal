import { etiquetaMunicipio } from '@/domain/geografia/geografia'
import { useMemo, useState } from 'react'
import { Download, FileText, Printer, User, Users } from 'lucide-react'
import { formatearPeriodo, formatearPeriodoCorto } from '@/domain/shared/periodo'
import { aCsv } from '@/lib/csv'
import { descargarCsv, nombreConFecha } from '@/lib/descargar'
import { formatearPesos } from '@/lib/formato'
import { Boton } from '@/presentation/components/shared/Boton'
import { Seleccion } from '@/presentation/components/shared/Campo'
import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { EstadoVacio } from '@/presentation/components/shared/EstadoVacio'
import { useHojaImpresion } from '@/presentation/components/shared/HojaImpresion'
import { useNotas, useVentasCliente } from '@/presentation/hooks/data/useClientes'
import { useResumen } from '@/presentation/hooks/data/useResumen'
import { usePeriodoSeleccionado } from '@/presentation/hooks/ui/contexto-periodo'
import { ETIQUETA_ABC, ETIQUETA_ESTADO } from '../clientes/etiquetas'
import { FichaImprimible } from './FichaImprimible'
import { InformeMensual } from './InformeMensual'
import { ListaImprimible } from './ListaImprimible'

type Reporte = 'mensual' | 'cartera' | 'ficha'

const REPORTES: ReadonlyArray<{ clave: Reporte; titulo: string; descripcion: string; icono: typeof FileText }> = [
  {
    clave: 'mensual',
    titulo: 'Informe mensual de gestión',
    descripcion: 'Cumplimiento, proyección, cobertura, top de clientes y alertas.',
    icono: FileText,
  },
  {
    clave: 'cartera',
    titulo: 'Cartera de clientes',
    descripcion: 'Listado completo con clasificación, estado y ventas.',
    icono: Users,
  },
  {
    clave: 'ficha',
    titulo: 'Ficha de cliente',
    descripcion: 'Una hoja con todo lo del cliente, para llevar a la visita.',
    icono: User,
  },
]

export default function PaginaReportes() {
  const { periodo } = usePeriodoSeleccionado()
  const resumen = useResumen()
  const { imprimir, portal } = useHojaImpresion()

  const [reporte, setReporte] = useState<Reporte>('mensual')
  const [clienteId, setClienteId] = useState('')

  const clientes = useMemo(
    () => (resumen?.clientes ?? []).filter((c) => !c.archivado),
    [resumen],
  )
  const cliente = clientes.find((c) => c.id === clienteId)
  const ventasCliente = useVentasCliente(cliente?.id ?? null)
  const notasCliente = useNotas(cliente?.id ?? null)

  if (!resumen) {
    return (
      <>
        <EncabezadoPagina titulo="Reportes" />
        <p className="text-sm text-tenue">Cargando…</p>
      </>
    )
  }

  if (resumen.sinDatos && reporte === 'mensual') {
    return (
      <>
        <EncabezadoPagina titulo="Reportes" descripcion="Informes para imprimir o guardar en PDF." />
        <EstadoVacio
          icono={FileText}
          titulo="Todavía no hay nada que reportar"
          descripcion="El informe mensual se arma con las ventas del periodo. Regístralas y vuelve aquí."
        />
      </>
    )
  }

  const descripcionFiltros = `Todos los clientes activos · ${formatearPeriodoCorto(periodo)}`

  const documento =
    reporte === 'mensual' ? (
      <InformeMensual resumen={resumen} />
    ) : reporte === 'cartera' ? (
      <ListaImprimible
        clientes={clientes}
        periodo={periodo}
        descripcionFiltros={descripcionFiltros}
      />
    ) : cliente ? (
      <FichaImprimible
        cliente={cliente}
        ventas={ventasCliente ?? []}
        notas={notasCliente ?? []}
        periodo={periodo}
      />
    ) : null

  const exportarCsv = () => {
    const filas: (string | number)[][] =
      reporte === 'mensual'
        ? [
            ['Mes', 'Vendido', 'Meta', 'Cumplimiento'],
            ...resumen.serie.map((p) => [
              p.etiqueta,
              p.vendido,
              p.meta ?? '',
              p.cumplimiento === null ? '' : Math.round(p.cumplimiento * 1000) / 10,
            ]),
          ]
        : [
            ['Codigo', 'Cliente', 'Zona', 'Ciudad', 'Telefono', 'ABC', 'Estado', 'Venta mes', 'Venta ano', 'Ultima compra'],
            ...clientes.map((c) => [
              c.codigo,
              c.nombre,
              c.zona ?? '',
              etiquetaMunicipio(c.municipio),
              c.telefono ?? '',
              ETIQUETA_ABC[c.clasificacion],
              ETIQUETA_ESTADO[c.estado],
              c.ventaPeriodo,
              c.ventaAnio,
              c.ultimaCompra ?? '',
            ]),
          ]

    descargarCsv(
      nombreConFecha(reporte === 'mensual' ? 'informe-mensual' : 'cartera-clientes', 'csv'),
      aCsv(filas),
    )
  }

  return (
    <>
      {portal}

      <EncabezadoPagina
        titulo="Reportes"
        descripcion={`Lo que ves aquí es exactamente lo que se imprime · ${formatearPeriodo(periodo)}`}
        acciones={
          <>
            <Boton onClick={exportarCsv} disabled={reporte === 'ficha'}>
              <Download className="size-4" aria-hidden="true" />
              CSV
            </Boton>
            <Boton
              variante="primario"
              disabled={documento === null}
              onClick={() => documento && imprimir(documento)}
            >
              <Printer className="size-4" aria-hidden="true" />
              Imprimir o guardar en PDF
            </Boton>
          </>
        }
      />

      <div className="mb-5 grid gap-3 lg:grid-cols-3 no-imprimir">
        {REPORTES.map((item) => {
          const Icono = item.icono
          const activo = reporte === item.clave
          return (
            <button
              key={item.clave}
              type="button"
              onClick={() => setReporte(item.clave)}
              aria-pressed={activo}
              className={
                'rounded-panel border px-4 py-3 text-left transition-colors duration-150 ' +
                (activo
                  ? 'border-acento bg-acento-suave'
                  : 'border-borde bg-superficie hover:bg-superficie-alt')
              }
            >
              <Icono
                className={'mb-2 size-4 ' + (activo ? 'text-acento' : 'text-tenue')}
                aria-hidden="true"
              />
              <p className={'text-sm font-medium ' + (activo ? 'text-acento-fuerte' : 'text-texto')}>
                {item.titulo}
              </p>
              <p className="mt-0.5 text-xs text-suave">{item.descripcion}</p>
            </button>
          )
        })}
      </div>

      {reporte === 'ficha' ? (
        <div className="mb-4 flex max-w-md items-center gap-2 no-imprimir">
          <label className="sr-only" htmlFor="cliente-ficha">
            Cliente
          </label>
          <Seleccion
            id="cliente-ficha"
            value={clienteId}
            onChange={(evento) => setClienteId(evento.target.value)}
          >
            <option value="">Elige un cliente…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {formatearPesos(c.ventaAnio)} en el año
              </option>
            ))}
          </Seleccion>
        </div>
      ) : null}

      {documento === null ? (
        <EstadoVacio
          icono={User}
          titulo="Elige un cliente"
          descripcion="La ficha se genera para el cliente que selecciones arriba."
        />
      ) : (
        <div className="flex justify-center">
          <div className="marco-hoja">{documento}</div>
        </div>
      )}
    </>
  )
}
