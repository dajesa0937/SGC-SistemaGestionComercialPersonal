import type { Periodo } from '@/domain/shared/types'
import { formatearPeriodo } from '@/domain/shared/periodo'
import type { CoberturaTerritorial, FilaTerritorio } from '@/application/indicadores/coberturaTerritorial'
import { formatearNumero, formatearPesos, formatearPorcentaje } from '@/lib/formato'
import { EncabezadoImpresion } from '@/presentation/components/shared/HojaImpresion'
import { MapaColombia } from './MapaColombia'

interface Props {
  cobertura: CoberturaTerritorial
  periodo: Periodo
  paraImprimir?: boolean
}

function Tabla({
  titulo,
  filas,
  etiquetaColumna,
  vacio,
}: {
  titulo: string
  filas: readonly FilaTerritorio[]
  etiquetaColumna: string
  vacio: string
}) {
  return (
    <section className="mb-5 break-inside-avoid">
      <h3 className="mb-1.5 text-sm font-medium text-texto">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="text-xs text-tenue">{vacio}</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs text-tenue">{etiquetaColumna}</th>
              <th className="text-right text-xs whitespace-nowrap text-tenue">Clientes</th>
              <th className="text-right text-xs whitespace-nowrap text-tenue">Compraron</th>
              <th className="text-right text-xs whitespace-nowrap text-tenue">Cobertura</th>
              <th className="text-right text-xs whitespace-nowrap text-tenue">Venta del mes</th>
              <th className="text-right text-xs whitespace-nowrap text-tenue">Venta del año</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.clave}>
                <td className="text-texto">{fila.nombre}</td>
                <td className="cifra text-right whitespace-nowrap">{formatearNumero(fila.clientes)}</td>
                <td className="cifra text-right whitespace-nowrap">{formatearNumero(fila.conCompra)}</td>
                <td className="cifra text-right whitespace-nowrap text-suave">
                  {fila.clientes === 0 ? '—' : formatearPorcentaje(fila.conCompra / fila.clientes, 0)}
                </td>
                <td className="cifra text-right whitespace-nowrap">{formatearPesos(fila.ventaPeriodo)}</td>
                <td className="cifra text-right whitespace-nowrap">{formatearPesos(fila.ventaAnio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

/**
 * Informe de cobertura territorial.
 *
 * El mapa responde «dónde está mi cartera» de un vistazo; las tablas responden
 * «cuántos y cuánto», que es lo que un mapa no puede decir con precisión. Las
 * dos cosas juntas, y la tabla es la que manda si alguna vez discrepan.
 */
export function InformeTerritorial({ cobertura, periodo, paraImprimir = false }: Props) {
  const municipiosConClientes = cobertura.municipios.length
  const departamentosConClientes = cobertura.departamentos.length

  return (
    <div className={paraImprimir ? 'hoja' : ''}>
      {paraImprimir ? (
        <EncabezadoImpresion
          titulo="Cobertura territorial"
          subtitulo={`${formatearNumero(cobertura.totalClientes)} clientes activos en ${formatearNumero(municipiosConClientes)} municipios de ${formatearNumero(departamentosConClientes)} departamentos`}
          detalle={formatearPeriodo(periodo)}
        />
      ) : null}

      <div className="mb-5 grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <MapaColombia cobertura={cobertura} paraImprimir={paraImprimir} />

        <div className="min-w-0 break-inside-avoid">
          <Tabla
            titulo="Por departamento"
            filas={cobertura.departamentos}
            etiquetaColumna="Departamento"
            vacio="Ningún cliente tiene municipio asignado todavía."
          />
        </div>
      </div>

      <Tabla
        titulo="Por zona"
        filas={cobertura.zonas}
        etiquetaColumna="Zona"
        vacio="Todavía no has definido zonas. Se crean en Configuración → Zonas comerciales."
      />

      <Tabla
        titulo="Por municipio"
        filas={cobertura.municipios}
        etiquetaColumna="Municipio"
        vacio="Ningún cliente tiene municipio asignado todavía."
      />

      {cobertura.sinUbicacion > 0 ? (
        <p className="text-xs text-alerta">
          {formatearNumero(cobertura.sinUbicacion)}{' '}
          {cobertura.sinUbicacion === 1 ? 'cliente no aparece' : 'clientes no aparecen'} en el mapa
          porque no {cobertura.sinUbicacion === 1 ? 'tiene' : 'tienen'} municipio asignado. Se
          {cobertura.sinUbicacion === 1 ? ' corrige' : ' corrigen'} desde la ficha del cliente.
        </p>
      ) : null}
    </div>
  )
}
