import { FileUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatearPeriodo } from '@/domain/shared/periodo'
import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { EstadoVacio } from '@/presentation/components/shared/EstadoVacio'
import { ModuloPendiente } from '@/presentation/components/shared/ModuloPendiente'
import { Boton } from '@/presentation/components/shared/Boton'
import { useResumenBase } from '@/presentation/hooks/data/useResumenBase'
import { usePeriodoSeleccionado } from '@/presentation/hooks/ui/contexto-periodo'

export default function PaginaPanel() {
  const { periodo } = usePeriodoSeleccionado()
  const resumen = useResumenBase()

  const sinDatos = resumen !== undefined && resumen.periodosConDatos.length === 0

  return (
    <>
      <EncabezadoPagina
        titulo={`Panel · ${formatearPeriodo(periodo)}`}
        descripcion="Cómo voy contra la cuota, sin abrir el Excel."
      />

      {sinDatos ? (
        <EstadoVacio
          icono={FileUp}
          titulo="Todavía no hay ventas cargadas"
          descripcion="Los indicadores aparecen en cuanto importes el primer archivo de ventas. Se puede cargar el histórico completo de una sola vez."
          accion={
            <Link to="/importar">
              <Boton variante="primario">Importar Excel</Boton>
            </Link>
          }
        />
      ) : (
        <ModuloPendiente
          sprint="Llega en el Sprint 3"
          objetivo="Conocer la situación comercial completa en menos de cinco segundos."
          incluye={[
            'Cumplimiento del mes: vendido, meta, porcentaje y faltante',
            'Ritmo requerido por día hábil y proyección de cierre',
            'Acumulado del año contra la meta anual',
            'Cobertura de clientes y clientes nuevos del periodo',
            'Ventas contra meta de los últimos doce meses',
            'Clientes que requieren atención y top del mes',
          ]}
        />
      )}
    </>
  )
}
