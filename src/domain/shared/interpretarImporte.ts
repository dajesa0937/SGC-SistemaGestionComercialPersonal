import type { Pesos } from './types'

/**
 * Interpreta un importe escrito como lo escriben los archivos reales.
 *
 * En Colombia el punto separa miles y la coma decimales (`1.648.997,93`), pero
 * los sistemas exportan a menudo en formato ingles (`1648997.93`) y a veces con
 * el signo entre parentesis para los negativos. Confundir un separador con otro
 * multiplica o divide por mil sin avisar, asi que la regla es explicita:
 *
 * - si aparecen los dos, el ULTIMO en aparecer es el decimal;
 * - si aparece uno solo y deja exactamente tres digitos a la derecha, es
 *   separador de miles (`1.648` son mil seiscientos cuarenta y ocho);
 * - si aparece uno solo y deja otra cantidad, es decimal.
 *
 * El caso ambiguo de verdad —`1.648` -> mil seiscientos o uno con seiscientos
 * cuarenta y ocho— se resuelve a favor de miles porque es lo que significa en
 * un archivo colombiano de importes.
 */
export function interpretarImporte(valor: string): Pesos | undefined {
  let texto = valor.trim()
  if (texto === '') return undefined

  let negativo = false
  if (/^\(.*\)$/.test(texto)) {
    negativo = true
    texto = texto.slice(1, -1)
  }

  // El espacio duro (\u00a0) aparece de verdad: es el separador de miles que
  // usa Excel al exportar con formato de moneda.
  texto = texto.replace(/[$\s\u00a0]/g, '')
  if (texto.startsWith('-')) {
    negativo = true
    texto = texto.slice(1)
  }
  if (texto === '' || /[^\d.,]/.test(texto)) return undefined

  const ultimoPunto = texto.lastIndexOf('.')
  const ultimaComa = texto.lastIndexOf(',')

  let decimal = ''
  if (ultimoPunto !== -1 && ultimaComa !== -1) {
    decimal = ultimoPunto > ultimaComa ? '.' : ','
  } else if (ultimoPunto !== -1 || ultimaComa !== -1) {
    const separador = ultimoPunto !== -1 ? '.' : ','
    const posicion = Math.max(ultimoPunto, ultimaComa)
    const derecha = texto.length - posicion - 1
    const apariciones = texto.split(separador).length - 1
    // Un decimal aparece una sola vez: si el separador se repite, son miles.
    // Con una sola aparicion, tres digitos a la derecha tambien son miles.
    decimal = apariciones > 1 || derecha === 3 ? '' : separador
  }

  const limpio =
    decimal === ''
      ? texto.replace(/[.,]/g, '')
      : texto
          .split(decimal)
          .map((parte, i) => (i === 0 ? parte.replace(/[.,]/g, '') : parte))
          .join('.')

  const numero = Number(limpio)
  if (!Number.isFinite(numero)) return undefined

  return negativo ? -numero : numero
}
