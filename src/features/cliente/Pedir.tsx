import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Marker, Polyline } from 'react-leaflet'
import { toast } from 'sonner'
import {
  ArrowDownUp,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  Check,
  Clock,
  CreditCard,
  LocateFixed,
  MapPin,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Route as RouteIcon,
  Search,
  ShieldCheck,
  Timer,
  UserPlus,
  X,
  Zap,
} from 'lucide-react'
import { Avatar, Button, Card, InfoDot, Modal, Pill, Segmented, Switch, Textarea, Input } from '@/components/ui'
import { PageHeader, PreviewBanner, Reveal } from '@/components/shared'
import { VehicleArt } from '@/components/brand'
import { ACCENT, MapView, icons } from '@/components/map/MapView'
import { CATEGORY_IDEAL, CATEGORY_LABEL } from '@/data/labels'
import { CABA_CENTER, DEMO_ORIGIN, HELPER_PER_HOUR, PLACES, TARIFFS, haversineKm, tariffOf } from '@/data/places'
import { DRIVERS, MARTIN } from '@/data/drivers'
import type { Driver, LatLng, Place, VehicleCategory } from '@/data/types'
import { useTrip } from '@/store/trip'
import { Lnow, useT } from '@/i18n'
import { uyu, cn } from '@/lib/utils'
import { approachFor, norm, placeText, routeInfo, SectionHead, vehicleText } from './lib'

/* Icons are created once (react-leaflet swaps them by reference). */
const IC = {
  origin: icons.origin(),
  dest: icons.dest(),
  avail: icons.available(),
  lit: icons.available(true),
  dim: icons.dim(),
  radar: icons.radar(),
  truck: icons.truck(),
}

const MATCH_MS = 3600
const LIT_STEPS = [650, 1350, 2050, 2750]

function nearbyDrivers(o: Place | null): Driver[] {
  if (!o) return []
  const sorted = DRIVERS.filter((d) => d.enLinea && !d.ocupado && d.verificacion === 'aprobado' && d.id !== MARTIN.id)
    .map((d) => ({ d, km: haversineKm([o.lat, o.lng], [d.lat, d.lng]) }))
    .sort((a, b) => a.km - b.km)
  const within = sorted.filter((x) => x.km < 3.2)
  return (within.length >= 8 ? within.slice(0, 11) : sorted.slice(0, 10)).map((x) => x.d)
}

function defaultSchedule() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T10:00`
}

/* ───────────────────────── Page ───────────────────────── */
export default function Pedir() {
  const { L, P, lang } = useT()
  const navigate = useNavigate()
  const req = useTrip((s) => s.req)
  const setReq = useTrip((s) => s.setReq)
  const phase = useTrip((s) => s.phase)
  const startMatching = useTrip((s) => s.startMatching)
  const assign = useTrip((s) => s.assign)
  const resetCustomer = useTrip((s) => s.resetCustomer)

  const [runId, setRunId] = useState(0)
  const [lit, setLit] = useState(0)
  const [guide, setGuide] = useState(false)
  const [when, setWhen] = useState(defaultSchedule)
  const mapRef = useRef<HTMLDivElement>(null)

  const info = useMemo(() => routeInfo(req.origen, req.destino), [req.origen, req.destino])
  const drivers = useMemo(() => nearbyDrivers(req.origen), [req.origen])
  const rate = tariffOf(req.categoria).porHora
  const helper = req.ayudante ? HELPER_PER_HOUR : 0
  const total = (rate + helper) * req.horas
  const sameSpot = !!req.origen && !!req.destino && req.origen.id === req.destino.id

  /* matching sequence: drivers light up one by one, then Martín is assigned */
  useEffect(() => {
    if (phase !== 'matching') return
    setLit(0)
    const ts = LIT_STEPS.map((ms, i) => setTimeout(() => setLit(i + 1), ms))
    ts.push(
      setTimeout(() => {
        assign()
        toast.success(Lnow('¡Conductor asignado! Martín llega en 6 min', 'Driver assigned! Martín arrives in 6 min'))
      }, MATCH_MS),
    )
    return () => ts.forEach(clearTimeout)
  }, [phase, runId, assign])

  const pedir = useCallback(() => {
    if (!req.origen || !req.destino) {
      toast.error(L('Elegí origen y destino para continuar', 'Choose pickup and drop-off to continue'))
      return
    }
    if (req.origen.id === req.destino.id) {
      toast.error(L('El origen y el destino no pueden ser iguales', 'Pickup and drop-off can’t be the same'))
      return
    }
    startMatching()
    setRunId((r) => r + 1)
    if (window.innerWidth < 1024) mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [req.origen, req.destino, startMatching, L])

  const pickOrigin = useCallback((p: Place | null) => setReq({ origen: p }), [setReq])
  const pickDest = useCallback((p: Place | null) => setReq({ destino: p }), [setReq])
  const useMyLocation = () => {
    setReq({ origen: DEMO_ORIGIN })
    toast.success(L('Ubicación detectada: Av. Brasil 2800, Pocitos', 'Location found: Av. Brasil 2800, Pocitos'))
  }
  const swap = () => {
    setReq({ origen: req.destino, destino: req.origen })
    toast(L('Invertimos origen y destino', 'Pickup and drop-off swapped'))
  }
  const fmtKm = (km: number) => km.toLocaleString(lang === 'en' ? 'en-US' : 'es-UY', { maximumFractionDigits: 1 })

  return (
    <div>
      <PreviewBanner
        id="Pedir"
        bullets={[
          L('Autocompletado real de direcciones (Google Places) y ruta con tráfico en vivo', 'Real address autocomplete (Google Places) and live-traffic routing'),
          L('Matching automático con el conductor verificado más cercano según vehículo', 'Automatic matching with the nearest verified driver for the vehicle type'),
          L('Cobro con tarjeta tokenizada o efectivo, por hora y fracción de 15 min', 'Tokenized card or cash payment, hourly with 15-min fractions'),
        ]}
      />
      <PageHeader
        title={L('Pedí tu flete', 'Book a van')}
        subtitle={L('Conductores verificados en Montevideo y Canelones. Pagás por hora, sin sorpresas.', 'Verified drivers across Montevideo and Canelones. Pay by the hour, no surprises.')}
        actions={
          <Pill tone="green" className="text-[12px]">
            <span className="pulse-dot" /> {L('{n} conductores cerca', '{n} drivers nearby', { n: drivers.length })}
          </Pill>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        {/* ── MAP ── */}
        <div ref={mapRef} className="order-first scroll-mt-20 lg:sticky lg:top-20 lg:order-last">
          <div className="relative h-[45vh] min-h-[300px] lg:h-[560px]">
            <PedirMap o={req.origen} d={req.destino} route={info?.route ?? null} drivers={drivers} phase={phase} lit={lit} />
            {/* chips on the map */}
            {info && phase === 'form' && (
              <motion.div
                initial={{ opacity: 0, translate: '0px -8px' }}
                animate={{ opacity: 1, translate: '0px 0px' }}
                className="pointer-events-none absolute right-3 top-3 z-[500] flex items-center gap-2 rounded-full border border-line bg-card/95 px-3 py-1.5 text-[12px] font-semibold text-ink shadow-card backdrop-blur"
              >
                <RouteIcon size={13} className="text-accent" />
                <span className="mono font-bold">{fmtKm(info.km)} km</span>
                <span className="text-ink2">·</span>
                <span className="mono font-bold">~{info.min} min</span>
              </motion.div>
            )}
            {phase === 'matching' && <MatchingOverlay lit={lit} runId={runId} />}
            {phase === 'asignado' && (
              <div className="absolute inset-x-3 bottom-3 z-[500]">
                <AssignedCard onFollow={() => navigate('/viaje')} />
              </div>
            )}
          </div>
        </div>

        {/* ── ORDER PANEL ── */}
        <div className="space-y-4">
          {/* a) origin / destination */}
          <Card className="p-4 sm:p-5">
            <SectionHead n={1} title={L('Origen y destino', 'Pickup and drop-off')} />
            <div className="relative">
              <div className="pointer-events-none absolute left-[19px] top-[40px] h-[calc(100%-80px)] w-px border-l-2 border-dotted border-line" />
              <div className="space-y-2.5 pr-12">
                <PlaceInput kind="origin" value={req.origen} onPick={pickOrigin} placeholder={L('¿Dónde cargamos?', 'Where do we pick up?')} />
                <PlaceInput kind="dest" value={req.destino} onPick={pickDest} placeholder={L('¿A dónde lo llevamos?', 'Where are we going?')} />
              </div>
              <button
                onClick={swap}
                aria-label={L('Invertir', 'Swap')}
                className="absolute right-0 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-card text-ink2 shadow-card hover:border-accent/40 hover:text-accent"
              >
                <ArrowDownUp size={16} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={useMyLocation} className="-ml-2 text-accent hover:text-accent">
                <LocateFixed size={15} /> {L('Usar mi ubicación', 'Use my location')}
              </Button>
              {info && !sameSpot && (
                <span className="text-[12.5px] text-ink2">
                  {L('Distancia', 'Distance')} <span className="mono font-bold text-ink">{fmtKm(info.km)} km</span> ·{' '}
                  <span className="mono font-bold text-ink">~{info.min} min</span>
                </span>
              )}
              {sameSpot && <span className="text-[12.5px] font-semibold text-st-red">{L('Origen y destino son iguales', 'Pickup and drop-off are the same')}</span>}
            </div>
          </Card>

          {/* b) vehicle */}
          <Card className="p-4 sm:p-5">
            <SectionHead
              n={2}
              title={L('Elegí tu vehículo', 'Choose your vehicle')}
              right={
                <button onClick={() => setGuide(true)} className="text-[12.5px] font-semibold text-accent hover:underline">
                  {L('¿Qué tamaño necesito?', 'What size do I need?')}
                </button>
              }
            />
            <div className="grid gap-2.5 sm:grid-cols-3">
              {TARIFFS.map((tf, i) => {
                const sel = req.categoria === tf.categoria
                return (
                  <motion.button
                    key={tf.categoria}
                    data-trailer={`vehicle-${tf.categoria}`}
                    initial={{ opacity: 0, translate: '0px 8px' }}
                    animate={{ opacity: 1, translate: '0px 0px' }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => setReq({ categoria: tf.categoria })}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-card border-2 p-3 text-left transition-colors sm:flex-col sm:items-stretch sm:gap-2 sm:p-3.5',
                      sel ? 'border-accent bg-accent-soft/70' : 'border-line bg-card hover:border-accent/40',
                    )}
                  >
                    {sel && (
                      <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <div className="grid w-[84px] shrink-0 place-items-center sm:h-[70px] sm:w-full">
                      <VehicleArt cat={tf.categoria} className="h-auto w-full text-ink sm:h-full sm:w-auto" />
                    </div>
                    <div className="min-w-0 flex-1 pr-5 sm:pr-0">
                      <div className="text-[14.5px] font-bold leading-tight text-ink">{P(CATEGORY_LABEL[tf.categoria])}</div>
                      <div className="mt-0.5 text-[12px] text-ink2">{tf.modelos.join(' / ')}</div>
                      <div className="text-[12px] text-ink2">
                        {L('hasta {kg} kg', 'up to {kg} kg', { kg: tf.capacidadKg.toLocaleString('es-UY') })}
                      </div>
                      <div className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-ink2">{P(CATEGORY_IDEAL[tf.categoria])}</div>
                      <div className={cn('mono mt-1.5 text-[13.5px] font-bold', sel ? 'text-accent' : 'text-ink')}>
                        {uyu(tf.porHora)}
                        <span className="text-[11px] font-semibold text-ink2">/h</span>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </Card>

          {/* c) details */}
          <Card className="p-4 sm:p-5">
            <SectionHead n={3} title={L('Detalles', 'Details')} />
            <div className="divide-y divide-line">
              <div className="flex items-center gap-3 pb-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-subtle text-ink2">
                  <UserPlus size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-ink">{L('¿Necesitás ayudante?', 'Need a helper?')}</div>
                  <div className="text-[12px] text-ink2">
                    {L('Ayuda a cargar y descargar', 'Helps load and unload')} · <span className="mono font-bold">+{uyu(HELPER_PER_HOUR)}/h</span>
                  </div>
                </div>
                <Switch
                  checked={req.ayudante}
                  onChange={(v) => {
                    setReq({ ayudante: v })
                    toast(v ? L('Sumamos un ayudante', 'Helper added') : L('Sin ayudante', 'No helper'))
                  }}
                />
              </div>

              <div className="flex items-center gap-3 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-subtle text-ink2">
                  <Timer size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-ink">{L('Horas estimadas', 'Estimated hours')}</div>
                  <div className="text-[12px] text-ink2">{L('Si se extiende, pagás lo real', 'If it runs longer, you pay actual time')}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setReq({ horas: Math.max(1, req.horas - 1) })}
                    disabled={req.horas <= 1}
                    className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink hover:border-accent/40 disabled:opacity-40"
                    aria-label="-"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="mono w-11 text-center text-[16px] font-bold text-ink">{req.horas} h</span>
                  <button
                    onClick={() => setReq({ horas: Math.min(6, req.horas + 1) })}
                    disabled={req.horas >= 6}
                    className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink hover:border-accent/40 disabled:opacity-40"
                    aria-label="+"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="py-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-subtle text-ink2">
                    <CalendarClock size={18} />
                  </span>
                  <div className="min-w-0 flex-1 text-[14px] font-semibold text-ink">{L('Fecha', 'When')}</div>
                  <Segmented
                    size="md"
                    value={req.cuando}
                    onChange={(v) => setReq({ cuando: v })}
                    items={[
                      { id: 'ahora', label: <><Zap size={13} /> {L('Ahora', 'Now')}</> },
                      { id: 'programar', label: <><CalendarClock size={13} /> {L('Programar', 'Schedule')}</> },
                    ]}
                  />
                </div>
                <Reveal show={req.cuando === 'programar'}>
                  <div className="pt-3">
                    <Input
                      type="datetime-local"
                      value={when}
                      onChange={(e) => setWhen(e.target.value)}
                      className="mono h-11"
                    />
                    <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-ink2">
                      {L('Te confirmamos el conductor 24 h antes', 'We confirm your driver 24 h before')}
                      <InfoDot text={L('Los viajes programados con recordatorio automático llegan en la versión final.', 'Scheduled trips with automatic reminders come in the final version.')} />
                    </p>
                  </div>
                </Reveal>
              </div>

              <div className="pt-3.5">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink">{L('Nota para el conductor', 'Note for the driver')}</label>
                <Textarea
                  value={req.nota}
                  onChange={(e) => setReq({ nota: e.target.value })}
                  placeholder={L('Ej.: 3er piso por escalera, un sillón de 2 cuerpos y 6 cajas.', 'E.g.: 3rd floor walk-up, a 2-seat sofa and 6 boxes.')}
                  className="min-h-[72px]"
                />
              </div>
            </div>
          </Card>

          {/* d) summary */}
          <Card className="p-4 sm:p-5">
            <SectionHead n={4} title={L('Resumen', 'Summary')} />
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="kpi-label">{L('Tarifa estimada', 'Estimated fare')}</div>
                <motion.div key={total} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="mono mt-1 text-[30px] font-bold leading-none tracking-tight text-ink">
                  {uyu(total)}
                </motion.div>
                <div className="mono mt-1.5 text-[12.5px] font-semibold text-ink2">
                  ({req.horas} h × {uyu(rate + helper, false)})
                </div>
              </div>
              <div className="text-right text-[12px] leading-relaxed text-ink2">
                <div>
                  {P(CATEGORY_LABEL[req.categoria])} <span className="mono font-bold text-ink">{uyu(rate, false)}/h</span>
                </div>
                {req.ayudante && (
                  <div>
                    {L('Ayudante', 'Helper')} <span className="mono font-bold text-ink">{uyu(HELPER_PER_HOUR, false)}/h</span>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-subtle px-3 py-2 text-[12px] text-ink2">
              <Clock size={13} className="mt-0.5 shrink-0" />
              {L('Se cobra por fracción de 15 min después de la primera hora', 'Billed per 15-min fraction after the first hour')}
            </p>
            <div className="mt-4">
              <div className="kpi-label mb-2">{L('Medio de pago', 'Payment method')}</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'tarjeta', icon: CreditCard, label: 'Visa ··4417' },
                    { id: 'efectivo', icon: Banknote, label: L('Efectivo', 'Cash') },
                  ] as const
                ).map((m) => {
                  const sel = req.metodo === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => setReq({ metodo: m.id })}
                      className={cn(
                        'flex h-12 items-center gap-2 rounded-xl border-2 px-3 text-left text-[13.5px] font-semibold transition-colors',
                        sel ? 'border-accent bg-accent-soft/70 text-ink' : 'border-line bg-card text-ink2 hover:border-accent/40',
                      )}
                    >
                      <m.icon size={17} className={m.id === 'tarjeta' ? 'text-accent' : 'text-st-green'} />
                      <span className={cn(m.id === 'tarjeta' && 'mono')}>{m.label}</span>
                      {sel && <Check size={15} className="ml-auto text-accent" strokeWidth={3} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* e) CTA */}
          <div className="space-y-2.5">
            {phase === 'asignado' ? (
              <div className="grid grid-cols-2 gap-2.5">
                <Button data-trailer="pedir-btn" variant="secondary" size="xl" onClick={pedir}>
                  <RotateCcw size={16} /> {L('Pedir otro flete', 'Book another')}
                </Button>
                <Button size="xl" onClick={() => navigate('/viaje')}>
                  {L('Seguir mi viaje', 'Track my trip')} <ArrowRight size={17} />
                </Button>
              </div>
            ) : (
              <Button data-trailer="pedir-btn" size="xl" className="w-full justify-between text-[16px]" onClick={pedir}>
                {phase === 'matching' ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {L('Buscando conductor…', 'Finding a driver…')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Package size={18} /> {L('Pedir flete', 'Book van')}
                  </span>
                )}
                <span className="mono font-bold">{uyu(total)}</span>
              </Button>
            )}
            <div className="flex items-center justify-center gap-3 text-[11.5px] text-ink2">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-st-green" /> {L('Conductores verificados', 'Verified drivers')}
              </span>
              {phase === 'asignado' && (
                <button
                  onClick={() => {
                    resetCustomer()
                    toast(L('Nuevo pedido desde cero', 'Fresh new request'))
                  }}
                  className="font-semibold text-accent hover:underline"
                >
                  {L('Empezar de cero', 'Start over')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <SizeGuide open={guide} onClose={() => setGuide(false)} onPick={(c) => { setReq({ categoria: c }); setGuide(false) }} />
    </div>
  )
}

/* ───────────────────────── Map ───────────────────────── */
function PedirMap({
  o,
  d,
  route,
  drivers,
  phase,
  lit,
}: {
  o: Place | null
  d: Place | null
  route: LatLng[] | null
  drivers: Driver[]
  phase: 'form' | 'matching' | 'asignado'
  lit: number
}) {
  const fit = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = route ? [...route] : []
    if (!route && o) pts.push([o.lat, o.lng])
    if (!route && d) pts.push([d.lat, d.lng])
    return pts
  }, [route, o, d])
  const approach = useMemo(() => (o ? approachFor(o) : null), [o])
  return (
    <MapView
      center={o ? [o.lat, o.lng] : CABA_CENTER}
      zoom={14}
      fit={fit}
      fitKey={`${o?.id ?? '-'}_${d?.id ?? '-'}`}
      fitPadding={46}
      className="h-full w-full shadow-card"
    >
      {route && <Polyline positions={route} pathOptions={{ color: ACCENT, weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />}
      {phase !== 'asignado' &&
        drivers.map((x, i) => (
          <Marker
            key={x.id}
            position={[x.lat, x.lng]}
            icon={phase === 'matching' ? (i < lit ? IC.lit : IC.dim) : IC.avail}
            interactive={false}
          />
        ))}
      {phase === 'asignado' && approach && (
        <>
          <Polyline positions={approach} pathOptions={{ color: ACCENT, weight: 3, opacity: 0.7, dashArray: '4 8' }} />
          <Marker position={approach[0]} icon={IC.truck} interactive={false} />
        </>
      )}
      {phase === 'matching' && o && <Marker position={[o.lat, o.lng]} icon={IC.radar} interactive={false} />}
      {o && <Marker position={[o.lat, o.lng]} icon={IC.origin} interactive={false} />}
      {d && <Marker position={[d.lat, d.lng]} icon={IC.dest} interactive={false} />}
    </MapView>
  )
}

function MatchingOverlay({ lit, runId }: { lit: number; runId: number }) {
  const { L } = useT()
  return (
    <motion.div
      initial={{ opacity: 0, translate: '0px 10px' }}
      animate={{ opacity: 1, translate: '0px 0px' }}
      className="absolute inset-x-3 bottom-3 z-[500] rounded-card border border-line bg-card/95 p-3.5 shadow-pop backdrop-blur"
    >
      <div className="flex items-center gap-3">
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Search size={17} />
          <span className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold text-ink">{L('Buscando conductores verificados cerca…', 'Finding verified drivers nearby…')}</div>
          <div className="text-[12px] text-ink2">
            <span className="mono font-bold text-accent">{lit}</span> {L('conductores notificados', 'drivers notified')}
          </div>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-subtle">
        <motion.div
          key={runId}
          className="h-full rounded-full bg-accent"
          initial={{ width: '4%' }}
          animate={{ width: '100%' }}
          transition={{ duration: MATCH_MS / 1000, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  )
}

function AssignedCard({ onFollow }: { onFollow: () => void }) {
  const { L, t, lang } = useT()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, translate: '0px 14px' }}
      animate={{ opacity: 1, scale: 1, translate: '0px 0px' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-line bg-card p-3.5 shadow-pop sm:p-4"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-bold text-st-green">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-st-green text-white">
            <Check size={12} strokeWidth={3} />
          </span>
          {L('¡Conductor asignado!', 'Driver assigned!')}
        </span>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent">
          {L('Llega en', 'Arrives in')} <span className="mono font-bold">6 min</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Avatar name={MARTIN.nombre} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[15.5px] font-bold text-ink">{MARTIN.nombre}</span>
            <Pill tone="green">
              <BadgeCheck size={11} /> {t('common.verified')}
            </Pill>
          </div>
          <div className="mt-0.5 text-[12.5px] text-ink2">
            <span className="text-amber-500">★</span> <span className="mono font-bold text-ink">{MARTIN.rating.toFixed(1)}</span> ({MARTIN.viajes} {t('common.trips')})
          </div>
          <div className="mt-0.5 truncate text-[12.5px] text-ink2">
            {vehicleText(MARTIN, lang)} · <span className="mono font-bold text-ink">{MARTIN.vehiculo.patente}</span>
          </div>
        </div>
      </div>
      <Button size="lg" className="mt-3 w-full" onClick={onFollow}>
        {L('Seguir mi viaje', 'Track my trip')} <ArrowRight size={16} />
      </Button>
    </motion.div>
  )
}

/* ───────────────────────── Autocomplete ───────────────────────── */
function PlaceInput({
  kind,
  value,
  onPick,
  placeholder,
}: {
  kind: 'origin' | 'dest'
  value: Place | null
  onPick: (p: Place | null) => void
  placeholder: string
}) {
  const { L } = useT()
  const [q, setQ] = useState(placeText(value))
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  useEffect(() => setQ(placeText(value)), [value])

  const results = useMemo(() => {
    const n = norm(q)
    if (!n || n === norm(placeText(value))) return PLACES.slice(0, 6)
    const tokens = n.split(/\s+/)
    return PLACES.filter((p) => {
      const hay = norm(`${p.label} ${p.barrio} ${p.zona}`)
      return tokens.every((tk) => hay.includes(tk))
    }).slice(0, 7)
  }, [q, value])

  const pick = (p: Place) => {
    onPick(p)
    setQ(placeText(p))
    setOpen(false)
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'flex h-12 items-center gap-2.5 rounded-xl border bg-subtle pl-3 pr-1.5 transition-colors',
          open ? 'border-accent bg-card ring-2 ring-accent/20' : 'border-transparent',
        )}
      >
        {kind === 'origin' ? (
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border-[3px] border-ink" />
        ) : (
          <MapPin size={17} className="shrink-0 text-accent" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase leading-none tracking-[.08em] text-ink2">{kind === 'origin' ? L('Origen', 'Pickup') : L('Destino', 'Drop-off')}</div>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
              setActive(0)
            }}
            onFocus={(e) => {
              setOpen(true)
              e.target.select()
            }}
            onBlur={() => {
              setOpen(false)
              setQ(placeText(value))
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(results.length - 1, a + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(0, a - 1))
              } else if (e.key === 'Enter' && results[active]) {
                e.preventDefault()
                pick(results[active])
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            placeholder={placeholder}
            className="w-full truncate bg-transparent text-[14px] font-semibold text-ink placeholder:font-normal placeholder:text-ink2/70 focus:outline-none"
          />
        </div>
        {q && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQ('')
              onPick(null)
              setOpen(true)
            }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink2 hover:bg-card hover:text-ink"
            aria-label={L('Borrar', 'Clear')}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && (
        <motion.ul
          initial={{ opacity: 0, translate: '0px -4px' }}
          animate={{ opacity: 1, translate: '0px 0px' }}
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-[280px] overflow-y-auto rounded-xl border border-line bg-card p-1.5 shadow-pop"
        >
          {results.length === 0 && (
            <li className="px-3 py-3 text-[13px] text-ink2">{L('Sin resultados en Montevideo para “{q}”', 'No results in Montevideo for “{q}”', { q })}</li>
          )}
          {results.map((p, i) => (
            <li key={p.id}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(p)}
                className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left', i === active ? 'bg-subtle' : '')}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <MapPin size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{p.label}</span>
                  <span className="block truncate text-[12px] text-ink2">
                    {p.barrio} · {p.zona === 'Norte' || p.barrio === 'Las Piedras' ? 'Canelones' : 'Montevideo'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </motion.ul>
      )}
    </div>
  )
}

/* ───────────────────────── Size guide modal ───────────────────────── */
const EXAMPLES: Record<VehicleCategory, [string, string][]> = {
  chico: [
    ['Heladera + lavarropas', 'Fridge + washing machine'],
    ['Un sillón o una cama', 'A sofa or a bed'],
    ['Hasta 15 cajas', 'Up to 15 boxes'],
  ],
  mediano: [
    ['Monoambiente completo', 'Whole studio apartment'],
    ['Mesa + 6 sillas + placard', 'Table + 6 chairs + wardrobe'],
    ['Hasta 35 cajas', 'Up to 35 boxes'],
  ],
  grande: [
    ['2 ambientes completo', 'Whole 1-bedroom apartment'],
    ['Mercadería en pallets', 'Palletized merchandise'],
    ['Hasta 60 cajas', 'Up to 60 boxes'],
  ],
}

function SizeGuide({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (c: VehicleCategory) => void }) {
  const { L, P } = useT()
  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl">
      <div className="p-5 sm:p-6">
        <h3 className="pr-8 text-[19px] font-extrabold tracking-tight text-ink">{L('¿Qué tamaño necesito?', 'What size do I need?')}</h3>
        <p className="mt-1 text-[13px] text-ink2">{L('Una guía rápida según lo que vas a mover.', 'A quick guide based on what you’re moving.')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TARIFFS.map((tf) => (
            <div key={tf.categoria} className="flex flex-col rounded-card border border-line bg-subtle/60 p-3.5">
              <div className="grid h-[76px] place-items-center">
                <VehicleArt cat={tf.categoria} className="h-full w-auto max-w-full text-ink" />
              </div>
              <div className="mt-2 text-[14.5px] font-bold text-ink">{P(CATEGORY_LABEL[tf.categoria])}</div>
              <div className="text-[12px] text-ink2">{tf.modelos.join(' / ')}</div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-card px-2 py-1.5">
                  <div className="kpi-label !text-[9.5px]">{L('Caja', 'Cargo box')}</div>
                  <div className="mono text-[11.5px] font-bold text-ink">{tf.caja}</div>
                </div>
                <div className="rounded-lg bg-card px-2 py-1.5">
                  <div className="kpi-label !text-[9.5px]">{L('Carga', 'Payload')}</div>
                  <div className="mono text-[11.5px] font-bold text-ink">{tf.capacidadKg.toLocaleString('es-UY')} kg</div>
                </div>
              </div>
              <ul className="mt-2.5 flex-1 space-y-1">
                {EXAMPLES[tf.categoria].map((ex, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12.5px] text-ink">
                    <Check size={13} className="mt-0.5 shrink-0 text-st-green" /> {P(ex)}
                  </li>
                ))}
              </ul>
              <Button variant="soft" size="sm" className="mt-3 w-full" onClick={() => onPick(tf.categoria)}>
                {L('Elegir', 'Choose')} · <span className="mono">{uyu(tf.porHora, false)}/h</span>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
