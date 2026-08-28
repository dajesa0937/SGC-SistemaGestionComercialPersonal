import { useMemo, useState } from 'react'
import { Download, FileUp, Plus, Printer, Users } from 'lucide-react'
import type { ClienteEnriquecido } from '@/domain/cliente/cliente.entity'
import { hayFiltrosActivos } from '@/application/clientes/filtrarClientes'
import { formatearPeriodoCorto } from '@/domain/shared/periodo'
import { paginar } from '@/lib/paginacion'
import { formatearPesos, formatearVariacion } from '@/lib/formato'
import { aCsv } from '@/lib/csv'
import { descargarCsv, nombreConFecha } from '@/lib/descargar'
import { Badge } from '@/presentation/components/shared/Badge'
import { Boton } from '@/presentation/components/shared/Boton'
import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { EstadoVacio } from '@/presentation/components/shared/EstadoVacio'
import { MiniGrafica } from '@/presentation/components/shared/MiniGrafica'
import { TablaDatos, type ColumnaTabla } from '@/presentation/components/shared/TablaDatos'
import { useHojaImpresion } from '@/presentation/components/shared/HojaImpresion'
import { ListaImprimible } from '../reportes/ListaImprimible'
import { useClientes } from '@/presentation/hooks/data/useClientes'
import { useFiltrosClientes } from '@/presentation/hooks/ui/useFiltrosClientes'
import { usePeriodoSeleccionado } from '@/presentation/hooks/ui/contexto-periodo'
import { AsistenteMaestro } from './AsistenteMaestro'
import { BarraFiltros } from './BarraFiltros'
import { FichaCliente } from './FichaCliente'
import { FormularioCliente } from './FormularioCliente'
import { ETIQUETA_ABC, ETIQUETA_ESTADO, TONO_ESTADO } from './etiquetas'

const POR_PAGINA = 25

export default function PaginaClientes() {
  const { periodo } = usePeriodoSeleccionado()
  const { filtros, pagina, actualizar, limpiar, alternarOrden } = useFiltrosClientes()
  const { visibles, zonas, departamentos, cargando, totalSinFiltrar, sinVentas } =
    useClientes(filtros)

  const [enFicha, setEnFicha] = useState<ClienteEnriquecido | null>(null)
  const [editando, setEditando] = useState<ClienteEnriquecido | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [importando, setImportando] = useState(false)
  const { imprimir, portal } = useHojaImpresion()

  const paginaActual = useMemo(() => paginar(visibles, pagina, POR_PAGINA), [visibles, pagina])
  const conFiltros = hayFiltrosActivos(filtros)

  // Se imprime y se exporta lo FILTRADO completo, no solo la página visible:
  // quien filtró por "en riesgo" quiere las veintitrés filas, no las primeras
  // veinticinco de la tabla.
  const descripcionFiltros = [
    filtros.texto ? `búsqueda "${filtros.texto}"` : null,
    filtros.zona ? `zona ${zonas.find((z) => z.valor === filtros.zona)?.etiqueta ?? ''}` : null,
    filtros.departamento
      ? `departamento ${departamentos.find((d) => d.valor === filtros.departamento)?.etiqueta ?? ''}`
      : null,
    filtros.estado ? `estado ${ETIQUETA_ESTADO[filtros.estado]}` : null,
    filtros.clasificacion ? `clase ${filtros.clasificacion}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const exportarCsv = () => {
    const filas: (string | number)[][] = [
      ['Identificacion', 'Codigo', 'Cliente', 'Zona', 'Municipio', 'Departamento', 'Telefono', 'Correo', 'ABC', 'Estado', 'Venta mes', 'Venta ano', 'Ultima compra'],
      ...visibles.map((c) => [
        c.identificacion ?? '',
        c.codigo,
        c.nombre,
        c.zona ?? '',
        c.nombreMunicipio ?? '',
        c.departamento ?? '',
        c.telefono ?? '',
        c.email ?? '',
        ETIQUETA_ABC[c.clasificacion],
        ETIQUETA_ESTADO[c.estado],
        c.ventaPeriodo,
        c.ventaAnio,
        c.ultimaCompra ?? '',
      ]),
    ]
    descargarCsv(nombreConFecha('clientes', 'csv'), aCsv(filas))
  }

  const abrirNuevo = () => {
    setEditando(null)
    setFormularioAbierto(true)
  }

  const editarDesdeFicha = (cliente: ClienteEnriquecido) => {
    setEnFicha(null)
    setEditando(cliente)
    setFormularioAbierto(true)
  }

  const columnas: ColumnaTabla<ClienteEnriquecido>[] = [
    {
      clave: 'nombre',
      encabezado: 'Cliente',
      ordenable: true,
      render: (cliente) => (
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-texto">{cliente.nombre}</p>
            <p className="cifra truncate text-xs text-tenue">
              {cliente.identificacion ?? cliente.codigo}
              {cliente.nombreMunicipio ? ` · ${cliente.nombreMunicipio}` : ''}
              {cliente.zona ? ` · ${cliente.zona}` : ''}
            </p>
          </div>
          {cliente.archivado ? <Badge tono="alerta">Archivado</Badge> : null}
        </div>
      ),
    },
    {
      clave: 'abc',
      encabezado: 'ABC',
      ancho: '64px',
      render: (cliente) => (
        <Badge tono={cliente.clasificacion === 'A' ? 'acento' : 'neutro'}>
          {ETIQUETA_ABC[cliente.clasificacion]}
        </Badge>
      ),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      ancho: '110px',
      render: (cliente) => (
        <Badge tono={TONO_ESTADO[cliente.estado]}>{ETIQUETA_ESTADO[cliente.estado]}</Badge>
      ),
    },
    {
      clave: 'ventaPeriodo',
      encabezado: formatearPeriodoCorto(periodo),
      ordenable: true,
      alineacion: 'derecha',
      ancho: '150px',
      render: (cliente) =>
        cliente.ventaPeriodo === 0 ? (
          <span className="text-tenue">—</span>
        ) : (
          <div>
            <p className="text-texto">{formatearPesos(cliente.ventaPeriodo)}</p>
            {cliente.variacionMesAnterior !== null ? (
              <p
                className={
                  'text-xs ' +
                  (cliente.variacionMesAnterior >= 0 ? 'text-exito' : 'text-peligro')
                }
              >
                {formatearVariacion(cliente.variacionMesAnterior)}
              </p>
            ) : null}
          </div>
        ),
    },
    {
      clave: 'ventaAnio',
      encabezado: 'Año',
      ordenable: true,
      alineacion: 'derecha',
      ancho: '140px',
      render: (cliente) =>
        cliente.ventaAnio === 0 ? (
          <span className="text-tenue">—</span>
        ) : (
          <span className="text-suave">{formatearPesos(cliente.ventaAnio)}</span>
        ),
    },
    {
      clave: 'ultimaCompra',
      encabezado: 'Últ. compra',
      ordenable: true,
      ancho: '110px',
      render: (cliente) => (
        <span className="cifra text-suave">
          {cliente.ultimaCompra ? formatearPeriodoCorto(cliente.ultimaCompra) : '—'}
        </span>
      ),
    },
    {
      clave: 'tendencia',
      encabezado: 'Tendencia',
      ancho: '90px',
      noImprimir: true,
      render: (cliente) => (
        <MiniGrafica
          valores={cliente.serie12Meses}
          titulo={`Tendencia de ${cliente.nombre} en los últimos 12 meses`}
        />
      ),
    },
  ]

  return (
    <>
      {portal}

      <EncabezadoPagina
        titulo="Clientes"
        descripcion={
          cargando ? 'Cargando la cartera…' : `${totalSinFiltrar} clientes activos en el territorio`
        }
        acciones={
          <>
            <Boton onClick={exportarCsv} disabled={visibles.length === 0} title="Exportar lo filtrado a CSV">
              <Download className="size-4" aria-hidden="true" />
              CSV
            </Boton>
            <Boton
              disabled={visibles.length === 0}
              title="Imprimir la lista con los filtros actuales"
              onClick={() =>
                imprimir(
                  <ListaImprimible
                    clientes={visibles}
                    periodo={periodo}
                    descripcionFiltros={descripcionFiltros || 'Sin filtros aplicados'}
                  />,
                )
              }
            >
              <Printer className="size-4" aria-hidden="true" />
              Imprimir
            </Boton>
            <Boton onClick={() => setImportando(true)}>
              <FileUp className="size-4" aria-hidden="true" />
              Importar
            </Boton>
            <Boton variante="primario" onClick={abrirNuevo}>
              <Plus className="size-4" aria-hidden="true" />
              Nuevo cliente
            </Boton>
          </>
        }
      />

      <BarraFiltros
        filtros={filtros}
        zonas={zonas}
        departamentos={departamentos}
        hayFiltros={conFiltros}
        onCambiar={actualizar}
        onLimpiar={limpiar}
      />

      {!cargando && totalSinFiltrar === 0 && !conFiltros ? (
        <EstadoVacio
          icono={Users}
          titulo="Todavía no hay clientes"
          descripcion="Puedes crearlos uno a uno o importar el maestro completo desde un archivo de Excel."
          accion={
            <div className="flex gap-2">
              <Boton onClick={() => setImportando(true)}>
                <FileUp className="size-4" aria-hidden="true" />
                Importar desde Excel
              </Boton>
              <Boton variante="primario" onClick={abrirNuevo}>
                <Plus className="size-4" aria-hidden="true" />
                Nuevo cliente
              </Boton>
            </div>
          }
        />
      ) : !cargando && paginaActual.totalItems === 0 ? (
        <EstadoVacio
          icono={Users}
          titulo="Ningún cliente coincide"
          descripcion="Prueba con otros términos de búsqueda o quita los filtros aplicados."
          accion={<Boton onClick={limpiar}>Limpiar filtros</Boton>}
        />
      ) : (
        <>
          <TablaDatos
            columnas={columnas}
            pagina={paginaActual}
            claveDe={(cliente) => cliente.id}
            onFila={setEnFicha}
            orden={filtros.orden}
            direccion={filtros.direccion}
            onOrdenar={alternarOrden}
            onCambiarPagina={(p) => actualizar({ pagina: p })}
            etiquetaItems="clientes"
          />
          {sinVentas ? (
            <p className="mt-3 text-sm text-tenue no-imprimir">
              Las columnas de venta, la clasificación ABC y el estado aparecen en cuanto registres
              ventas.
            </p>
          ) : null}
        </>
      )}

      <FichaCliente cliente={enFicha} onCerrar={() => setEnFicha(null)} onEditar={editarDesdeFicha} />

      <FormularioCliente
        abierto={formularioAbierto}
        cliente={editando}
        onCerrar={() => setFormularioAbierto(false)}
      />

      <AsistenteMaestro abierto={importando} onCerrar={() => setImportando(false)} />
    </>
  )
}
