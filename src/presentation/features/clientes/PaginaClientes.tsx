import { useMemo, useState } from 'react'
import { FileUp, Plus, Printer, Users } from 'lucide-react'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import { hayFiltrosActivos } from '@/application/clientes/filtrarClientes'
import { paginar } from '@/lib/paginacion'
import { Badge } from '@/presentation/components/shared/Badge'
import { Boton } from '@/presentation/components/shared/Boton'
import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { EstadoVacio } from '@/presentation/components/shared/EstadoVacio'
import { TablaDatos, type ColumnaTabla } from '@/presentation/components/shared/TablaDatos'
import { useClientes } from '@/presentation/hooks/data/useClientes'
import { useFiltrosClientes } from '@/presentation/hooks/ui/useFiltrosClientes'
import { AsistenteMaestro } from './AsistenteMaestro'
import { BarraFiltros } from './BarraFiltros'
import { FormularioCliente } from './FormularioCliente'

const POR_PAGINA = 25

const ETIQUETA_ESTADO: Record<Cliente['estadoManual'], string> = {
  cliente: 'Cliente',
  prospecto: 'Prospecto',
  suspendido: 'Suspendido',
}

export default function PaginaClientes() {
  const { filtros, pagina, actualizar, limpiar, alternarOrden } = useFiltrosClientes()
  const { visibles, zonas, cargando, totalSinFiltrar } = useClientes(filtros)

  const [editando, setEditando] = useState<Cliente | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [importando, setImportando] = useState(false)

  const paginaActual = useMemo(() => paginar(visibles, pagina, POR_PAGINA), [visibles, pagina])
  const conFiltros = hayFiltrosActivos(filtros)

  const abrirNuevo = () => {
    setEditando(null)
    setFormularioAbierto(true)
  }

  const abrirEdicion = (cliente: Cliente) => {
    setEditando(cliente)
    setFormularioAbierto(true)
  }

  const columnas: ColumnaTabla<Cliente>[] = [
    {
      clave: 'nombre',
      encabezado: 'Cliente',
      ordenable: true,
      render: (cliente) => (
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-texto">{cliente.nombre}</p>
            {cliente.nombreComercial ? (
              <p className="truncate text-xs text-tenue">{cliente.nombreComercial}</p>
            ) : null}
          </div>
          {cliente.archivado ? <Badge tono="alerta">Archivado</Badge> : null}
        </div>
      ),
    },
    {
      clave: 'codigo',
      encabezado: 'Código',
      ordenable: true,
      ancho: '110px',
      render: (cliente) => <span className="cifra text-suave">{cliente.codigo}</span>,
    },
    {
      clave: 'zona',
      encabezado: 'Zona',
      ordenable: true,
      ancho: '140px',
      render: (cliente) => <span className="text-suave">{cliente.zona ?? '—'}</span>,
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      ancho: '120px',
      render: (cliente) => (
        <Badge tono={cliente.estadoManual === 'cliente' ? 'acento' : 'neutro'}>
          {ETIQUETA_ESTADO[cliente.estadoManual]}
        </Badge>
      ),
    },
    {
      clave: 'contacto',
      encabezado: 'Contacto',
      render: (cliente) => (
        <span className="text-suave">
          {cliente.telefono ?? cliente.contactoPrincipal ?? cliente.email ?? '—'}
        </span>
      ),
    },
  ]

  return (
    <>
      <EncabezadoPagina
        titulo="Clientes"
        descripcion={
          cargando
            ? 'Cargando la cartera…'
            : `${totalSinFiltrar} clientes activos en el territorio`
        }
        acciones={
          <>
            <Boton onClick={() => window.print()} title="Imprimir la lista con los filtros actuales">
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

      {/* Encabezado que solo aparece en papel, para que la hoja se explique sola. */}
      <div className="solo-impresion mb-4">
        <p className="text-sm">
          Cartera de clientes · {paginaActual.totalItems} registros
          {filtros.zona ? ` · zona ${filtros.zona}` : ''}
          {filtros.texto ? ` · búsqueda "${filtros.texto}"` : ''}
        </p>
      </div>

      <BarraFiltros
        filtros={filtros}
        zonas={zonas}
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
        <TablaDatos
          columnas={columnas}
          pagina={paginaActual}
          claveDe={(cliente) => cliente.id}
          onFila={abrirEdicion}
          orden={filtros.orden}
          direccion={filtros.direccion}
          onOrdenar={alternarOrden}
          onCambiarPagina={(p) => actualizar({ pagina: p })}
          etiquetaItems="clientes"
        />
      )}

      <FormularioCliente
        abierto={formularioAbierto}
        cliente={editando}
        zonasSugeridas={zonas}
        onCerrar={() => setFormularioAbierto(false)}
      />

      <AsistenteMaestro abierto={importando} onCerrar={() => setImportando(false)} />
    </>
  )
}
