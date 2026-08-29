import { useEffect } from 'react'
import { CLAVE_DEMO, type MarcaDemo } from '@/application/demo/generarDemo'
import { useRepositorios } from './contexto-repositorios'
import { useConsulta } from './useConsulta'

/**
 * Si la base cargada es la de demostracion.
 *
 * Ademas de devolverlo, pone `data-demo` en `<html>`. Esa es la parte que
 * importa: el sello que sale en todo lo que se imprime cuelga de ese atributo
 * desde `print.css`, asi que ninguna hoja nueva puede olvidarse de llevarlo.
 * Si dependiera de que cada informe se acuerde de pintarlo, tarde o temprano
 * saldria un PDF de demostracion con pinta de informe real.
 */
export function useDemo(): MarcaDemo | null | undefined {
  const repositorios = useRepositorios()
  const marca = useConsulta(
    async () => (await repositorios.configuracion.leerValor<MarcaDemo>(CLAVE_DEMO)) ?? null,
    [],
  )

  useEffect(() => {
    if (marca === undefined) return
    if (marca?.esDemo) document.documentElement.setAttribute('data-demo', '')
    else document.documentElement.removeAttribute('data-demo')
  }, [marca])

  return marca
}
