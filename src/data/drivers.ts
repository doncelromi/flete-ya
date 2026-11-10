import { seeded } from '@/lib/utils'
import { BARRIO_CENTERS, TARIFFS } from './places'
import { at } from './dates'
import type { Doc, DocType, Driver, VehicleCategory, VerificationStatus, Zone } from './types'

const rnd = seeded(20260928)
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))

const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ'
function patente() {
  const l = () => LETTERS[Math.floor(rnd() * LETTERS.length)]
  return `${l()}${l()} ${int(100, 999)} ${l()}${l()}`
}
function phone() {
  return `+598 9${int(1, 9)} ${int(100, 999)} ${int(100, 999)}`
}
const COLORS: [string, string][] = [
  ['Blanca', 'White'],
  ['Blanca', 'White'],
  ['Gris', 'Grey'],
  ['Plata', 'Silver'],
  ['Negra', 'Black'],
  ['Roja', 'Red'],
  ['Azul', 'Blue'],
]

function docs(status: VerificationStatus, opts: { seguroVence?: number; seguroEstado?: VerificationStatus; altaDay?: number } = {}): Doc[] {
  const types: DocType[] = ['dni', 'licencia', 'antecedentes', 'seguro', 'cedula']
  const up = opts.altaDay ?? -int(30, 400)
  return types.map((tipo) => {
    const estado: VerificationStatus = tipo === 'seguro' && opts.seguroEstado ? opts.seguroEstado : status
    const auditoria: Doc['auditoria'] = [{ por: 'conductor', fecha: at(up, int(8, 20), int(0, 59)), accion: 'subido' }]
    if (estado === 'aprobado') auditoria.push({ por: 'Jonathan', fecha: at(up + 1, int(9, 18), int(0, 59)), accion: 'aprobado' })
    if (estado === 'rechazado') auditoria.push({ por: 'Jonathan', fecha: at(up + 1, int(9, 18), int(0, 59)), accion: 'rechazado' })
    const d: Doc = { tipo, estado, auditoria }
    if (tipo === 'seguro') d.vence = at(opts.seguroVence ?? int(40, 300), 0, 0)
    if (tipo === 'licencia') d.vence = at(int(200, 1400), 0, 0)
    return d
  })
}

interface Seed {
  id: string
  nombre: string
  cat: VehicleCategory
  modelo: string
  barrio: string
  verificacion: VerificationStatus
  enLinea: boolean
  ocupado?: boolean
  rating: number
  viajes: number
  patente?: string
  color?: [string, string]
  lat?: number
  lng?: number
  seguroVence?: number
  seguroEstado?: VerificationStatus
  motivoRechazo?: [string, string]
  alta?: number
}

// Named drivers used across the demo (same people in every view)
const NAMED: Seed[] = [
  { id: 'd-martin', nombre: 'Martín Gómez', cat: 'chico', modelo: 'Fiorino', barrio: 'Pocitos', verificacion: 'aprobado', enLinea: true, rating: 4.9, viajes: 213, patente: 'SBC 4821', color: ['Blanca', 'White'], lat: -34.9175, lng: -56.1560, seguroVence: 12, alta: -420 },
  { id: 'd-hernan', nombre: 'Hernán Ruiz', cat: 'mediano', modelo: 'Traffic', barrio: 'Tres Cruces', verificacion: 'aprobado', enLinea: true, rating: 4.6, viajes: 158 },
  { id: 'd-carlos', nombre: 'Carlos Medina', cat: 'mediano', modelo: 'Master', barrio: 'La Blanqueada', verificacion: 'aprobado', enLinea: false, rating: 3.9, viajes: 87 },
  { id: 'd-nahuel', nombre: 'Nahuel Sosa', cat: 'grande', modelo: 'Ducato', barrio: 'Cordón', verificacion: 'aprobado', enLinea: true, rating: 4.8, viajes: 176 },
  { id: 'd-gisela', nombre: 'Gisela Paz', cat: 'chico', modelo: 'Kangoo', barrio: 'Punta Carretas', verificacion: 'aprobado', enLinea: true, rating: 4.9, viajes: 142 },
  { id: 'd-ramon', nombre: 'Ramón Acosta', cat: 'grande', modelo: 'Sprinter', barrio: 'La Teja', verificacion: 'aprobado', enLinea: true, rating: 4.7, viajes: 201 },
  { id: 'd-luciana', nombre: 'Luciana Ortiz', cat: 'chico', modelo: 'Partner', barrio: 'Malvín', verificacion: 'aprobado', enLinea: true, rating: 4.8, viajes: 96 },
  { id: 'd-diego', nombre: 'Diego Romero', cat: 'chico', modelo: 'Fiorino', barrio: 'Cordón', verificacion: 'pendiente', enLinea: false, rating: 0, viajes: 0, alta: -1 },
  { id: 'd-walter', nombre: 'Walter Benítez', cat: 'mediano', modelo: 'Traffic', barrio: 'Las Piedras', verificacion: 'pendiente', enLinea: false, rating: 0, viajes: 0, seguroVence: -8, alta: -2 },
  { id: 'd-brian', nombre: 'Brian Villalba', cat: 'grande', modelo: 'Ducato', barrio: 'Cerro', verificacion: 'pendiente', enLinea: false, rating: 0, viajes: 0, alta: -1 },
  { id: 'd-julian', nombre: 'Julián Castro', cat: 'chico', modelo: 'Kangoo', barrio: 'Solymar', verificacion: 'pendiente', enLinea: false, rating: 0, viajes: 0, alta: -3 },
  { id: 'd-rocio', nombre: 'Rocío Molina', cat: 'chico', modelo: 'Partner', barrio: 'Punta Carretas', verificacion: 'pendiente', enLinea: false, rating: 0, viajes: 0, alta: 0 },
  { id: 'd-matias', nombre: 'Matías Herrera', cat: 'mediano', modelo: 'Master', barrio: 'Ciudad de la Costa', verificacion: 'pendiente', enLinea: false, rating: 0, viajes: 0, alta: -2 },
  { id: 'd-sergio', nombre: 'Sergio Díaz', cat: 'mediano', modelo: 'Traffic', barrio: 'Sayago', verificacion: 'rechazado', enLinea: false, rating: 0, viajes: 0, motivoRechazo: ['Licencia profesional vencida', 'Professional license expired'], alta: -9 },
  { id: 'd-pablo', nombre: 'Pablo Luna', cat: 'chico', modelo: 'Fiorino', barrio: 'Cerro', verificacion: 'rechazado', enLinea: false, rating: 0, viajes: 0, motivoRechazo: ['Antecedentes penales ilegibles, pedir nueva copia', 'Criminal record unreadable, request a new copy'], alta: -12 },
]

const FIRST = ['Juan', 'Lucas', 'Santiago', 'Facundo', 'Gonzalo', 'Mariano', 'Federico', 'Ezequiel', 'Leandro', 'Rodrigo', 'Maximiliano', 'Cristian', 'Gustavo', 'Alejandro', 'Damián', 'Emiliano', 'Hugo', 'Oscar', 'Rubén', 'Fabián', 'Jorge', 'Luis', 'Marcelo', 'Ariel', 'Ignacio', 'Tomás', 'Agustín', 'Franco', 'Nicolás', 'Sebastián', 'Claudio', 'Daniel', 'Raúl', 'Miguel', 'Esteban', 'Mauro', 'Paola', 'Valeria', 'Soledad', 'Florencia', 'Romina', 'Carla', 'Diego', 'Kevin', 'Axel', 'Jonathan', 'Alan', 'Leonel']
const LAST = ['Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Benítez', 'Acosta', 'Medina', 'Herrera', 'Suárez', 'Aguirre', 'Giménez', 'Gutiérrez', 'Pereyra', 'Rojas', 'Molina', 'Castro', 'Ortiz', 'Silva', 'Carrasco', 'Luna', 'Juárez', 'Cabrera', 'Ríos', 'Morales', 'Godoy', 'Moreno', 'Ferreyra', 'Domínguez', 'Vera', 'Quiroga', 'Ledesma', 'Villalba', 'Paz', 'Sosa', 'Coronel', 'Maldonado']

function build(s: Seed): Driver {
  const center = BARRIO_CENTERS.find((b) => b.barrio === s.barrio) ?? BARRIO_CENTERS[0]
  const color = s.color ?? pick(COLORS)
  const altaDay = s.alta ?? -(Math.max(45, Math.round(s.viajes * 1.6)) + int(0, 120))
  return {
    id: s.id,
    nombre: s.nombre,
    avatar: s.nombre,
    telefono: phone(),
    dni: `${int(1, 6)}.${int(100, 999)}.${int(100, 999)}-${int(0, 9)}`,
    licenciaClase: s.cat === 'grande' ? 'C profesional' : 'B profesional',
    vehiculo: { categoria: s.cat, modelo: s.modelo, patente: s.patente ?? patente(), color: color[0], colorEn: color[1] },
    zona: center.zona as Zone,
    barrio: s.barrio,
    lat: s.lat ?? center.lat + (rnd() - 0.5) * 0.028,
    lng: s.lng ?? center.lng + (rnd() - 0.5) * 0.032,
    enLinea: s.enLinea,
    ocupado: !!s.ocupado,
    rating: s.rating,
    viajes: s.viajes,
    verificacion: s.verificacion,
    documentos: docs(s.verificacion, { seguroVence: s.seguroVence, seguroEstado: s.seguroEstado, altaDay }),
    ultimaConexion: s.enLinea ? new Date(Date.now() - int(1, 8) * 60000).toISOString() : at(-int(0, 6), int(7, 22), int(0, 59)),
    alta: at(altaDay, 10, 0),
    motivoRechazo: s.motivoRechazo,
  }
}

const generated: Seed[] = []
const usedNames = new Set(NAMED.map((n) => n.nombre))
const barrios = BARRIO_CENTERS.map((b) => b.barrio)
// 112 total: 15 named + 97 generated. Online target = 31 (6 named online + 25 generated).
let onlineLeft = 25
while (NAMED.length + generated.length < 112) {
  const nombre = `${pick(FIRST)} ${pick(LAST)}`
  if (usedNames.has(nombre)) continue
  usedNames.add(nombre)
  const r = rnd()
  const cat: VehicleCategory = r < 0.5 ? 'chico' : r < 0.82 ? 'mediano' : 'grande'
  const tariff = TARIFFS.find((t) => t.categoria === cat)!
  const enLinea = onlineLeft > 0 && rnd() < 0.36
  if (enLinea) onlineLeft--
  generated.push({
    id: `d-${generated.length + 100}`,
    nombre,
    cat,
    modelo: pick(tariff.modelos),
    barrio: pick(barrios),
    verificacion: 'aprobado',
    enLinea,
    rating: Math.round((4.2 + rnd() * 0.75) * 10) / 10,
    viajes: int(12, 260),
  })
}
// top up online count deterministically if the random pass fell short
for (const g of generated) {
  if (onlineLeft <= 0) break
  if (!g.enLinea) {
    g.enLinea = true
    onlineLeft--
  }
}

export const DRIVERS: Driver[] = [...NAMED, ...generated].map(build)

// 9 online drivers are busy with trips in progress (never Martín: he is the one who gets matched)
const busyIds = ['d-hernan', 'd-nahuel', 'd-ramon', ...DRIVERS.filter((d) => d.enLinea && d.id.startsWith('d-1')).slice(0, 6).map((d) => d.id)]
for (const d of DRIVERS) if (busyIds.includes(d.id)) d.ocupado = true
export const BUSY_DRIVER_IDS = busyIds

export const driverById = (id: string) => DRIVERS.find((d) => d.id === id)!
export const MARTIN = driverById('d-martin')

export const DRIVER_STATS = {
  total: DRIVERS.length,
  online: DRIVERS.filter((d) => d.enLinea).length,
  busy: DRIVERS.filter((d) => d.ocupado).length,
  pending: DRIVERS.filter((d) => d.verificacion === 'pendiente').length,
  rejected: DRIVERS.filter((d) => d.verificacion === 'rechazado').length,
}
