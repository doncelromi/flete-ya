export type Role = 'cliente' | 'conductor' | 'admin'
export type VehicleCategory = 'chico' | 'mediano' | 'grande'
export type TripStatus = 'buscando' | 'asignado' | 'en_camino' | 'en_origen' | 'cargando' | 'en_viaje' | 'completado' | 'cancelado' | 'programado'
export type PaymentMethod = 'tarjeta' | 'efectivo'
export type VerificationStatus = 'pendiente' | 'aprobado' | 'rechazado'
export type DocType = 'dni' | 'licencia' | 'antecedentes' | 'seguro' | 'cedula'
export type Zone = 'CABA' | 'Norte' | 'Sur' | 'Oeste'

export type LatLng = [number, number]

export interface Place {
  id: string
  label: string // street address
  barrio: string
  zona: Zone
  lat: number
  lng: number
}

export interface AuditEntry {
  por: string
  fecha: string // ISO
  accion: 'subido' | 'aprobado' | 'rechazado' | 'vencido' | 'recordatorio'
}

export interface Doc {
  tipo: DocType
  estado: VerificationStatus
  vence?: string // ISO date
  auditoria: AuditEntry[]
}

export interface Driver {
  id: string
  nombre: string
  avatar: string // initials seed (rendered with <Avatar/>)
  telefono: string
  dni: string
  licenciaClase: string
  vehiculo: { categoria: VehicleCategory; modelo: string; patente: string; color: string; colorEn: string }
  zona: Zone
  barrio: string
  lat: number
  lng: number
  enLinea: boolean
  ocupado: boolean
  rating: number
  viajes: number
  verificacion: VerificationStatus
  documentos: Doc[]
  ultimaConexion: string // ISO
  alta: string // ISO
  motivoRechazo?: [string, string]
}

export interface Trip {
  id: number
  fecha: string // ISO datetime (start)
  usuarioId: string
  conductorId: string
  categoria: VehicleCategory
  origen: Place
  destino: Place
  ruta: LatLng[]
  km: number
  horas: number
  ayudante: boolean
  total: number
  metodo: PaymentMethod
  comision: number
  estado: TripStatus
  /** stars the customer gave the driver */
  calificacionConductor?: number
  /** stars the driver gave the customer */
  calificacionUsuario?: number
  comentario?: [string, string]
  chips?: string[]
  canceladoPor?: 'usuario' | 'conductor'
}

export interface User {
  id: string
  nombre: string
  barrio: string
  rating: number
  email: string
  tarjetas: { marca: 'Visa' | 'Mastercard'; ultimos4: string; predeterminada: boolean }[]
}

export interface Tariff {
  categoria: VehicleCategory
  porHora: number
  capacidadKg: number
  modelos: string[]
  caja: string // box dimensions
}

export interface Contact {
  id: string
  nombre: string
  telefono: string
  duplicadoDe?: string // driver id already registered
}
