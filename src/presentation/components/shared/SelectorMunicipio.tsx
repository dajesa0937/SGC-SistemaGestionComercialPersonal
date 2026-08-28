import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, MapPin, X } from 'lucide-react'
import {
  buscarMunicipios,
  etiquetaMunicipio,
  type CodigoMunicipio,
} from '@/domain/geografia/geografia'
import { cn } from '@/lib/cn'

interface Props {
  valor: CodigoMunicipio | ''
  onCambiar: (codigo: CodigoMunicipio | '') => void
  id?: string
  invalido?: boolean
}

/**
 * Buscador de municipios sobre el catálogo DANE completo.
 *
 * No es un `<select>` con 1.122 opciones —una lista así es inservible— sino un
 * campo de texto que busca mientras se escribe. Lo que se guarda es el código;
 * lo que se ve es «Municipio, Departamento», porque hay nombres repetidos en
 * departamentos distintos y el nombre solo no identifica nada.
 */
export function SelectorMunicipio({ valor, onCambiar, id, invalido }: Props) {
  const generado = useId()
  const idCampo = id ?? generado
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [resaltado, setResaltado] = useState(0)
  const contenedor = useRef<HTMLDivElement>(null)

  const opciones = useMemo(() => (abierto ? buscarMunicipios(texto, 8) : []), [texto, abierto])

  useEffect(() => {
    if (!abierto) return
    const alClic = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', alClic)
    return () => document.removeEventListener('mousedown', alClic)
  }, [abierto])

  const elegir = (codigo: CodigoMunicipio) => {
    onCambiar(codigo)
    setTexto('')
    setAbierto(false)
  }

  if (valor !== '' && !abierto) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-borde bg-superficie px-3 py-2">
        <span className="flex items-center gap-2 text-sm text-texto">
          <MapPin className="size-4 text-suave" aria-hidden="true" />
          {etiquetaMunicipio(valor)}
        </span>
        <button
          type="button"
          onClick={() => {
            onCambiar('')
            setAbierto(true)
          }}
          className="rounded p-0.5 text-suave transition-colors duration-150 hover:text-texto"
          aria-label="Cambiar municipio"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <div ref={contenedor} className="relative">
      <input
        id={idCampo}
        type="text"
        role="combobox"
        aria-expanded={abierto && opciones.length > 0}
        aria-controls={`${idCampo}-lista`}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Escribe el municipio…"
        value={texto}
        onFocus={() => setAbierto(true)}
        onChange={(evento) => {
          setTexto(evento.target.value)
          setAbierto(true)
          setResaltado(0)
        }}
        onKeyDown={(evento) => {
          if (evento.key === 'ArrowDown') {
            evento.preventDefault()
            setResaltado((n) => Math.min(n + 1, opciones.length - 1))
          } else if (evento.key === 'ArrowUp') {
            evento.preventDefault()
            setResaltado((n) => Math.max(n - 1, 0))
          } else if (evento.key === 'Enter' && opciones.length > 0) {
            evento.preventDefault()
            const elegida = opciones[resaltado]
            if (elegida) elegir(elegida.codigo)
          } else if (evento.key === 'Escape') {
            setAbierto(false)
          }
        }}
        className={cn(
          'w-full rounded-md border bg-superficie px-3 py-2 text-sm text-texto outline-none transition-colors duration-150',
          'placeholder:text-tenue focus:border-acento focus:ring-2 focus:ring-acento/20',
          invalido ? 'border-peligro' : 'border-borde',
        )}
      />

      {abierto && opciones.length > 0 ? (
        <ul
          id={`${idCampo}-lista`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-borde bg-superficie py-1 shadow-lg"
        >
          {opciones.map((opcion, indice) => (
            <li key={opcion.codigo}>
              <button
                type="button"
                role="option"
                aria-selected={indice === resaltado}
                onMouseEnter={() => setResaltado(indice)}
                onClick={() => elegir(opcion.codigo)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm',
                  indice === resaltado ? 'bg-superficie-alt text-texto' : 'text-suave',
                )}
              >
                <span>
                  {opcion.nombre}
                  <span className="ml-1.5 text-xs text-tenue">{opcion.departamento}</span>
                </span>
                {indice === resaltado ? (
                  <Check className="size-3.5 shrink-0 text-acento" aria-hidden="true" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {abierto && texto.trim() !== '' && opciones.length === 0 ? (
        <p className="absolute z-20 mt-1 w-full rounded-md border border-borde bg-superficie px-3 py-2 text-xs text-tenue">
          Ningún municipio coincide con «{texto}»
        </p>
      ) : null}
    </div>
  )
}
