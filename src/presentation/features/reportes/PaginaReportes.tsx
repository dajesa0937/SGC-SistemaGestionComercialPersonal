import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { ModuloPendiente } from '@/presentation/components/shared/ModuloPendiente'

export default function PaginaReportes() {
  return (
    <>
      <EncabezadoPagina titulo="Reportes" descripcion="Informes para imprimir o guardar en PDF." />
      <ModuloPendiente
        sprint="Llega en el Sprint 5"
        objetivo="Llevar la información fuera de la pantalla, en papel o en PDF."
        incluye={[
          'Informe mensual de gestión',
          'Listado de clientes respetando los filtros aplicados',
          'Ficha individual del cliente, útil antes de una visita',
          'Exportación de cualquier tabla a CSV',
        ]}
      />
    </>
  )
}
