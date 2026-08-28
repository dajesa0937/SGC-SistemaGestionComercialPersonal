import type { ClienteEnriquecido } from '@/domain/cliente/cliente.entity'
import type { Id, Pesos } from '@/domain/shared/types'
import { etiquetaMunicipio, nombreDepartamento } from '@/domain/geografia/geografia'

/** Cifras de un territorio, sea un departamento, un municipio o una zona. */
export interface FilaTerritorio {
  readonly clave: string
  readonly nombre: string
  readonly clientes: number
  /** Clientes que compraron en el periodo consultado. */
  readonly conCompra: number
  readonly ventaPeriodo: Pesos
  readonly ventaAnio: Pesos
}

export interface CoberturaTerritorial {
  readonly departamentos: readonly FilaTerritorio[]
  readonly municipios: readonly FilaTerritorio[]
  readonly zonas: readonly FilaTerritorio[]
  /** Clientes sin municipio: no caben en ningún mapa y hay que decirlo. */
  readonly sinUbicacion: number
  readonly totalClientes: number
  /** Mayor número de clientes en un solo departamento. Escala el mapa. */
  readonly maximoPorDepartamento: number
}

interface Acumulado {
  nombre: string
  clientes: number
  conCompra: number
  ventaPeriodo: Pesos
  ventaAnio: Pesos
}

function acumular(mapa: Map<string, Acumulado>, clave: string, nombre: string, cliente: ClienteEnriquecido) {
  const fila = mapa.get(clave) ?? { nombre, clientes: 0, conCompra: 0, ventaPeriodo: 0, ventaAnio: 0 }
  fila.clientes += 1
  if (cliente.ventaPeriodo > 0) fila.conCompra += 1
  fila.ventaPeriodo += cliente.ventaPeriodo
  fila.ventaAnio += cliente.ventaAnio
  mapa.set(clave, fila)
}

function ordenar(mapa: Map<string, Acumulado>): FilaTerritorio[] {
  return [...mapa.entries()]
    .map(([clave, a]) => ({ clave, ...a }))
    // Primero por peso comercial y, a igualdad, por nombre: dos territorios con
    // las mismas cifras deben salir siempre en el mismo orden.
    .sort(
      (a, b) =>
        b.ventaAnio - a.ventaAnio || b.clientes - a.clientes || a.nombre.localeCompare(b.nombre, 'es-CO'),
    )
}

/**
 * Reparte la cartera sobre el territorio.
 *
 * Los clientes archivados quedan fuera: el mapa responde «dónde estoy
 * trabajando», y un cliente que uno mismo dio de baja no es territorio activo.
 *
 * Un cliente sin municipio no se descarta en silencio, se cuenta aparte. Si
 * desapareciera, la suma del mapa no cuadraría con la cartera y nadie sabría
 * por qué.
 */
export function calcularCoberturaTerritorial(
  clientes: readonly ClienteEnriquecido[],
): CoberturaTerritorial {
  const departamentos = new Map<string, Acumulado>()
  const municipios = new Map<string, Acumulado>()
  const zonas = new Map<Id, Acumulado>()
  let sinUbicacion = 0
  let total = 0

  for (const cliente of clientes) {
    if (cliente.archivado) continue
    total += 1

    if (!cliente.municipio) {
      sinUbicacion += 1
      continue
    }

    const codigoDepartamento = cliente.municipio.slice(0, 2)
    acumular(
      departamentos,
      codigoDepartamento,
      nombreDepartamento(codigoDepartamento) ?? `Departamento ${codigoDepartamento}`,
      cliente,
    )
    acumular(municipios, cliente.municipio, etiquetaMunicipio(cliente.municipio), cliente)

    if (cliente.zonaId && cliente.zona) acumular(zonas, cliente.zonaId, cliente.zona, cliente)
  }

  const filasDepartamento = ordenar(departamentos)

  return {
    departamentos: filasDepartamento,
    municipios: ordenar(municipios),
    zonas: ordenar(zonas),
    sinUbicacion,
    totalClientes: total,
    maximoPorDepartamento: Math.max(0, ...filasDepartamento.map((d) => d.clientes)),
  }
}

/**
 * Nivel de la rampa de color que le toca a un departamento, de 0 a 4.
 *
 * Cero es «sin clientes» y se pinta neutro, no como el primer paso del color:
 * un mapa donde la ausencia de datos se parece a «hay poquito» miente sobre la
 * cobertura.
 *
 * El reparto es por tramos proporcionales al máximo y no por cuantiles, porque
 * con pocos departamentos los cuantiles dan saltos que no corresponden a nada:
 * con dos departamentos, uno saldría siempre en el color más oscuro.
 */
export function nivelDeMapa(clientes: number, maximo: number): 0 | 1 | 2 | 3 | 4 {
  if (clientes <= 0) return 0
  if (maximo <= 0) return 0
  const fraccion = clientes / maximo
  if (fraccion <= 0.25) return 1
  if (fraccion <= 0.5) return 2
  if (fraccion <= 0.75) return 3
  return 4
}

/** Rótulos de la leyenda, en el mismo orden que los niveles 1 a 4. */
export function tramosDeLeyenda(maximo: number): readonly string[] {
  if (maximo <= 0) return []
  const corte = (f: number) => Math.max(1, Math.round(maximo * f))
  const tramos = [
    [1, corte(0.25)],
    [corte(0.25) + 1, corte(0.5)],
    [corte(0.5) + 1, corte(0.75)],
    [corte(0.75) + 1, maximo],
  ] as const
  return tramos
    .filter(([desde, hasta]) => desde <= hasta)
    .map(([desde, hasta]) => (desde === hasta ? String(desde) : `${desde}–${hasta}`))
}
