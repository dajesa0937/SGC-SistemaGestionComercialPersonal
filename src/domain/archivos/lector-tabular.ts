/**
 * Puerto de lectura de archivos tabulares.
 *
 * `File` es un tipo estandar del entorno de ejecucion (existe tanto en el
 * navegador como en Node desde la version 20), no la API de una libreria: el
 * dominio puede depender de el sin comprometer la migracion.
 */
export interface ArchivoTabular {
  readonly nombre: string
  readonly hojas: readonly string[]
  /** Devuelve la hoja como rejilla rectangular de texto. */
  leerHoja(hoja: string): Promise<string[][]>
}

export interface LectorTabular {
  abrir(archivo: File): Promise<ArchivoTabular>
}
