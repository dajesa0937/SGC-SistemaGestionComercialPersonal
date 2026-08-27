import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { ModuloPendiente } from '@/presentation/components/shared/ModuloPendiente'

export default function PaginaImportacion() {
  return (
    <>
      <EncabezadoPagina
        titulo="Importar"
        descripcion="Cargar el archivo de ventas que envía la empresa."
      />
      <ModuloPendiente
        sprint="Llega en el Sprint 2"
        objetivo="Que el Excel real del mes entre completo y correcto, en menos de dos minutos."
        incluye={[
          'Asistente de tres pasos: archivo, mapeo y revisión',
          'Mapeo de columnas configurable, recordado entre importaciones',
          'Vista previa obligatoria antes de aplicar cualquier cambio',
          'Resolución de clientes no reconocidos, que queda guardada como alias',
          'Reimportación sin duplicar y reversión de la última carga',
        ]}
      />
    </>
  )
}
