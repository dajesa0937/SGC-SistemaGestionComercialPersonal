import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import { ConmutadorTema } from '@/presentation/components/shared/ConmutadorTema'
import { UmbralesNegocio } from './UmbralesNegocio'
import { Respaldo } from './Respaldo'
import { Zonas } from './Zonas'
import { useResumenBase } from '@/presentation/hooks/data/useResumenBase'
import { formatearNumero } from '@/lib/formato'
import { solicitarAlmacenamientoPersistente } from '@/lib/almacenamiento'

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-borde-suave px-5 py-3 last:border-b-0">
      <span className="text-sm text-suave">{etiqueta}</span>
      <span className="text-sm font-medium text-texto">{children}</span>
    </div>
  )
}

function Indicador({ activo, siNo }: { activo: boolean; siNo: [string, string] }) {
  const Icono = activo ? Check : X
  return (
    <span className={activo ? 'flex items-center gap-1.5 text-exito' : 'flex items-center gap-1.5 text-alerta'}>
      <Icono className="size-4" aria-hidden="true" />
      {activo ? siNo[0] : siNo[1]}
    </span>
  )
}

export default function PaginaConfiguracion() {
  const resumen = useResumenBase()
  const [persistente, setPersistente] = useState<boolean | null>(null)

  useEffect(() => {
    let vigente = true
    void solicitarAlmacenamientoPersistente().then((valor) => {
      if (vigente) setPersistente(valor)
    })
    return () => {
      vigente = false
    }
  }, [])

  return (
    <>
      <EncabezadoPagina
        titulo="Configuración"
        descripcion="Zonas, apariencia, estado del almacenamiento y respaldo."
      />

      <div className="flex flex-col gap-5">
        <Tarjeta>
          <div className="border-b border-borde-suave px-5 py-3">
            <h2 className="text-sm font-medium text-texto">Apariencia</h2>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <span className="text-sm text-suave">Tema de la interfaz</span>
            <ConmutadorTema />
          </div>
        </Tarjeta>

        <Tarjeta>
          <div className="border-b border-borde-suave px-5 py-3">
            <h2 className="text-sm font-medium text-texto">Estado del almacenamiento local</h2>
          </div>
          <Fila etiqueta="Clientes registrados">
            <span className="cifra">
              {resumen ? formatearNumero(resumen.totalClientes) : '—'}
            </span>
          </Fila>
          <Fila etiqueta="Periodos con ventas">
            <span className="cifra">
              {resumen ? formatearNumero(resumen.periodosConDatos.length) : '—'}
            </span>
          </Fila>
          <Fila etiqueta="Meses con presupuesto">
            <span className="cifra">
              {resumen ? formatearNumero(resumen.totalPresupuestos) : '—'}
            </span>
          </Fila>
          <Fila etiqueta="Almacenamiento protegido por el navegador">
            {persistente === null ? (
              <span className="text-tenue">Comprobando…</span>
            ) : (
              <Indicador activo={persistente} siNo={['Sí', 'No garantizado']} />
            )}
          </Fila>
        </Tarjeta>

        <Zonas />

        <UmbralesNegocio />

        <Respaldo />
      </div>
    </>
  )
}
