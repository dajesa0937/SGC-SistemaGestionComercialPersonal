import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  CONFIGURACION_POR_DEFECTO,
  type ConfiguracionNegocio,
} from '@/domain/config/configuracion.entity'
import { Boton } from '@/presentation/components/shared/Boton'
import { Tarjeta } from '@/presentation/components/shared/Tarjeta'
import { useConfiguracionNegocio } from '@/presentation/hooks/data/useConfiguracion'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'

type Clave = keyof ConfiguracionNegocio

interface Definicion {
  clave: Clave
  etiqueta: string
  ayuda: string
  unidad: 'meses' | 'porcentaje' | 'dias' | 'visitas'
  minimo: number
  maximo: number
}

const CAMPOS: readonly Definicion[] = [
  {
    clave: 'mesesParaInactivo',
    etiqueta: 'Meses sin comprar para considerar inactivo',
    ayuda: 'Depende del ciclo de compra del territorio, no de una regla general.',
    unidad: 'meses',
    minimo: 1,
    maximo: 24,
  },
  {
    clave: 'umbralCaida',
    etiqueta: 'Caída que marca a un cliente en riesgo',
    ayuda: 'Comparado con el promedio de los tres meses anteriores.',
    unidad: 'porcentaje',
    minimo: 5,
    maximo: 95,
  },
  {
    clave: 'corteA',
    etiqueta: 'Corte de Pareto para la clase A',
    ayuda: 'Participación acumulada en la facturación de los últimos doce meses.',
    unidad: 'porcentaje',
    minimo: 50,
    maximo: 95,
  },
  {
    clave: 'corteB',
    etiqueta: 'Corte de Pareto para la clase B',
    ayuda: 'Debe ser mayor que el corte de la clase A.',
    unidad: 'porcentaje',
    minimo: 55,
    maximo: 99,
  },
  {
    clave: 'umbralVerde',
    etiqueta: 'Cumplimiento para el semáforo verde',
    ayuda: 'Por debajo de este valor el indicador deja de estar en verde.',
    unidad: 'porcentaje',
    minimo: 50,
    maximo: 150,
  },
  {
    clave: 'umbralAmbar',
    etiqueta: 'Cumplimiento para el semáforo ámbar',
    ayuda: 'Por debajo de este valor el indicador se pone en rojo.',
    unidad: 'porcentaje',
    minimo: 10,
    maximo: 120,
  },
]

/**
 * Politica de visitas.
 *
 * Va en su propia tarjeta y no mezclada con los umbrales porque responde a otra
 * pregunta: los umbrales dicen como leer los datos, esto dice como trabajar la
 * calle.
 */
const CAMPOS_VISITAS: readonly Definicion[] = [
  {
    clave: 'diasVisitaA',
    etiqueta: 'Visitar a un cliente A cada',
    ayuda: 'Los que concentran la mayor parte de tu facturación.',
    unidad: 'dias',
    minimo: 1,
    maximo: 365,
  },
  {
    clave: 'diasVisitaB',
    etiqueta: 'Visitar a un cliente B cada',
    ayuda: 'El grupo intermedio.',
    unidad: 'dias',
    minimo: 1,
    maximo: 365,
  },
  {
    clave: 'diasVisitaC',
    etiqueta: 'Visitar a un cliente C cada',
    ayuda: 'La cola larga de la cartera.',
    unidad: 'dias',
    minimo: 1,
    maximo: 365,
  },
  {
    clave: 'diasVisitaSinHistoria',
    etiqueta: 'Visitar a un cliente sin compras cada',
    ayuda: 'Todavía no ha comprado, así que no tiene clase: hay que ir a abrirlo.',
    unidad: 'dias',
    minimo: 1,
    maximo: 365,
  },
  {
    clave: 'visitasPorSemana',
    etiqueta: 'Visitas que alcanzas a hacer por semana',
    ayuda: 'Es el límite que convierte una lista de deseos en un plan que cabe.',
    unidad: 'visitas',
    minimo: 1,
    maximo: 100,
  },
]

/** Los porcentajes se guardan como fracción y se editan como número entero. */
function aVista(valor: number, unidad: Definicion['unidad']): number {
  return unidad === 'porcentaje' ? Math.round(valor * 100) : valor
}

function aModelo(valor: number, unidad: Definicion['unidad']): number {
  return unidad === 'porcentaje' ? valor / 100 : valor
}

function Fila({
  campo,
  valor,
  onGuardar,
}: {
  campo: Definicion
  valor: number
  onGuardar: (valor: number) => void
}) {
  const [texto, setTexto] = useState(() => String(aVista(valor, campo.unidad)))

  useEffect(() => {
    setTexto(String(aVista(valor, campo.unidad)))
  }, [valor, campo.unidad])

  const confirmar = () => {
    const numero = Number(texto)
    if (!Number.isFinite(numero)) {
      setTexto(String(aVista(valor, campo.unidad)))
      return
    }
    const acotado = Math.min(campo.maximo, Math.max(campo.minimo, numero))
    setTexto(String(acotado))
    const modelo = aModelo(acotado, campo.unidad)
    if (modelo !== valor) onGuardar(modelo)
  }

  return (
    <div className="flex items-start justify-between gap-6 border-b border-borde-suave px-5 py-3 last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={`umbral-${campo.clave}`} className="text-sm text-texto">
          {campo.etiqueta}
        </label>
        <p className="mt-0.5 text-xs text-tenue">{campo.ayuda}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          id={`umbral-${campo.clave}`}
          type="number"
          inputMode="numeric"
          min={campo.minimo}
          max={campo.maximo}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          onBlur={confirmar}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') evento.currentTarget.blur()
          }}
          className="cifra h-9 w-20 rounded-md border border-borde bg-superficie px-2.5 text-right text-sm text-texto"
        />
        <span className="w-14 text-xs text-tenue">
          {campo.unidad === 'porcentaje'
            ? '%'
            : campo.unidad === 'meses'
              ? 'meses'
              : campo.unidad === 'visitas'
                ? 'visitas'
                : 'días'}
        </span>
      </div>
    </div>
  )
}

export function UmbralesNegocio() {
  const { config, guardar } = useConfiguracionNegocio()
  const { mostrar } = useAvisos()

  if (!config) return <p className="text-sm text-tenue">Cargando…</p>

  const aplicar = async (clave: Clave, valor: number) => {
    try {
      await guardar({ [clave]: valor })
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo guardar el umbral', 'error')
    }
  }

  const corteIncoherente = config.corteB <= config.corteA
  const semaforoIncoherente = config.umbralAmbar >= config.umbralVerde

  return (
    <Tarjeta>
      <div className="flex items-center justify-between border-b border-borde-suave px-5 py-3">
        <div>
          <h2 className="text-sm font-medium text-texto">Umbrales de negocio</h2>
          <p className="mt-0.5 text-xs text-suave">
            Los indicadores del panel se recalculan al instante con estos valores.
          </p>
        </div>
        <Boton
          tamano="sm"
          onClick={() => void guardar(CONFIGURACION_POR_DEFECTO)}
          title="Volver a los valores iniciales"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Restablecer
        </Boton>
      </div>

      {CAMPOS.map((campo) => (
        <Fila
          key={campo.clave}
          campo={campo}
          valor={config[campo.clave]}
          onGuardar={(valor) => void aplicar(campo.clave, valor)}
        />
      ))}

      {corteIncoherente || semaforoIncoherente ? (
        <div className="border-t border-borde-suave bg-alerta-suave px-5 py-3">
          <p className="text-sm text-texto">
            {corteIncoherente
              ? 'El corte de la clase B debe ser mayor que el de la clase A, o ningún cliente quedará en B.'
              : 'El umbral ámbar debe ser menor que el verde, o el semáforo nunca se pondrá en ámbar.'}
          </p>
        </div>
      ) : null}
    </Tarjeta>
  )
}

export function PoliticaDeVisitas() {
  const { config, guardar } = useConfiguracionNegocio()
  const { mostrar } = useAvisos()

  if (!config) return null

  const aplicar = async (clave: Clave, valor: number) => {
    try {
      await guardar({ [clave]: valor })
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo guardar', 'error')
    }
  }

  return (
    <Tarjeta>
      <div className="border-b border-borde-suave px-5 py-3">
        <h2 className="text-sm font-medium text-texto">Política de visitas</h2>
        <p className="mt-0.5 text-xs text-suave">
          Cada cuánto ver a cada clase y cuántas visitas caben en tu semana. El plan se recalcula al
          instante.
        </p>
      </div>

      {CAMPOS_VISITAS.map((campo) => (
        <Fila
          key={campo.clave}
          campo={campo}
          valor={config[campo.clave]}
          onGuardar={(valor) => void aplicar(campo.clave, valor)}
        />
      ))}
    </Tarjeta>
  )
}
