/**
 * Envoltorio de la API de almacenamiento del navegador.
 *
 * Mitigacion parcial del riesgo R-02: sin permiso persistente, el navegador
 * puede descartar IndexedDB cuando necesite espacio. No sustituye al respaldo
 * manual, que sigue siendo la unica garantia real.
 */
export async function solicitarAlmacenamientoPersistente(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function almacenamientoEsPersistente(): Promise<boolean> {
  if (!navigator.storage?.persisted) return false
  try {
    return await navigator.storage.persisted()
  } catch {
    return false
  }
}
