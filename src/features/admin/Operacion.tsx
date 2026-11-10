import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Clock, Radio, Save, Star, Truck, UserPlus, Users, Wifi, Wallet, Activity } from 'lucide-react'
import { Circle, Polyline, Popup, Tooltip } from 'react-leaflet'
import { toast } from 'sonner'
import { DevNotice, PageHeader, PreviewBanner } from '@/components/shared'
import { Button, Card, InfoDot, Kpi, Pill, Switch } from '@/components/ui'
import { ACCENT, MapView, icons } from '@/components/map/MapView'
import { DRIVERS, DRIVER_STATS, driverById } from '@/data/drivers'
import { LIVE_TRIPS, TODAY_KPIS, TODAY_TRIPS, TRIPS } from '@/data/trips'
import { AMBA_CENTER, ZONE_CENTERS, pointAt } from '@/data/places'
import { CATEGORY_LABEL, METHOD_LABEL, STATUS_LABEL, ZONE_LABEL } from '@/data/labels'
import { fmtTime, NOW } from '@/data/dates'
import type { Driver, LatLng, PaymentMethod, Trip, Zone } from '@/data/types'
import { useT } from '@/i18n'
import { uyu, cn } from '@/lib/utils'
import { MovingMarker } from './a/MovingMarker'
import { shortName } from './a/kit'

/* ───────── static map data ───────── */
const ICON_AVAIL = icons.available()
const ICON_BUSY = icons.busy()
const AVAILABLE = DRIVERS.filter((d) => d.enLinea && !d.ocupado)
const BUSY = LIVE_TRIPS.map((t) => ({ trip: t, driver: driverById(t.conductorId) }))
const FIT: LatLng[] = [
  [-34.725, -56.22], // Las Piedras
  [-34.89, -56.265], // Cerro
  [-34.925, -56.16], // Punta Carretas
  [-34.885, -56.05], // Carrasco
  [-34.83, -55.955], // Solymar
]
const START_PROGRESS: Record<string, number> = { asignado: 0.02, en_camino: 0.08, en_origen: 0, cargando: 0, en_viaje: 0.35 }
const MOVING = new Set(['asignado', 'en_camino', 'en_viaje'])
const ZONES: Zone[] = ['CABA', 'Norte', 'Sur', 'Oeste']
const DEFAULT_RADII: Record<Zone, number> = { CABA: 3, Norte: 5, Sur: 5, Oeste: 6 }
const TICK_MS = 3000

/** deterministic pseudo-random in [-1, 1] */
function noise(a: number, b: number) {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

/* ───────── live events ───────── */
type EvKind = 'accept' | 'deliver' | 'pending' | 'online' | 'rated'
interface Ev {
  id: number
  at: Date
  kind: EvKind
  name: string
  trip?: number
  amount?: number
  method?: PaymentMethod
  stars?: number
  real: boolean
}

const MAX_TRIP_ID = Math.max(...TRIPS.map((t) => t.id))
const DONE_TODAY = TODAY_TRIPS.filter((t) => t.estado === 'completado').sort((a, b) => b.fecha.localeCompare(a.fecha))
const PENDING = DRIVERS.filter((d) => d.verificacion === 'pendiente')
const OFFLINE = DRIVERS.filter((d) => !d.enLinea && d.verificacion === 'aprobado')

function initialEvents(): Ev[] {
  const live = [...LIVE_TRIPS].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const seq: Omit<Ev, 'id' | 'at'>[] = [
    { kind: 'accept', name: driverById(live[0].conductorId).nombre, trip: live[0].id, real: true },
    { kind: 'deliver', name: driverById(DONE_TODAY[0].conductorId).nombre, trip: DONE_TODAY[0].id, amount: DONE_TODAY[0].total, method: DONE_TODAY[0].metodo, real: true },
    { kind: 'pending', name: PENDING[0]?.nombre ?? 'Rocío Medina', real: true },
    { kind: 'accept', name: driverById(live[1].conductorId).nombre, trip: live[1].id, real: true },
    { kind: 'rated', name: driverById(DONE_TODAY[1].conductorId).nombre, trip: DONE_TODAY[1].id, stars: DONE_TODAY[1].calificacionConductor ?? 5, real: true },
    { kind: 'deliver', name: driverById(DONE_TODAY[2].conductorId).nombre, trip: DONE_TODAY[2].id, amount: DONE_TODAY[2].total, method: DONE_TODAY[2].metodo, real: true },
    { kind: 'online', name: AVAILABLE[0].nombre, real: true },
    { kind: 'accept', name: driverById(live[2].conductorId).nombre, trip: live[2].id, real: true },
    { kind: 'deliver', name: driverById(DONE_TODAY[3].conductorId).nombre, trip: DONE_TODAY[3].id, amount: DONE_TODAY[3].total, method: DONE_TODAY[3].metodo, real: true },
    { kind: 'pending', name: PENDING[1]?.nombre ?? 'Julián Ortiz', real: true },
  ]
  return seq.map((e, i) => ({ ...e, id: i + 1, at: new Date(NOW.getTime() - (i * 2 + (i % 3)) * 60000) }))
}

const EV_ICON: Record<EvKind, { icon: typeof Truck; cls: string }> = {
  accept: { icon: Truck, cls: 'bg-accent-soft text-accent' },
  deliver: { icon: CheckCircle2, cls: 'bg-[var(--green-soft)] text-st-green' },
  pending: { icon: UserPlus, cls: 'bg-[var(--amber-soft)] text-st-amber' },
  online: { icon: Wifi, cls: 'bg-subtle text-ink2' },
  rated: { icon: Star, cls: 'bg-[var(--amber-soft)] text-st-amber' },
}

export default function Operacion() {
  const { L, P } = useT()
  const navigate = useNavigate()

  /* ── simulated GPS tick ── */
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const availPos = useMemo(
    () =>
      AVAILABLE.map((d, i) => {
        const p: LatLng = tick === 0 ? [d.lat, d.lng] : [d.lat + noise(i, tick) * 0.0022, d.lng + noise(i + 99, tick) * 0.0026]
        return { d, p }
      }),
    [tick],
  )
  const busyPos = useMemo(
    () =>
      BUSY.map(({ trip, driver }, i) => {
        const moving = MOVING.has(trip.estado)
        let prog = (START_PROGRESS[trip.estado] ?? 0.2) + (moving ? tick * 0.012 : 0)
        if (prog > 0.97) prog = 0.97
        const base = pointAt(trip.ruta, prog)
        const p: LatLng = moving ? base : [base[0] + noise(i, tick) * 0.0004, base[1] + noise(i + 7, tick) * 0.0004]
        return { trip, driver, p }
      }),
    [tick],
  )

  /* ── matching radii ── */
  const [radii, setRadii] = useState<Record<Zone, number>>(DEFAULT_RADII)
  const [showRadii, setShowRadii] = useState(true)
  const dirty = ZONES.some((z) => radii[z] !== DEFAULT_RADII[z])
  const saveRadii = useCallback(() => {
    toast.success(L('Radios de matching guardados', 'Matching radii saved'), {
      description: ZONES.map((z) => `${P(ZONE_LABEL[z])} ${radii[z]} km`).join(' · '),
    })
  }, [L, P, radii])

  /* ── live feed ── */
  const [events, setEvents] = useState<Ev[]>(initialEvents)
  const counter = useRef({ n: 100, trip: MAX_TRIP_ID + 1, k: 0 })
  useEffect(() => {
    const id = setInterval(() => {
      const c = counter.current
      const kinds: EvKind[] = ['accept', 'deliver', 'online', 'accept', 'rated', 'deliver', 'pending']
      const kind = kinds[c.k % kinds.length]
      c.k++
      c.n++
      const r = (arr: Driver[]) => arr[Math.floor(Math.random() * arr.length)]
      let ev: Ev
      if (kind === 'accept') ev = { id: c.n, at: new Date(), kind, name: r(AVAILABLE).nombre, trip: c.trip++, real: false }
      else if (kind === 'deliver') {
        const t: Trip = DONE_TODAY[Math.floor(Math.random() * DONE_TODAY.length)]
        ev = { id: c.n, at: new Date(), kind, name: driverById(t.conductorId).nombre, trip: t.id, amount: t.total, method: t.metodo, real: true }
      } else if (kind === 'rated') {
        const t: Trip = DONE_TODAY[Math.floor(Math.random() * DONE_TODAY.length)]
        ev = { id: c.n, at: new Date(), kind, name: driverById(t.conductorId).nombre, trip: t.id, stars: t.calificacionConductor ?? 5, real: true }
      } else if (kind === 'pending') ev = { id: c.n, at: new Date(), kind, name: r(PENDING.length ? PENDING : DRIVERS).nombre, real: true }
      else ev = { id: c.n, at: new Date(), kind, name: r(OFFLINE.length ? OFFLINE : DRIVERS).nombre, real: false }
      setEvents((prev) => [ev, ...prev].slice(0, 12))
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const evText = (e: Ev) => {
    const n = shortName(e.name)
    switch (e.kind) {
      case 'accept':
        return L('{n} aceptó viaje #{id}', '{n} accepted trip #{id}', { n, id: e.trip ?? '' })
      case 'deliver':
        return L('Viaje #{id} entregado · {a} · {m}', 'Trip #{id} delivered · {a} · {m}', {
          id: e.trip ?? '',
          a: uyu(e.amount ?? 0),
          m: P(METHOD_LABEL[e.method ?? 'tarjeta']).toLowerCase(),
        })
      case 'pending':
        return L('Nuevo conductor pendiente de verificación: {n}', 'New driver pending verification: {n}', { n })
      case 'online':
        return L('{n} se conectó y está disponible', '{n} went online and is available', { n })
      case 'rated':
        return L('{n} recibió ★{s} en el viaje #{id}', '{n} got ★{s} on trip #{id}', { n, s: e.stars ?? 5, id: e.trip ?? '' })
    }
  }

  const onEvent = (e: Ev) => {
    if (e.kind === 'pending') return navigate('/admin/verificacion')
    if (e.trip && e.real) return navigate(`/admin/viajes?q=${e.trip}`)
    if (e.kind === 'accept') return toast(L('Viaje #{id} recién asignado', 'Trip #{id} just assigned', { id: e.trip ?? '' }), { description: L('Va a aparecer en Viajes cuando el conductor llegue al origen.', 'It will show up in Trips once the driver reaches the pickup.') })
    toast(L('{n} está en línea', '{n} is online', { n: e.name }))
  }

  const zoneShort = (z: Zone) => P(ZONE_LABEL[z])

  return (
    <div>
      <PreviewBanner
        id="admin-operacion"
        bullets={[
          L('Posición GPS real de cada conductor en línea, actualizada cada 5–10 s', 'Real GPS position of every online driver, updated every 5–10 s'),
          L('Matching automático por cercanía dentro del radio configurado para cada zona', 'Automatic proximity matching within each zone’s configured radius'),
          L('Feed de eventos en tiempo real: aceptaciones, entregas, pagos y altas', 'Real-time event feed: acceptances, deliveries, payments and sign-ups'),
        ]}
      />
      <PageHeader
        title={L('Operación en vivo', 'Live operations')}
        subtitle={L('Toda la flota de Montevideo en un vistazo: quién está libre, quién está en viaje y qué está pasando ahora.', 'The whole Montevideo fleet at a glance: who is free, who is on a trip and what is happening right now.')}
        actions={
          <Pill tone="green" className="h-8 px-3 text-[12px]">
            <span className="pulse-dot text-st-green" /> {L('Sistema operativo', 'All systems normal')}
          </Pill>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label={L('Viajes hoy', 'Trips today')} value={TODAY_KPIS.viajesHoy} delta={{ v: '+12%', up: true }} hint={L('vs. mismo día, semana pasada', 'vs. same day last week')} icon={<Activity size={15} />} />
        <Kpi label={L('En curso ahora', 'In progress now')} value={TODAY_KPIS.enCurso} tone="accent" hint={L('en el mapa', 'on the map')} icon={<Truck size={15} />} />
        <Kpi
          label={L('Conductores en línea', 'Drivers online')}
          value={
            <>
              {DRIVER_STATS.online}
              <span className="text-[16px] font-semibold text-ink2">/{DRIVER_STATS.total}</span>
            </>
          }
          hint={L('{b} ocupados · {f} libres', '{b} busy · {f} free', { b: DRIVER_STATS.busy, f: DRIVER_STATS.online - DRIVER_STATS.busy })}
          icon={<Users size={15} />}
        />
        <Kpi label={L('Tiempo medio de asignación', 'Avg. assignment time')} value={TODAY_KPIS.asignacionMedia} delta={{ v: '−0:25', up: true }} hint="min" icon={<Clock size={15} />} />
        <Kpi
          label={L('Comisión del día', 'Today’s commission')}
          value={uyu(TODAY_KPIS.comisionDia)}
          tone="green"
          hint={L('de {f} facturado', 'of {f} billed', { f: uyu(TODAY_KPIS.facturadoDia) })}
          icon={<Wallet size={15} />}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* MAP */}
        <div className="relative" data-trailer="ops-map">
          <MapView center={AMBA_CENTER} zoom={11} fit={FIT} fitPadding={20} className="h-[380px] md:h-[560px]">
            {showRadii &&
              ZONES.map((z) => (
                <Circle
                  key={z}
                  center={ZONE_CENTERS[z]}
                  radius={radii[z] * 1000}
                  pathOptions={{ color: ACCENT, weight: 1.5, dashArray: '6 6', fillColor: ACCENT, fillOpacity: 0.05 }}
                >
                  <Tooltip direction="center" permanent className="!border-0 !bg-transparent !p-0 !shadow-none">
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-[#1F5BFF] shadow">
                      {zoneShort(z)} · {radii[z]} km
                    </span>
                  </Tooltip>
                </Circle>
              ))}
            {LIVE_TRIPS.map((t) => (
              <Polyline key={t.id} positions={t.ruta} pathOptions={{ color: ACCENT, weight: 3, opacity: 0.7 }} />
            ))}
            {availPos.map(({ d, p }) => (
              <MovingMarker key={d.id} position={p} icon={ICON_AVAIL}>
                <Tooltip direction="top" offset={[0, -8]}>
                  {shortName(d.nombre)} · {L('Disponible', 'Available')}
                </Tooltip>
                <Popup>
                  <DriverPopup d={d} status={L('Disponible', 'Available')} tone="#059669" />
                </Popup>
              </MovingMarker>
            ))}
            {busyPos.map(({ trip, driver, p }) => (
              <MovingMarker key={driver.id} position={p} icon={ICON_BUSY} zIndexOffset={500}>
                <Tooltip direction="top" offset={[0, -6]}>
                  {shortName(driver.nombre)} · #{trip.id}
                </Tooltip>
                <Popup>
                  <DriverPopup d={driver} status={`${P(STATUS_LABEL[trip.estado])} · #${trip.id}`} tone={ACCENT} extra={`${trip.origen.barrio} → ${trip.destino.barrio}`} />
                </Popup>
              </MovingMarker>
            ))}
          </MapView>

          {/* legend */}
          <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-1.5 pl-14">
            <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-card/95 px-2.5 py-1 text-[11.5px] font-semibold text-ink shadow-card">
              <span className="h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-accent/25" /> {L('Disponibles', 'Available')} <span className="mono text-ink2">{AVAILABLE.length}</span>
            </span>
            <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-card/95 px-2.5 py-1 text-[11.5px] font-semibold text-ink shadow-card">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" /> {L('En viaje', 'On a trip')} <span className="mono text-ink2">{BUSY.length}</span>
            </span>
            <span className="pointer-events-auto hidden items-center gap-1.5 rounded-full border border-line bg-card/95 px-2.5 py-1 text-[11.5px] font-semibold text-ink shadow-card sm:inline-flex">
              <span className="h-0 w-4 border-t-2 border-dashed border-accent" /> {L('Radio de zona', 'Zone radius')}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-line bg-card/95 px-2.5 py-1 text-[11px] font-semibold text-ink2 shadow-card">
            <Radio size={12} className="text-accent" /> {L('Posiciones simuladas · cada 3 s', 'Simulated positions · every 3 s')}
          </div>
        </div>

        {/* SIDE */}
        <div className="grid content-start gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[14px] font-bold text-ink">{L('Radio de matching por zona', 'Matching radius by zone')}</h2>
                <InfoDot text={L('Cuando un cliente pide un flete, se notifica primero a los conductores disponibles dentro de este radio.', 'When a customer requests a van, available drivers inside this radius are notified first.')} />
              </div>
              <Switch checked={showRadii} onChange={setShowRadii} />
            </div>
            <div className="mt-3 grid gap-3.5">
              {ZONES.map((z) => (
                <div key={z}>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold text-ink">{P(ZONE_LABEL[z])}</span>
                    <span className="mono font-bold text-accent">{radii[z]} km</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={radii[z]}
                    onChange={(e) => setRadii((r) => ({ ...r, [z]: Number(e.target.value) }))}
                    className="h-1.5 w-full cursor-pointer"
                    style={{ accentColor: 'var(--accent)' }}
                    aria-label={P(ZONE_LABEL[z])}
                  />
                  <div className="mono flex justify-between text-[10px] text-ink2">
                    <span>1</span>
                    <span>10 km</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" size="sm" onClick={saveRadii}>
                <Save size={14} /> {L('Guardar radios', 'Save radii')}
              </Button>
              <Button variant="secondary" size="sm" disabled={!dirty} onClick={() => setRadii(DEFAULT_RADII)}>
                {L('Restablecer', 'Reset')}
              </Button>
            </div>
          </Card>

          <Card className="flex min-h-0 flex-col p-0">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="pulse-dot text-st-red" />
                <h2 className="text-[14px] font-bold text-ink">{L('En vivo', 'Live')}</h2>
              </div>
              <button onClick={() => navigate('/admin/viajes')} className="text-[12px] font-semibold text-accent hover:underline">
                {L('Ver todos los viajes', 'See all trips')}
              </button>
            </div>
            <ul className="max-h-[330px] overflow-y-auto lg:max-h-[300px]">
              <AnimatePresence initial={false}>
                {events.map((e) => {
                  const I = EV_ICON[e.kind]
                  return (
                    <motion.li
                      key={e.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <button onClick={() => onEvent(e)} className="flex w-full items-start gap-2.5 border-b border-line px-4 py-2.5 text-left transition-colors hover:bg-subtle">
                        <span className={cn('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full', I.cls)}>
                          <I.icon size={14} />
                        </span>
                        <span className="min-w-0 text-[12.5px] leading-snug text-ink">
                          <span className="mono mr-1 text-ink2">{fmtTime(e.at.toISOString())} ·</span>
                          {evText(e)}
                        </span>
                      </button>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          </Card>
        </div>
      </div>

      <DevNotice
        className="mt-4"
        title={L('GPS real de conductores (Core Location / Google Play Services)', 'Real driver GPS (Core Location / Google Play Services)')}
        now={L('las posiciones de los conductores, que se refrescan cada pocos segundos.', 'driver positions, refreshed every few seconds.')}
        later={L(
          'GPS real de cada conductor cada 5–10 s y matching por cercanía dentro del radio de su zona.',
          'real GPS from each driver every 5–10 s and proximity matching within their zone radius.',
        )}
      />
    </div>
  )
}

function DriverPopup({ d, status, tone, extra }: { d: Driver; status: string; tone: string; extra?: string }) {
  const { P } = useT()
  return (
    <div className="min-w-[170px] text-zinc-900">
      <div className="text-[13px] font-bold">{d.nombre}</div>
      <div className="mt-0.5 text-[11.5px] text-zinc-500">
        {d.vehiculo.modelo} · {P(CATEGORY_LABEL[d.vehiculo.categoria])}
      </div>
      <div className="mono mt-0.5 text-[11px] text-zinc-500">{d.vehiculo.patente}</div>
      <div className="mt-1.5 text-[11.5px] font-semibold" style={{ color: tone }}>
        ● {status}
      </div>
      {extra && <div className="mt-0.5 text-[11px] text-zinc-500">{extra}</div>}
    </div>
  )
}
