import { seeded } from '@/lib/utils'
import type { User } from './types'

const rnd = seeded(4417)
const FIRST = ['Sofía', 'Valentina', 'Camila', 'Martina', 'Julieta', 'Agustina', 'Micaela', 'Florencia', 'Carolina', 'Natalia', 'Andrea', 'Mariana', 'Pablo', 'Ignacio', 'Tomás', 'Joaquín', 'Nicolás', 'Matías', 'Bruno', 'Ezequiel', 'Gastón', 'Hernán', 'Lautaro', 'Federico', 'Rocío', 'Belén', 'Paula', 'Victoria', 'Lorena', 'Gabriel']
const LAST = ['Ferrari', 'Bianchi', 'Costa', 'Méndez', 'Rey', 'Sáenz', 'Iglesias', 'Campos', 'Vidal', 'Blanco', 'Cano', 'Mansilla', 'Pintos', 'Arias', 'Bustos', 'Ojeda', 'Correa', 'Peralta', 'Figueroa', 'Toledo', 'Ibarra', 'Lucero', 'Miranda', 'Navarro', 'Olivera', 'Ponce', 'Quintana', 'Robles', 'Salinas', 'Zapata']
const BARRIOS = ['Punta Carretas', 'Pocitos', 'Tres Cruces', 'Cordón', 'La Blanqueada', 'Malvín', 'Carrasco', 'La Teja', 'Cerro', 'Ciudad de la Costa', 'Solymar', 'Las Piedras', 'Sayago']

export const LUCIA: User = {
  id: 'u-lucia',
  nombre: 'Lucía Ferreyra',
  barrio: 'Pocitos',
  rating: 4.8,
  email: 'lucia.ferreyra@gmail.com',
  tarjetas: [
    { marca: 'Visa', ultimos4: '4417', predeterminada: true },
    { marca: 'Mastercard', ultimos4: '0921', predeterminada: false },
  ],
}

const others: User[] = []
const used = new Set([LUCIA.nombre])
while (others.length < 39) {
  const nombre = `${FIRST[Math.floor(rnd() * FIRST.length)]} ${LAST[Math.floor(rnd() * LAST.length)]}`
  if (used.has(nombre)) continue
  used.add(nombre)
  others.push({
    id: `u-${others.length + 1}`,
    nombre,
    barrio: BARRIOS[Math.floor(rnd() * BARRIOS.length)],
    rating: Math.round((4.3 + rnd() * 0.7) * 10) / 10,
    email: `${nombre.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@mail.com`,
    tarjetas: [{ marca: rnd() < 0.6 ? 'Visa' : 'Mastercard', ultimos4: String(1000 + Math.floor(rnd() * 8999)), predeterminada: true }],
  })
}

export const USERS: User[] = [LUCIA, ...others]
export const userById = (id: string) => USERS.find((u) => u.id === id)!
