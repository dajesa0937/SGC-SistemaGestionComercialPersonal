import { z } from 'zod'
import type { NuevoCliente } from '@/domain/cliente/cliente.entity'

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
  codigo: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio: es la clave que concilia con el archivo de la empresa')
    .max(40, 'Máximo 40 caracteres'),
  nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(160, 'Máximo 160 caracteres'),
  nombreComercial: opcional(160),
  nit: opcional(30),
  zona: opcional(80),
  ciudad: opcional(80),
  direccion: opcional(160),
  telefono: opcional(40),
  email: opcional(120).refine((v) => v === '' || CORREO.test(v), 'Correo electrónico no válido'),
  contactoPrincipal: opcional(120),
  estadoManual: z.enum(['prospecto', 'cliente', 'suspendido']),
})

export type DatosFormularioCliente = z.infer<typeof esquemaCliente>

export const FORMULARIO_VACIO: DatosFormularioCliente = {
  codigo: '',
  nombre: '',
  nombreComercial: '',
  nit: '',
  zona: '',
  ciudad: '',
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

  return {
    codigo: datos.codigo.trim(),
    nombre: datos.nombre.trim(),
    nombreComercial: limpio(datos.nombreComercial),
    nit: limpio(datos.nit),
    zona: limpio(datos.zona),
    ciudad: limpio(datos.ciudad),
    direccion: limpio(datos.direccion),
    telefono: limpio(datos.telefono),
    email: limpio(datos.email),
    contactoPrincipal: limpio(datos.contactoPrincipal),
    estadoManual: datos.estadoManual,
  }
}
