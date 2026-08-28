/**
 * Genera el mapa de departamentos de Colombia.
 *
 * Fuente: paquete npm `@svg-maps/colombia` (VictorCazanave/svg-maps),
 * **CC BY 4.0**. La licencia obliga a dar crédito, y el crédito aparece tanto
 * en el archivo generado como debajo del mapa en la aplicación.
 *
 * El resultado se versiona: la aplicación no descarga geometría en tiempo de
 * ejecución, porque tiene que funcionar sin conexión. Para regenerarlo:
 *
 *   npm install && npm run mapa
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const mapa = require('@svg-maps/colombia').default ?? require('@svg-maps/colombia')

const DESTINO = path.join(process.cwd(), 'src/domain/geografia/mapa.generado.ts')

/**
 * Correspondencia entre el identificador del paquete y el código DANE.
 *
 * Se escribe a mano y una sola vez, con los 33 departamentos, porque el paquete
 * usa abreviaturas propias («nsa», «vac») y algunos nombres difieren del
 * oficial: «Guaviar» por Guaviare y «North Santander» por Norte de Santander.
 * Emparejar por nombre fallaría justo en esos.
 */
const CODIGO_DANE = {
  ama: '91', // Amazonas
  ant: '05', // Antioquia
  ara: '81', // Arauca
  atl: '08', // Atlántico
  dc: '11', // Bogotá, D.C.
  bol: '13', // Bolívar
  boy: '15', // Boyacá
  cal: '17', // Caldas
  caq: '18', // Caquetá
  cas: '85', // Casanare
  cau: '19', // Cauca
  ces: '20', // Cesar
  cho: '27', // Chocó
  cor: '23', // Córdoba
  cun: '25', // Cundinamarca
  gua: '94', // Guainía
  guv: '95', // Guaviare
  hui: '41', // Huila
  lag: '44', // La Guajira
  mag: '47', // Magdalena
  met: '50', // Meta
  nar: '52', // Nariño
  nsa: '54', // Norte de Santander
  put: '86', // Putumayo
  qui: '63', // Quindío
  ris: '66', // Risaralda
  sap: '88', // Archipiélago de San Andrés, Providencia y Santa Catalina
  san: '68', // Santander
  suc: '70', // Sucre
  tol: '73', // Tolima
  vac: '76', // Valle del Cauca
  vid: '99', // Vichada
  vau: '97', // Vaupés
}

/**
 * Centro aproximado de un trazado, para colocar su etiqueta.
 *
 * Recorre el `d` acumulando los puntos finales de cada comando —los de control
 * de las curvas se ignoran, que para centrar una etiqueta sobran— y devuelve el
 * centro de la caja que los contiene. No es el centroide geométrico exacto y no
 * necesita serlo: solo tiene que caer dentro del departamento, y se comprueba
 * mirando el mapa dibujado.
 */
function centroAproximado(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? []
  const puntos = []
  let x = 0
  let y = 0
  let inicioX = 0
  let inicioY = 0
  let comando = ''
  let i = 0

  const num = () => Number(tokens[i++])
  const empujar = () => puntos.push([x, y])

  while (i < tokens.length) {
    const t = tokens[i]
    if (/^[a-zA-Z]$/.test(t)) {
      comando = t
      i++
    }
    const rel = comando === comando.toLowerCase()
    switch (comando.toLowerCase()) {
      case 'm': {
        const dx = num()
        const dy = num()
        x = rel ? x + dx : dx
        y = rel ? y + dy : dy
        inicioX = x
        inicioY = y
        empujar()
        comando = rel ? 'l' : 'L'
        break
      }
      case 'l': {
        const dx = num()
        const dy = num()
        x = rel ? x + dx : dx
        y = rel ? y + dy : dy
        empujar()
        break
      }
      case 'h': {
        const dx = num()
        x = rel ? x + dx : dx
        empujar()
        break
      }
      case 'v': {
        const dy = num()
        y = rel ? y + dy : dy
        empujar()
        break
      }
      case 'c': {
        i += 4 // dos puntos de control
        const dx = num()
        const dy = num()
        x = rel ? x + dx : dx
        y = rel ? y + dy : dy
        empujar()
        break
      }
      case 's':
      case 'q': {
        i += 2
        const dx = num()
        const dy = num()
        x = rel ? x + dx : dx
        y = rel ? y + dy : dy
        empujar()
        break
      }
      case 't': {
        const dx = num()
        const dy = num()
        x = rel ? x + dx : dx
        y = rel ? y + dy : dy
        empujar()
        break
      }
      case 'a': {
        i += 5
        const dx = num()
        const dy = num()
        x = rel ? x + dx : dx
        y = rel ? y + dy : dy
        empujar()
        break
      }
      case 'z': {
        x = inicioX
        y = inicioY
        break
      }
      default:
        i++
    }
  }

  if (puntos.length === 0) throw new Error('Trazado sin puntos')
  const xs = puntos.map((p) => p[0])
  const ys = puntos.map((p) => p[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  return { cx: Number(cx.toFixed(1)), cy: Number(cy.toFixed(1)) }
}

const departamentos = mapa.locations
  .map((region) => {
    const codigo = CODIGO_DANE[region.id]
    if (!codigo) throw new Error(`Sin código DANE para «${region.id}» (${region.name})`)
    const path = region.path.replace(/\s+/g, ' ').trim()
    return { codigo, id: region.id, path, ...centroAproximado(path) }
  })
  .sort((a, b) => a.codigo.localeCompare(b.codigo))

const codigos = new Set(departamentos.map((d) => d.codigo))
if (codigos.size !== departamentos.length) throw new Error('Hay códigos DANE repetidos')
if (departamentos.length !== 33) throw new Error(`Se esperaban 33 departamentos, hay ${departamentos.length}`)

const contenido = `/**
 * ARCHIVO GENERADO. No editar a mano.
 *
 * Trazados de los ${departamentos.length} departamentos de Colombia, indexados por código DANE.
 * Se regenera con \`npm run mapa\`. Ver \`docs/adr/0009-mapa-de-cobertura.md\`.
 *
 * ---------------------------------------------------------------------------
 * Geometría: «${mapa.label}» de VictorCazanave/svg-maps
 * Licencia:  Creative Commons Attribution 4.0 (CC BY 4.0)
 *            https://creativecommons.org/licenses/by/4.0/
 *            https://github.com/VictorCazanave/svg-maps
 *
 * La atribución es obligatoria y aparece también bajo el mapa en la
 * aplicación. No la quites.
 * ---------------------------------------------------------------------------
 */

/** Sistema de coordenadas del mapa. Todo trazado está dentro de esta caja. */
export const VISTA_MAPA = '${mapa.viewBox}'

export interface TrazadoDepartamento {
  /** Código DANE de dos dígitos. */
  readonly codigo: string
  readonly path: string
  /** Punto donde colocar la etiqueta, en el sistema del \`viewBox\`. */
  readonly cx: number
  readonly cy: number
}

export const DEPARTAMENTOS_MAPA: readonly TrazadoDepartamento[] = [
${departamentos.map((d) => `  { codigo: '${d.codigo}', cx: ${d.cx}, cy: ${d.cy}, path: '${d.path}' },`).join('\n')}
]
`

fs.mkdirSync(path.dirname(DESTINO), { recursive: true })
fs.writeFileSync(DESTINO, contenido, 'utf8')
console.log(
  `Mapa generado: ${departamentos.length} departamentos, ${(contenido.length / 1024).toFixed(1)} KB`,
)
