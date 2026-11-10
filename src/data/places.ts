import type { LatLng, Place, Tariff, VehicleCategory } from './types'

/** Real Montevideo / Canelones addresses with approximate coordinates. */
export const PLACES: Place[] = [
  { id: 'p-corrientes', label: 'Av. Brasil 2800', barrio: 'Pocitos', zona: 'CABA', lat: -34.9080, lng: -56.1530 },
  { id: 'p-rivadavia6100', label: 'Av. 18 de Julio 1800', barrio: 'Cordón', zona: 'CABA', lat: -34.9015, lng: -56.1755 },
  { id: 'p-cordoba', label: 'José Ellauri 350', barrio: 'Punta Carretas', zona: 'CABA', lat: -34.9205, lng: -56.1585 },
  { id: 'p-corrientes3400', label: 'Bv. Artigas 1700', barrio: 'Tres Cruces', zona: 'CABA', lat: -34.8950, lng: -56.1655 },
  { id: 'p-santafe', label: 'Av. Sarmiento 2400', barrio: 'Punta Carretas', zona: 'CABA', lat: -34.9180, lng: -56.1650 },
  { id: 'p-scalabrini', label: 'Solano García 2500', barrio: 'Punta Carretas', zona: 'CABA', lat: -34.9215, lng: -56.1550 },
  { id: 'p-warnes', label: 'Av. Rivera 3200', barrio: 'Pocitos', zona: 'CABA', lat: -34.8990, lng: -56.1440 },
  { id: 'p-diazvelez', label: 'Av. Italia 2100', barrio: 'Tres Cruces', zona: 'CABA', lat: -34.8930, lng: -56.1615 },
  { id: 'p-goyena', label: 'Av. Constituyente 1700', barrio: 'Cordón', zona: 'CABA', lat: -34.9060, lng: -56.1775 },
  { id: 'p-rivadavia7000', label: 'Av. 8 de Octubre 2700', barrio: 'La Blanqueada', zona: 'CABA', lat: -34.8870, lng: -56.1580 },
  { id: 'p-directorio', label: 'Av. Centenario 3000', barrio: 'La Blanqueada', zona: 'CABA', lat: -34.8830, lng: -56.1520 },
  { id: 'p-cabildo', label: 'Av. Italia 4600', barrio: 'Malvín', zona: 'CABA', lat: -34.8890, lng: -56.1080 },
  { id: 'p-juramento', label: 'Orinoco 4900', barrio: 'Malvín', zona: 'CABA', lat: -34.8965, lng: -56.1020 },
  { id: 'p-libertador', label: 'Av. Arocena 1600', barrio: 'Carrasco', zona: 'CABA', lat: -34.8880, lng: -56.0570 },
  { id: 'p-mitre', label: 'Av. Carlos María Ramírez 500', barrio: 'La Teja', zona: 'Sur', lat: -34.8680, lng: -56.2350 },
  { id: 'p-yrigoyen', label: 'Grecia 3500', barrio: 'Cerro', zona: 'Sur', lat: -34.8860, lng: -56.2560 },
  { id: 'p-centenario', label: 'Av. Giannattasio km 21', barrio: 'Ciudad de la Costa', zona: 'Norte', lat: -34.8470, lng: -55.9900 },
  { id: 'p-maipu', label: 'Av. Giannattasio km 24', barrio: 'Solymar', zona: 'Norte', lat: -34.8340, lng: -55.9620 },
  { id: 'p-moron', label: 'Av. Artigas 600', barrio: 'Las Piedras', zona: 'Oeste', lat: -34.7270, lng: -56.2200 },
  { id: 'p-ramos', label: 'Av. Millán 4300', barrio: 'Sayago', zona: 'Oeste', lat: -34.8400, lng: -56.2120 },
  { id: 'p-jbjusto', label: 'Luis de la Torre 700', barrio: 'Punta Carretas', zona: 'CABA', lat: -34.9175, lng: -56.1560 },
  { id: 'p-acoyte', label: 'Gaboto 1500', barrio: 'Cordón', zona: 'CABA', lat: -34.9040, lng: -56.1720 },
  { id: 'p-medrano', label: 'Acevedo Díaz 1500', barrio: 'Tres Cruces', zona: 'CABA', lat: -34.8975, lng: -56.1690 },
  { id: 'p-dorrego', label: 'Benito Blanco 900', barrio: 'Punta Carretas', zona: 'CABA', lat: -34.9135, lng: -56.1610 },
]

export const placeById = (id: string) => PLACES.find((p) => p.id === id)!

export const BARRIO_CENTERS: { barrio: string; zona: Place['zona']; lat: number; lng: number }[] = [
  { barrio: 'Pocitos', zona: 'CABA', lat: -34.9085, lng: -56.1500 },
  { barrio: 'Tres Cruces', zona: 'CABA', lat: -34.8950, lng: -56.1670 },
  { barrio: 'Punta Carretas', zona: 'CABA', lat: -34.9195, lng: -56.1580 },
  { barrio: 'Cordón', zona: 'CABA', lat: -34.9035, lng: -56.1760 },
  { barrio: 'La Blanqueada', zona: 'CABA', lat: -34.8855, lng: -56.1560 },
  { barrio: 'Malvín', zona: 'CABA', lat: -34.8920, lng: -56.1030 },
  { barrio: 'Carrasco', zona: 'CABA', lat: -34.8860, lng: -56.0580 },
  { barrio: 'La Teja', zona: 'Sur', lat: -34.8650, lng: -56.2330 },
  { barrio: 'Cerro', zona: 'Sur', lat: -34.8860, lng: -56.2570 },
  { barrio: 'Ciudad de la Costa', zona: 'Norte', lat: -34.8460, lng: -55.9880 },
  { barrio: 'Solymar', zona: 'Norte', lat: -34.8330, lng: -55.9600 },
  { barrio: 'Las Piedras', zona: 'Oeste', lat: -34.7280, lng: -56.2190 },
  { barrio: 'Sayago', zona: 'Oeste', lat: -34.8390, lng: -56.2110 },
]

export const AMBA_CENTER: LatLng = [-34.8700, -56.1300]
export const CABA_CENTER: LatLng = [-34.9050, -56.1650]

export const ZONE_CENTERS: Record<Place['zona'], LatLng> = {
  CABA: [-34.9000, -56.1450],
  Norte: [-34.8400, -55.9750],
  Sur: [-34.8760, -56.2450],
  Oeste: [-34.7850, -56.2150],
}

/* ───────── Tariffs ───────── */
export const TARIFFS: Tariff[] = [
  { categoria: 'chico', porHora: 1200, capacidadKg: 650, modelos: ['Fiorino', 'Kangoo', 'Partner'], caja: '1,5 × 1,2 × 1,1 m' },
  { categoria: 'mediano', porHora: 1700, capacidadKg: 1300, modelos: ['Traffic', 'Master'], caja: '2,6 × 1,7 × 1,5 m' },
  { categoria: 'grande', porHora: 2200, capacidadKg: 1800, modelos: ['Ducato', 'Sprinter'], caja: '3,7 × 1,8 × 1,9 m' },
]
export const tariffOf = (c: VehicleCategory) => TARIFFS.find((t) => t.categoria === c)!
export const HELPER_PER_HOUR = 500
export const COMMISSION = 0.15
export const MIN_FRACTION_MIN = 15

export function tripTotal(cat: VehicleCategory, horas: number, ayudante: boolean) {
  return Math.round((tariffOf(cat).porHora + (ayudante ? HELPER_PER_HOUR : 0)) * horas)
}

/* ───────── Geo helpers ───────── */
export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLng = ((b[1] - a[1]) * Math.PI) / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function pathKm(path: LatLng[]) {
  let d = 0
  for (let i = 1; i < path.length; i++) d += haversineKm(path[i - 1], path[i])
  return d
}

/** City-grid-ish route between two points (street elbows), deterministic. */
export function makeRoute(a: LatLng, b: LatLng, wiggle = 0.35): LatLng[] {
  const dLat = b[0] - a[0]
  const dLng = b[1] - a[1]
  const pts: LatLng[] = [a]
  const steps = 4
  for (let i = 1; i < steps; i++) {
    const f = i / steps
    const off = (i % 2 === 0 ? 1 : -1) * wiggle * 0.08
    // alternate moving along lng then lat to mimic avenues
    pts.push([a[0] + dLat * (f - 0.12 + off * 0.3), a[1] + dLng * f])
    pts.push([a[0] + dLat * f, a[1] + dLng * (f + off * 0.2)])
  }
  pts.push(b)
  return pts
}

/** Densify a polyline so a marker can move smoothly along it. */
export function densify(path: LatLng[], n = 120): LatLng[] {
  const total = pathKm(path)
  if (total === 0) return path
  const out: LatLng[] = []
  for (let i = 0; i <= n; i++) out.push(pointAt(path, i / n))
  return out
}

/** Point at fraction t (0..1) of a polyline. */
export function pointAt(path: LatLng[], t: number): LatLng {
  const total = pathKm(path)
  let target = Math.max(0, Math.min(1, t)) * total
  for (let i = 1; i < path.length; i++) {
    const seg = haversineKm(path[i - 1], path[i])
    if (target <= seg || i === path.length - 1) {
      const f = seg === 0 ? 0 : Math.min(1, target / seg)
      return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * f, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * f]
    }
    target -= seg
  }
  return path[path.length - 1]
}

/* Main demo route (WOW #1): Pocitos → Cordón, and Martín's approach. */
export const DEMO_ORIGIN = placeById('p-corrientes')
export const DEMO_DEST = placeById('p-rivadavia6100')
export const DEMO_ROUTE: LatLng[] = [
  [-34.9080, -56.1530],
  [-34.9069, -56.1561],
  [-34.9058, -56.1594],
  [-34.9049, -56.1622],
  [-34.9043, -56.1650],
  [-34.9037, -56.1676],
  [-34.9030, -56.1700],
  [-34.9024, -56.1722],
  [-34.9019, -56.1740],
  [-34.9015, -56.1755],
]
export const DEMO_KM = 3.6
export const DEMO_MIN = 12
/** Martín starts ~6 min away (Punta Carretas, Luis de la Torre) and drives to the origin. */
export const MARTIN_APPROACH: LatLng[] = [
  [-34.9175, -56.1560],
  [-34.9152, -56.1556],
  [-34.9130, -56.1549],
  [-34.9110, -56.1542],
  [-34.9093, -56.1536],
  [-34.9080, -56.1530],
]
