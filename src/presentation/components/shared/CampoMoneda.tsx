import { useEffect, useState, type FocusEvent } from 'react'
import { cn } from '@/lib/cn'
import { formatearNumero } from '@/lib/formato'

interface Props {
  valor: number
  onGuardar: (valor: number) => void
  id?: string
  'aria-label'?: string
  className?: string
  disabled?: boolean
}

/** Solo dígitos: quita separadores, espacios y el símbolo de peso. */
function aNumero(texto: string): number {
  const digitos = texto.replace(/[^\d]/g, '')
  return digitos === '' ? 0 : Number(digitos)
}

/**
 * El cero se muestra como campo vacío.
 *
 * Una grilla con once ceros se lee como "hay once valores"; vacía se lee como
 * "falta definirlos", que es la verdad.
 */
function aTexto(valor: number): string {
  return valor === 0 ? '' : formatearNumero(valor)
}

/**
 * Entrada de importe en pesos.
 *
 * Muestra la cifra con separadores de miles cuando no está enfocada y en crudo
 * mientras se escribe: editar sobre un texto que se reformatea con cada tecla
 * es incómodo y mueve el cursor de sitio.
 *
 * Guarda al salir del campo o con Enter, no en cada pulsación: escribir
 * "50000000" no debe producir ocho escrituras en la base.
 */
export function CampoMoneda({ valor, onGuardar, className, disabled, ...resto }: Props) {
  const [texto, setTexto] = useState(() => aTexto(valor))
  const [enfocado, setEnfocado] = useState(false)

  useEffect(() => {
    if (!enfocado) setTexto(aTexto(valor))
  }, [valor, enfocado])

  const guardar = (evento: FocusEvent<HTMLInputElement>) => {
    setEnfocado(false)
    const nuevo = aNumero(evento.target.value)
    setTexto(aTexto(nuevo))
    if (nuevo !== valor) onGuardar(nuevo)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      placeholder="0"
      value={texto}
      onFocus={(evento) => {
        setEnfocado(true)
        setTexto(valor === 0 ? '' : String(valor))
        // placeholder visible mientras el campo está vacío
        evento.target.select()
      }}
      onChange={(evento) => setTexto(evento.target.value)}
      onBlur={guardar}
      onKeyDown={(evento) => {
        if (evento.key === 'Enter') evento.currentTarget.blur()
        if (evento.key === 'Escape') {
          setTexto(aTexto(valor))
          evento.currentTarget.blur()
        }
      }}
      className={cn(
        'cifra h-9 w-full rounded-md border border-borde bg-superficie px-2.5 text-right text-sm',
        'text-texto placeholder:text-tenue disabled:opacity-50',
        className,
      )}
      {...resto}
    />
  )
}
