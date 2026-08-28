import { z } from 'zod'
import type { NuevoCliente } from '@/domain/cliente/cliente.entity'
import { normalizarIdentificacion } from '@/domain/cliente/identificacion'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const opcional = (maximo: number) => z.string().trim().max(maximo, `Máximo ${maximo} caracteres`)

/**
 * Contrato de validacion del formulario de cliente.
 *
 * Vive en la capa de aplicacion y no en el dominio para que el dominio siga sin
 * importar librerias externas. La capa de presentacion lo consume a traves del
 * resolvedor de React Hook Form.
 */
export const esquemaCliente = z.object({
  codigo: opcional(40),
  nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(160, 'Máximo 160 caracteres'),
  nombreComercial: opcional(160),
  identificacion: opcional(30),
  /** Código DANE de cinco dígitos. Lo escribe el selector, no el usuario. */
  municipio: opcional(5),
  direccion: opcional(160),
  telefono: opcional(40),
  email: opcional(120).refine((v) => v === '' || CORREO.test(v), 'Correo electrónico no válido'),
  contactoPrincipal: opcional(120),
  estadoManual: z.enum(['prospecto', 'cliente', 'suspendido']),
})
  .refine(
    (datos) => datos.identificacion.trim() !== '' || datos.codigo.trim() !== '',
    {
      message: 'Escribe al menos la identificación o un código: es lo que concilia con los archivos de la empresa',
      path: ['identificacion'],
    },
  )

export type DatosFormularioCliente = z.infer<typeof esquemaCliente>

export const FORMULARIO_VACIO: DatosFormularioCliente = {
  codigo: '',
  nombre: '',
  nombreComercial: '',
  identificacion: '',
  municipio: '',
  direccion: '',
  telefono: '',
  email: '',
  contactoPrincipal: '',
  estadoManual: 'cliente',
}

/** Los campos opcionales vacios se guardan como ausentes, no como cadena vacia. */
export function aNuevoCliente(datos: DatosFormularioCliente): NuevoCliente {
  const limpio = (valor: string) => {
    const v = valor.trim()
    return v === '' ? undefined : v
  }

  const identificacion = normalizarIdentificacion(datos.identificacion)

  return {
    // Sin codigo propio, la identificacion hace de codigo visible.
    codigo: datos.codigo.trim() || (identificacion ?? ''),
    nombre: datos.nombre.trim(),
    nombreComercial: limpio(datos.nombreComercial),
    identificacion,
    municipio: limpio(datos.municipio),
    direccion: limpio(datos.direccion),
    telefono: limpio(datos.telefono),
    email: limpio(datos.email),
    contactoPrincipal: limpio(datos.contactoPrincipal),
    estadoManual: datos.estadoManual,
  }
}
