/**
 * Genera el catálogo de municipios de Colombia (DIVIPOLA del DANE).
 *
 * El resultado se versiona en el repositorio: la aplicación no depende en
 * tiempo de ejecución de ningún paquete de terceros para algo tan estable como
 * la división político-administrativa del país. Para regenerarlo:
 *
 *   npm install && npm run municipios
 *
 * Fuente: paquete npm `divipola` (1.0.3), contrastado contra los 31 códigos
 * reales del archivo de clientes. Ver `docs/adr/0007-geografia-dane.md`.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const crudo = require('divipola')

const DESTINO = path.join(process.cwd(), 'src/domain/geografia/municipios.generado.ts')

/** Palabras que en español no se capitalizan dentro de un nombre propio. */
const MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'el', 'en'])

function titulo(texto) {
  return texto
    .toLocaleLowerCase('es-CO')
    .split(/\s+/)
    .map((palabra, i) =>
      i > 0 && MENORES.has(palabra)
        ? palabra
        : palabra.replace(/^[\p{Ll}]/u, (c) => c.toLocaleUpperCase('es-CO')),
    )
    .join(' ')
}

/**
 * Correcciones a la fuente. Se listan una por una y con su motivo: un catálogo
 * corregido a ciegas es un catálogo en el que nadie confía.
 */
const CORRECCIONES = {
  // La fuente separa con punto lo que oficialmente lleva coma.
  '11001': 'Bogotá, D.C.',
  // Municipio de Chocó segregado de Riosucio en diciembre de 2022, posterior a
  // la versión de la fuente. Aparece en datos reales (un cliente del maestro).
  '27086': 'Belén de Bajirá',
}
const CORRECCIONES_DEPTO = {
  '11': 'Bogotá, D.C.',
  '88': 'Archipiélago de San Andrés, Providencia y Santa Catalina',
}

const municipios = new Map()
const departamentos = new Map()

for (const { mpioCode, mpioName, deptoName } of crudo) {
  municipios.set(mpioCode, titulo(mpioName))
  departamentos.set(mpioCode.slice(0, 2), titulo(deptoName))
}
for (const [codigo, nombre] of Object.entries(CORRECCIONES)) municipios.set(codigo, nombre)
for (const [codigo, nombre] of Object.entries(CORRECCIONES_DEPTO)) departamentos.set(codigo, nombre)

/** Comilla simple, como el resto del proyecto. */
function cita(texto) {
  return `'${texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

const ordenMun = [...municipios.entries()].sort((a, b) => a[0].localeCompare(b[0]))
const ordenDep = [...departamentos.entries()].sort((a, b) => a[0].localeCompare(b[0]))

const contenido = `/**
 * ARCHIVO GENERADO. No editar a mano.
 *
 * Catálogo DIVIPOLA del DANE: ${ordenMun.length} municipios, ${ordenDep.length} departamentos.
 * Se regenera con \`npm run municipios\`. Ver \`docs/adr/0007-geografia-dane.md\`.
 */

/** Nombre de cada departamento, por los dos primeros dígitos del código DANE. */
export const DEPARTAMENTOS: Readonly<Record<string, string>> = {
${ordenDep.map(([c, n]) => `  '${c}': ${cita(n)},`).join('\n')}
}

/** Nombre de cada municipio, por su código DANE de cinco dígitos. */
export const MUNICIPIOS: Readonly<Record<string, string>> = {
${ordenMun.map(([c, n]) => `  '${c}': ${cita(n)},`).join('\n')}
}
`

fs.mkdirSync(path.dirname(DESTINO), { recursive: true })
fs.writeFileSync(DESTINO, contenido, 'utf8')
console.log(
  `Catálogo generado: ${ordenMun.length} municipios, ${ordenDep.length} departamentos, ${(contenido.length / 1024).toFixed(1)} KB`,
)
