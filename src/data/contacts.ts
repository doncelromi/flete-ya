import { seeded } from '@/lib/utils'
import { DRIVERS } from './drivers'
import type { Contact } from './types'

const rnd = seeded(100)
const FIRST = ['Ale', 'Beto', 'Cacho', 'Dani', 'Edu', 'Fer', 'Gabi', 'Hugo', 'Iván', 'Javi', 'Kike', 'Lalo', 'Manu', 'Nico', 'Oscar', 'Pato', 'Quique', 'Ricky', 'Seba', 'Tito', 'Uriel', 'Walter', 'Yamil', 'Zeta', 'Chino', 'Colo', 'Flaco', 'Gordo', 'Negro', 'Rulo']
const LAST = ['Flete', 'Mudanzas', 'Fiorino', 'Traffic', 'Kangoo', 'Ducato', 'Sprinter', 'Master', 'Partner', 'Fletes']
const ZONE = ['La Blanqueada', 'Cerro', 'Las Piedras', 'Cordón', 'Punta Carretas', 'La Teja', 'Ciudad de la Costa', 'Sayago', 'Tres Cruces', 'Solymar']

// 100 contacts detected in Jonathan's phone agenda; 3 are already registered drivers (duplicates).
const list: Contact[] = []
while (list.length < 97) {
  const nombre = `${FIRST[Math.floor(rnd() * FIRST.length)]} ${LAST[Math.floor(rnd() * LAST.length)]} ${ZONE[Math.floor(rnd() * ZONE.length)]}`
  if (list.some((c) => c.nombre === nombre)) continue
  list.push({ id: `c-${list.length + 1}`, nombre, telefono: `+598 9${1 + Math.floor(rnd() * 9)} ${100 + Math.floor(rnd() * 900)} ${100 + Math.floor(rnd() * 900)}` })
}
const dupes = ['d-martin', 'd-hernan', 'd-gisela']
dupes.forEach((id, i) => {
  const d = DRIVERS.find((x) => x.id === id)!
  const alias = ['Martín Fiorino Pocitos', 'Hernán Traffic Tres Cruces', 'Gise Kangoo Punta Carretas'][i]
  list.splice(12 + i * 29, 0, { id: `c-dup-${i}`, nombre: alias, telefono: d.telefono, duplicadoDe: id })
})

export const CONTACTS: Contact[] = list
