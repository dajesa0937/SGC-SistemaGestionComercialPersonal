import type { CorteCartera, DocumentoCartera } from '@/domain/cobranza/cobranza.entity'
import type { CarteraDeCliente, ComparacionDeCortes, ResumenCartera } from '@/application/cobranza/indicadoresCartera'
import { carteraPorCliente, compararCortes, resumirCartera } from '@/application/cobranza/indicadoresCartera'
import { useRepositorios } from './contexto-repositorios'
import { useConsulta } from './useConsulta'

export interface VistaCartera {
  readonly cortes: readonly CorteCartera[]
  readonly corte: CorteCartera | null
  readonly documentos: readonly DocumentoCartera[]
  readonly porCliente: readonly CarteraDeCliente[]
  readonly resumen: ResumenCartera | null
  /** Contra el corte inmediatamente anterior por fecha. `null` si es el primero. */
  readonly comparacion: ComparacionDeCortes | null
}

/**
 * Carga un corte de cartera y todo lo que se deriva de el.
 *
 * El calculo va aqui y no en el repositorio: `carteraPorCliente` y
 * `resumirCartera` son funciones puras de la capa de aplicacion, y mantenerlas
 * fuera del almacenamiento es lo que permite probarlas sin navegador.
 */
export function useCartera(corteIdElegido?: string): VistaCartera | undefined {
  const repositorios = useRepositorios()

  return useConsulta(async () => {
    const cortes = await repositorios.cobranza.listarCortes()
    if (cortes.length === 0) {
      return { cortes, corte: null, documentos: [], porCliente: [], resumen: null, comparacion: null }
    }

    const corte = (corteIdElegido && cortes.find((c) => c.id === corteIdElegido)) || cortes[0]!
    const [documentos, clientes, zonas] = await Promise.all([
      repositorios.cobranza.documentosDelCorte(corte.id),
      repositorios.clientes.listar({ incluirArchivados: true }),
      repositorios.zonas.listar(),
    ])

    const porCliente = carteraPorCliente(documentos, corte.fecha, clientes, zonas)
    const resumen = resumirCartera(documentos, corte.fecha, clientes, zonas)

    // El anterior es el siguiente en la lista, que ya viene de mas nuevo a mas
    // viejo. Comparar con el ultimo importado y no con el ultimo en el tiempo
    // daria saltos raros al reimportar un corte antiguo.
    const indice = cortes.findIndex((c) => c.id === corte.id)
    const previo = cortes[indice + 1]
    let comparacion: ComparacionDeCortes | null = null
    if (previo) {
      const documentosPrevios = await repositorios.cobranza.documentosDelCorte(previo.id)
      comparacion = compararCortes(
        {
          resumen: resumirCartera(documentosPrevios, previo.fecha, clientes, zonas),
          porCliente: carteraPorCliente(documentosPrevios, previo.fecha, clientes, zonas),
        },
        { resumen, porCliente },
      )
    }

    return { cortes, corte, documentos, porCliente, resumen, comparacion }
  }, [corteIdElegido])
}
