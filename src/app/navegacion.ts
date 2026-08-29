import {
  CalendarCheck,
  FileUp,
  LayoutDashboard,
  Printer,
  Settings,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface Seccion {
  readonly ruta: string
  readonly etiqueta: string
  readonly descripcion: string
  readonly icono: LucideIcon
}

/** Navegacion principal. Fuente unica para la barra lateral y las migas. */
export const SECCIONES: readonly Seccion[] = [
  {
    ruta: '/',
    etiqueta: 'Panel',
    descripcion: 'Cómo voy contra la cuota del mes',
    icono: LayoutDashboard,
  },
  {
    ruta: '/clientes',
    etiqueta: 'Clientes',
    descripcion: 'Cartera del territorio',
    icono: Users,
  },
  {
    ruta: '/presupuesto',
    etiqueta: 'Presupuesto',
    descripcion: 'Cuota mensual del año',
    icono: Target,
  },
  {
    ruta: '/importar',
    etiqueta: 'Ventas',
    descripcion: 'Registrar o importar las ventas del mes',
    icono: FileUp,
  },
  {
    ruta: '/visitas',
    etiqueta: 'Visitas',
    descripcion: 'A quién ver esta semana y por qué',
    icono: CalendarCheck,
  },
  {
    ruta: '/reportes',
    etiqueta: 'Reportes',
    descripcion: 'Informes para imprimir',
    icono: Printer,
  },
] as const

export const SECCION_CONFIGURACION: Seccion = {
  ruta: '/configuracion',
  etiqueta: 'Configuración',
  descripcion: 'Umbrales, tema y respaldo',
  icono: Settings,
}

export function buscarSeccion(ruta: string): Seccion | undefined {
  return [...SECCIONES, SECCION_CONFIGURACION].find((s) => s.ruta === ruta)
}
