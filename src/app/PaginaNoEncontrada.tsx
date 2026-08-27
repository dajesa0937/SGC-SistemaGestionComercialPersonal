import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Boton } from '@/presentation/components/shared/Boton'
import { EstadoVacio } from '@/presentation/components/shared/EstadoVacio'

export default function PaginaNoEncontrada() {
  return (
    <EstadoVacio
      icono={Compass}
      titulo="Esta página no existe"
      descripcion="El enlace puede estar mal escrito o corresponder a un módulo que todavía no se ha construido."
      accion={
        <Link to="/">
          <Boton variante="primario">Volver al panel</Boton>
        </Link>
      }
    />
  )
}
