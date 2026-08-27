import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { ModuloPendiente } from '@/presentation/components/shared/ModuloPendiente'

export default function PaginaClientes() {
  return (
    <>
      <EncabezadoPagina titulo="Clientes" descripcion="Cartera del territorio." />
      <ModuloPendiente
        sprint="Llega en el Sprint 1"
        objetivo="Tener la cartera completa dentro de la aplicación, consultable y filtrable."
        incluye={[
          'Alta, edición y archivado de clientes',
          'Tabla con búsqueda por nombre, código y NIT',
          'Filtros por zona, estado y clasificación, conservados en la URL',
          'Importación del maestro de clientes desde Excel',
        ]}
      />
    </>
  )
}
