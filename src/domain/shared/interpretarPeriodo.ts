import type { FechaISO, Periodo } from './types'
import { crearPeriodo, esPeriodoValido } from './periodo'

const MESES: Readonly<Record<string, number>> = {
  ene: 1, enero: 1,
  feb: 2, febrero: 2,
  mar: 3, marzo: 3,
  abr: 4, abril: 4,
  may: 5, mayo: 5,
  jun: 6, junio: 6,
  jul: 7, julio: 7,
  ago: 8, agosto: 8,
  sep: 9, sept: 9, septiembre: 9, setiembre: 9,
  oct: 10, octubre: 10,
  nov: 11, noviembre: 11,
  dic: 12, diciembre: 12,
}

function sinTildes(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Fecha del dia cero de Excel para el sistema de 1900.
 *
 * Excel numera los dias desde el 1 de enero de 1900 y arrastra un error
 * historico: cree que 1900 fue bisiesto. Por eso el origen efectivo es el 30 de
 * diciembre de 1899 y no el 31.
 */
const ORIGEN_EXCEL = Date.UTC(1899, 11, 30)

/**
 * Interpreta lo que venga en una columna de fecha o de periodo.
 *
 * Los archivos reales traen la misma informacion de formas incompatibles:
 * `2026-04-07`, `07/04/2026`, `2026-04`, `Abr 2026`, `abril de 2026` o incluso
 * el numero de serie de Excel cuando la celda perdio su formato. Aceptarlas
 * todas es la diferencia entre importar y pelear con el archivo.
 *
 * Devuelve `undefined` en vez de adivinar cuando el valor es ambiguo o no
 * reconocible: una fecha mal interpretada mueve ventas de mes en silencio.
 */
export function interpretarPeriodo(valor: string): Periodo | undefined {
  const texto = valor.trim()
  if (texto === '') return undefined

  // 2026-04 tal cual
  if (esPeriodoValido(texto)) return texto

  // 2026-04-07 o 2026/04/07
  const iso = /^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/.exec(texto)
  if (iso) return periodoSeguro(Number(iso[1]), Number(iso[2]))

  // 07/04/2026 y 07-04-2026. Se asume dia/mes/ano, que es lo que usa Colombia.
  const latino = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(texto)
  if (latino) return periodoSeguro(Number(latino[3]), Number(latino[2]))

  // 04/2026 y 04-2026
  const mesAnio = /^(\d{1,2})[-/](\d{4})$/.exec(texto)
  if (mesAnio) return periodoSeguro(Number(mesAnio[2]), Number(mesAnio[1]))

  // Abr 2026, abril de 2026, ABRIL-2026
  const conNombre = /^([a-zA-ZñÑáéíóúÁÉÍÓÚ]+)\s*(?:de\s+|[-/ ])\s*(\d{4})$/.exec(texto)
  if (conNombre) {
    const mes = MESES[sinTildes(conNombre[1]!)]
    if (mes) return periodoSeguro(Number(conNombre[2]), mes)
  }

  // 2026 Abr
  const anioMes = /^(\d{4})\s*[-/ ]\s*([a-zA-ZñÑáéíóúÁÉÍÓÚ]+)$/.exec(texto)
  if (anioMes) {
    const mes = MESES[sinTildes(anioMes[2]!)]
    if (mes) return periodoSeguro(Number(anioMes[1]), mes)
  }

  // Numero de serie de Excel. Se acota a un rango razonable para no confundir
  // un importe con una fecha: 20000 es 1954 y 60000 es 2064.
  const serie = /^\d{5}(?:\.\d+)?$/.exec(texto)
  if (serie) {
    const dias = Number(texto)
    if (dias >= 20_000 && dias <= 60_000) {
      const fecha = new Date(ORIGEN_EXCEL + Math.floor(dias) * 86_400_000)
      return periodoSeguro(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1)
    }
  }

  return undefined
}

/** Fecha completa cuando el valor la trae; `undefined` si solo hay mes y ano. */
export function interpretarFecha(valor: string): FechaISO | undefined {
  const texto = valor.trim()

  const iso = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(texto)
  if (iso) return fechaSegura(Number(iso[1]), Number(iso[2]), Number(iso[3]))

  const latino = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(texto)
  if (latino) return fechaSegura(Number(latino[3]), Number(latino[2]), Number(latino[1]))

  const serie = /^\d{5}(?:\.\d+)?$/.exec(texto)
  if (serie) {
    const dias = Number(texto)
    if (dias >= 20_000 && dias <= 60_000) {
      const fecha = new Date(ORIGEN_EXCEL + Math.floor(dias) * 86_400_000)
      return fechaSegura(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, fecha.getUTCDate())
    }
  }

  return undefined
}

function periodoSeguro(anio: number, mes: number): Periodo | undefined {
  if (!Number.isInteger(anio) || !Number.isInteger(mes)) return undefined
  if (anio < 1900 || anio > 2200 || mes < 1 || mes > 12) return undefined
  return crearPeriodo(anio, mes)
}

function fechaSegura(anio: number, mes: number, dia: number): FechaISO | undefined {
  if (periodoSeguro(anio, mes) === undefined) return undefined
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) return undefined
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}
