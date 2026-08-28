import { etiquetaMunicipio } from '@/domain/geografia/geografia'
import type { ClienteEnriquecido, NotaCliente } from '@/domain/cliente/cliente.entity'
import type { VentaMensual } from '@/domain/venta/venta.entity'
import { formatearPeriodo } from '@/domain/shared/periodo'
import { formatearFecha, formatearPesos, formatearVariacion } from '@/lib/formato'
import { EncabezadoImpresion } from '@/presentation/components/shared/HojaImpresion'
import { ETIQUETA_ABC, ETIQUETA_ESTADO } from '../clientes/etiquetas'

interface Props {
  cliente: ClienteEnriquecido
  ventas: readonly VentaMensual[]
  notas: readonly NotaCliente[]
  periodo: string
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  return (
    <div>
      <span className="text-xs text-tenue">{etiqueta}: </span>
      <span className="text-sm text-texto">{valor?.trim() ? valor : '—'}</span>
    </div>
  )
}

/**
 * Ficha de una hoja para llevar a una visita.
 *
 * Va todo lo que hace falta para la conversación: con quién se habla, cuánto ha
 * comprado, cómo viene la tendencia y qué se dijo la última vez.
 */
export function FichaImprimible({ cliente, ventas, notas, periodo }: Props) {
  const conVenta = ventas.filter((v) => v.valor > 0).slice(0, 24)

  return (
    <div className="hoja">
      <EncabezadoImpresion
        titulo={cliente.nombre}
        subtitulo={`${cliente.codigo}${cliente.zona ? ` · ${cliente.zona}` : ''} · Clase ${ETIQUETA_ABC[cliente.clasificacion]} · ${ETIQUETA_ESTADO[cliente.estado]}`}
        detalle={`Periodo de referencia: ${formatearPeriodo(periodo)}`}
      />

      <section className="mb-5 no-cortar">
        <h2 className="mb-2 border-b border-borde-suave pb-1 text-xs font-semibold tracking-wider text-suave uppercase">
          Datos de contacto
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          <Dato etiqueta="Nombre comercial" valor={cliente.nombreComercial} />
          <Dato etiqueta="Identificación" valor={cliente.identificacion} />
          <Dato etiqueta="Contacto" valor={cliente.contactoPrincipal} />
          <Dato etiqueta="Teléfono" valor={cliente.telefono} />
          <Dato etiqueta="Correo" valor={cliente.email} />
          <Dato etiqueta="Municipio" valor={etiquetaMunicipio(cliente.municipio)} />
          <Dato etiqueta="Dirección" valor={cliente.direccion} />
        </div>
      </section>

      <section className="mb-5 no-cortar">
        <h2 className="mb-2 border-b border-borde-suave pb-1 text-xs font-semibold tracking-wider text-suave uppercase">
          Situación comercial
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-tenue">{formatearPeriodo(periodo)}</p>
            <p className="cifra text-base font-semibold">{formatearPesos(cliente.ventaPeriodo)}</p>
            <p className="text-xs text-suave">
              {formatearVariacion(cliente.variacionMesAnterior)} vs. mes anterior
            </p>
          </div>
          <div>
            <p className="text-xs text-tenue">Año en curso</p>
            <p className="cifra text-base font-semibold">{formatearPesos(cliente.ventaAnio)}</p>
            <p className="text-xs text-suave">
              {formatearVariacion(cliente.variacionAnioAnterior)} vs. año anterior
            </p>
          </div>
          <div>
            <p className="text-xs text-tenue">Últimos 12 meses</p>
            <p className="cifra text-base font-semibold">{formatearPesos(cliente.venta12Meses)}</p>
          </div>
          <div>
            <p className="text-xs text-tenue">Última compra</p>
            <p className="cifra text-base font-semibold">
              {cliente.ultimaCompra ? formatearPeriodo(cliente.ultimaCompra) : 'Nunca'}
            </p>
            <p className="text-xs text-suave">
              {cliente.primeraCompra ? `Cliente desde ${formatearPeriodo(cliente.primeraCompra)}` : ''}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 border-b border-borde-suave pb-1 text-xs font-semibold tracking-wider text-suave uppercase">
          Histórico de compras
        </h2>
        {conVenta.length === 0 ? (
          <p className="text-sm text-suave">Sin compras registradas.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs text-tenue">Periodo</th>
                <th className="text-right text-xs text-tenue">Venta</th>
              </tr>
            </thead>
            <tbody>
              {conVenta.map((venta) => (
                <tr key={venta.id}>
                  <td>{formatearPeriodo(venta.periodo)}</td>
                  <td className="cifra text-right">{formatearPesos(venta.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="mb-2 border-b border-borde-suave pb-1 text-xs font-semibold tracking-wider text-suave uppercase">
          Notas
        </h2>
        {notas.length === 0 ? (
          <p className="text-sm text-suave">Sin notas registradas.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {notas.map((nota) => (
              <li key={nota.id} className="no-cortar text-sm">
                <span className="text-xs text-tenue">{formatearFecha(nota.fecha)} · </span>
                {nota.texto}
              </li>
            ))}
          </ul>
        )}
        {/* Espacio en blanco a propósito: la ficha se lleva a una visita y ahí
            se escribe a mano lo que se acuerde. */}
        <div className="mt-4 border-t border-dashed border-borde pt-2">
          <p className="text-xs text-tenue">Notas de la visita</p>
          <div className="mt-1 h-24" />
        </div>
      </section>
    </div>
  )
}
