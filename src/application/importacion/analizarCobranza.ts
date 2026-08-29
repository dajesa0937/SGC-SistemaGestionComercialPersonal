import type { Cliente, NuevoCliente } from '@/domain/cliente/cliente.entity'
import { normalizarIdentificacion } from '@/domain/cliente/identificacion'
import type { Centavos } from '@/domain/shared/dinero'
import { interpretarCentavos } from '@/domain/shared/dinero'
import { interpretarFecha } from '@/domain/shared/interpretarPeriodo'
import type { FechaISO, Id } from '@/domain/shared/types'
import type { NuevoDocumento, PorTramo, Tramo } from '@/domain/cobranza/cobranza.entity'
import { tramoDe, tramosEnCero } from '@/domain/cobranza/cobranza.entity'
import { normalizarParaConciliar } from '@/lib/formato'
import type { MapeoDetectado } from './detectarColumnas'
import type { ErrorDeFila, Rejilla } from './analizarMaestroClientes'
import { clavePendiente } from './analizarVentas'

/** Cliente del reporte de cartera que todavia no existe en la base. */
export interface ClienteDeCarteraPorCrear {
  readonly clave: string
  readonly datos: NuevoCliente
  readonly documentos: number
  readonly saldo: Centavos
}

/**
 * Fila cuyo tramo derivado no coincide con el que dice la empresa, o cuyas
 * columnas de edades no suman el total.
 *
 * No es un error: la fila se importa igual. Es una senal de que el archivo
 * cambio de forma o de que la fecha del corte no es la que se creia, y es la
 * unica manera de enterarse sin revisar sesenta filas a mano.
 */
export interface Descuadre {
  readonly numeroFila: number
  readonly documento: string
  readonly motivo: string
}

export interface PrevisualizacionCobranza {
  readonly fecha: FechaISO
  readonly totalFilas: number
  readonly documentos: readonly NuevoDocumento[]
  readonly clientesPorCrear: readonly ClienteDeCarteraPorCrear[]
  readonly errores: readonly ErrorDeFila[]
  readonly descuadres: readonly Descuadre[]
  readonly total: Centavos
  readonly porTramo: PorTramo
  readonly clientes: number
}

/** Columna del archivo que corresponde a cada tramo, para poder contrastarla. */
const COLUMNA_DE_TRAMO: Record<Exclude<Tramo, 'a_favor'>, string> = {
  v1_30: 'vencido1a30',
  v31_60: 'vencido31a60',
  v61_90: 'vencido61a90',
  v91_mas: 'vencido91mas',
  por_vencer: 'porVencer',
}

function celda(fila: readonly string[], columna: number | null | undefined): string {
  if (columna == null) return ''
  return (fila[columna] ?? '').trim()
}

function importe(fila: readonly string[], mapeo: MapeoDetectado, campo: string): Centavos {
  return interpretarCentavos(celda(fila, mapeo[campo])) ?? 0
}

/**
 * Analiza el reporte de cuentas por cobrar y describe el corte que produciria.
 *
 * Funcion pura, como el resto de los analizadores: la vista previa antes de
 * tocar la base solo sirve si mirar no cambia nada.
 *
 * El importe se guarda **con signo y una sola vez**. El archivo dice lo mismo
 * en dos sitios —la columna «Saldo a favor» en positivo y «Total cartera» en
 * negativo— y guardar los dos es como se acaba con dos cifras distintas para el
 * mismo saldo. Se guarda «Total cartera», que ya trae el signo, y las seis
 * columnas de edades se usan solo para comprobar que la lectura fue correcta.
 */
export function analizarCobranza(
  rejilla: Rejilla,
  mapeo: MapeoDetectado,
  filaEncabezado: number,
  fechaCorte: FechaISO,
  existentes: readonly Cliente[],
): PrevisualizacionCobranza {
  const porIdentificacion = new Map(
    existentes.filter((c) => c.identificacion).map((c) => [c.identificacion!, c]),
  )
  const porNombre = new Map(existentes.map((c) => [normalizarParaConciliar(c.nombre), c]))

  const documentos: NuevoDocumento[] = []
  const errores: ErrorDeFila[] = []
  const descuadres: Descuadre[] = []
  const porCrear = new Map<string, { datos: NuevoCliente; documentos: number; saldo: Centavos }>()
  const porTramo = tramosEnCero()
  const clientes = new Set<string>()
  let totalFilas = 0
  let total = 0

  for (let indice = filaEncabezado; indice < rejilla.length; indice++) {
    const fila = rejilla[indice]
    if (!fila) continue
    if (fila.every((valor) => (valor ?? '').trim() === '')) continue

    // El pie del reporte —«Procesado en: Mayo 25 2026 13:48»— ocupa solo la
    // primera celda de su fila. Se descarta por esa forma y no por estar al
    // final ni por su texto: una fila de datos a la que le falte el total tiene
    // que seguir dando error, no desaparecer en silencio.
    if (fila.slice(1).every((valor) => (valor ?? '').trim() === '')) continue

    const numeroFila = indice + 1
    const identificacionCruda = celda(fila, mapeo['identificacion'])
    const nombre = celda(fila, mapeo['nombre'])
    const documento = celda(fila, mapeo['documento'])

    totalFilas++

    const valor = interpretarCentavos(celda(fila, mapeo['total']))
    if (valor === undefined) {
      const visto = celda(fila, mapeo['total'])
      errores.push({
        numeroFila,
        motivo: visto === '' ? 'Sin total de cartera' : `El total «${visto}» no es un número`,
      })
      continue
    }

    const fechaVencimiento = interpretarFecha(celda(fila, mapeo['fechaVencimiento']))
    if (!fechaVencimiento) {
      const visto = celda(fila, mapeo['fechaVencimiento'])
      motivoDeFecha(errores, numeroFila, visto)
      continue
    }

    const identificacion = normalizarIdentificacion(identificacionCruda)
    if (identificacion === undefined && nombre === '') {
      errores.push({ numeroFila, motivo: 'Sin cliente: no hay identificación ni nombre' })
      continue
    }

    // --- comprobacion 1: las seis columnas tienen que dar el total.
    if (mapeo['total'] != null && mapeo['porVencer'] != null) {
      const suma =
        importe(fila, mapeo, 'vencido1a30') +
        importe(fila, mapeo, 'vencido31a60') +
        importe(fila, mapeo, 'vencido61a90') +
        importe(fila, mapeo, 'vencido91mas') +
        importe(fila, mapeo, 'porVencer') -
        importe(fila, mapeo, 'saldoAFavor')
      if (suma !== valor) {
        descuadres.push({
          numeroFila,
          documento,
          motivo: 'Las columnas de edades no suman el total de la fila',
        })
      }
    }

    // --- comprobacion 2: el tramo que se deriva tiene que ser el del archivo.
    const tramo = tramoDe(valor, fechaVencimiento, fechaCorte)
    const declarado = tramoDeclarado(fila, mapeo)
    if (declarado && declarado !== tramo) {
      descuadres.push({
        numeroFila,
        documento,
        motivo: `El archivo lo pone en «${declarado}» y por fecha corresponde a «${tramo}»`,
      })
    }

    const existente =
      (identificacion ? porIdentificacion.get(identificacion) : undefined) ??
      (nombre ? porNombre.get(normalizarParaConciliar(nombre)) : undefined)

    const clave = identificacion ?? normalizarParaConciliar(nombre)
    clientes.add(clave)

    let clienteId: Id | undefined
    if (existente) {
      clienteId = existente.id
    } else {
      const anotado = porCrear.get(clave)
      if (anotado) {
        anotado.documentos++
        anotado.saldo += valor
      } else {
        porCrear.set(clave, {
          documentos: 1,
          saldo: valor,
          datos: {
            codigo: identificacion ?? '',
            nombre: nombre || (identificacion ?? ''),
            identificacion,
            contactoPrincipal: celda(fila, mapeo['contacto']) || undefined,
            telefono: celda(fila, mapeo['telefono']) || undefined,
            estadoManual: 'cliente',
          },
        })
      }
      clienteId = clavePendiente(clave)
    }

    porTramo[tramo] += valor
    total += valor

    documentos.push({
      identificacion: identificacion ?? '',
      nombre: nombre || (identificacion ?? ''),
      documento,
      fechaVencimiento,
      valor,
      clienteId,
      contacto: celda(fila, mapeo['contacto']) || undefined,
      telefono: celda(fila, mapeo['telefono']) || undefined,
    })
  }

  return {
    fecha: fechaCorte,
    totalFilas,
    documentos,
    clientesPorCrear: [...porCrear.entries()].map(([clave, v]) => ({ clave, ...v })),
    errores,
    descuadres,
    total,
    porTramo,
    clientes: clientes.size,
  }
}

function motivoDeFecha(errores: ErrorDeFila[], numeroFila: number, visto: string): void {
  errores.push({
    numeroFila,
    motivo:
      visto === ''
        ? 'Sin fecha de vencimiento'
        : `No se entiende la fecha de vencimiento «${visto}»`,
  })
}

/**
 * Tramo que declara el archivo: la unica columna de edades con importe.
 *
 * Devuelve `undefined` cuando hay dos o ninguna, porque entonces no hay nada
 * que contrastar y afirmar un tramo seria inventarselo.
 */
function tramoDeclarado(fila: readonly string[], mapeo: MapeoDetectado): Tramo | undefined {
  if (importe(fila, mapeo, 'saldoAFavor') !== 0) return 'a_favor'
  const conValor = Object.entries(COLUMNA_DE_TRAMO).filter(
    ([, columna]) => mapeo[columna] != null && importe(fila, mapeo, columna) !== 0,
  )
  return conValor.length === 1 ? (conValor[0]![0] as Tramo) : undefined
}

export const CAMPOS_CARTERA = [
  {
    clave: 'identificacion',
    etiqueta: 'Identificación',
    sinonimos: ['identificacion', 'nit', 'cedula', 'documento cliente', 'cc'],
    requerido: false,
  },
  {
    clave: 'nombre',
    etiqueta: 'Cliente',
    sinonimos: ['cliente', 'nombre', 'razon social', 'nombre cliente'],
    requerido: false,
  },
  {
    clave: 'documento',
    etiqueta: 'Documento',
    sinonimos: ['documento', 'factura', 'numero documento', 'num documento', 'doc'],
    requerido: true,
  },
  {
    clave: 'fechaVencimiento',
    etiqueta: 'Fecha de vencimiento',
    sinonimos: ['fecha vencimiento', 'vencimiento', 'fecha vence', 'vence'],
    requerido: true,
  },
  {
    clave: 'vencido1a30',
    etiqueta: 'Vencido 1 a 30',
    sinonimos: ['vencido 1 a 30', 'vencido 1 30', '1 a 30', '1 30'],
    requerido: false,
  },
  {
    clave: 'vencido31a60',
    etiqueta: 'Vencido 31 a 60',
    sinonimos: ['vencido 31 a 60', 'vencido 31 60', '31 a 60', '31 60'],
    requerido: false,
  },
  {
    clave: 'vencido61a90',
    etiqueta: 'Vencido 61 a 90',
    sinonimos: ['vencido 61 a 90', 'vencido 61 90', '61 a 90', '61 90'],
    requerido: false,
  },
  {
    clave: 'vencido91mas',
    etiqueta: 'Vencido más de 91',
    sinonimos: ['vencido mas de 91', 'vencido 91', 'mas de 91', 'mayor a 90', '91 o mas'],
    requerido: false,
  },
  {
    clave: 'porVencer',
    etiqueta: 'Saldo por vencer',
    sinonimos: ['saldo por vencer', 'por vencer', 'corriente', 'no vencido'],
    requerido: false,
  },
  {
    clave: 'saldoAFavor',
    etiqueta: 'Saldo a favor',
    sinonimos: ['saldo a favor', 'a favor', 'anticipo', 'credito'],
    requerido: false,
  },
  {
    clave: 'total',
    etiqueta: 'Total cartera',
    sinonimos: ['total cartera', 'total', 'saldo', 'saldo total', 'valor'],
    requerido: true,
  },
  {
    clave: 'contacto',
    etiqueta: 'Contacto',
    sinonimos: ['contacto', 'persona contacto', 'nombre contacto'],
    requerido: false,
  },
  {
    clave: 'telefono',
    etiqueta: 'Teléfono',
    sinonimos: ['telefono', 'celular', 'movil', 'tel'],
    requerido: false,
  },
] as const

/** Lo que ninguna columna comprueba por si sola. */
export function faltantesCartera(mapeo: MapeoDetectado): string[] {
  const faltan: string[] = []
  if (mapeo['identificacion'] == null && mapeo['nombre'] == null) {
    faltan.push('Falta la identificación o el nombre del cliente')
  }
  if (mapeo['fechaVencimiento'] == null) {
    faltan.push('Falta la fecha de vencimiento: sin ella no se puede calcular la edad del saldo')
  }
  if (mapeo['total'] == null) {
    faltan.push('Falta la columna del total de cartera')
  }
  return faltan
}
