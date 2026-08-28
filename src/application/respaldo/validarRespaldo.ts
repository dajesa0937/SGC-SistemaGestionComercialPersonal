import { z } from 'zod'
import { VERSION_RESPALDO, type Respaldo, type ResumenRespaldo } from '@/domain/respaldo/respaldo.entity'
import { migrarRespaldo } from './migrarRespaldo'

const periodo = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'periodo con formato AAAA-MM')

/**
 * Cliente, aceptando a la vez la forma de la v1 y la de la v2.
 *
 * Los campos viejos (`nit`, `zona`, `ciudad`) siguen siendo validos al leer
 * porque un respaldo generado ayer tiene que poder restaurarse hoy. La
 * conversion a la forma nueva ocurre despues, en `migrarRespaldo`.
 */
const cliente = z.object({
  id: z.string().min(1),
  codigo: z.string(),
  nombre: z.string(),
  nombreComercial: z.string().optional(),
  identificacion: z.string().optional(),
  municipio: z.string().optional(),
  nit: z.string().optional(),
  zona: z.string().optional(),
  ciudad: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  contactoPrincipal: z.string().optional(),
  estadoManual: z.enum(['prospecto', 'cliente', 'suspendido']),
  archivado: z.boolean(),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
})

const venta = z.object({
  id: z.string().min(1),
  clienteId: z.string().min(1),
  periodo,
  valor: z.number().finite(),
  unidades: z.number().optional(),
  origen: z.enum(['importacion', 'manual']),
  importacionId: z.string().optional(),
  actualizadoEn: z.string(),
})

const movimiento = z.object({
  id: z.string().min(1),
  clienteId: z.string().min(1),
  fecha: z.string(),
  periodo,
  categoria: z.string().optional(),
  producto: z.string().optional(),
  cantidad: z.number().optional(),
  valorUnitario: z.number().optional(),
  valor: z.number().finite(),
  importacionId: z.string().optional(),
  actualizadoEn: z.string(),
})

const mapeoColumnas = z.object({
  hoja: z.string(),
  filaEncabezado: z.number().int(),
  colCodigo: z.string().optional(),
  colCliente: z.string(),
  colValor: z.string(),
  colPeriodo: z.string().optional(),
  colUnidades: z.string().optional(),
  colZona: z.string().optional(),
  colFecha: z.string().optional(),
  colIdentificacion: z.string().optional(),
  colMunicipio: z.string().optional(),
  colCategoria: z.string().optional(),
  colProducto: z.string().optional(),
  colValorUnitario: z.string().optional(),
})

/**
 * El historial de importaciones tambien se valida.
 *
 * Se podria aceptar tal cual porque hoy nadie lo lee, pero un respaldo con
 * basura ahi reventaria el modulo de importacion el dia que se construya, y el
 * error aparecería lejísimos de su causa.
 */
const importacion = z.object({
  id: z.string().min(1),
  fecha: z.string(),
  archivoNombre: z.string(),
  periodos: z.array(periodo),
  filasLeidas: z.number().int().nonnegative(),
  filasAplicadas: z.number().int().nonnegative(),
  filasConError: z.number().int().nonnegative(),
  clientesCreados: z.number().int().nonnegative(),
  mapeo: mapeoColumnas,
  snapshotAnterior: z.array(venta),
  snapshotMovimientos: z.array(movimiento).default([]),
  estado: z.enum(['aplicada', 'revertida']),
})

const esquemaRespaldo = z.object({
  aplicacion: z.literal('sgc-personal'),
  version: z.number().int().positive(),
  generadoEn: z.string(),
  datos: z.object({
    clientes: z.array(cliente),
    aliases: z.array(z.object({ id: z.string(), clienteId: z.string(), textoOriginal: z.string() })),
    notas: z.array(
      z.object({
        id: z.string(),
        clienteId: z.string(),
        fecha: z.string(),
        texto: z.string(),
        tipo: z.enum(['visita', 'llamada', 'general']),
        creadoEn: z.string(),
      }),
    ),
    ventas: z.array(venta),
    movimientos: z.array(movimiento).default([]),
    presupuestos: z.array(
      z.object({
        id: z.string(),
        periodo,
        meta: z.number().finite(),
        nota: z.string().optional(),
        actualizadoEn: z.string(),
      }),
    ),
    importaciones: z.array(importacion).default([]),
    zonas: z
      .array(
        z.object({
          id: z.string().min(1),
          nombre: z.string(),
          municipios: z.array(z.string()),
          creadoEn: z.string(),
          actualizadoEn: z.string(),
        }),
      )
      .default([]),
    configuracion: z.array(z.object({ clave: z.string(), valor: z.unknown() })).default([]),
  }),
})

export type ResultadoValidacion =
  | { readonly valido: true; readonly respaldo: Respaldo; readonly resumen: ResumenRespaldo }
  | { readonly valido: false; readonly motivo: string; readonly detalles: readonly string[] }

/**
 * Valida un archivo de respaldo antes de dejar que toque la base.
 *
 * Restaurar es la operacion mas destructiva de la aplicacion: reemplaza todo.
 * Por eso el archivo se valida entero primero y solo se aplica si esta bien.
 * Un archivo a medias es peor que ningun archivo.
 */
export function validarRespaldo(texto: string): ResultadoValidacion {
  let crudo: unknown
  try {
    crudo = JSON.parse(texto)
  } catch {
    return {
      valido: false,
      motivo: 'El archivo no es un JSON válido',
      detalles: ['Puede estar dañado o no ser un respaldo de SGC Personal.'],
    }
  }

  const resultado = esquemaRespaldo.safeParse(crudo)

  if (!resultado.success) {
    const esOtraApp =
      typeof crudo === 'object' && crudo !== null && (crudo as { aplicacion?: unknown }).aplicacion !== 'sgc-personal'
    return {
      valido: false,
      motivo: esOtraApp
        ? 'Este archivo no es un respaldo de SGC Personal'
        : 'El respaldo tiene un formato que no se reconoce',
      detalles: resultado.error.issues
        .slice(0, 6)
        .map((e) => `${e.path.join('.') || 'raíz'}: ${e.message}`),
    }
  }

  const leido = resultado.data as Respaldo

  if (leido.version > VERSION_RESPALDO) {
    return {
      valido: false,
      motivo: `El respaldo es de una versión más nueva (v${leido.version})`,
      detalles: ['Actualiza la aplicación antes de restaurarlo.'],
    }
  }

  // Un respaldo viejo se traduce, no se rechaza. Lo contrario convierte cada
  // cambio del modelo en una pérdida silenciosa de las copias ya guardadas.
  const respaldo = migrarRespaldo(leido)

  return { valido: true, respaldo, resumen: resumirRespaldo(respaldo) }
}

export function resumirRespaldo(respaldo: Respaldo): ResumenRespaldo {
  const periodos = new Set(respaldo.datos.ventas.map((v) => v.periodo))
  return {
    clientes: respaldo.datos.clientes.length,
    ventas: respaldo.datos.ventas.length,
    presupuestos: respaldo.datos.presupuestos.length,
    notas: respaldo.datos.notas.length,
    periodos: periodos.size,
    generadoEn: respaldo.generadoEn,
  }
}
