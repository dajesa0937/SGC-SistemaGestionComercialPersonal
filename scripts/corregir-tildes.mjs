/**
 * Corrige las tildes de los textos visibles al usuario.
 *
 * Reemplaza frases completas y no palabras sueltas: los identificadores del
 * codigo (descripcion, configuracion, codigo, ultima...) se escriben sin tilde
 * a proposito, y un reemplazo por palabra los romperia.
 *
 * El script falla si alguna frase esperada no aparece: asi no pasa
 * desapercibido que un texto cambio y dejo de corregirse.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

const CAMBIOS = [
  ['src/app/navegacion.ts', [
    ['Como voy contra la cuota del mes', 'Cómo voy contra la cuota del mes'],
    ['Cuota mensual del ano', 'Cuota mensual del año'],
    ["etiqueta: 'Configuracion'", "etiqueta: 'Configuración'"],
  ]],
  ['src/domain/shared/errores.ts', [
    ['no es un periodo valido', 'no es un periodo válido'],
    ['con el codigo ${codigo}', 'con el código ${codigo}'],
    ['no es un importe valido en pesos', 'no es un importe válido en pesos'],
  ]],
  ['src/app/layouts/LayoutPrincipal.tsx', [
    ['Ruta de navegacion', 'Ruta de navegación'],
  ]],
  ['src/presentation/components/shared/BarraLateral.tsx', [
    ['Navegacion principal', 'Navegación principal'],
  ]],
  ['src/app/PaginaNoEncontrada.tsx', [
    ['Esta pagina no existe', 'Esta página no existe'],
    ['corresponder a un modulo que todavia no se ha construido',
     'corresponder a un módulo que todavía no se ha construido'],
  ]],
  ['src/app/LimiteDeError.tsx', [
    ['No se pudo completar la operacion', 'No se pudo completar la operación'],
    ['Algo salio mal en esta pantalla', 'Algo salió mal en esta pantalla'],
    ['El resto de la aplicacion sigue funcionando', 'El resto de la aplicación sigue funcionando'],
    ['para ver el detalle tecnico', 'para ver el detalle técnico'],
  ]],
  ['src/presentation/features/panel/PaginaPanel.tsx', [
    ['Como voy contra la cuota, sin abrir el Excel',
     'Cómo voy contra la cuota, sin abrir el Excel'],
    ['Todavia no hay ventas cargadas', 'Todavía no hay ventas cargadas'],
    ['Se puede cargar el historico completo', 'Se puede cargar el histórico completo'],
    ['Conocer la situacion comercial completa', 'Conocer la situación comercial completa'],
    ['Ritmo requerido por dia habil y proyeccion de cierre',
     'Ritmo requerido por día hábil y proyección de cierre'],
    ['Acumulado del ano contra la meta anual', 'Acumulado del año contra la meta anual'],
    ['Ventas contra meta de los ultimos doce meses',
     'Ventas contra meta de los últimos doce meses'],
    ['Clientes que requieren atencion y top del mes',
     'Clientes que requieren atención y top del mes'],
  ]],
  ['src/presentation/features/clientes/PaginaClientes.tsx', [
    ['completa dentro de la aplicacion', 'completa dentro de la aplicación'],
    ['Alta, edicion y archivado de clientes', 'Alta, edición y archivado de clientes'],
    ['Tabla con busqueda por nombre, codigo y NIT', 'Tabla con búsqueda por nombre, código y NIT'],
    ['Filtros por zona, estado y clasificacion', 'Filtros por zona, estado y clasificación'],
    ['Importacion del maestro de clientes', 'Importación del maestro de clientes'],
  ]],
  ['src/presentation/features/presupuesto/PaginaPresupuesto.tsx', [
    ['Cuota mensual asignada para el ano', 'Cuota mensual asignada para el año'],
    ['Grilla de los doce meses editable en linea', 'Grilla de los doce meses editable en línea'],
  ]],
  ['src/presentation/features/importacion/PaginaImportacion.tsx', [
    ['Cargar el archivo de ventas que envia la empresa',
     'Cargar el archivo de ventas que envía la empresa'],
    ['archivo, mapeo y revision', 'archivo, mapeo y revisión'],
    ['Resolucion de clientes no reconocidos', 'Resolución de clientes no reconocidos'],
    ['Reimportacion sin duplicar y reversion de la ultima carga',
     'Reimportación sin duplicar y reversión de la última carga'],
  ]],
  ['src/presentation/features/reportes/PaginaReportes.tsx', [
    ['Llevar la informacion fuera de la pantalla', 'Llevar la información fuera de la pantalla'],
    ['Informe mensual de gestion', 'Informe mensual de gestión'],
    ['del cliente, util antes de una visita', 'del cliente, útil antes de una visita'],
    ['Exportacion de cualquier tabla a CSV', 'Exportación de cualquier tabla a CSV'],
  ]],
  ['src/presentation/features/configuracion/PaginaConfiguracion.tsx', [
    ['titulo="Configuracion"', 'titulo="Configuración"'],
    ["siNo={['Si', 'No garantizado']}", "siNo={['Sí', 'No garantizado']}"],
    ['hasta entonces la aplicacion no debe ser la\n            unica copia',
     'hasta entonces la aplicación no debe ser la\n            única copia'],
    ['sin miedo a perder informacion', 'sin miedo a perder información'],
    ['Aviso cuando pasen quince dias sin respaldar', 'Aviso cuando pasen quince días sin respaldar'],
    ['Historial de importaciones y reversion de la ultima',
     'Historial de importaciones y reversión de la última'],
    ['Caida porcentual que marca a un cliente en riesgo',
     'Caída porcentual que marca a un cliente en riesgo'],
    ['Cortes de Pareto para la clasificacion ABC', 'Cortes de Pareto para la clasificación ABC'],
    ['Umbrales de color del semaforo de cumplimiento',
     'Umbrales de color del semáforo de cumplimiento'],
  ]],
  ['index.html', [
    ['content="Sistema de Gestion Comercial Personal"',
     'content="Sistema de Gestión Comercial Personal"'],
  ]],
  ['vite.config.ts', [
    ["description: 'Sistema de Gestion Comercial Personal'",
     "description: 'Sistema de Gestión Comercial Personal'"],
  ]],
  ['package.json', [
    ['"description": "Sistema de Gestion Comercial Personal"',
     '"description": "Sistema de Gestión Comercial Personal"'],
  ]],
]

let total = 0
const faltantes = []

for (const [archivo, pares] of CAMBIOS) {
  const ruta = join(RAIZ, archivo)
  let texto = readFileSync(ruta, 'utf8')
  for (const [viejo, nuevo] of pares) {
    if (!texto.includes(viejo)) {
      faltantes.push(`${archivo}: no se encontro "${viejo.slice(0, 45)}…"`)
      continue
    }
    texto = texto.split(viejo).join(nuevo)
    total++
  }
  writeFileSync(ruta, texto)
}

console.log(`${total} textos corregidos`)
if (faltantes.length) {
  console.error('\nFRASES NO ENCONTRADAS:')
  faltantes.forEach((f) => console.error('  ' + f))
  process.exit(1)
}
