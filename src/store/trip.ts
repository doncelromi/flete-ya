import { create } from 'zustand'
import { DEMO_DEST, DEMO_ORIGIN, tripTotal } from '@/data/places'
import type { PaymentMethod, Place, TripStatus, VehicleCategory } from '@/data/types'

/** Live customer trip steps (Mi viaje progress bar). */
export const LIVE_STEPS: TripStatus[] = ['asignado', 'en_camino', 'en_origen', 'cargando', 'en_viaje', 'completado']
/** Seconds added to the hour clock when the presenter jumps to a step, so the demo shows ~01:12 while "En viaje". */
export const CLOCK_JUMP: Partial<Record<TripStatus, number>> = { cargando: 0, en_viaje: 37 * 60, completado: 0 }

export interface TripRequest {
  origen: Place | null
  destino: Place | null
  categoria: VehicleCategory
  horas: number
  ayudante: boolean
  metodo: PaymentMethod
  cuando: 'ahora' | 'programar'
  nota: string
}

interface TripState {
  req: TripRequest
  /** customer flow: form → matching → assigned */
  phase: 'form' | 'matching' | 'asignado'
  status: TripStatus
  /** hour clock: accumulated seconds + running since (ms) */
  clockBase: number
  clockSince: number | null
  paid: boolean
  rated: boolean
  /** driver flow */
  driverOnline: boolean
  driverStep: number // 0 go to origin · 1 arrived · 2 loading · 3 in transit · 4 delivered
  cashConfirmedAt: string | null
  driverRated: boolean

  setReq: (p: Partial<TripRequest>) => void
  total: () => number
  startMatching: () => void
  assign: () => void
  setStatus: (s: TripStatus) => void
  advance: () => void
  elapsed: () => number
  setPaid: () => void
  setRated: () => void
  resetCustomer: () => void
  setDriverOnline: (v: boolean) => void
  setDriverStep: (n: number) => void
  confirmCash: () => void
  setDriverRated: () => void
  resetDriver: () => void
}

const DEFAULT_REQ: TripRequest = {
  origen: DEMO_ORIGIN,
  destino: DEMO_DEST,
  categoria: 'chico',
  horas: 2,
  ayudante: false,
  metodo: 'tarjeta',
  cuando: 'ahora',
  nota: '',
}

export const useTrip = create<TripState>((set, get) => ({
  req: DEFAULT_REQ,
  phase: 'form',
  status: 'asignado',
  clockBase: 0,
  clockSince: null,
  paid: false,
  rated: false,
  driverOnline: true,
  driverStep: 0,
  cashConfirmedAt: null,
  driverRated: false,

  setReq: (p) => set((s) => ({ req: { ...s.req, ...p } })),
  total: () => {
    const r = get().req
    return tripTotal(r.categoria, r.horas, r.ayudante)
  },
  startMatching: () => set({ phase: 'matching' }),
  assign: () => set({ phase: 'asignado', status: 'asignado', clockBase: 0, clockSince: null, paid: false, rated: false }),
  setStatus: (st) => {
    const s = get()
    let base = s.clockBase
    let since = s.clockSince
    const now = Date.now()
    if (since) base += (now - since) / 1000
    const idx = LIVE_STEPS.indexOf(st)
    if (idx >= LIVE_STEPS.indexOf('en_origen') && st !== 'completado') {
      since = now
      base += CLOCK_JUMP[st] ?? 0
    } else if (st === 'completado') {
      since = null
    } else {
      base = 0
      since = null
    }
    set({ status: st, clockBase: base, clockSince: since, phase: 'asignado' })
  },
  advance: () => {
    const s = get()
    const i = LIVE_STEPS.indexOf(s.status)
    if (i < LIVE_STEPS.length - 1) s.setStatus(LIVE_STEPS[i + 1])
  },
  elapsed: () => {
    const s = get()
    return s.clockBase + (s.clockSince ? (Date.now() - s.clockSince) / 1000 : 0)
  },
  setPaid: () => set({ paid: true }),
  setRated: () => set({ rated: true }),
  resetCustomer: () => set({ req: DEFAULT_REQ, phase: 'form', status: 'asignado', clockBase: 0, clockSince: null, paid: false, rated: false }),
  setDriverOnline: (v) => set({ driverOnline: v }),
  setDriverStep: (n) => set({ driverStep: n }),
  confirmCash: () => set({ cashConfirmedAt: new Date().toISOString() }),
  setDriverRated: () => set({ driverRated: true }),
  resetDriver: () => set({ driverStep: 0, cashConfirmedAt: null, driverRated: false }),
}))
