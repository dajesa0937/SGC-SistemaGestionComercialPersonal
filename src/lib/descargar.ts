/**
 * Descarga de archivos generados en el navegador.
 *
 * Se le antepone el BOM a los CSV porque, sin el, Excel en Windows abre el
 * archivo en Latin-1 y convierte «Ibagué» en «IbaguÃ©».
 */
export function descargarTexto(nombreArchivo: string, contenido: string, tipo: string): void {
  const bom = tipo.includes('csv') ? '\uFEFF' : ''
  const blob = new Blob([bom + contenido], { type: `${tipo};charset=utf-8` })
  const url = URL.createObjectURL(blob)

  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)

  // Se libera en el siguiente ciclo: revocarlo de inmediato cancela la descarga
  // en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function descargarCsv(nombreArchivo: string, contenido: string): void {
  descargarTexto(nombreArchivo, contenido, 'text/csv')
}

/** Nombre de archivo con la fecha de hoy, sin caracteres problemáticos. */
export function nombreConFecha(base: string, extension: string): string {
  const hoy = new Date()
  const fecha = [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, '0'),
    String(hoy.getDate()).padStart(2, '0'),
  ].join('-')
  const limpio = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `${limpio}-${fecha}.${extension}`
}
