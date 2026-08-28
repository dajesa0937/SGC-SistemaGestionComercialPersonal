/**
 * Normalizacion del NIT o la cedula.
 *
 * Los archivos de la empresa escriben el mismo numero de varias formas:
 * `901593129-3`, `901.593.129`, `901593129`. Son el mismo cliente. Se guarda
 * siempre la forma canonica —solo digitos, sin digito de verificacion— porque
 * de eso depende que reimportar no duplique clientes.
 *
 * El digito de verificacion se descarta a proposito: es redundante (se calcula
 * a partir del numero) y es justo la parte que unos reportes traen y otros no.
 */
export function normalizarIdentificacion(valor: unknown): string | undefined {
  if (valor === null || valor === undefined) return undefined

  const texto = String(valor).trim()
  if (texto === '') return undefined

  // Si viene con guion, lo de la derecha es el digito de verificacion.
  const sinVerificacion = texto.includes('-') ? texto.slice(0, texto.lastIndexOf('-')) : texto
  const digitos = sinVerificacion.replace(/\D/g, '')

  return digitos === '' ? undefined : digitos
}

/**
 * Digito de verificacion del NIT segun la formula de la DIAN.
 *
 * Solo se usa para mostrarlo; nunca para rechazar una identificacion. Un
 * archivo con un digito mal escrito no es motivo para perder un cliente.
 */
export function digitoVerificacion(nit: string): number | undefined {
  const digitos = nit.replace(/\D/g, '')
  if (digitos === '' || digitos.length > 15) return undefined

  const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
  let suma = 0
  for (let i = 0; i < digitos.length; i++) {
    const digito = Number(digitos[digitos.length - 1 - i])
    suma += digito * (PESOS[i] ?? 0)
  }
  const resto = suma % 11
  return resto > 1 ? 11 - resto : resto
}

/** `901593129-3`. Devuelve el numero tal cual si no se puede calcular el digito. */
export function formatearIdentificacion(identificacion: string): string {
  const dv = digitoVerificacion(identificacion)
  return dv === undefined ? identificacion : `${identificacion}-${dv}`
}
