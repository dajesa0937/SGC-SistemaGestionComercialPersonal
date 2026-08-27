/**
 * Genera los iconos PNG de la PWA sin dependencias externas.
 *
 * Dibuja directamente sobre un buffer de pixeles y codifica el PNG con el
 * modulo zlib de Node. Se prefiere esto a arrastrar una libreria de imagenes
 * para producir dos archivos que casi nunca cambian.
 *
 * Uso: npm run iconos
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = join(RAIZ, 'public', 'icons')

const FONDO = [0x0e, 0x6a, 0x62]
const BARRAS = [
  { x: 0.22, y: 0.56, ancho: 0.14, alto: 0.22, alfa: 0.6 },
  { x: 0.43, y: 0.4, ancho: 0.14, alto: 0.38, alfa: 0.8 },
  { x: 0.64, y: 0.22, ancho: 0.14, alto: 0.56, alfa: 1 },
]

function mezclar(fondo, alfa) {
  return Math.round(fondo * (1 - alfa) + 255 * alfa)
}

function dibujar(lado) {
  // Cuatro canales por pixel mas un byte de filtro al inicio de cada fila.
  const filas = Buffer.alloc((lado * 4 + 1) * lado)

  for (let y = 0; y < lado; y++) {
    const inicio = y * (lado * 4 + 1)
    filas[inicio] = 0 // filtro "none"

    for (let x = 0; x < lado; x++) {
      let [r, g, b] = FONDO

      for (const barra of BARRAS) {
        const x0 = barra.x * lado
        const x1 = (barra.x + barra.ancho) * lado
        const y0 = barra.y * lado
        const y1 = (barra.y + barra.alto) * lado
        if (x >= x0 && x < x1 && y >= y0 && y < y1) {
          r = mezclar(r, barra.alfa)
          g = mezclar(g, barra.alfa)
          b = mezclar(b, barra.alfa)
        }
      }

      const p = inicio + 1 + x * 4
      filas[p] = r
      filas[p + 1] = g
      filas[p + 2] = b
      filas[p + 3] = 255
    }
  }

  return filas
}

function crc32(buffer) {
  let c
  const tabla = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabla[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const byte of buffer) crc = tabla[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function bloque(tipo, datos) {
  const longitud = Buffer.alloc(4)
  longitud.writeUInt32BE(datos.length)
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos])
  const suma = Buffer.alloc(4)
  suma.writeUInt32BE(crc32(cuerpo))
  return Buffer.concat([longitud, cuerpo, suma])
}

function png(lado) {
  const firma = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(lado, 0)
  ihdr.writeUInt32BE(lado, 4)
  ihdr[8] = 8 // profundidad de bits
  ihdr[9] = 6 // color RGBA
  return Buffer.concat([
    firma,
    bloque('IHDR', ihdr),
    bloque('IDAT', deflateSync(dibujar(lado), { level: 9 })),
    bloque('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(DESTINO, { recursive: true })
for (const lado of [192, 512]) {
  const archivo = join(DESTINO, `icon-${lado}.png`)
  writeFileSync(archivo, png(lado))
  console.log(`icono generado: public/icons/icon-${lado}.png`)
}
