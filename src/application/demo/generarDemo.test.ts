import { describe, expect, it } from 'vitest'
import { resolverMunicipio } from '@/domain/geografia/geografia'
import { totalDe, tramoDe, tramosEnCero } from '@/domain/cobranza/cobranza.entity'
import { validarRespaldo } from '@/application/respaldo/validarRespaldo'
import { construirRespaldo, serializarRespaldo } from '@/application/respaldo/construirRespaldo'
import { CLAVE_DEMO, PREFIJO_DEMO, generarDemo } from './generarDemo'

const HOY = '2026-08-29'
const demo = generarDemo(HOY)

describe('generarDemo', () => {
  it('es determinista: la misma fecha da exactamente la misma base', () => {
    // Sin esto no se puede probar nada de lo demás, y una demo que cambia sola
    // es imposible de verificar cuando algo se ve raro.
    expect(JSON.stringify(generarDemo(HOY))).toEqual(JSON.stringify(demo))
  })

  it('todo cliente se delata como demostración por su nombre', () => {
    expect(demo.contenido.clientes.length).toBeGreaterThan(30)
    for (const cliente of demo.contenido.clientes) {
      expect(cliente.nombre.startsWith(PREFIJO_DEMO)).toBe(true)
      expect(cliente.id.startsWith('demo-')).toBe(true)
    }
  })

  it('deja la marca de demostración en la configuración', () => {
    const marca = demo.contenido.configuracion.find((fila) => fila.clave === CLAVE_DEMO)
    expect(marca?.valor).toEqual({ esDemo: true, generadaEn: HOY })
  })

  it('todos los municipios existen en el catálogo DANE', () => {
    // Un código inventado dejaría clientes fuera del mapa y la demostración
    // enseñaría un fallo que la aplicación no tiene.
    for (const cliente of demo.contenido.clientes) {
      expect(resolverMunicipio(cliente.municipio!).conocido).toBe(true)
    }
  })

  it('el total mensual coincide con la suma de sus movimientos', () => {
    // Es la regla del proyecto: el total se deriva, no se escribe aparte.
    const sumado = new Map<string, number>()
    for (const movimiento of demo.contenido.movimientos) {
      const clave = `${movimiento.clienteId}|${movimiento.periodo}`
      sumado.set(clave, (sumado.get(clave) ?? 0) + movimiento.valor)
    }
    expect(demo.contenido.ventas.length).toBe(sumado.size)
    for (const venta of demo.contenido.ventas) {
      expect(venta.valor).toBe(sumado.get(`${venta.clienteId}|${venta.periodo}`))
      expect(venta.origen).toBe('movimientos')
    }
  })

  it('trae dieciocho meses de historia y presupuesto para todos', () => {
    const periodos = new Set(demo.contenido.ventas.map((venta) => venta.periodo))
    expect(periodos.size).toBe(18)
    expect(demo.contenido.presupuestos).toHaveLength(18)
    for (const presupuesto of demo.contenido.presupuestos) {
      expect(presupuesto.meta).toBeGreaterThan(0)
    }
  })

  it('hay clientes de los cinco comportamientos, no todos iguales', () => {
    // Con todos iguales ni el plan de visitas ni el puente de ventas mostrarían
    // nada: la demostración enseñaría una aplicación más pobre de lo que es.
    const ultimos = new Set<string>()
    const primeros = new Set<string>()
    const periodos = [...new Set(demo.contenido.ventas.map((v) => v.periodo))].sort()
    const tresPrimeros = periodos.slice(0, 3)
    const tresUltimos = periodos.slice(-3)
    for (const venta of demo.contenido.ventas) {
      if (tresUltimos.includes(venta.periodo)) ultimos.add(venta.clienteId)
      if (tresPrimeros.includes(venta.periodo)) primeros.add(venta.clienteId)
    }
    const nuevos = [...ultimos].filter((id) => !primeros.has(id))
    const perdidos = [...primeros].filter((id) => !ultimos.has(id))
    expect(nuevos.length).toBeGreaterThan(0)
    expect(perdidos.length).toBeGreaterThan(0)
  })

  it('deja clientes nunca visitados y visitas repartidas en el tiempo', () => {
    const visitados = new Set(demo.contenido.notas.map((nota) => nota.clienteId))
    expect(demo.contenido.notas.length).toBeGreaterThan(100)
    expect(visitados.size).toBeLessThan(demo.contenido.clientes.length)
    for (const nota of demo.contenido.notas) {
      expect(nota.tipo).toBe('visita')
      expect(nota.fecha <= HOY).toBe(true)
    }
  })

  it('las cinco líneas de producto aparecen todas', () => {
    const categorias = new Set(demo.contenido.movimientos.map((m) => m.categoria))
    expect(categorias).toEqual(
      new Set(['Guadañadoras', 'Motosierras', 'Motobombas', 'Motores', 'Repuestos']),
    )
  })
})

describe('cartera de la demostración', () => {
  it('trae dos cortes separados treinta días', () => {
    expect(demo.contenido.cortes).toHaveLength(2)
    const [anterior, actual] = demo.contenido.cortes
    expect(actual!.fecha).toBe(HOY)
    expect(anterior!.fecha).toBe('2026-07-30')
  })

  it('el total de cada corte es la suma de sus documentos', () => {
    for (const corte of demo.contenido.cortes) {
      const suyos = demo.contenido.documentosCartera.filter((d) => d.corteId === corte.id)
      expect(suyos).toHaveLength(corte.documentos)
      expect(suyos.reduce((suma, d) => suma + d.valor, 0)).toBe(corte.total)
    }
  })

  it('cada corte reparte por tramos sin perder un centavo', () => {
    for (const corte of demo.contenido.cortes) {
      const tramos = tramosEnCero()
      for (const documento of demo.contenido.documentosCartera.filter((d) => d.corteId === corte.id)) {
        tramos[tramoDe(documento.valor, documento.fechaVencimiento, corte.fecha)] += documento.valor
      }
      expect(totalDe(tramos)).toBe(corte.total)
    }
  })

  it('incluye saldos a favor, que es el caso que se escapa', () => {
    for (const corte of demo.contenido.cortes) {
      const aFavor = demo.contenido.documentosCartera.filter(
        (d) => d.corteId === corte.id && d.valor < 0,
      )
      expect(aFavor.length).toBeGreaterThan(0)
    }
  })

  it('todo documento apunta a un cliente que existe', () => {
    const ids = new Set(demo.contenido.clientes.map((cliente) => cliente.id))
    for (const documento of demo.contenido.documentosCartera) {
      expect(ids.has(documento.clienteId!)).toBe(true)
    }
  })
})

describe('la demostración viaja por el camino del respaldo', () => {
  it('se serializa y vuelve a validar como un respaldo cualquiera', () => {
    // Es la garantía de que cargar la demostración no necesita una ruta de
    // escritura propia: usa la misma que ya está probada, y por eso quitarla es
    // restaurar el respaldo del usuario.
    const resultado = validarRespaldo(serializarRespaldo(construirRespaldo(demo.contenido)))
    expect(resultado.valido).toBe(true)
    if (!resultado.valido) return
    expect(resultado.respaldo.datos.clientes).toHaveLength(demo.contenido.clientes.length)
    expect(resultado.respaldo.datos.documentosCartera).toHaveLength(
      demo.contenido.documentosCartera.length,
    )
  })
})
