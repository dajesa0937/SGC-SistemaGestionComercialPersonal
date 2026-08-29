import type { AliasCliente, Cliente, NotaCliente } from '@/domain/cliente/cliente.entity'
import type { VentaMensual } from '@/domain/venta/venta.entity'
import type { MovimientoVenta } from '@/domain/venta/movimiento.entity'
import type { Presupuesto } from '@/domain/presupuesto/presupuesto.entity'
import type { Zona } from '@/domain/geografia/zona.entity'
import type { CorteCartera, DocumentoCartera } from '@/domain/cobranza/cobranza.entity'
import type { ContenidoRespaldo } from '@/domain/respaldo/respaldo.entity'
import { CONFIGURACION_POR_DEFECTO } from '@/domain/config/configuracion.entity'
import { aCentavos } from '@/domain/shared/dinero'
import { diasEntre } from '@/domain/shared/fechas'
import { crearPeriodo, periodoDeFecha, sumarMeses } from '@/domain/shared/periodo'
import type { FechaISO, Periodo } from '@/domain/shared/types'

/**
 * Base de demostracion.
 *
 * Existe para poder ver la aplicacion llena y funcionando sin tocar los datos
 * reales: se genera un `ContenidoRespaldo` completo y se restaura por el mismo
 * camino que un respaldo de verdad. Eso tiene dos ventajas sobre insertar
 * registros sueltos: reutiliza la ruta ya probada, y **reemplaza** en vez de
 * mezclar, que es lo unico que garantiza que despues se pueda volver atras
 * restaurando el respaldo propio.
 *
 * Tres reglas que no se negocian:
 *
 * 1. Todo cliente se llama `DEMO · algo`. Un dato de demostracion tiene que
 *    delatarse solo en cualquier pantalla, informe o exportacion.
 * 2. Los identificadores empiezan por `demo-`, asi que se reconocen tambien
 *    dentro del archivo de respaldo.
 * 3. La generacion es **determinista**: mismo `hoy`, misma base. Sin eso no se
 *    puede probar, y una demo que cambia sola es imposible de verificar.
 */

/** Marca en la tabla de configuracion. Su presencia es lo que enciende el aviso. */
export const CLAVE_DEMO = 'demo'

export interface MarcaDemo {
  readonly esDemo: true
  readonly generadaEn: FechaISO
}

export const PREFIJO_DEMO = 'DEMO · '

/**
 * Generador pseudoaleatorio con semilla (mulberry32).
 *
 * `Math.random()` haria la demo distinta en cada carga y por tanto imposible de
 * verificar con una prueba. Aqui la semilla es fija y el resultado siempre el
 * mismo.
 */
function aleatorio(semilla: number): () => number {
  let estado = semilla >>> 0
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Las cinco lineas reales del negocio. */
const CATEGORIAS = [
  { nombre: 'Guadañadoras', productos: ['Guadaña 2T 43cc', 'Guadaña 4T 35cc', 'Guadaña profesional 52cc'], precio: 1_450_000 },
  { nombre: 'Motosierras', productos: ['Motosierra 18"', 'Motosierra 22"', 'Motosierra podadora'], precio: 1_850_000 },
  { nombre: 'Motobombas', productos: ['Motobomba 2"', 'Motobomba 3"', 'Motobomba autocebante'], precio: 1_200_000 },
  { nombre: 'Motores', productos: ['Motor 6.5 HP', 'Motor 9 HP', 'Motor 13 HP'], precio: 2_100_000 },
  { nombre: 'Repuestos', productos: ['Kit de corte', 'Cadena 18"', 'Bujía y filtro', 'Piñón y barra'], precio: 145_000 },
] as const

/**
 * Como se comporta cada cliente a lo largo del ano.
 *
 * Que haya de los cinco tipos es lo que hace util la demo: con todos iguales,
 * ni el plan de visitas ni el puente de ventas mostrarian nada.
 */
type Perfil = 'crece' | 'estable' | 'cae' | 'esporadico' | 'nuevo' | 'recien' | 'perdido'

interface Semilla {
  nombre: string
  municipio: string
  perfil: Perfil
  /** Compra tipica al mes, en pesos. */
  escala: number
}

/**
 * Municipios de los diez departamentos donde el usuario tiene cartera real.
 *
 * Son codigos DANE de verdad; hay una prueba que comprueba que el catalogo los
 * reconoce todos, porque un codigo inventado dejaria clientes fuera del mapa y
 * la demo enseñaria un fallo que no existe.
 */
const CLIENTES: readonly Semilla[] = [
  { nombre: 'Agroservicios El Roble', municipio: '68001', perfil: 'crece', escala: 4_200_000 },
  { nombre: 'Ferretería La Palma', municipio: '68081', perfil: 'estable', escala: 2_800_000 },
  { nombre: 'Maquinaria del Oriente', municipio: '68276', perfil: 'crece', escala: 6_500_000 },
  { nombre: 'Distribuidora Piedecuesta', municipio: '68547', perfil: 'cae', escala: 3_100_000 },
  { nombre: 'Agrocampo Puerto Wilches', municipio: '68575', perfil: 'estable', escala: 1_900_000 },
  { nombre: 'Insumos Sabana', municipio: '68655', perfil: 'esporadico', escala: 1_400_000 },
  { nombre: 'Comercial Sincelejo', municipio: '70001', perfil: 'crece', escala: 5_400_000 },
  { nombre: 'Agrotienda Corozal', municipio: '70215', perfil: 'estable', escala: 2_300_000 },
  { nombre: 'Herramientas San Marcos', municipio: '70473', perfil: 'cae', escala: 2_700_000 },
  { nombre: 'Depósito San Onofre', municipio: '70708', perfil: 'esporadico', escala: 1_100_000 },
  { nombre: 'Equipos del Norte', municipio: '05001', perfil: 'crece', escala: 7_800_000 },
  { nombre: 'Agropecuaria Turbo', municipio: '05837', perfil: 'estable', escala: 3_600_000 },
  { nombre: 'Ferretería Apartadó', municipio: '05045', perfil: 'cae', escala: 2_200_000 },
  { nombre: 'Suministros Puerto Berrío', municipio: '05579', perfil: 'perdido', escala: 1_800_000 },
  { nombre: 'Importadora Cartagena', municipio: '13001', perfil: 'crece', escala: 9_200_000 },
  { nombre: 'Agroinsumos Magangué', municipio: '13430', perfil: 'estable', escala: 4_100_000 },
  { nombre: 'Ferretería Turbaco', municipio: '13836', perfil: 'esporadico', escala: 1_600_000 },
  { nombre: 'Comercial Arjona', municipio: '13052', perfil: 'cae', escala: 2_500_000 },
  { nombre: 'Maquinaria Montería', municipio: '23001', perfil: 'crece', escala: 6_900_000 },
  { nombre: 'Agroservicio Lorica', municipio: '23417', perfil: 'estable', escala: 3_300_000 },
  { nombre: 'Insumos San Bernardo', municipio: '23670', perfil: 'esporadico', escala: 1_250_000 },
  { nombre: 'Depósito Tierralta', municipio: '23807', perfil: 'cae', escala: 2_050_000 },
  { nombre: 'Equipos Santa Marta', municipio: '47001', perfil: 'crece', escala: 5_100_000 },
  { nombre: 'Agrotienda El Banco', municipio: '47245', perfil: 'estable', escala: 2_400_000 },
  { nombre: 'Ferretería Ciénaga', municipio: '47189', perfil: 'perdido', escala: 1_700_000 },
  { nombre: 'Maquinaria Valledupar', municipio: '20001', perfil: 'crece', escala: 4_800_000 },
  { nombre: 'Agroinsumos Aguachica', municipio: '20011', perfil: 'estable', escala: 2_900_000 },
  { nombre: 'Comercial La Paz', municipio: '20621', perfil: 'esporadico', escala: 980_000 },
  { nombre: 'Distribuidora Cúcuta', municipio: '54001', perfil: 'cae', escala: 3_900_000 },
  { nombre: 'Ferretería Ocaña', municipio: '54498', perfil: 'estable', escala: 2_100_000 },
  { nombre: 'Suministros Inírida', municipio: '94001', perfil: 'esporadico', escala: 850_000 },
  { nombre: 'Agrocomercio Quibdó', municipio: '27001', perfil: 'nuevo', escala: 2_600_000 },
  { nombre: 'Talleres del Sinú', municipio: '23001', perfil: 'nuevo', escala: 3_400_000 },
  { nombre: 'Agroservicios Floridablanca', municipio: '68276', perfil: 'nuevo', escala: 1_950_000 },
  { nombre: 'Repuestos del Caribe', municipio: '13001', perfil: 'crece', escala: 3_700_000 },
  { nombre: 'La Casa del Agricultor', municipio: '70001', perfil: 'estable', escala: 4_400_000 },
  { nombre: 'Motores y Equipos del Sur', municipio: '05001', perfil: 'cae', escala: 5_600_000 },
  { nombre: 'Agroferretería Bucaramanga', municipio: '68001', perfil: 'estable', escala: 3_050_000 },
  { nombre: 'Insumos del Magdalena', municipio: '47001', perfil: 'esporadico', escala: 1_350_000 },
  { nombre: 'Comercializadora Sucre', municipio: '70215', perfil: 'crece', escala: 4_600_000 },
  { nombre: 'Agroservicios La Esperanza', municipio: '13430', perfil: 'recien', escala: 2_800_000 },
  { nombre: 'Ferretería El Progreso', municipio: '20001', perfil: 'recien', escala: 1_650_000 },
]

const ZONAS: readonly { nombre: string; municipios: string[] }[] = [
  { nombre: 'Santander', municipios: ['68001', '68276', '68547', '68655'] },
  { nombre: 'Magdalena Medio', municipios: ['68081', '68575', '05579'] },
  { nombre: 'Sabanas', municipios: ['70001', '70215', '70473', '70708'] },
  { nombre: 'Costa', municipios: ['13001', '13430', '13836', '13052', '47001', '47245', '47189'] },
  { nombre: 'Sinú', municipios: ['23001', '23417', '23670', '23807'] },
  { nombre: 'Urabá y Antioquia', municipios: ['05001', '05837', '05045'] },
  { nombre: 'Cesar y Norte', municipios: ['20001', '20011', '20621', '54001', '54498'] },
]

const MESES_HISTORIA = 18

function fechaEn(anio: number, mes: number, dia: number): FechaISO {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function sumarDias(fecha: FechaISO, dias: number): FechaISO {
  const instante = Date.parse(`${fecha}T00:00:00Z`) + dias * 86_400_000
  return new Date(instante).toISOString().slice(0, 10)
}

/** Factor de estacionalidad: en el campo se compra mas en las dos temporadas de lluvia. */
function estacionalidad(mes: number): number {
  const fuerte = [3, 4, 5, 9, 10, 11]
  const flojo = [1, 2, 7]
  if (fuerte.includes(mes)) return 1.25
  if (flojo.includes(mes)) return 0.75
  return 1
}

/**
 * Cuanto compra un cliente en el mes `indice` de los dieciocho.
 *
 * Devuelve 0 cuando no compro, que es lo que hace que existan clientes
 * perdidos, recuperados y esporadicos — y por tanto que el puente de ventas
 * tenga algo que explicar.
 */
function compraDelMes(perfil: Perfil, indice: number, azar: () => number): number {
  const avance = indice / (MESES_HISTORIA - 1)
  switch (perfil) {
    case 'crece':
      return 0.7 + avance * 0.8 + (azar() - 0.5) * 0.2
    case 'estable':
      return 0.9 + (azar() - 0.5) * 0.3
    case 'cae':
      return 1.4 - avance * 0.9 + (azar() - 0.5) * 0.2
    case 'esporadico':
      // Compra una de cada tres veces: es el cliente que aparece y desaparece.
      return azar() < 0.35 ? 1.1 + (azar() - 0.5) * 0.5 : 0
    case 'nuevo':
      // Solo existe en los ultimos cuatro meses.
      return indice >= MESES_HISTORIA - 4 ? 0.8 + (azar() - 0.5) * 0.3 : 0
    case 'recien':
      // Abierto este mismo mes: sin el, el indicador de aperturas del panel
      // saldria en cero y pareceria que la aplicacion no lo calcula.
      return indice === MESES_HISTORIA - 1 ? 0.9 : 0
    case 'perdido':
      // Compraba bien y dejo de comprar hace cinco meses.
      return indice < MESES_HISTORIA - 5 ? 1 + (azar() - 0.5) * 0.3 : 0
  }
}

export interface BaseDemo {
  readonly contenido: ContenidoRespaldo
  readonly resumen: {
    readonly clientes: number
    readonly movimientos: number
    readonly periodos: number
    readonly visitas: number
    readonly cortes: number
  }
}

/**
 * Construye la base de demostracion completa.
 *
 * `hoy` se pasa en vez de leerse del reloj para que la generacion sea
 * reproducible y comprobable con una prueba.
 */
export function generarDemo(hoy: FechaISO): BaseDemo {
  const azar = aleatorio(20260829)
  const instante = `${hoy}T12:00:00.000Z`
  const [anioHoy, mesHoy] = hoy.split('-').map(Number) as [number, number, number]
  const periodoActual = crearPeriodo(anioHoy, mesHoy)
  const primerPeriodo = sumarMeses(periodoActual, -(MESES_HISTORIA - 1))

  const clientes: Cliente[] = []
  const movimientos: MovimientoVenta[] = []
  const notas: NotaCliente[] = []
  const aliases: AliasCliente[] = []

  CLIENTES.forEach((semilla, indiceCliente) => {
    const id = `demo-c-${String(indiceCliente + 1).padStart(3, '0')}`
    const identificacion = `99${String(1_000_000 + indiceCliente * 7919).padStart(7, '0')}`

    clientes.push({
      id,
      codigo: identificacion,
      nombre: `${PREFIJO_DEMO}${semilla.nombre}`,
      identificacion,
      municipio: semilla.municipio,
      direccion: `Calle ${10 + (indiceCliente % 40)} # ${5 + (indiceCliente % 30)}-${20 + (indiceCliente % 60)}`,
      telefono: `31${String(indiceCliente % 10)}${String(2_000_000 + indiceCliente * 13_577).slice(0, 7)}`,
      contactoPrincipal: `Contacto ${indiceCliente + 1}`,
      estadoManual: 'cliente',
      archivado: false,
      creadoEn: instante,
      actualizadoEn: instante,
    })

    // --- ventas, linea a linea
    for (let mes = 0; mes < MESES_HISTORIA; mes++) {
      const periodo = sumarMeses(primerPeriodo, mes)
      const [anio, numeroMes] = periodo.split('-').map(Number) as [number, number]
      const factor = compraDelMes(semilla.perfil, mes, azar) * estacionalidad(numeroMes)
      if (factor <= 0) continue

      const objetivo = semilla.escala * factor
      // Entre uno y tres pedidos al mes, y cada pedido de una a tres lineas.
      const pedidos = 1 + Math.floor(azar() * 2.4)
      for (let pedido = 0; pedido < pedidos; pedido++) {
        const dia = 3 + Math.floor(azar() * 25)
        const fecha = fechaEn(anio, numeroMes, dia)
        const lineas = 1 + Math.floor(azar() * 2.6)
        for (let linea = 0; linea < lineas; linea++) {
          const categoria = CATEGORIAS[Math.floor(azar() * CATEGORIAS.length)]!
          const producto = categoria.productos[Math.floor(azar() * categoria.productos.length)]!
          const cantidad = 1 + Math.floor(azar() * (categoria.nombre === 'Repuestos' ? 8 : 3))
          const valorUnitario = Math.round(
            (categoria.precio * (0.9 + azar() * 0.25) * (objetivo / (pedidos * lineas * 2_000_000))) /
              1000,
          ) * 1000
          if (valorUnitario <= 0) continue
          movimientos.push({
            id: `demo-m-${movimientos.length + 1}`,
            clienteId: id,
            fecha,
            periodo,
            categoria: categoria.nombre,
            producto,
            cantidad,
            valorUnitario,
            valor: valorUnitario * cantidad,
            actualizadoEn: instante,
          })
        }
      }
    }

    // --- visitas
    //
    // Repartidas a proposito en tres situaciones: al dia, vencida y nunca
    // visitado. Si todos estuvieran al dia el plan de visitas saldria vacio y
    // no se veria funcionando.
    const nunca = indiceCliente % 9 === 0
    if (!nunca) {
      const visitas = 3 + Math.floor(azar() * 7)
      let atras = 5 + Math.floor(azar() * 70)
      for (let visita = 0; visita < visitas; visita++) {
        notas.push({
          id: `demo-n-${notas.length + 1}`,
          clienteId: id,
          fecha: sumarDias(hoy, -atras),
          texto: visita === 0 ? 'Visita de seguimiento' : 'Visita de ruta',
          tipo: 'visita',
          creadoEn: instante,
        })
        atras += 20 + Math.floor(azar() * 40)
      }
    }
  })

  // --- totales mensuales derivados de los movimientos, nunca escritos aparte
  const totales = new Map<string, { clienteId: string; periodo: Periodo; valor: number; unidades: number }>()
  for (const movimiento of movimientos) {
    const clave = `${movimiento.clienteId}|${movimiento.periodo}`
    const actual = totales.get(clave)
    if (actual) {
      actual.valor += movimiento.valor
      actual.unidades += movimiento.cantidad ?? 0
    } else {
      totales.set(clave, {
        clienteId: movimiento.clienteId,
        periodo: movimiento.periodo,
        valor: movimiento.valor,
        unidades: movimiento.cantidad ?? 0,
      })
    }
  }

  const ventas: VentaMensual[] = [...totales.values()].map((total, indice) => ({
    id: `demo-v-${indice + 1}`,
    clienteId: total.clienteId,
    periodo: total.periodo,
    valor: total.valor,
    unidades: total.unidades,
    origen: 'movimientos',
    actualizadoEn: instante,
  }))

  // --- presupuesto: la cuota del mes es lo vendido el mismo mes del ano
  // anterior mas un 8 %, y para los primeros meses el promedio general.
  const ventaPorPeriodo = new Map<Periodo, number>()
  for (const venta of ventas) {
    ventaPorPeriodo.set(venta.periodo, (ventaPorPeriodo.get(venta.periodo) ?? 0) + venta.valor)
  }
  const promedio =
    [...ventaPorPeriodo.values()].reduce((suma, valor) => suma + valor, 0) /
    Math.max(1, ventaPorPeriodo.size)

  const presupuestos: Presupuesto[] = []
  for (let mes = 0; mes < MESES_HISTORIA; mes++) {
    const periodo = sumarMeses(primerPeriodo, mes)
    const anterior = ventaPorPeriodo.get(sumarMeses(periodo, -12))
    const base = anterior ?? promedio
    presupuestos.push({
      id: `demo-p-${mes + 1}`,
      periodo,
      meta: Math.round((base * 1.08) / 100_000) * 100_000,
      actualizadoEn: instante,
    })
  }

  const zonas: Zona[] = ZONAS.map((zona, indice) => ({
    id: `demo-z-${indice + 1}`,
    nombre: zona.nombre,
    municipios: zona.municipios,
    creadoEn: instante,
    actualizadoEn: instante,
  }))

  // --- cartera: dos cortes, para que la comparacion tenga con que
  const { cortes, documentos } = generarCartera(hoy, clientes, movimientos, azar, instante)

  return {
    contenido: {
      clientes,
      aliases,
      notas,
      ventas,
      movimientos,
      presupuestos,
      importaciones: [],
      zonas,
      cortes,
      documentosCartera: documentos,
      configuracion: [
        { clave: 'negocio', valor: CONFIGURACION_POR_DEFECTO },
        { clave: CLAVE_DEMO, valor: { esDemo: true, generadaEn: hoy } satisfies MarcaDemo },
      ],
    },
    resumen: {
      clientes: clientes.length,
      movimientos: movimientos.length,
      periodos: ventaPorPeriodo.size,
      visitas: notas.length,
      cortes: cortes.length,
    },
  }
}

/**
 * Dos cortes de cartera separados treinta dias.
 *
 * Las facturas salen de las ventas reales de la demo, con vencimiento a 30, 45 o
 * 60 dias. Entre un corte y otro unas se saldan, otras siguen y aparecen las
 * nuevas: es lo que hace que la comparacion entre cortes muestre clientes que
 * suben, que bajan, que saldan y que entran.
 */
function generarCartera(
  hoy: FechaISO,
  clientes: readonly Cliente[],
  movimientos: readonly MovimientoVenta[],
  azar: () => number,
  instante: string,
): { cortes: CorteCartera[]; documentos: DocumentoCartera[] } {
  const fechaReciente = hoy
  const fechaAnterior = sumarDias(hoy, -30)

  const porId = new Map(clientes.map((cliente) => [cliente.id, cliente]))

  // Una factura por pedido: se agrupan las lineas por cliente y fecha.
  const facturas = new Map<string, { clienteId: string; fecha: FechaISO; valor: number }>()
  for (const movimiento of movimientos) {
    const clave = `${movimiento.clienteId}|${movimiento.fecha}`
    const actual = facturas.get(clave)
    if (actual) actual.valor += movimiento.valor
    else facturas.set(clave, { clienteId: movimiento.clienteId, fecha: movimiento.fecha, valor: movimiento.valor })
  }

  const cortes: CorteCartera[] = []
  const documentos: DocumentoCartera[] = []
  let numeroFactura = 3000

  const lista = [...facturas.values()].sort((a, b) => a.fecha.localeCompare(b.fecha))

  for (const [indiceCorte, fechaCorte] of [fechaAnterior, fechaReciente].entries()) {
    const corteId = `demo-corte-${indiceCorte + 1}`
    const documentosDelCorte: DocumentoCartera[] = []

    for (const factura of lista) {
      // Solo lo facturado en los cuatro meses previos al corte sigue vivo.
      const antiguedad = diasEntre(factura.fecha, fechaCorte)
      if (antiguedad < 0 || antiguedad > 130) continue

      const cliente = porId.get(factura.clienteId)
      if (!cliente) continue

      // Alrededor de la mitad de lo facturado ya se pago; se decide con un
      // valor estable por factura para que no cambie de un corte al otro sin
      // motivo — una factura pagada no puede reaparecer sin pagar.
      const dado = ((factura.valor % 97) + antiguedad) % 100
      if (dado < 55) continue

      const plazo = [30, 45, 60][Math.floor(azar() * 3)]!
      const vencimiento = sumarDias(factura.fecha, plazo)
      const saldo = Math.round(factura.valor * (0.4 + (dado % 60) / 100))

      numeroFactura++
      documentosDelCorte.push({
        id: `demo-d-${documentos.length + documentosDelCorte.length + 1}`,
        corteId,
        identificacion: cliente.identificacion ?? '',
        nombre: cliente.nombre,
        documento: `FV-2-${numeroFactura}`,
        fechaVencimiento: vencimiento,
        valor: aCentavos(saldo + azar() * 0.99),
        clienteId: cliente.id,
        contacto: cliente.contactoPrincipal,
        telefono: cliente.telefono,
      })
    }

    // Dos anticipos por corte: son los que obligan a que el saldo a favor se
    // trate aparte, y sin ellos la demo no enseñaria ese caso.
    for (let anticipo = 0; anticipo < 2; anticipo++) {
      const cliente = clientes[(indiceCorte * 5 + anticipo * 11) % clientes.length]!
      numeroFactura++
      documentosDelCorte.push({
        id: `demo-d-${documentos.length + documentosDelCorte.length + 1}`,
        corteId,
        identificacion: cliente.identificacion ?? '',
        nombre: cliente.nombre,
        documento: `RC-1-${numeroFactura}`,
        fechaVencimiento: sumarDias(fechaCorte, -(5 + anticipo * 9)),
        valor: -aCentavos(300_000 + anticipo * 450_000),
        clienteId: cliente.id,
        contacto: cliente.contactoPrincipal,
        telefono: cliente.telefono,
      })
    }

    cortes.push({
      id: corteId,
      fecha: fechaCorte,
      procesadoEn: `Procesado en: ${fechaCorte} (datos de demostración)`,
      empresa: 'DEMOSTRACIÓN',
      archivo: 'base-de-demostracion',
      importadoEn: instante,
      total: documentosDelCorte.reduce((suma, documento) => suma + documento.valor, 0),
      documentos: documentosDelCorte.length,
    })
    documentos.push(...documentosDelCorte)
  }

  return { cortes, documentos }
}

/** Periodo mas reciente con datos, para poder situar la aplicacion al cargar. */
export function periodoDeDemo(hoy: FechaISO): Periodo {
  return periodoDeFecha(new Date(`${hoy}T12:00:00Z`))
}
