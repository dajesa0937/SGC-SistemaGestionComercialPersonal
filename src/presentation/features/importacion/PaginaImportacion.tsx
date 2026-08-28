import { useState } from 'react'
import { Upload } from 'lucide-react'
import { EncabezadoPagina } from '@/presentation/components/shared/EncabezadoPagina'
import { Boton } from '@/presentation/components/shared/Boton'
import { AsistenteVentas } from './AsistenteVentas'
import { HistorialImportaciones } from './HistorialImportaciones'
import { RegistroManualVentas } from './RegistroManualVentas'

export default function PaginaImportacion() {
  const [importando, setImportando] = useState(false)

  return (
    <>
      <EncabezadoPagina
        titulo="Ventas"
        descripcion="Importación del archivo del mes y registro manual del periodo seleccionado."
        acciones={
          <Boton variante="primario" onClick={() => setImportando(true)}>
            <Upload className="size-4" aria-hidden="true" />
            Importar ventas
          </Boton>
        }
      />

      <div className="flex flex-col gap-5">
        <HistorialImportaciones />
        <RegistroManualVentas />
      </div>

      <AsistenteVentas abierto={importando} onCerrar={() => setImportando(false)} />
    </>
  )
}
