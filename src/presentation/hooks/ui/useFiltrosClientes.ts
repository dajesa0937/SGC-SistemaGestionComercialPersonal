import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FILTROS_POR_DEFECTO,
  type DireccionOrden,
  type FiltrosClientes,
  type OrdenClientes,
} from '@/application/clientes/filtrarClientes'
import type { ClasificacionABC, EstadoCliente } from '@/domain/cliente/cliente.entity'

const ORDENES: readonly OrdenClientes[] = [
  'nombre',
  'codigo',
  'zona',
  'ventaPeriodo',
  'ventaAnio',
  'ultimaCompra',
]
const ESTADOS: readonly EstadoCliente[] = ['nuevo', 'activo', 'en_riesgo', 'inactivo']
const CLASES: readonly ClasificacionABC[] = ['A', 'B', 'C', 'SIN_HISTORIA']

/** Escribir en el buscador no debe llenar el historial de entradas. */
function soloTexto(cambios: Partial<FiltrosClientes & { pagina: number }>): boolean {
  const claves = Object.keys(cambios)
  return claves.length === 1 && claves[0] === 'texto'
}

/**
 * Filtros de la cartera, guardados en la URL.
 *
 * Vivir en la URL permite guardar la vista filtrada como marcador y no perder
 * el contexto de busqueda al volver de la ficha de un cliente.
 *
 * Sobre el historial del navegador: escribir en el buscador REEMPLAZA la
 * entrada actual (una entrada por pulsacion de tecla haria inservible el boton
 * atras), mientras que cambiar zona, estado, clasificacion, orden o pagina si
 * crea una entrada nueva, porque son decisiones deliberadas que tiene sentido
 * poder deshacer.
 */
export function useFiltrosClientes() {
  const [parametros, setParametros] = useSearchParams()

  const filtros = useMemo<FiltrosClientes>(() => {
    const orden = parametros.get('orden')
    const estado = parametros.get('estado')
    const clase = parametros.get('abc')

    return {
      texto: parametros.get('q') ?? '',
      zona: parametros.get('zona') ?? '',
      estado: ESTADOS.includes(estado as EstadoCliente) ? (estado as EstadoCliente) : '',
      clasificacion: CLASES.includes(clase as ClasificacionABC) ? (clase as ClasificacionABC) : '',
      incluirArchivados: parametros.get('archivados') === '1',
      orden: ORDENES.includes(orden as OrdenClientes)
        ? (orden as OrdenClientes)
        : FILTROS_POR_DEFECTO.orden,
      direccion: parametros.get('dir') === 'desc' ? 'desc' : 'asc',
    }
  }, [parametros])

  const pagina = Number(parametros.get('pagina') ?? '1') || 1

  const actualizar = useCallback(
    (cambios: Partial<FiltrosClientes & { pagina: number }>) => {
      setParametros(
        (previos) => {
          const siguientes = new URLSearchParams(previos)
          const fijar = (clave: string, valor: string, porDefecto: string) => {
            if (valor === porDefecto) siguientes.delete(clave)
            else siguientes.set(clave, valor)
          }

          if (cambios.texto !== undefined) fijar('q', cambios.texto, '')
          if (cambios.zona !== undefined) fijar('zona', cambios.zona, '')
          if (cambios.estado !== undefined) fijar('estado', cambios.estado, '')
          if (cambios.clasificacion !== undefined) fijar('abc', cambios.clasificacion, '')
          if (cambios.incluirArchivados !== undefined) {
            fijar('archivados', cambios.incluirArchivados ? '1' : '0', '0')
          }
          if (cambios.orden !== undefined) fijar('orden', cambios.orden, 'nombre')
          if (cambios.direccion !== undefined) fijar('dir', cambios.direccion, 'asc')

          // Cualquier cambio de filtro devuelve a la primera pagina: seguir en
          // la pagina 4 tras filtrar deja una tabla vacia sin explicacion.
          const paginaNueva = soloPagina(cambios) ? (cambios.pagina ?? 1) : 1
          fijar('pagina', String(paginaNueva), '1')

          return siguientes
        },
        { replace: soloTexto(cambios) },
      )
    },
    [setParametros],
  )

  const limpiar = useCallback(
    () => setParametros(new URLSearchParams(), { replace: false }),
    [setParametros],
  )

  const alternarOrden = useCallback(
    (clave: string) => {
      if (!ORDENES.includes(clave as OrdenClientes)) return
      const mismaColumna = filtros.orden === clave
      // Las columnas de dinero arrancan de mayor a menor: nadie ordena por
      // venta para ver primero a quien menos compro.
      const esImporte = clave === 'ventaPeriodo' || clave === 'ventaAnio'
      const inicial: DireccionOrden = esImporte ? 'desc' : 'asc'
      const direccion: DireccionOrden = mismaColumna
        ? filtros.direccion === 'asc'
          ? 'desc'
          : 'asc'
        : inicial
      actualizar({ orden: clave as OrdenClientes, direccion })
    },
    [filtros.orden, filtros.direccion, actualizar],
  )

  return { filtros, pagina, actualizar, limpiar, alternarOrden }
}

function soloPagina(cambios: Partial<FiltrosClientes & { pagina: number }>): boolean {
  const claves = Object.keys(cambios)
  return claves.length === 1 && claves[0] === 'pagina'
}
