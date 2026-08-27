import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorDeDominio } from '@/domain/shared/errores'

interface Props {
  children: ReactNode
}

interface Estado {
  error: Error | null
}

/**
 * Limite de error por ruta.
 *
 * Un fallo en una pantalla no puede tumbar toda la aplicacion. Los errores de
 * dominio se muestran con su mensaje en espanol; los demas se reportan de forma
 * generica, sin exponer un stack trace al usuario.
 */
export class LimiteDeError extends Component<Props, Estado> {
  override state: Estado = { error: null }

  static getDerivedStateFromError(error: Error): Estado {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[SGC] Error no controlado', error, info.componentStack)
  }

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    const esDeDominio = error instanceof ErrorDeDominio

    return (
      <div className="rounded-panel border border-peligro/40 bg-peligro-suave p-6">
        <h2 className="text-base font-medium text-texto">
          {esDeDominio ? 'No se pudo completar la operación' : 'Algo salió mal en esta pantalla'}
        </h2>
        <p className="mt-2 max-w-prose text-sm text-suave">
          {esDeDominio
            ? error.message
            : 'El resto de la aplicación sigue funcionando. Si vuelve a ocurrir, revisa la consola del navegador para ver el detalle técnico.'}
        </p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-4 inline-flex h-9 items-center rounded-md bg-acento px-4 text-sm font-medium text-acento-contraste"
        >
          Reintentar
        </button>
      </div>
    )
  }
}
