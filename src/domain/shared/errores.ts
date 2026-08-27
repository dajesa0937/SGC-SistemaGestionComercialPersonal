/**
 * Errores de dominio.
 *
 * La capa de presentacion los traduce a mensajes en espanol entendibles.
 * Nunca se muestra al usuario un stack trace ni un mensaje en ingles.
 */

export abstract class ErrorDeDominio extends Error {
  abstract readonly codigo: string

  constructor(mensaje: string) {
    super(mensaje)
    this.name = new.target.name
  }
}

export class PeriodoInvalidoError extends ErrorDeDominio {
  readonly codigo = 'PERIODO_INVALIDO'

  constructor(valor: string) {
    super(`"${valor}" no es un periodo válido. Se esperaba el formato AAAA-MM.`)
  }
}

export class ClienteNoEncontradoError extends ErrorDeDominio {
  readonly codigo = 'CLIENTE_NO_ENCONTRADO'

  constructor(id: string) {
    super(`No existe un cliente con el identificador ${id}.`)
  }
}

export class CodigoDeClienteDuplicadoError extends ErrorDeDominio {
  readonly codigo = 'CODIGO_CLIENTE_DUPLICADO'

  constructor(codigo: string) {
    super(`Ya existe un cliente con el código ${codigo}.`)
  }
}

export class ImporteInvalidoError extends ErrorDeDominio {
  readonly codigo = 'IMPORTE_INVALIDO'

  constructor(valor: unknown) {
    super(`"${String(valor)}" no es un importe válido en pesos.`)
  }
}

export class FormatoNoSoportadoError extends ErrorDeDominio {
  readonly codigo = 'FORMATO_NO_SOPORTADO'

  constructor(extension: string) {
    super(
      `No se pueden leer archivos ${extension}. Ábrelo en Excel y usa «Guardar como → Libro de Excel (.xlsx)».`,
    )
  }
}
