import { seeded } from '@/lib/utils'
import { COMMISSION, DEMO_KM, DEMO_ORIGIN, DEMO_ROUTE, PLACES, makeRoute, pathKm, placeById, tariffOf, HELPER_PER_HOUR } from './places'
import { BUSY_DRIVER_IDS, DRIVERS } from './drivers'
import { USERS } from './users'
import { at, dayDiff, inWeek, isToday } from './dates'
import type { PaymentMethod, Place, Trip, TripStatus, VehicleCategory } from './types'

const rnd = seeded(4790)
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))

export const COMMENTS_GOOD: [string, string][] = [
  ['Súper puntual y cuidadoso con los muebles.', 'Very punctual and careful with the furniture.'],
  ['Llegó antes de hora y ayudó a cargar todo.', 'Arrived early and helped load everything.'],
  ['Excelente trato, lo vuelvo a pedir.', 'Great service, I’ll book him again.'],
  ['La camioneta impecable, todo llegó perfecto.', 'Spotless van, everything arrived perfectly.'],
  ['Muy amable, respetó el horario.', 'Very kind, kept to the schedule.'],
  ['Rápido y prolijo. 10 puntos.', 'Fast and tidy. Top marks.'],
]
export const COMMENTS_BAD: [string, string][] = [
  ['Llegó 40 minutos tarde y no avisó.', 'Arrived 40 minutes late without notice.'],
  ['Demoró mucho en llegar al origen.', 'Took a long time to reach the pickup.'],
  ['Tardó más de lo estimado, aunque trató bien la carga.', 'Took longer than estimated, though the load was handled well.'],
]
const CHIPS = ['puntual', 'cuidadoso', 'amable', 'rapido', 'limpio']

function mk(o: {
  fecha: string
  usuarioId: string
  conductorId: string
  categoria: VehicleCategory
  origen: Place
  destino: Place
  horas: number
  ayudante: boolean
  metodo: PaymentMethod
  estado: TripStatus
  ruta?: [number, number][]
  km?: number
  canceladoPor?: 'usuario' | 'conductor'
}): Trip {
  if (o.origen.id === o.destino.id) o.destino = PLACES[(PLACES.indexOf(o.origen) + 5) % PLACES.length]
  const ruta = o.ruta ?? makeRoute([o.origen.lat, o.origen.lng], [o.destino.lat, o.destino.lng])
  const total = o.estado === 'cancelado' ? 0 : Math.round((tariffOf(o.categoria).porHora + (o.ayudante ? HELPER_PER_HOUR : 0)) * o.horas)
  const driver = DRIVERS.find((d) => d.id === o.conductorId)!
  const t: Trip = {
    id: 0,
    fecha: o.fecha,
    usuarioId: o.usuarioId,
    conductorId: o.conductorId,
    categoria: o.categoria,
    origen: o.origen,
    destino: o.destino,
    ruta,
    km: o.km ?? Math.round(pathKm(ruta) * 13) / 10,
    horas: o.horas,
    ayudante: o.ayudante,
    total,
    metodo: o.metodo,
    comision: Math.round(total * COMMISSION),
    estado: o.estado,
    canceladoPor: o.estado === 'cancelado' ? o.canceladoPor ?? 'usuario' : undefined,
  }
  if (o.estado === 'completado') {
    const bad = driver.id === 'd-carlos' && rnd() < 0.55
    const base = driver.rating || 4.7
    t.calificacionConductor = bad ? int(2, 3) : Math.min(5, Math.max(3, Math.round(base + (rnd() - 0.35))))
    t.calificacionUsuario = rnd() < 0.85 ? 5 : 4
    if (rnd() < 0.7 || bad) {
      t.comentario = bad ? pick(COMMENTS_BAD) : pick(COMMENTS_GOOD)
      t.chips = bad ? [] : [pick(CHIPS), pick(CHIPS)].filter((v, i, a) => a.indexOf(v) === i)
    }
  }
  return t
}

const P = placeById
const others = PLACES.filter((p) => p.id !== DEMO_ORIGIN.id)
const randomUser = () => USERS[int(1, USERS.length - 1)].id
const approvedDrivers = DRIVERS.filter((d) => d.verificacion === 'aprobado')

const list: Trip[] = []

/* ── Martín Gómez · weekly trips (must match Ganancias ↔ Comisiones) ──
   Efectivo: 72.000 + 54.000 + 39.000 + 45.000 = 210.000  → owes 31.500
   Tarjeta:  52.000 + 72.000 + 72.000 + 26.000 + 54.000 = 276.000 → platform owes 234.600
   Net in his favour: 203.100 */
const M = 'd-martin'
const martinWeek: { d: number; h: number; horas: number; ay: boolean; metodo: PaymentMethod; o: string; de: string; u?: string; fix?: 'demo' }[] = [
  { d: -6, h: 9, horas: 4, ay: false, metodo: 'efectivo', o: 'p-warnes', de: 'p-cabildo' },
  { d: -4, h: 15, horas: 2, ay: true, metodo: 'tarjeta', o: 'p-scalabrini', de: 'p-acoyte' }, // #4790
  { d: -3, h: 10, horas: 4, ay: false, metodo: 'tarjeta', o: 'p-medrano', de: 'p-maipu' },
  { d: -2, h: 11, horas: 4, ay: false, metodo: 'tarjeta', o: 'p-corrientes', de: 'p-rivadavia6100', u: 'u-lucia', fix: 'demo' },
  { d: -1, h: 16, horas: 3, ay: false, metodo: 'efectivo', o: 'p-dorrego', de: 'p-goyena' },
  { d: 0, h: 8, horas: 1.5, ay: true, metodo: 'efectivo', o: 'p-jbjusto', de: 'p-diazvelez' },
  { d: 0, h: 10, horas: 1, ay: true, metodo: 'tarjeta', o: 'p-cordoba', de: 'p-santafe' },
  { d: 0, h: 11, horas: 2.5, ay: false, metodo: 'efectivo', o: 'p-corrientes3400', de: 'p-directorio' },
  { d: 0, h: 13, horas: 3, ay: false, metodo: 'tarjeta', o: 'p-warnes', de: 'p-rivadavia7000' },
]
for (const m of martinWeek)
  list.push(
    mk({
      fecha: at(m.d, m.h, int(0, 50)),
      usuarioId: m.u ?? randomUser(),
      conductorId: M,
      categoria: 'chico',
      origen: P(m.o),
      destino: P(m.de),
      horas: m.horas,
      ayudante: m.ay,
      metodo: m.metodo,
      estado: 'completado',
      ...(m.fix === 'demo' ? { ruta: DEMO_ROUTE, km: DEMO_KM } : {}),
    }),
  )
const MARTIN_4790 = list[1]

/* ── Hernán Ruiz · cash-heavy week: $U 28.075 cobrados en efectivo → debe $U 4.212 ── */
const hernan: { d: number; horas: number; ay: boolean }[] = [
  { d: -6, horas: 4, ay: false },
  { d: -5, horas: 1.75, ay: true },
  { d: -4, horas: 4, ay: false },
  { d: -2, horas: 3, ay: false },
  { d: -1, horas: 3.25, ay: false },
]
for (const h of hernan)
  list.push(
    mk({
      fecha: at(h.d, int(8, 17), int(0, 55)),
      usuarioId: randomUser(),
      conductorId: 'd-hernan',
      categoria: 'mediano',
      origen: pick(others),
      destino: pick(others),
      horas: h.horas,
      ayudante: h.ay,
      metodo: 'efectivo',
      estado: 'completado',
    }),
  )

/* ── Lucía Ferreyra · customer history (12 trips + 1 scheduled) ── */
const lucia: { d: number; driver: string; cat: VehicleCategory; horas: number; ay: boolean; metodo: PaymentMethod; de: string; estado?: TripStatus }[] = [
  { d: -9, driver: 'd-gisela', cat: 'chico', horas: 2, ay: false, metodo: 'tarjeta', de: 'p-santafe', estado: 'cancelado' },
  { d: -12, driver: 'd-nahuel', cat: 'grande', horas: 3, ay: true, metodo: 'tarjeta', de: 'p-cabildo' },
  { d: -24, driver: 'd-martin', cat: 'chico', horas: 1.5, ay: false, metodo: 'efectivo', de: 'p-medrano' },
  { d: -33, driver: 'd-luciana', cat: 'chico', horas: 2, ay: false, metodo: 'tarjeta', de: 'p-juramento' },
  { d: -41, driver: 'd-hernan', cat: 'mediano', horas: 3, ay: true, metodo: 'tarjeta', de: 'p-libertador' },
  { d: -52, driver: 'd-martin', cat: 'chico', horas: 2, ay: false, metodo: 'tarjeta', de: 'p-acoyte' },
  { d: -66, driver: 'd-ramon', cat: 'grande', horas: 4, ay: true, metodo: 'tarjeta', de: 'p-maipu' },
  { d: -79, driver: 'd-gisela', cat: 'chico', horas: 1, ay: false, metodo: 'efectivo', de: 'p-cordoba' },
  { d: -95, driver: 'd-carlos', cat: 'mediano', horas: 2.5, ay: false, metodo: 'tarjeta', de: 'p-goyena' },
  { d: -108, driver: 'd-martin', cat: 'chico', horas: 2, ay: true, metodo: 'efectivo', de: 'p-diazvelez' },
  { d: -121, driver: 'd-nahuel', cat: 'grande', horas: 3.5, ay: true, metodo: 'tarjeta', de: 'p-centenario' },
]
for (const l of lucia)
  list.push(
    mk({
      fecha: at(l.d, int(9, 18), [0, 15, 30, 45][int(0, 3)]),
      usuarioId: 'u-lucia',
      conductorId: l.driver,
      categoria: l.cat,
      origen: DEMO_ORIGIN,
      destino: P(l.de),
      horas: l.horas,
      ayudante: l.ay,
      metodo: l.metodo,
      estado: l.estado ?? 'completado',
      canceladoPor: l.estado === 'cancelado' ? 'usuario' : undefined,
    }),
  )
export const SCHEDULED_TRIP: Trip = (() => {
  // next Saturday 10:00
  const dow = new Date(at(0)).getDay()
  const toSat = ((6 - dow + 7) % 7) || 7
  const t = mk({
    fecha: at(toSat, 10, 0),
    usuarioId: 'u-lucia',
    conductorId: 'd-nahuel',
    categoria: 'mediano',
    origen: DEMO_ORIGIN,
    destino: P('p-libertador'),
    horas: 3,
    ayudante: true,
    metodo: 'tarjeta',
    estado: 'programado',
  })
  return t
})()

/* ── Past 13 days: fill up to 60 historical trips (d-13..d-1) ── */
const pastCount = () => list.filter((t) => dayDiff(t.fecha) < 0 && dayDiff(t.fecha) >= -13).length
while (pastCount() < 60) {
  const d = approvedDrivers[int(1, approvedDrivers.length - 1)]
  if (d.id === 'd-martin' || d.id === 'd-hernan') continue
  const r = rnd()
  list.push(
    mk({
      fecha: at(-int(1, 13), int(7, 20), int(0, 59)),
      usuarioId: randomUser(),
      conductorId: d.id,
      categoria: d.vehiculo.categoria,
      origen: pick(PLACES),
      destino: pick(PLACES),
      horas: [1, 1.5, 2, 2, 2.5, 3, 3, 4][int(0, 7)],
      ayudante: rnd() < 0.3,
      metodo: r < 0.56 ? 'tarjeta' : 'efectivo',
      estado: rnd() < 0.05 ? 'cancelado' : 'completado',
      canceladoPor: 'conductor',
    }),
  )
}

/* ── Today: 38 finished (incl. Martín's 4) + 9 in progress = 47 ── */
const todayDone = () => list.filter((t) => isToday(t.fecha)).length
while (todayDone() < 38) {
  const d = approvedDrivers[int(1, approvedDrivers.length - 1)]
  if (d.id === 'd-martin' || d.id === 'd-hernan') continue
  list.push(
    mk({
      fecha: at(0, int(7, 13), int(0, 59)),
      usuarioId: randomUser(),
      conductorId: d.id,
      categoria: d.vehiculo.categoria,
      origen: pick(PLACES),
      destino: pick(PLACES),
      horas: [1, 1.5, 2, 2, 2.5, 3][int(0, 5)],
      ayudante: rnd() < 0.3,
      metodo: rnd() < 0.56 ? 'tarjeta' : 'efectivo',
      estado: 'completado',
    }),
  )
}
const LIVE_STATES: TripStatus[] = ['en_camino', 'en_viaje', 'cargando', 'en_viaje', 'en_origen', 'en_viaje', 'en_camino', 'en_viaje', 'asignado']
BUSY_DRIVER_IDS.forEach((id, i) => {
  const d = DRIVERS.find((x) => x.id === id)!
  const o = pick(PLACES)
  let de = pick(PLACES)
  if (de.id === o.id) de = PLACES[(PLACES.indexOf(o) + 3) % PLACES.length]
  list.push(
    mk({
      fecha: at(0, 13, int(0, 50)),
      usuarioId: randomUser(),
      conductorId: id,
      categoria: d.vehiculo.categoria,
      origen: o,
      destino: de,
      horas: [2, 3, 1.5, 2.5][i % 4],
      ayudante: i % 3 === 0,
      metodo: i % 2 === 0 ? 'tarjeta' : 'efectivo',
      estado: LIVE_STATES[i],
    }),
  )
})

// ids ascending by date, anchored so Martín's cash-less #4790 keeps its number
list.sort((a, b) => a.fecha.localeCompare(b.fecha))
const base = 4790 - list.indexOf(MARTIN_4790)
list.forEach((t, i) => (t.id = base + i))
SCHEDULED_TRIP.id = base + list.length + 3

export const TRIPS: Trip[] = list
export const tripById = (id: number) => TRIPS.find((t) => t.id === id)
export const LIVE_TRIPS = TRIPS.filter((t) => !['completado', 'cancelado', 'programado'].includes(t.estado))
export const TODAY_TRIPS = TRIPS.filter((t) => isToday(t.fecha))
export const WEEK_TRIPS = TRIPS.filter((t) => inWeek(t.fecha) && t.estado === 'completado')
export const LUCIA_TRIPS = TRIPS.filter((t) => t.usuarioId === 'u-lucia').sort((a, b) => b.fecha.localeCompare(a.fecha))
export const MARTIN_TRIPS = TRIPS.filter((t) => t.conductorId === 'd-martin').sort((a, b) => b.fecha.localeCompare(a.fecha))

/* ───────── Aggregates (single source of truth for every view) ───────── */
export interface DriverBalance {
  driverId: string
  viajes: number
  efectivo: number
  comisionEfectivo: number // driver owes platform
  tarjeta: number
  parteTarjeta: number // platform owes driver
  neto: number // >0 platform owes driver · <0 driver owes platform
  trips: Trip[]
}

export function weeklyBalances(): DriverBalance[] {
  const map = new Map<string, DriverBalance>()
  for (const t of WEEK_TRIPS) {
    const b = map.get(t.conductorId) ?? { driverId: t.conductorId, viajes: 0, efectivo: 0, comisionEfectivo: 0, tarjeta: 0, parteTarjeta: 0, neto: 0, trips: [] }
    b.viajes++
    b.trips.push(t)
    if (t.metodo === 'efectivo') {
      b.efectivo += t.total
      b.comisionEfectivo += t.comision
    } else {
      b.tarjeta += t.total
      b.parteTarjeta += t.total - t.comision
    }
    map.set(t.conductorId, b)
  }
  const arr = [...map.values()]
  arr.forEach((b) => (b.neto = b.parteTarjeta - b.comisionEfectivo))
  return arr.sort((a, b) => Math.abs(b.neto) - Math.abs(a.neto))
}

export function driverWeek(driverId: string) {
  return weeklyBalances().find((b) => b.driverId === driverId)!
}

export const TODAY_KPIS = (() => {
  const today = TODAY_TRIPS
  const done = today.filter((t) => t.estado === 'completado')
  return {
    viajesHoy: today.length,
    enCurso: LIVE_TRIPS.length,
    comisionDia: done.reduce((a, t) => a + t.comision, 0),
    facturadoDia: done.reduce((a, t) => a + t.total, 0),
    asignacionMedia: '2:40',
  }
})()

export const MARTIN_TODAY = (() => {
  const t = TODAY_TRIPS.filter((x) => x.conductorId === 'd-martin' && x.estado === 'completado')
  return { viajes: t.length, generado: t.reduce((a, x) => a + x.total, 0), horas: t.reduce((a, x) => a + x.horas, 0) }
})()
