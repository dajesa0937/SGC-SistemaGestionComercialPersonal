import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Archive, ArchiveRestore } from 'lucide-react'
import {
  FORMULARIO_VACIO,
  aNuevoCliente,
  esquemaCliente,
  type DatosFormularioCliente,
} from '@/application/clientes/cliente.schema'
import type { Cliente } from '@/domain/cliente/cliente.entity'
import { CodigoDeClienteDuplicadoError } from '@/domain/shared/errores'
import { Boton } from '@/presentation/components/shared/Boton'
import { Campo, Entrada, Seleccion } from '@/presentation/components/shared/Campo'
import { PanelLateral } from '@/presentation/components/shared/PanelLateral'
import { SelectorMunicipio } from '@/presentation/components/shared/SelectorMunicipio'
import { useRepositorios } from '@/presentation/hooks/data/contexto-repositorios'
import { useAvisos } from '@/presentation/hooks/ui/contexto-avisos'

interface Props {
  abierto: boolean
  /** `null` = alta de un cliente nuevo. */
  cliente: Cliente | null
  onCerrar: () => void
}

function aFormulario(cliente: Cliente): DatosFormularioCliente {
  return {
    codigo: cliente.codigo,
    nombre: cliente.nombre,
    nombreComercial: cliente.nombreComercial ?? '',
    identificacion: cliente.identificacion ?? '',
    municipio: cliente.municipio ?? '',
    direccion: cliente.direccion ?? '',
    telefono: cliente.telefono ?? '',
    email: cliente.email ?? '',
    contactoPrincipal: cliente.contactoPrincipal ?? '',
    estadoManual: cliente.estadoManual,
  }
}

export function FormularioCliente({ abierto, cliente, onCerrar }: Props) {
  const repositorios = useRepositorios()
  const { mostrar } = useAvisos()
  const [guardando, setGuardando] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<DatosFormularioCliente>({
    resolver: zodResolver(esquemaCliente),
    defaultValues: FORMULARIO_VACIO,
  })

  useEffect(() => {
    if (abierto) reset(cliente ? aFormulario(cliente) : FORMULARIO_VACIO)
  }, [abierto, cliente, reset])

  const enviar = handleSubmit(async (datos) => {
    setGuardando(true)
    try {
      const nuevos = aNuevoCliente(datos)
      if (cliente) {
        await repositorios.clientes.actualizar(cliente.id, nuevos)
        mostrar(`${nuevos.nombre} actualizado`, 'exito')
      } else {
        await repositorios.clientes.crear(nuevos)
        mostrar(`${nuevos.nombre} agregado a la cartera`, 'exito')
      }
      onCerrar()
    } catch (error) {
      if (error instanceof CodigoDeClienteDuplicadoError) {
        setError('codigo', { message: error.message })
      } else {
        mostrar(
          error instanceof Error ? error.message : 'No se pudo guardar el cliente',
          'error',
        )
      }
    } finally {
      setGuardando(false)
    }
  })

  const alternarArchivado = async () => {
    if (!cliente) return
    try {
      await repositorios.clientes.archivar(cliente.id, !cliente.archivado)
      mostrar(
        cliente.archivado ? `${cliente.nombre} reactivado` : `${cliente.nombre} archivado`,
        'exito',
      )
      onCerrar()
    } catch (error) {
      mostrar(error instanceof Error ? error.message : 'No se pudo archivar', 'error')
    }
  }

  return (
    <PanelLateral
      abierto={abierto}
      titulo={cliente ? 'Editar cliente' : 'Nuevo cliente'}
      subtitulo={cliente?.nombre}
      onCerrar={onCerrar}
      pie={
        <>
          {cliente ? (
            <Boton variante="fantasma" onClick={alternarArchivado} className="mr-auto">
              {cliente.archivado ? (
                <>
                  <ArchiveRestore className="size-4" aria-hidden="true" /> Reactivar
                </>
              ) : (
                <>
                  <Archive className="size-4" aria-hidden="true" /> Archivar
                </>
              )}
            </Boton>
          ) : null}
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form="formulario-cliente" disabled={guardando}>
            {guardando ? 'Guardando…' : cliente ? 'Guardar cambios' : 'Crear cliente'}
          </Boton>
        </>
      }
    >
      <form id="formulario-cliente" onSubmit={enviar} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Campo
            etiqueta="Identificación"
            htmlFor="identificacion"
            error={errors.identificacion?.message}
            ayuda="NIT o cédula. Es la llave que concilia con los archivos de la empresa"
          >
            <Entrada id="identificacion" inputMode="numeric" autoComplete="off" {...register('identificacion')} />
          </Campo>
          <Campo
            etiqueta="Código interno"
            htmlFor="codigo"
            error={errors.codigo?.message}
            ayuda="Solo si el archivo trae un código distinto"
          >
            <Entrada id="codigo" autoComplete="off" {...register('codigo')} />
          </Campo>
        </div>

        <Campo
          etiqueta="Nombre o razón social"
          htmlFor="nombre"
          requerido
          error={errors.nombre?.message}
        >
          <Entrada id="nombre" autoComplete="off" {...register('nombre')} />
        </Campo>

        <Campo
          etiqueta="Nombre comercial"
          htmlFor="nombreComercial"
          error={errors.nombreComercial?.message}
          ayuda="Si el establecimiento se conoce por otro nombre"
        >
          <Entrada id="nombreComercial" autoComplete="off" {...register('nombreComercial')} />
        </Campo>

        <Campo
          etiqueta="Municipio"
          htmlFor="municipio"
          error={errors.municipio?.message}
          ayuda="La zona comercial sale de aquí: se define en Configuración → Zonas"
        >
          <Controller
            name="municipio"
            control={control}
            render={({ field }) => (
              <SelectorMunicipio
                id="municipio"
                valor={field.value}
                onCambiar={field.onChange}
                invalido={errors.municipio !== undefined}
              />
            )}
          />
        </Campo>

        <Campo etiqueta="Dirección" htmlFor="direccion" error={errors.direccion?.message}>
          <Entrada id="direccion" autoComplete="off" {...register('direccion')} />
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Teléfono" htmlFor="telefono" error={errors.telefono?.message}>
            <Entrada id="telefono" inputMode="tel" autoComplete="off" {...register('telefono')} />
          </Campo>
          <Campo etiqueta="Correo" htmlFor="email" error={errors.email?.message}>
            <Entrada id="email" inputMode="email" autoComplete="off" {...register('email')} />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo
            etiqueta="Contacto principal"
            htmlFor="contactoPrincipal"
            error={errors.contactoPrincipal?.message}
          >
            <Entrada id="contactoPrincipal" autoComplete="off" {...register('contactoPrincipal')} />
          </Campo>
          <Campo etiqueta="Estado" htmlFor="estadoManual" error={errors.estadoManual?.message}>
            <Seleccion id="estadoManual" {...register('estadoManual')}>
              <option value="cliente">Cliente</option>
              <option value="prospecto">Prospecto</option>
              <option value="suspendido">Suspendido</option>
            </Seleccion>
          </Campo>
        </div>

        {cliente && isDirty ? (
          <p className="text-xs text-tenue">Hay cambios sin guardar.</p>
        ) : null}
      </form>
    </PanelLateral>
  )
}
