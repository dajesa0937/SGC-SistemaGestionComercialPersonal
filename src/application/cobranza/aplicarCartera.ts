import type { Repositorios } from '@/domain/repositorios'
import type { Id } from '@/domain/shared/types'
import type { NuevoDocumento } from '@/domain/cobranza/cobranza.entity'
import { claveDePendiente, esPendiente } from '@/application/importacion/analizarVentas'
import type { PrevisualizacionCobranza } from '@/application/importacion/analizarCobranza'

export interface ResultadoCorte {
  readonly corteId: Id
  readonly clientesCreados: number
  readonly documentosGuardados: number
}

/** Datos del reporte que no salen de ninguna columna. */
export interface CabeceraDelCorte {
  readonly archivo: string
  readonly empresa?: string
  readonly nit?: string
  readonly procesadoEn?: string
}

/**
 * Guarda un corte de cartera ya analizado.
 *
 * Primero los clientes que faltan, porque los documentos apuntan a ellos, y
 * despues el corte completo en una sola operacion del repositorio.
 *
 * Crear el cliente es opcional: `crearClientesFaltantes` en `false` guarda el
 * corte igual y los documentos quedan sin ficha. El corte sigue siendo legible
 * —lleva el nombre y la identificacion escritos— y eso importa, porque diez de
 * los treinta y dos clientes con cartera del reporte real no estan en el
 * maestro y no todos son clientes que el usuario quiera dar de alta.
 */
export async function aplicarCartera(
  repositorios: Repositorios,
  previa: PrevisualizacionCobranza,
  cabecera: CabeceraDelCorte,
  crearClientesFaltantes: boolean,
): Promise<ResultadoCorte> {
  const idPorClave = new Map<string, Id>()
  if (crearClientesFaltantes) {
    for (const pendiente of previa.clientesPorCrear) {
      const creado = await repositorios.clientes.crear(pendiente.datos)
      idPorClave.set(pendiente.clave, creado.id)
    }
  }

  const documentos: NuevoDocumento[] = previa.documentos.map((documento) => {
    const clienteId = documento.clienteId
    if (clienteId && esPendiente(clienteId)) {
      // Sin ficha creada, el documento se queda sin `clienteId` en vez de
      // guardar una clave que no apunta a nada.
      const real = idPorClave.get(claveDePendiente(clienteId))
      return real ? { ...documento, clienteId: real } : { ...documento, clienteId: undefined }
    }
    return documento
  })

  const corteId = await repositorios.cobranza.guardarCorte(
    {
      fecha: previa.fecha,
      archivo: cabecera.archivo,
      empresa: cabecera.empresa,
      nit: cabecera.nit,
      procesadoEn: cabecera.procesadoEn,
    },
    documentos,
  )

  return {
    corteId,
    clientesCreados: crearClientesFaltantes ? previa.clientesPorCrear.length : 0,
    documentosGuardados: documentos.length,
  }
}
