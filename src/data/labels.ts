// Display translations for enum values. Internal values stay stable; UI shows [es, en].
import type { DocType, PaymentMethod, TripStatus, VehicleCategory, VerificationStatus, Zone } from './types'

type Pair = readonly [string, string]

export const STATUS_LABEL: Record<TripStatus, Pair> = {
  buscando: ['Buscando conductor', 'Finding a driver'],
  asignado: ['Asignado', 'Assigned'],
  en_camino: ['En camino', 'On the way'],
  en_origen: ['Llegó al origen', 'At pickup'],
  cargando: ['Cargando', 'Loading'],
  en_viaje: ['En viaje', 'In transit'],
  completado: ['Completado', 'Completed'],
  cancelado: ['Cancelado', 'Cancelled'],
  programado: ['Programado', 'Scheduled'],
}

export const CATEGORY_LABEL: Record<VehicleCategory, Pair> = {
  chico: ['Utilitario chico', 'Small van'],
  mediano: ['Mediano', 'Medium van'],
  grande: ['Grande', 'Large van'],
}
export const CATEGORY_IDEAL: Record<VehicleCategory, Pair> = {
  chico: ['Ideal para: un par de muebles, electrodomésticos', 'Ideal for: a few pieces of furniture, appliances'],
  mediano: ['Mudanza de monoambiente', 'Studio apartment move'],
  grande: ['Mudanza de 2 ambientes, mercadería', '1-bedroom move, merchandise'],
}

export const METHOD_LABEL: Record<PaymentMethod, Pair> = {
  tarjeta: ['Tarjeta', 'Card'],
  efectivo: ['Efectivo', 'Cash'],
}

export const VERIF_LABEL: Record<VerificationStatus, Pair> = {
  pendiente: ['Pendiente', 'Pending'],
  aprobado: ['Aprobado', 'Approved'],
  rechazado: ['Rechazado', 'Rejected'],
}

export const DOC_LABEL: Record<DocType, Pair> = {
  dni: ['Cédula de identidad', 'ID card'],
  licencia: ['Licencia profesional', 'Professional license'],
  antecedentes: ['Antecedentes penales', 'Criminal record'],
  seguro: ['Seguro del vehículo', 'Vehicle insurance'],
  cedula: ['Libreta de propiedad', 'Vehicle registration'],
}

export const ZONE_LABEL: Record<Zone, Pair> = {
  CABA: ['Montevideo', 'Montevideo'],
  Norte: ['Costa (Canelones)', 'Coast (Canelones)'],
  Sur: ['Montevideo Oeste', 'West Montevideo'],
  Oeste: ['Norte y Las Piedras', 'North & Las Piedras'],
}

export const CHIP_LABEL: Record<string, Pair> = {
  puntual: ['Puntual', 'On time'],
  cuidadoso: ['Cuidadoso con la carga', 'Careful with the load'],
  amable: ['Amable', 'Friendly'],
  rapido: ['Rápido', 'Fast'],
  limpio: ['Vehículo limpio', 'Clean vehicle'],
  // driver → customer
  claro: ['Indicaciones claras', 'Clear directions'],
  listo: ['Carga lista a tiempo', 'Load ready on time'],
  respetuoso: ['Respetuoso', 'Respectful'],
}

export const INCIDENT_LABEL: Record<string, Pair> = {
  danado: ['Objeto dañado', 'Damaged item'],
  cobro: ['Cobro incorrecto', 'Incorrect charge'],
  no_llego: ['Conductor no llegó', 'Driver didn’t show up'],
  otro: ['Otro', 'Other'],
}

export const AUDIT_LABEL: Record<string, Pair> = {
  subido: ['Documento subido', 'Document uploaded'],
  aprobado: ['Aprobado', 'Approved'],
  rechazado: ['Rechazado', 'Rejected'],
  vencido: ['Vencido', 'Expired'],
  recordatorio: ['Recordatorio enviado', 'Reminder sent'],
}

/** Vehicle color display */
export const COLOR_EN: Record<string, string> = { Blanca: 'White', Gris: 'Grey', Plata: 'Silver', Negra: 'Black', Roja: 'Red', Azul: 'Blue' }

/** Trip-status → semantic tone for <Pill/> */
export const STATUS_TONE: Record<TripStatus, 'amber' | 'accent' | 'green' | 'red' | 'neutral'> = {
  buscando: 'amber',
  asignado: 'accent',
  en_camino: 'accent',
  en_origen: 'accent',
  cargando: 'accent',
  en_viaje: 'accent',
  completado: 'green',
  cancelado: 'red',
  programado: 'neutral',
}
export const VERIF_TONE: Record<VerificationStatus, 'amber' | 'green' | 'red'> = {
  pendiente: 'amber',
  aprobado: 'green',
  rechazado: 'red',
}
