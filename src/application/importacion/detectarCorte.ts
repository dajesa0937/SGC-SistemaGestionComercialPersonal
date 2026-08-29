import type { FechaISO } from '@/domain/shared/types'
import { interpretarFecha } from '@/domain/shared/interpretarPeriodo'
import type { Rejilla } from './analizarMaestroClientes'

/** Datos de cabecera del reporte de cuentas por cobrar. */
export interface CabeceraCorte {
  fecha?: FechaISO
  empresa?: string
  nit?: string
  procesadoEn?: string
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/**
 * Lee la fecha de la linea «Procesado en: Mayo 25 2026 13:48».
 *
 * El mes viene escrito en espanol y el dia antes del ano, que no es ninguno de
 * los formatos que entiende `interpretarFecha`. Se acepta tambien la forma
 * numerica por si la empresa cambia la plantilla.
 */
export function interpretarFechaDeProceso(texto: string): FechaISO | undefined {
  const limpio = texto
    .replace(/^.*?:/, '')
    .normalize('NFD')
    // Escrito con escapes a proposito: los combinantes literales son
    // invisibles en el editor y ya han roto este mismo patron dos veces.
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  const conNombre = /^([a-zA-Z]+)\s+(\d{1,2})\s+(\d{4})/.exec(limpio)
  if (conNombre) {
    const mes = MESES.indexOf(conNombre[1]!.toLowerCase())
    const dia = Number(conNombre[2])
    const anio = Number(conNombre[3])
    if (mes >= 0 && dia >= 1 && dia <= 31) {
      return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    }
  }

  return interpretarFecha(limpio)
}

/**
 * Reconoce el bloque de titulo y el pie del reporte de cuentas por cobrar.
 *
 * El archivo real trae seis filas antes del encabezado —titulo, razon social,
 * NIT— y una fila suelta al final con la fecha de proceso. Nada de eso es una
 * columna, asi que ninguna deteccion de columnas lo encuentra: hay que leerlo
 * como texto suelto.
 *
 * Si algo falta, se devuelve sin ese campo. La fecha del corte es lo unico que
 * la importacion necesita de verdad, y quien importa puede escribirla a mano.
 */
export function detectarCabeceraCorte(rejilla: Rejilla, filaEncabezado: number): CabeceraCorte {
  const cabecera: CabeceraCorte = {}

  for (let i = 0; i < rejilla.length; i++) {
    const fila = rejilla[i]
    if (!fila) continue
    const texto = (fila[0] ?? '').trim()
    if (texto === '') continue

    if (/^procesado\s+en/i.test(texto)) {
      cabecera.procesadoEn = texto
      cabecera.fecha = interpretarFechaDeProceso(texto)
      continue
    }

    // Solo el bloque de titulo, antes del encabezado de columnas.
    if (i >= filaEncabezado) continue
    // El NIT del emisor: nueve o diez digitos con guion y digito de verificacion.
    if (/^\d[\d.]{6,}-?\d?$/.test(texto)) {
      cabecera.nit ??= texto
    } else if (!/cuentas?\s+por\s+cobrar|cartera/i.test(texto)) {
      cabecera.empresa ??= texto
    }
  }

  return cabecera
}
