/**
 * Dias habiles y festivos de Colombia.
 *
 * La proyeccion de cierre del mes depende de cuantos dias habiles quedan. Con
 * un calendario mal calculado la proyeccion miente, y una proyeccion que miente
 * es peor que no tenerla: induce a relajarse o a alarmarse sin motivo.
 */

/** Domingo de Pascua por el algoritmo de Meeus/Jones/Butcher (calendario gregoriano). */
export function domingoDePascua(anio: number): Date {
  const a = anio % 19
  const b = Math.floor(anio / 100)
  const c = anio % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(anio, mes - 1, dia)
}

function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha)
  resultado.setDate(resultado.getDate() + dias)
  return resultado
}

/**
 * Traslada un festivo al lunes siguiente (Ley 51 de 1983, "ley Emiliani").
 *
 * Si ya cae lunes se queda donde esta.
 */
function trasladarALunes(fecha: Date): Date {
  const diaSemana = fecha.getDay() // 0 = domingo, 1 = lunes
  if (diaSemana === 1) return fecha
  const faltan = (8 - diaSemana) % 7
  return sumarDias(fecha, faltan)
}

function clave(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

/**
 * Festivos colombianos de un ano, como claves `YYYY-MM-DD`.
 *
 * Colombia tiene 18 festivos: 6 de fecha fija, 6 fijos trasladables al lunes y
 * 6 derivados de la Pascua (tres de ellos trasladables).
 */
export function festivosDeColombia(anio: number): Set<string> {
  const pascua = domingoDePascua(anio)
  const festivos: Date[] = [
    // Fecha fija, no se trasladan.
    new Date(anio, 0, 1), // Ano nuevo
    new Date(anio, 4, 1), // Dia del trabajo
    new Date(anio, 6, 20), // Independencia
    new Date(anio, 7, 7), // Batalla de Boyaca
    new Date(anio, 11, 8), // Inmaculada Concepcion
    new Date(anio, 11, 25), // Navidad

    // Derivados de la Pascua, sin traslado.
    sumarDias(pascua, -3), // Jueves santo
    sumarDias(pascua, -2), // Viernes santo

    // Fijos trasladables al lunes.
    trasladarALunes(new Date(anio, 0, 6)), // Reyes
    trasladarALunes(new Date(anio, 2, 19)), // San Jose
    trasladarALunes(new Date(anio, 5, 29)), // San Pedro y San Pablo
    trasladarALunes(new Date(anio, 7, 15)), // Asuncion
    trasladarALunes(new Date(anio, 9, 12)), // Dia de la raza
    trasladarALunes(new Date(anio, 10, 1)), // Todos los santos
    trasladarALunes(new Date(anio, 10, 11)), // Independencia de Cartagena

    // Derivados de la Pascua, trasladables al lunes.
    trasladarALunes(sumarDias(pascua, 43)), // Ascension
    trasladarALunes(sumarDias(pascua, 64)), // Corpus Christi
    trasladarALunes(sumarDias(pascua, 71)), // Sagrado Corazon
  ]

  return new Set(festivos.map(clave))
}

const cacheFestivos = new Map<number, Set<string>>()

function festivosCacheados(anio: number): Set<string> {
  let festivos = cacheFestivos.get(anio)
  if (!festivos) {
    festivos = festivosDeColombia(anio)
    cacheFestivos.set(anio, festivos)
  }
  return festivos
}

/** Indica si una fecha es dia habil: ni fin de semana ni festivo nacional. */
export function esDiaHabil(fecha: Date): boolean {
  const diaSemana = fecha.getDay()
  if (diaSemana === 0 || diaSemana === 6) return false
  return !festivosCacheados(fecha.getFullYear()).has(clave(fecha))
}

export interface DiasDelPeriodo {
  readonly totales: number
  readonly transcurridos: number
  readonly restantes: number
}

/**
 * Cuenta los dias habiles de un mes respecto a una fecha de referencia.
 *
 * El dia de hoy cuenta como transcurrido: la jornada esta en curso y sus ventas
 * ya pueden haberse hecho. Contarlo como restante inflaria la proyeccion.
 */
export function diasHabilesDelMes(anio: number, mes: number, referencia: Date): DiasDelPeriodo {
  const primero = new Date(anio, mes - 1, 1)
  const ultimo = new Date(anio, mes, 0)

  let totales = 0
  let transcurridos = 0

  for (let dia = new Date(primero); dia <= ultimo; dia.setDate(dia.getDate() + 1)) {
    if (!esDiaHabil(dia)) continue
    totales++
    if (dia.getTime() <= inicioDelDia(referencia).getTime()) transcurridos++
  }

  // Si la referencia cae fuera del mes, o esta antes, se ajusta a los extremos.
  if (referencia < primero) transcurridos = 0
  if (referencia > ultimo) transcurridos = totales

  return { totales, transcurridos, restantes: totales - transcurridos }
}

function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}
