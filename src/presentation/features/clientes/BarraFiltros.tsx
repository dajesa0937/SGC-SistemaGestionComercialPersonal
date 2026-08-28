import { Search, X } from 'lucide-react'
import type { FiltrosClientes, OpcionFiltro } from '@/application/clientes/filtrarClientes'
import { Seleccion } from '@/presentation/components/shared/Campo'
import { Boton } from '@/presentation/components/shared/Boton'

interface Props {
  filtros: FiltrosClientes
  zonas: readonly OpcionFiltro[]
  departamentos: readonly OpcionFiltro[]
  hayFiltros: boolean
  onCambiar: (cambios: Partial<FiltrosClientes>) => void
  onLimpiar: () => void
}

export function BarraFiltros({
  filtros,
  zonas,
  departamentos,
  hayFiltros,
  onCambiar,
  onLimpiar,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 no-imprimir">
      <div className="relative min-w-52 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-tenue"
          aria-hidden="true"
        />
        <label className="sr-only" htmlFor="buscar-cliente">
          Buscar cliente
        </label>
        <input
          id="buscar-cliente"
          type="search"
          value={filtros.texto}
          placeholder="Buscar por nombre, identificación o municipio…"
          onChange={(evento) => onCambiar({ texto: evento.target.value })}
          className="h-9 w-full rounded-md border border-borde bg-superficie pr-2.5 pl-8 text-sm text-texto placeholder:text-tenue"
        />
      </div>

      <label className="sr-only" htmlFor="filtro-zona">
        Zona
      </label>
      <Seleccion
        id="filtro-zona"
        value={filtros.zona}
        onChange={(evento) => onCambiar({ zona: evento.target.value })}
        className="w-auto min-w-32"
      >
        <option value="">Todas las zonas</option>
        {zonas.map((zona) => (
          <option key={zona.valor} value={zona.valor}>
            {zona.etiqueta}
          </option>
        ))}
      </Seleccion>

      <label className="sr-only" htmlFor="filtro-departamento">
        Departamento
      </label>
      <Seleccion
        id="filtro-departamento"
        value={filtros.departamento}
        onChange={(evento) => onCambiar({ departamento: evento.target.value })}
        className="w-auto min-w-36"
      >
        <option value="">Todo el país</option>
        {departamentos.map((departamento) => (
          <option key={departamento.valor} value={departamento.valor}>
            {departamento.etiqueta}
          </option>
        ))}
      </Seleccion>

      <label className="sr-only" htmlFor="filtro-estado">
        Estado
      </label>
      <Seleccion
        id="filtro-estado"
        value={filtros.estado}
        onChange={(evento) =>
          onCambiar({ estado: evento.target.value as FiltrosClientes['estado'] })
        }
        className="w-auto min-w-32"
      >
        <option value="">Todos los estados</option>
        <option value="nuevo">Nuevos</option>
        <option value="activo">Activos</option>
        <option value="en_riesgo">En riesgo</option>
        <option value="inactivo">Inactivos</option>
      </Seleccion>

      <label className="sr-only" htmlFor="filtro-abc">
        Clasificación
      </label>
      <Seleccion
        id="filtro-abc"
        value={filtros.clasificacion}
        onChange={(evento) =>
          onCambiar({ clasificacion: evento.target.value as FiltrosClientes['clasificacion'] })
        }
        className="w-auto min-w-28"
      >
        <option value="">Todo el ABC</option>
        <option value="A">Clase A</option>
        <option value="B">Clase B</option>
        <option value="C">Clase C</option>
        <option value="SIN_HISTORIA">Sin historia</option>
      </Seleccion>

      <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-borde bg-superficie px-2.5 text-sm text-suave">
        <input
          type="checkbox"
          checked={filtros.incluirArchivados}
          onChange={(evento) => onCambiar({ incluirArchivados: evento.target.checked })}
          className="size-3.5 accent-[var(--sgc-acento)]"
        />
        Archivados
      </label>

      {hayFiltros ? (
        <Boton variante="fantasma" tamano="sm" onClick={onLimpiar}>
          <X className="size-3.5" aria-hidden="true" />
          Limpiar
        </Boton>
      ) : null}
    </div>
  )
}
