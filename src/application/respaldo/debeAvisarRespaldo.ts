/**
 * ¿Hay que recordarle al usuario que respalde?
 *
 * Vive aquí y no dentro del componente porque es la única regla de negocio del
 * aviso, y una regla que no se puede probar sin montar un navegador es una
 * regla que en la práctica nadie prueba.
 */
export interface DatosAviso {
  /** Fecha ISO del último respaldo descargado. `null` si nunca se hizo uno. */
  readonly ultimo: string | null
  readonly diasDesdeUltimo: number | null
  readonly hayDatos: boolean
}

export type MotivoAviso = 'nunca' | 'vencido' | null

export function motivoAvisoRespaldo(datos: DatosAviso, diasUmbral: number): MotivoAviso {
  // Una base vacía no tiene nada que perder: avisar ahí solo enseña a ignorar
  // el aviso antes de que importe.
  if (!datos.hayDatos) return null
  if (datos.ultimo === null) return 'nunca'
  if (datos.diasDesdeUltimo !== null && datos.diasDesdeUltimo >= diasUmbral) return 'vencido'
  return null
}
