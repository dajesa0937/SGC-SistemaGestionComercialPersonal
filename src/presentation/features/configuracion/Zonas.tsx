import { useMemo, useState } from 'react'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { etiquetaMunicipio, type CodigoMunicipio } from '@/domain/geografia/geografia'
import { municipiosEnConflicto } from '@/domain/geografia/zona.entity'
import type { Zona } from '@/domain/geografia/zona.entity'
import { Boton } from '@/presentation/components/shared/Boton'
import { Entrada } from '@/presentation/components/shared/Campo'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import { SelectorMunicipio } from '@/presentation/components/shared/SelectorMunicipio'
import { useAccionesZonas, useZonas } from '@/presentation/hooks/data/useZonas'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'

function FilaZona({ zona, enConflicto }: { zona: Zona; enConflicto: ReadonlySet<string> }) {
  const { actualizar, eliminar } = useAccionesZonas()
  const { mostrar } = useAvisos()
  const [confirmando, setConfirmando] = useState(false)

  const agregar = async (codigo: CodigoMunicipio | '') => {
    if (codigo === '' || zona.municipios.includes(codigo)) return
    await actualizar(zona.id, { municipios: [...zona.municipios, codigo] })
  }

  const quitar = async (codigo: CodigoMunicipio) => {
    await actualizar(zona.id, { municipios: zona.municipios.filter((m) => m !== codigo) })
  }

  const municipios = [...zona.municipios].sort((a, b) =>
    etiquetaMunicipio(a).localeCompare(etiquetaMunicipio(b), 'es-CO'),
  )

  return (
    <div className="border-b border-borde-suave px-5 py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <input
          value={zona.nombre}
          onChange={(evento) => void actualizar(zona.id, { nombre: evento.target.value })}
          aria-label={`Nombre de la zona ${zona.nombre}`}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-texto hover:border-borde focus:border-acento focus:outline-none"
        />
        <span className="shrink-0 text-xs text-tenue">
          {municipios.length} {municipios.length === 1 ? 'municipio' : 'municipios'}
        </span>
        {confirmando ? (
          <span className="flex shrink-0 items-center gap-2">
            <Boton tamano="sm" onClick={() => setConfirmando(false)}>
              Cancelar
            </Boton>
            <Boton
              tamano="sm"
              className="border-peligro text-peligro"
              onClick={() => {
                void eliminar(zona.id)
                mostrar(`Zona «${zona.nombre}» eliminada. Ningún cliente se borró.`, 'exito')
              }}
            >
              Eliminar
            </Boton>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            aria-label={`Eliminar la zona ${zona.nombre}`}
            className="shrink-0 rounded p-1 text-suave transition-colors duration-150 hover:text-peligro"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {municipios.map((codigo) => (
          <span
            key={codigo}
            className={
              enConflicto.has(codigo)
                ? 'flex items-center gap-1 rounded-full border border-alerta bg-alerta-suave px-2 py-0.5 text-xs text-texto'
                : 'flex items-center gap-1 rounded-full border border-borde bg-superficie-alt px-2 py-0.5 text-xs text-suave'
            }
            title={enConflicto.has(codigo) ? 'Este municipio está en más de una zona' : undefined}
          >
            <MapPin className="size-3" aria-hidden="true" />
            {etiquetaMunicipio(codigo)}
            <button
              type="button"
              onClick={() => void quitar(codigo)}
              aria-label={`Quitar ${etiquetaMunicipio(codigo)} de ${zona.nombre}`}
              className="ml-0.5 text-tenue hover:text-peligro"
            >
              ×
            </button>
          </span>
        ))}
        {municipios.length === 0 ? (
          <span className="text-xs text-tenue">
            Sin municipios todavía: esta zona no agrupa a ningún cliente.
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 max-w-sm">
        <SelectorMunicipio valor="" onCambiar={(codigo) => void agregar(codigo)} />
      </div>
    </div>
  )
}

/**
 * Administración de las zonas comerciales.
 *
 * Una zona es un conjunto de municipios y nada más. El cliente no guarda su
 * zona: la hereda de su municipio. Por eso mover un municipio de zona reetiqueta
 * a sus clientes en el acto, y borrar una zona no borra ni toca a nadie.
 */
export function Zonas() {
  const { zonas, cargando } = useZonas()
  const { crear } = useAccionesZonas()
  const { mostrar } = useAvisos()
  const [nombre, setNombre] = useState('')

  const enConflicto = useMemo(() => new Set(municipiosEnConflicto(zonas)), [zonas])

  const agregarZona = async () => {
    const limpio = nombre.trim()
    if (limpio === '') return
    if (zonas.some((z) => z.nombre.toLowerCase() === limpio.toLowerCase())) {
      mostrar('Ya existe una zona con ese nombre', 'error')
      return
    }
    await crear({ nombre: limpio, municipios: [] })
    setNombre('')
  }

  return (
    <Tarjeta>
      <div className="border-b border-borde-suave px-5 py-3">
        <h2 className="text-sm font-medium text-texto">Zonas comerciales</h2>
        <p className="mt-0.5 text-xs text-suave">
          Agrupa municipios como tú los trabajas. La zona de cada cliente sale de su municipio, así
          que cambiarla aquí reetiqueta a sus clientes al instante.
        </p>
      </div>

      {cargando ? (
        <p className="px-5 py-4 text-sm text-tenue">Cargando…</p>
      ) : zonas.length === 0 ? (
        <p className="px-5 py-4 text-sm text-tenue">
          Todavía no has creado ninguna zona. Sin zonas, los clientes se agrupan solo por
          departamento.
        </p>
      ) : (
        zonas.map((zona) => <FilaZona key={zona.id} zona={zona} enConflicto={enConflicto} />)
      )}

      {enConflicto.size > 0 ? (
        <p className="border-t border-borde-suave px-5 py-2.5 text-xs text-alerta">
          Hay {enConflicto.size} municipio(s) en más de una zona. Cada cliente se cuenta en una sola:
          la primera por orden alfabético.
        </p>
      ) : null}

      <div className="flex items-center gap-2 border-t border-borde-suave px-5 py-3">
        <Entrada
          value={nombre}
          placeholder="Nombre de la zona nueva"
          aria-label="Nombre de la zona nueva"
          onChange={(evento) => setNombre(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') {
              evento.preventDefault()
              void agregarZona()
            }
          }}
        />
        <Boton
          variante="primario"
          className="shrink-0 whitespace-nowrap"
          onClick={() => void agregarZona()}
          disabled={nombre.trim() === ''}
        >
          <Plus className="size-4" aria-hidden="true" />
          Crear zona
        </Boton>
      </div>
    </Tarjeta>
  )
}
