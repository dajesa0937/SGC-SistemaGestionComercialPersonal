import type { ArchivoTabular, LectorTabular } from '@/domain/archivos/lector-tabular'
import { FormatoNoSoportadoError } from '@/domain/shared/errores'
import { leerCsv } from '@/lib/csv'

function aTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  if (valor instanceof Date) {
    const mes = String(valor.getMonth() + 1).padStart(2, '0')
    const dia = String(valor.getDate()).padStart(2, '0')
    return `${valor.getFullYear()}-${mes}-${dia}`
  }
  if (typeof valor === 'number') return String(valor)
  if (typeof valor === 'boolean') return valor ? 'true' : 'false'
  return String(valor)
}

/**
 * Rellena las filas cortas para que la rejilla sea rectangular.
 *
 * Sin esto, el indice de una columna significaria cosas distintas segun la
 * fila y el mapeo leeria datos equivocados en silencio.
 */
function rectangular(filas: readonly (readonly unknown[])[]): string[][] {
  const ancho = filas.reduce((max, fila) => Math.max(max, fila.length), 0)
  return filas.map((fila) => {
    const texto = fila.map(aTexto)
    while (texto.length < ancho) texto.push('')
    return texto
  })
}

class LectorTabularNavegador implements LectorTabular {
  async abrir(archivo: File): Promise<ArchivoTabular> {
    const extension = (archivo.name.split('.').pop() ?? '').toLowerCase()

    if (extension === 'csv' || extension === 'txt') {
      const rejilla = rectangular(leerCsv(await archivo.text()))
      return {
        nombre: archivo.name,
        hojas: ['Datos'],
        leerHoja: async () => rejilla,
      }
    }

    if (extension !== 'xlsx') throw new FormatoNoSoportadoError(`.${extension}`)

    // Carga diferida: el lector de XLSX solo pesa para quien entra a importar.
    const { default: leerXlsx } = await import('read-excel-file/browser')

    // Una sola lectura devuelve todas las hojas con sus datos, asi que se
    // convierten aqui y no se vuelve a tocar el archivo al cambiar de hoja.
    const hojas = await leerXlsx(archivo)
    const rejillas = new Map(hojas.map((hoja) => [hoja.sheet, rectangular(hoja.data)]))

    return {
      nombre: archivo.name,
      hojas: [...rejillas.keys()],
      leerHoja: async (nombre: string) => rejillas.get(nombre) ?? [],
    }
  }
}

export function crearLectorTabular(): LectorTabular {
  return new LectorTabularNavegador()
}
