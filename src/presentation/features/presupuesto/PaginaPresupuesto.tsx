import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { ModuloPendiente } from '@/presentation/components/shared/ModuloPendiente'

export default function PaginaPresupuesto() {
  return (
    <>
      <EncabezadoPagina titulo="Presupuesto" descripcion="Cuota mensual asignada para el año." />
      <ModuloPendiente
        sprint="Llega en el Sprint 3"
        objetivo="Registrar la meta de cada mes para poder medir el cumplimiento."
        incluye={[
          'Grilla de los doce meses editable en línea',
          'Total anual y cumplimiento por mes',
          'Replicar una cifra a los meses restantes',
        ]}
      />
    </>
  )
}
