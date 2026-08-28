import type { ClienteEnriquecido } from '@/domain/cliente/cliente.entity'
import { formatearPeriodo, formatearPeriodoCorto } from '@/domain/shared/periodo'
import { formatearPesos } from '@/lib/formato'
import { EncabezadoImpresion } from '@/presentation/components/shared/HojaImpresion'
import { ETIQUETA_ABC, ETIQUETA_ESTADO } from '../clientes/etiquetas'

interface Props {
  clientes: readonly ClienteEnriquecido[]
  periodo: string
  descripcionFiltros: string
}

/** Listado de la cartera tal como se ve en pantalla, para trabajarlo en la calle. */
export function ListaImprimible({ clientes, periodo, descripcionFiltros }: Props) {
  return (
    <div className="hoja">
      <EncabezadoImpresion
        titulo="Cartera de clientes"
        subtitulo={descripcionFiltros}
        detalle={`${clientes.length} clientes · ${formatearPeriodo(periodo)}`}
      />

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs text-tenue">Cliente</th>
            <th className="text-left text-xs text-tenue">Código</th>
            <th className="text-left text-xs text-tenue">Zona</th>
            <th className="text-left text-xs text-tenue">Contacto</th>
            <th className="text-center text-xs text-tenue">ABC</th>
            <th className="text-left text-xs text-tenue">Estado</th>
            <th className="text-right text-xs text-tenue">{formatearPeriodoCorto(periodo)}</th>
            <th className="text-right text-xs text-tenue">Año</th>
            <th className="text-right text-xs text-tenue">Últ. compra</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id}>
              <td>{cliente.nombre}</td>
              <td className="cifra text-suave">{cliente.codigo}</td>
              <td className="text-suave">{cliente.zona ?? '—'}</td>
              <td className="cifra text-suave">{cliente.telefono ?? '—'}</td>
              <td className="text-center">{ETIQUETA_ABC[cliente.clasificacion]}</td>
              <td className="text-suave">{ETIQUETA_ESTADO[cliente.estado]}</td>
              <td className="cifra text-right">
                {cliente.ventaPeriodo === 0 ? '—' : formatearPesos(cliente.ventaPeriodo)}
              </td>
              <td className="cifra text-right text-suave">
                {cliente.ventaAnio === 0 ? '—' : formatearPesos(cliente.ventaAnio)}
              </td>
              <td className="cifra text-right text-suave">
                {cliente.ultimaCompra ? formatearPeriodoCorto(cliente.ultimaCompra) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
