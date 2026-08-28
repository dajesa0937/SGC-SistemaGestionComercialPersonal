import type { Cliente, ClienteEnriquecido } from '@/domain/cliente/cliente.entity'
import type { ConfiguracionNegocio } from '@/domain/config/configuracion.entity'
import type { Zona } from '@/domain/geografia/zona.entity'
import type { MovimientoVenta, ParticipacionMezcla } from '@/domain/venta/movimiento.entity'
import { calcularMezcla } from '@/domain/venta/movimiento.entity'
import type { Presupuesto } from '@/domain/presupuesto/presupuesto.entity'
import type { Periodo } from '@/domain/shared/types'
import type { VentaMensual } from '@/domain/venta/venta.entity'
import { anioDe } from '@/domain/shared/periodo'
import {
  calcularAcumuladoAnual,
  calcularCumplimiento,
  metaAnual,
  semaforo,
  type Cumplimiento,
  type SemaforoCumplimiento,
} from './calcularCumplimiento'
import { proyectarCierre, type ProyeccionCierre } from './proyectarCierre'
import { construirSerie12Meses, type PuntoSerie } from './construirSerie12Meses'
import {
  calcularCobertura,
  detectarAlertas,
  detectarClientesNuevos,
  enriquecerClientes,
  topClientes,
  type Alerta,
  type Cobertura,
} from './analizarCartera'

export interface EntradaResumen {
  readonly periodo: Periodo
  readonly clientes: readonly Cliente[]
  readonly ventas: readonly VentaMensual[]
  readonly presupuestos: readonly Presupuesto[]
  readonly config: ConfiguracionNegocio
  readonly zonas?: readonly Zona[]
  /** Lineas de factura, si el archivo importado las traia. */
  readonly movimientos?: readonly MovimientoVenta[]
  /** Se inyecta para que el resumen sea determinista y comprobable. */
  readonly hoy: Date
}

export interface ResumenDelPeriodo {
  readonly periodo: Periodo
  readonly mes: Cumplimiento
  readonly semaforoMes: SemaforoCumplimiento
  readonly proyeccion: ProyeccionCierre
  readonly anio: Cumplimiento
  readonly metaAnualCompleta: number
  readonly serie: readonly PuntoSerie[]
  readonly cobertura: Cobertura
  readonly clientes: readonly ClienteEnriquecido[]
  readonly nuevos: readonly ClienteEnriquecido[]
  readonly alertas: readonly Alerta[]
  readonly top: readonly ClienteEnriquecido[]
  /**
   * Mezcla de producto del mes y del ano (decision D-01).
   *
   * Vacia cuando el archivo importado no traia detalle de producto: es la
   * diferencia honesta entre «no hay datos» y «todo vale cero».
   */
  readonly mezclaPeriodo: readonly ParticipacionMezcla[]
  readonly mezclaAnio: readonly ParticipacionMezcla[]
  readonly hayDetalleProducto: boolean
  /** No hay ninguna venta registrada en toda la base. */
  readonly sinDatos: boolean
}

/**
 * Orquestador del panel.
 *
 * Función pura y sin acceso a la base: recibe todo lo que necesita y devuelve
 * todo lo que el panel muestra. Es lo que permite probar los números sin
 * navegador y validar que coinciden con el archivo de origen.
 */
export function resumenDelPeriodo(entrada: EntradaResumen): ResumenDelPeriodo {
  const { periodo, clientes, ventas, presupuestos, config, zonas, movimientos = [], hoy } = entrada

  const mes = calcularCumplimiento(ventas, presupuestos, periodo)
  const anio = calcularAcumuladoAnual(ventas, presupuestos, periodo)
  const enriquecidos = enriquecerClientes(clientes, ventas, periodo, config, zonas)

  return {
    periodo,
    mes,
    semaforoMes: semaforo(mes.cumplimiento, config),
    proyeccion: proyectarCierre(mes.vendido, mes.faltante, mes.meta, periodo, hoy),
    anio,
    metaAnualCompleta: metaAnual(presupuestos, anioDe(periodo)),
    serie: construirSerie12Meses(ventas, presupuestos, periodo),
    cobertura: calcularCobertura(enriquecidos),
    clientes: enriquecidos,
    nuevos: detectarClientesNuevos(enriquecidos, periodo),
    alertas: detectarAlertas(enriquecidos, periodo),
    top: topClientes(enriquecidos),
    mezclaPeriodo: calcularMezcla(movimientos.filter((m) => m.periodo === periodo)),
    mezclaAnio: calcularMezcla(movimientos.filter((m) => anioDe(m.periodo) === anioDe(periodo))),
    hayDetalleProducto: movimientos.length > 0,
    sinDatos: ventas.length === 0,
  }
}
