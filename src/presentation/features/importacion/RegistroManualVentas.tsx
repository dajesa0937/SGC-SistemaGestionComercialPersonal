import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import type { Pesos } from '@/domain/shared/types'
import { formatearPeriodo } from '@/domain/shared/periodo'
import { coincideConTexto } from '@/application/clientes/filtrarClientes'
import { formatearPesos } from '@/lib/formato'
import { Boton } from '@/presentation/components/shared/Boton'
import { CampoMoneda } from '@/presentation/components/shared/CampoMoneda'
import { EstadoVacio } from '@/presentation/components/shared/EstadoVacio'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import { useConsulta } from '@/presentation/hooks/data/useConsulta'
import { useRepositorios } from '@/presentation/hooks/data/contexto-repositorios'
import { usePeriodoSeleccionado } from '@/presentation/hooks/ui/contexto-periodo'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'

/**
 * Captura manual de ventas del periodo.
 *
 * No estaba en el alcance obligatorio del MVP, pero sin alguna forma de
 * registrar ventas el panel muestra ceros y los indicadores no sirven de nada.
 * Cuando exista el importador de Excel esta pantalla sigue siendo util para
 * corregir una cifra puntual o adelantarse al archivo del mes.
 */
export function RegistroManualVentas() {
  const { periodo } = usePeriodoSeleccionado()
  const repositorios = useRepositorios()
  const { mostrar } = useAvisos()
  const [busqueda, setBusqueda] = useState('')

  const datos = useConsulta(async () => {
    const [clientes, ventas] = await Promise.all([
      repositorios.clientes.listar(),
      repositorios.ventas.listarPorPeriodo(periodo),
    ])
    return { clientes, ventas: new Map(ventas.map((v) => [v.clienteId, v.valor])) }
  }, [repositorios, periodo])

  const visibles = useMemo(
    () => (datos ? datos.clientes.filter((c) => coincideConTexto(c, busqueda)) : []),
    [datos, busqueda],
  )

  const total = useMemo(() => {
    if (!datos) return 0
    let suma = 0
    for (const valor of datos.ventas.values()) suma += valor
    return suma
  }, [datos])

  const guardar = async (cliente: Cliente, valor: Pesos) => {
    try {
      await repositorios.ventas.guardarLote([
        { clienteId: cliente.id, periodo, valor, origen: 'manual' },
      ])
    } catch (error) {
      mostrar(
        error instanceof Error ? error.message : `No se pudo guardar la venta de ${cliente.nombre}`,
        'error',
      )
    }
  }

  if (datos && datos.clientes.length === 0) {
    return (
      <EstadoVacio
        icono={Users}
        titulo="Primero hacen falta clientes"
        descripcion="Las ventas se registran contra un cliente. Crea la cartera o impórtala desde Excel."
        accion={
          <Link to="/clientes">
            <Boton variante="primario">Ir a Clientes</Boton>
          </Link>
        }
      />
    )
  }

  return (
    <Tarjeta className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borde px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-texto">
            Ventas de {formatearPeriodo(periodo)}
          </h2>
          <p className="mt-0.5 text-xs text-suave">
            Se guarda al salir de cada casilla o al pulsar Enter.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-tenue"
              aria-hidden="true"
            />
            <label className="sr-only" htmlFor="buscar-venta">
              Buscar cliente
            </label>
            <input
              id="buscar-venta"
              type="search"
              value={busqueda}
              placeholder="Buscar cliente…"
              onChange={(evento) => setBusqueda(evento.target.value)}
              className="h-8 w-52 rounded-md border border-borde bg-superficie pr-2.5 pl-8 text-sm text-texto placeholder:text-tenue"
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-tenue">Total del mes</p>
            <p className="cifra text-sm font-semibold text-texto">{formatearPesos(total)}</p>
          </div>
        </div>
      </div>

      <div className="max-h-[26rem] overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {visibles.map((cliente) => (
              <tr key={cliente.id} className="border-b border-borde-suave last:border-b-0">
                <td className="px-4 py-1.5">
                  <span className="text-texto">{cliente.nombre}</span>
                  <span className="cifra ml-2 text-xs text-tenue">{cliente.codigo}</span>
                </td>
                <td className="w-48 px-4 py-1.5">
                  <CampoMoneda
                    aria-label={`Venta de ${cliente.nombre}`}
                    valor={datos?.ventas.get(cliente.id) ?? 0}
                    onGuardar={(valor) => void guardar(cliente, valor)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {datos && visibles.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-tenue">
            Ningún cliente coincide con «{busqueda}».
          </p>
        ) : null}
      </div>
    </Tarjeta>
  )
}
