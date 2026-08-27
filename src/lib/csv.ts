/**
 * Lector de CSV.
 *
 * Se escribe a mano en lugar de anadir una dependencia porque el problema esta
 * acotado y se puede cubrir con pruebas: comillas, separadores dentro de
 * comillas, saltos de linea dentro de celdas, comillas escapadas, BOM y
 * deteccion del separador (los Excel en espanol exportan con punto y coma).
 */

/** Detecta el separador contando ocurrencias fuera de comillas en la primera linea. */
export function detectarSeparador(texto: string): string {
  const primeraLinea = texto.split(/\r?\n/, 1)[0] ?? ''
  const candidatos = [';', ',', '\t', '|']
  let mejor = ','
  let maximo = 0

  for (const candidato of candidatos) {
    let cuenta = 0
    let enComillas = false
    for (const caracter of primeraLinea) {
      if (caracter === '"') enComillas = !enComillas
      else if (caracter === candidato && !enComillas) cuenta++
    }
    if (cuenta > maximo) {
      maximo = cuenta
      mejor = candidato
    }
  }
  return mejor
}

/**
 * Convierte texto CSV en una rejilla de celdas.
 *
 * Devuelve siempre texto: la interpretacion de numeros y fechas depende del
 * mapeo que elija el usuario y se hace mas adelante, no aqui.
 */
export function leerCsv(texto: string, separador?: string): string[][] {
  const contenido = texto.replace(/^\uFEFF/, '')
  const sep = separador ?? detectarSeparador(contenido)

  const filas: string[][] = []
  let fila: string[] = []
  let celda = ''
  let enComillas = false

  for (let i = 0; i < contenido.length; i++) {
    const caracter = contenido[i]

    if (enComillas) {
      if (caracter === '"') {
        if (contenido[i + 1] === '"') {
          celda += '"'
          i++
        } else {
          enComillas = false
        }
      } else {
        celda += caracter
      }
      continue
    }

    if (caracter === '"') {
      enComillas = true
    } else if (caracter === sep) {
      fila.push(celda)
      celda = ''
    } else if (caracter === '\n') {
      fila.push(celda)
      filas.push(fila)
      fila = []
      celda = ''
    } else if (caracter === '\r') {
      // Se ignora: el salto real lo marca el \n que viene detras.
    } else {
      celda += caracter
    }
  }

  if (celda !== '' || fila.length > 0) {
    fila.push(celda)
    filas.push(fila)
  }

  // Una linea final vacia no es una fila.
  return filas.filter((f) => !(f.length === 1 && f[0] === ''))
}
