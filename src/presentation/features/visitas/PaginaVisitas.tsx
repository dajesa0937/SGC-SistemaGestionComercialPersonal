import { useState } from 'react'
import { AlertTriangle, CalendarCheck, CheckCircle2, MapPin, Printer } from 'lucide-react'
import type { ClienteDelPlan } from '@/application/visitas/planDeVisitas'
import { etiquetaMunicipio } from '@/domain/geografia/geografia'
import { hoyISO } from '@/domain/shared/types'
import { Badge } from '@/presentation/components/shared/Badge'
import { Boton } from '@/presentation/components/shared/Boton'
import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { EstadoVacio } from '@/presentation/components/shared/EstadoVacio'
import { useHojaImpresion } from '@/presentation/components/shared/HojaImpresion'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import { useRepositorios } from '@/presentation/hooks/data/contexto-repositorios'
import { useResumen } from '@/presentation/hooks/data/useResumen'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'
import { formatearNumero, formatearPesos, formatearVariacion } from '@/lib/formato'
import { ETIQUETA_ABC } from '../clientes/etiquetas'
import { HojaDeRuta } from './HojaDeRuta'
import { ETIQUETA_TENDENCIA, ETIQUETA_VISITA, TONO_TENDENCIA } from './etiquetas'

function Cifra({ valor, etiqueta, nota, tono }: { valor: string; etiqueta: string; nota?: string; tono?: string }) {
  return (
    <Tarjeta className="px-4 py-3">
      <p className="text-xs tracking-wider text-tenue uppercase">{etiqueta}</p>
      <p className={'cifra mt-1 text-lg font-semibold ' + (tono ?? 'text-texto')}>{valor}</p>
      {nota ? <p className="mt-0.5 text-xs text-suave">{nota}</p> : null}
    </Tarjeta>
  )
}

function Fila({ fila, onVisitar }: { fila: ClienteDelPlan; onVisitar: (fila: ClienteDelPlan) => void }) {
  const { cliente, crecimiento, proyeccion } = fila

  return (
    <div className="flex items-start justify-between gap-4 border-b border-borde-suave px-5 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-texto">{cliente.nombre}</p>
          <Badge tono={cliente.clasificacion === 'A' ? 'acento' : 'neutro'}>
            {ETIQUETA_ABC[cliente.clasificacion]}
          </Badge>
          <Badge tono={TONO_TENDENCIA[crecimiento.tendencia]}>
            {ETIQUETA_TENDENCIA[crecimiento.tendencia]}
            {crecimiento.variacion !== null ? ` ${formatearVariacion(crecimiento.variacion, 0)}` : ''}
          </Badge>
          <Badge tono={fila.estado === 'vencida' || fila.estado === 'nunca' ? 'alerta' : 'neutro'}>
            {ETIQUETA_VISITA[fila.estado]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-suave">{fila.motivo}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-tenue">
          <span className="flex items-center gap-1">
            <MapPin className="size-3" aria-hidden="true" />
            {etiquetaMunicipio(cliente.municipio)}
          </span>
          {cliente.telefono ? <span className="cifra">{cliente.telefono}</span> : null}
          <span>Cada {fila.frecuencia} días</span>
          <span>
            Año <span className="cifra">{formatearPesos(cliente.ventaAnio)}</span>
          </span>
          <span>
            Cierre estimado <span className="cifra">{formatearPesos(proyeccion.estimado)}</span>
            {proyeccion.confiable ? '' : ' · poca base'}
          </span>
        </p>
      </div>

      <Boton tamano="sm" className="shrink-0" onClick={() => onVisitar(fila)}>
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Visitado hoy
      </Boton>
    </div>
  )
}

export default function PaginaVisitas() {
  const resumen = useResumen()
  const repositorios = useRepositorios()
  const { mostrar } = useAvisos()
  const { imprimir, portal } = useHojaImpresion()
  const [verTodos, setVerTodos] = useState(false)

  if (!resumen) {
    return (
      <>
        <EncabezadoPagina titulo="Plan de visitas" />
        <p className="text-sm text-tenue">Cargando…</p>
      </>
    )
  }

  const { plan } = resumen
  const lista = verTodos ? plan.pendientes : plan.estaSemana

  const registrarVisita = async (fila: ClienteDelPlan) => {
    await repositorios.clientes.crearNota({
      clienteId: fila.cliente.id,
      fecha: hoyISO(),
      texto: 'Visita registrada desde el plan',
      tipo: 'visita',
    })
    mostrar(`Visita a ${fila.cliente.nombre} registrada`, 'exito')
  }

  return (
    <>
      {portal}

      <EncabezadoPagina
        titulo="Plan de visitas"
        descripcion="A quién ver primero, por lo que vale y por cómo viene."
        acciones={
          <Boton
            variante="primario"
            disabled={lista.length === 0}
            onClick={() => imprimir(<HojaDeRuta filas={lista} plan={plan} />)}
          >
            <Printer className="size-4" aria-hidden="true" />
            Imprimir la hoja de ruta
          </Boton>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          valor={formatearNumero(plan.pendientes.length)}
          etiqueta="Por visitar"
          nota={`${formatearNumero(plan.alDia)} al día`}
        />
        <Cifra
          valor={formatearNumero(plan.capacidadSemanal)}
          etiqueta="Caben esta semana"
          nota="Se cambia en Configuración"
        />
        <Cifra
          valor={formatearNumero(plan.requeridasPorMes)}
          etiqueta="Pide el plan al mes"
          nota={`Tu capacidad son ${formatearNumero(plan.capacidadMensual)}`}
          tono={plan.deficit > 0 ? 'text-alerta' : undefined}
        />
        <Cifra
          valor={formatearNumero(plan.nuncaVisitados)}
          etiqueta="Nunca visitados"
          nota={plan.nuncaVisitados > 0 ? 'Sin una sola visita registrada' : 'Ninguno'}
        />
      </div>

      {plan.deficit > 0 ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-panel border-l-2 border-alerta bg-alerta-suave px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-alerta" aria-hidden="true" />
          <p className="text-sm text-texto">
            Las frecuencias que definiste piden{' '}
            <strong className="font-medium">{formatearNumero(plan.requeridasPorMes)} visitas al mes</strong> y
            alcanzas a hacer {formatearNumero(plan.capacidadMensual)}: faltan{' '}
            <strong className="font-medium">{formatearNumero(plan.deficit)}</strong>. O espacias las
            visitas de alguna clase, o aceptas que los de abajo de la lista se quedan sin ver. La
            aplicación prioriza para que lo que se quede fuera sea siempre lo que menos pesa.
          </p>
        </div>
      ) : null}

      <Tarjeta>
        <div className="flex items-center justify-between gap-4 border-b border-borde-suave px-5 py-3">
          <div>
            <h2 className="text-sm font-medium text-texto">
              {verTodos ? 'Todos los pendientes' : 'Esta semana'}
            </h2>
            <p className="mt-0.5 text-xs text-suave">
              Ordenados por lo que vale el cliente, cómo viene y cuánto llevas sin verlo.
            </p>
          </div>
          <Boton tamano="sm" onClick={() => setVerTodos((v) => !v)}>
            {verTodos ? `Ver solo la semana (${plan.capacidadSemanal})` : `Ver todos (${plan.pendientes.length})`}
          </Boton>
        </div>

        {lista.length === 0 ? (
          <EstadoVacio
            icono={CalendarCheck}
            titulo="No hay visitas pendientes"
            descripcion="Toda la cartera está dentro de su frecuencia. Registra las visitas que hagas para que el plan siga siendo de fiar."
          />
        ) : (
          lista.map((fila) => (
            <Fila key={fila.cliente.id} fila={fila} onVisitar={(f) => void registrarVisita(f)} />
          ))
        )}
      </Tarjeta>
    </>
  )
}
