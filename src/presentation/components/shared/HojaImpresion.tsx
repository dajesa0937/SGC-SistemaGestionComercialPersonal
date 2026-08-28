import { useCallback, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Impresión de un documento concreto, no de la pantalla.
 *
 * El problema que resuelve: `print.css` oculta los paneles laterales, así que
 * pulsar «Imprimir» dentro de un panel imprimía la pantalla de detrás. Aquí el
 * contenido se monta en un contenedor aparte al final del documento y se marca
 * `<html data-imprimiendo>`, que en impresión oculta la aplicación entera y
 * deja solo la hoja.
 *
 * Ventaja de fondo: lo que se imprime se escribe una sola vez y se ve igual en
 * papel y en PDF, sin mantener una segunda maquetación.
 */
export function useHojaImpresion() {
  const [hoja, setHoja] = useState<ReactNode>(null)

  const imprimir = useCallback((contenido: ReactNode) => {
    setHoja(contenido)

    // Se espera a que React pinte la hoja antes de abrir el diálogo.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.setAttribute('data-imprimiendo', '')
        window.print()
        document.documentElement.removeAttribute('data-imprimiendo')
        setHoja(null)
      })
    })
  }, [])

  const portal = hoja ? createPortal(<div id="hoja-impresion">{hoja}</div>, document.body) : null

  return { imprimir, portal }
}

interface EncabezadoProps {
  titulo: string
  subtitulo?: string
  detalle?: string
}

/** Encabezado común de los reportes: la hoja tiene que explicarse sola. */
export function EncabezadoImpresion({ titulo, subtitulo, detalle }: EncabezadoProps) {
  const generado = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date())

  return (
    <header className="mb-5 flex items-start justify-between gap-6 border-b border-borde pb-3">
      <div>
        <p className="text-xs tracking-wider text-tenue uppercase">SGC Personal</p>
        <h1 className="mt-0.5 text-lg font-semibold text-texto">{titulo}</h1>
        {subtitulo ? <p className="text-sm text-suave">{subtitulo}</p> : null}
      </div>
      <div className="text-right text-xs text-tenue">
        <p>Generado el {generado}</p>
        {detalle ? <p className="mt-0.5">{detalle}</p> : null}
      </div>
    </header>
  )
}
