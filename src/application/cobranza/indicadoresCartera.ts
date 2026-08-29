import type { Centavos } from '@/domain/shared/dinero'
import type { FechaISO, Id } from '@/domain/shared/types'
import type { DocumentoCartera, PorTramo, Tramo } from '@/domain/cobranza/cobranza.entity'
import { diasDeMora, totalDe, tramoDe, tramosEnCero, vencidoDe } from '@/domain/cobranza/cobranza.entity'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import type { Zona } from '@/domain/geografia/zona.entity'
import { indexarZonasPorMunicipio } from '@/domain/geografia/zona.entity'
import { resolverMunicipio } from '@/domain/geografia/geografia'

/** Cartera de un cliente dentro de un corte. */
export interface CarteraDeCliente {
  readonly clave: string
  readonly clienteId?: Id
  readonly nombre: string
  readonly identificacion: string
  readonly municipio?: string
  readonly departamento?: string
  readonly zona?: string
  readonly porTramo: PorTramo
  readonly total: Centavos
  readonly vencido: Centavos
  /** Fraccion de su saldo que esta vencida. `0.45` es 45 %. */
  readonly porcentajeVencido: number
  /** Mora del documento mas antiguo. Cero si no debe nada vencido. */
  readonly moraMaxima: number
  readonly documentos: number
  readonly contacto?: string
  readonly telefono?: string
  readonly sinFicha: boolean
}

export interface ResumenCartera {
  readonly fecha: FechaISO
  readonly porTramo: PorTramo
  readonly total: Centavos
  readonly vencido: Centavos
  /** Fraccion vencida del total. Es LA cifra del informe. */
  readonly porcentajeVencido: number
  readonly clientes: number
  readonly documentos: number
  /** Peso de los cinco clientes con mas saldo. */
  readonly concentracionTop5: number
  /** Mora ponderada por saldo: cuantos dias promedio lleva vencido un peso. */
  readonly moraPromedioPonderada: number
  readonly documentoMasAntiguo?: { readonly documento: string; readonly nombre: string; readonly dias: number }
}

/** Reparte los documentos de un corte por cliente. */
export function carteraPorCliente(
  documentos: readonly DocumentoCartera[],
  fechaCorte: FechaISO,
  clientes: readonly Cliente[],
  zonas: readonly Zona[] = [],
): readonly CarteraDeCliente[] {
  const porId = new Map(clientes.map((cliente) => [cliente.id, cliente]))
  const zonaDe = indexarZonasPorMunicipio(zonas)

  const acumulado = new Map<
    string,
    {
      clienteId?: Id
      nombre: string
      identificacion: string
      porTramo: PorTramo
      moraMaxima: number
      documentos: number
      contacto?: string
      telefono?: string
    }
  >()

  for (const documento of documentos) {
    // La identificacion manda como llave; el nombre solo cuando no hay numero.
    const clave = documento.identificacion || documento.nombre
    const actual = acumulado.get(clave) ?? {
      clienteId: undefined,
      nombre: documento.nombre,
      identificacion: documento.identificacion,
      porTramo: tramosEnCero(),
      moraMaxima: 0,
      documentos: 0,
      contacto: undefined,
      telefono: undefined,
    }

    const ficha = documento.clienteId ? porId.get(documento.clienteId) : undefined
    if (ficha) actual.clienteId = ficha.id
    actual.porTramo[tramoDe(documento.valor, documento.fechaVencimiento, fechaCorte)] += documento.valor
    actual.moraMaxima = Math.max(
      actual.moraMaxima,
      diasDeMora(documento.valor, documento.fechaVencimiento, fechaCorte),
    )
    actual.documentos++
    actual.contacto ??= documento.contacto
    actual.telefono ??= documento.telefono
    acumulado.set(clave, actual)
  }

  return [...acumulado.entries()]
    .map(([clave, d]) => {
      const ficha = d.clienteId ? porId.get(d.clienteId) : undefined
      const municipio = ficha?.municipio
      const total = totalDe(d.porTramo)
      const vencido = vencidoDe(d.porTramo)
      return {
        clave,
        clienteId: d.clienteId,
        nombre: ficha?.nombre ?? d.nombre,
        identificacion: d.identificacion,
        municipio,
        departamento: municipio ? resolverMunicipio(municipio).departamento : undefined,
        zona: municipio ? zonaDe.get(municipio)?.nombre : undefined,
        porTramo: d.porTramo,
        total,
        vencido,
        porcentajeVencido: total > 0 ? vencido / total : 0,
        moraMaxima: d.moraMaxima,
        documentos: d.documentos,
        contacto: ficha?.contactoPrincipal ?? d.contacto,
        telefono: ficha?.telefono ?? d.telefono,
        sinFicha: ficha === undefined,
      }
    })
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es-CO'))
}

/**
 * Resume un corte entero.
 *
 * `porcentajeVencido` se calcula sobre el total NETO, que es el que incluye los
 * saldos a favor. Calcularlo sobre la deuda bruta daria un porcentaje mas
 * bonito y no cuadraria con el total que muestra la misma pantalla.
 */
export function resumirCartera(
  documentos: readonly DocumentoCartera[],
  fechaCorte: FechaISO,
  clientes: readonly Cliente[],
  zonas: readonly Zona[] = [],
): ResumenCartera {
  const porCliente = carteraPorCliente(documentos, fechaCorte, clientes, zonas)
  const porTramo = tramosEnCero()
  let moraPorPeso = 0
  let pesosVencidos = 0
  let masAntiguo: ResumenCartera['documentoMasAntiguo']

  for (const documento of documentos) {
    porTramo[tramoDe(documento.valor, documento.fechaVencimiento, fechaCorte)] += documento.valor
    const mora = diasDeMora(documento.valor, documento.fechaVencimiento, fechaCorte)
    if (mora > 0) {
      moraPorPeso += mora * documento.valor
      pesosVencidos += documento.valor
      if (!masAntiguo || mora > masAntiguo.dias) {
        masAntiguo = { documento: documento.documento, nombre: documento.nombre, dias: mora }
      }
    }
  }

  const total = totalDe(porTramo)
  const vencido = vencidoDe(porTramo)
  const top5 = porCliente.slice(0, 5).reduce((suma, cliente) => suma + cliente.total, 0)

  return {
    fecha: fechaCorte,
    porTramo,
    total,
    vencido,
    porcentajeVencido: total > 0 ? vencido / total : 0,
    clientes: porCliente.length,
    documentos: documentos.length,
    concentracionTop5: total > 0 ? top5 / total : 0,
    moraPromedioPonderada: pesosVencidos > 0 ? moraPorPeso / pesosVencidos : 0,
    documentoMasAntiguo: masAntiguo,
  }
}

/** Saldo agrupado por una dimension geografica. */
export interface CarteraAgrupada {
  readonly nombre: string
  readonly total: Centavos
  readonly vencido: Centavos
  readonly clientes: number
}

export function agruparCartera(
  porCliente: readonly CarteraDeCliente[],
  dimension: 'departamento' | 'zona' | 'municipio',
  sinDato = 'Sin ubicación',
): readonly CarteraAgrupada[] {
  const acumulado = new Map<string, { total: Centavos; vencido: Centavos; clientes: number }>()

  for (const cliente of porCliente) {
    const bruto = cliente[dimension]
    const nombre =
      dimension === 'municipio' && bruto ? resolverMunicipio(bruto).nombre : (bruto ?? sinDato)
    const actual = acumulado.get(nombre) ?? { total: 0, vencido: 0, clientes: 0 }
    actual.total += cliente.total
    actual.vencido += cliente.vencido
    actual.clientes++
    acumulado.set(nombre, actual)
  }

  return [...acumulado.entries()]
    .map(([nombre, d]) => ({ nombre, ...d }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es-CO'))
}

/** Como se movio un cliente entre dos cortes. */
export interface MovimientoDeCartera {
  readonly clave: string
  readonly nombre: string
  readonly anterior: Centavos
  readonly actual: Centavos
  readonly diferencia: Centavos
  readonly vencidoAnterior: Centavos
  readonly vencidoActual: Centavos
  readonly estado: 'nuevo' | 'saldado' | 'sube' | 'baja' | 'igual'
}

export interface ComparacionDeCortes {
  readonly anterior: ResumenCartera
  readonly actual: ResumenCartera
  readonly diasEntreCortes: number
  readonly variacionTotal: Centavos
  readonly variacionVencido: Centavos
  readonly movimientos: readonly MovimientoDeCartera[]
}

/**
 * Compara dos cortes cliente a cliente.
 *
 * La diferencia de saldo NO es lo que el cliente pago: entre un corte y otro
 * tambien se le facturo. Por eso los estados hablan de saldo —sube, baja,
 * saldado— y en ningun sitio se llama «pago» a una bajada. Para saber lo pagado
 * hace falta el recaudo, que este reporte no trae.
 */
export function compararCortes(
  anterior: { resumen: ResumenCartera; porCliente: readonly CarteraDeCliente[] },
  actual: { resumen: ResumenCartera; porCliente: readonly CarteraDeCliente[] },
): ComparacionDeCortes {
  const antes = new Map(anterior.porCliente.map((cliente) => [cliente.clave, cliente]))
  const ahora = new Map(actual.porCliente.map((cliente) => [cliente.clave, cliente]))
  const claves = new Set([...antes.keys(), ...ahora.keys()])

  const movimientos: MovimientoDeCartera[] = []
  for (const clave of claves) {
    const a = antes.get(clave)
    const b = ahora.get(clave)
    const saldoAntes = a?.total ?? 0
    const saldoAhora = b?.total ?? 0
    const diferencia = saldoAhora - saldoAntes

    let estado: MovimientoDeCartera['estado']
    if (!a) estado = 'nuevo'
    else if (!b) estado = 'saldado'
    else if (diferencia > 0) estado = 'sube'
    else if (diferencia < 0) estado = 'baja'
    else estado = 'igual'

    movimientos.push({
      clave,
      nombre: b?.nombre ?? a?.nombre ?? clave,
      anterior: saldoAntes,
      actual: saldoAhora,
      diferencia,
      vencidoAnterior: a?.vencido ?? 0,
      vencidoActual: b?.vencido ?? 0,
      estado,
    })
  }

  return {
    anterior: anterior.resumen,
    actual: actual.resumen,
    diasEntreCortes: diasEntreFechas(anterior.resumen.fecha, actual.resumen.fecha),
    variacionTotal: actual.resumen.total - anterior.resumen.total,
    variacionVencido: actual.resumen.vencido - anterior.resumen.vencido,
    movimientos: movimientos.sort((x, y) => Math.abs(y.diferencia) - Math.abs(x.diferencia)),
  }
}

function diasEntreFechas(desde: FechaISO, hasta: FechaISO): number {
  const a = Date.parse(`${desde}T00:00:00Z`)
  const b = Date.parse(`${hasta}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

/** Tramos ordenados con su participacion, para dibujar la barra de edades. */
export function tramosConParticipacion(
  porTramo: PorTramo,
  orden: readonly Tramo[],
): readonly { tramo: Tramo; valor: Centavos; participacion: number }[] {
  const base = orden.reduce((suma, tramo) => suma + Math.abs(porTramo[tramo]), 0)
  return orden.map((tramo) => ({
    tramo,
    valor: porTramo[tramo],
    participacion: base === 0 ? 0 : Math.abs(porTramo[tramo]) / base,
  }))
}
