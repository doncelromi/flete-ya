import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Circle, Marker } from 'react-leaflet'
import { toast } from 'sonner'
import { ArrowRight, Banknote, BellRing, Clock, Flame, MapPin, Navigation, Power, Star, Truck, X, Zap } from 'lucide-react'
import { Button, Card, InfoDot, Kpi, Pill, SectionTitle, Switch } from '@/components/ui'
import { DevNotice, MethodBadge, PageHeader, PreviewBanner } from '@/components/shared'
import { MapView, icons } from '@/components/map/MapView'
import { MARTIN } from '@/data/drivers'
import { MARTIN_TODAY, MARTIN_TRIPS } from '@/data/trips'
import { DEMO_DEST, DEMO_ORIGIN } from '@/data/places'
import { CATEGORY_LABEL } from '@/data/labels'
import { fmtTime, isToday } from '@/data/dates'
import type { LatLng } from '@/data/types'
import { useTrip } from '@/store/trip'
import { useT } from '@/i18n'
import { uyu, cn } from '@/lib/utils'
import { Enter } from './parts'

const REQUEST_SECONDS = 20
const REQUEST_TOTAL = 2400

/** Soft demand "heatmap" over the driver's zone. */
const DEMAND: { c: LatLng; r: number; tone: 'hot' | 'warm' }[] = [
  { c: [-34.9195, -56.1580], r: 850, tone: 'hot' }, // Punta Carretas
  { c: [-34.9165, -56.1630], r: 520, tone: 'warm' }, // Punta Carretas (Santa Fe)
  { c: [-34.9085, -56.1500], r: 720, tone: 'hot' }, // Pocitos
  { c: [-34.8950, -56.1670], r: 620, tone: 'warm' }, // Tres Cruces
  { c: [-34.8930, -56.1615], r: 420, tone: 'hot' }, // Tres Cruces (Corrientes)
  { c: [-34.9035, -56.1760], r: 900, tone: 'warm' }, // Cordón
  { c: [-34.9045, -56.1720], r: 450, tone: 'hot' }, // Cordón (Acoyte)
]
const DEMAND_FIT: LatLng[] = [...DEMAND.map((d) => d.c), [MARTIN.lat, MARTIN.lng]]
const HOT = '#1F5BFF'
const WARM = '#D97706'

export default function ConductorInicio() {
  const { L } = useT()
  const navigate = useNavigate()
  const online = useTrip((s) => s.driverOnline)
  const setOnline = useTrip((s) => s.setDriverOnline)
  const resetDriver = useTrip((s) => s.resetDriver)
  const [reqOpen, setReqOpen] = useState(false)

  const todayTrips = MARTIN_TRIPS.filter((t) => isToday(t.fecha) && t.estado === 'completado')
  const center: LatLng = [MARTIN.lat, MARTIN.lng]

  const toggleOnline = (v: boolean) => {
    setOnline(v)
    if (v) toast.success(L('Estás en línea: vas a recibir solicitudes cerca tuyo', 'You’re online: you’ll get requests nearby'))
    else toast(L('Te desconectaste. No vas a recibir solicitudes.', 'You’re offline. You won’t get requests.'))
  }

  const simulate = () => {
    if (!online) {
      setOnline(true)
      toast(L('Te conectamos para que puedas recibir la solicitud', 'We put you online so you can receive the request'))
    }
    setReqOpen(true)
  }

  const onAccept = useCallback(() => {
    setReqOpen(false)
    resetDriver()
    toast.success(L('¡Viaje aceptado! Andá al origen', 'Trip accepted! Head to the pickup'))
    navigate('/conductor/viaje')
  }, [L, navigate, resetDriver])

  const onReject = useCallback(() => {
    setReqOpen(false)
    toast(L('Rechazaste la solicitud. Seguís en línea.', 'You declined the request. You’re still online.'))
  }, [L])

  const onExpire = useCallback(() => {
    setReqOpen(false)
    toast.warning(L('La solicitud pasó a otro conductor', 'The request went to another driver'))
  }, [L])

  return (
    <div>
      <PreviewBanner
        id="conductor-inicio"
        bullets={[
          L('Te conectás con un toque y recibís pedidos cercanos según tu vehículo y zona.', 'Go online with one tap and get nearby requests matching your vehicle and zone.'),
          L('Ves dónde hay más demanda en tiempo real para moverte a esas zonas.', 'See where demand is highest in real time and move there.'),
          L('Aceptás o rechazás cada solicitud con precio, distancia y método de pago a la vista.', 'Accept or decline each request with price, distance and payment method upfront.'),
        ]}
      />
      <PageHeader
        title={L('Hola, Martín', 'Hi, Martín')}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{L('Fiorino blanca', 'White Fiorino')}</span>
            <span className="mono rounded-md border border-line bg-card px-1.5 py-0.5 text-[12px] font-bold text-ink">{MARTIN.vehiculo.patente}</span>
            <span>· Pocitos / Tres Cruces</span>
          </span>
        }
        actions={
          <Pill tone="green" className="text-[12px]">
            <Star size={12} className="fill-current" /> <span className="mono font-bold">{MARTIN.rating.toLocaleString('es-UY')}</span> · <span className="mono">{MARTIN.viajes}</span> {L('viajes', 'trips')}
          </Pill>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {/* Online toggle */}
          <Enter>
            <Card
              className={cn(
                'flex items-center gap-4 p-4 transition-colors sm:p-5',
                online ? 'border-st-green/30 bg-[var(--green-soft)]' : 'bg-subtle',
              )}
            >
              <span
                className={cn(
                  'relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-card transition-colors',
                  online ? 'bg-st-green' : 'bg-zinc-400 dark:bg-zinc-600',
                )}
              >
                <Power size={26} strokeWidth={2.4} />
                {online && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-card bg-st-green" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="kpi-label">{L('Tu estado', 'Your status')}</div>
                <div className={cn('text-[22px] font-extrabold leading-tight tracking-tight sm:text-[26px]', online ? 'text-st-green' : 'text-ink2')}>
                  {online ? L('Estás EN LÍNEA', 'You’re ONLINE') : L('DESCONECTADO', 'OFFLINE')}
                </div>
                <div className="mt-0.5 text-[12.5px] leading-snug text-ink2">
                  {online
                    ? L('Recibís solicitudes en tu zona', 'Receiving requests in your zone')
                    : L('Activá para empezar a recibir viajes', 'Turn on to start receiving trips')}
                </div>
              </div>
              <Switch big checked={online} onChange={toggleOnline} className={online ? '!bg-st-green' : ''} />
            </Card>
          </Enter>

          {/* Simulate request */}
          <Enter delay={0.05}>
            <Button
              data-trailer="simulate-request"
              size="xl"
              onClick={simulate}
              className="h-16 w-full bg-ink text-bg shadow-pop hover:bg-ink/90"
            >
              <BellRing size={20} />
              {L('Simular solicitud', 'Simulate request')}
              <Pill tone="neutral" className="ml-1 border-white/20 bg-white/15 text-[10px] text-bg">
                DEMO
              </Pill>
            </Button>
          </Enter>

          {/* Map with demand */}
          <Enter delay={0.1}>
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="flex items-center gap-2 text-[14px] font-bold text-ink">
                  <Flame size={16} className="text-st-amber" /> {L('Zonas con demanda', 'Demand zones')}
                </div>
                <div className="flex items-center gap-3 text-[11.5px] font-semibold text-ink2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: HOT, opacity: 0.7 }} /> {L('Alta', 'High')}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: WARM, opacity: 0.7 }} /> {L('Media', 'Medium')}
                  </span>
                </div>
              </div>
              <MapView center={center} zoom={14} fit={DEMAND_FIT} fitKey="demand" fitPadding={10} className="h-[280px] rounded-none border-x-0 border-b-0 lg:h-[420px]">
                {DEMAND.map((d, i) => (
                  <Circle
                    key={i}
                    center={d.c}
                    radius={d.r}
                    pathOptions={{
                      color: d.tone === 'hot' ? HOT : WARM,
                      fillColor: d.tone === 'hot' ? HOT : WARM,
                      fillOpacity: d.tone === 'hot' ? 0.16 : 0.14,
                      weight: 0,
                    }}
                  />
                ))}
                <Marker position={center} icon={online ? icons.available(true) : icons.busy()} />
              </MapView>
              <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-[12px] text-ink2">
                <Navigation size={13} className="text-accent" />
                {L('Punta Carretas y Pocitos tienen más pedidos ahora', 'Punta Carretas and Pocitos have more requests right now')}
                <InfoDot
                  className="ml-auto"
                  text={L(
                    'La demanda se calcula en vivo con los pedidos de los últimos minutos. En la demo es ilustrativa.',
                    'Demand is computed live from requests in the last minutes. In the demo it’s illustrative.',
                  )}
                />
              </div>
            </Card>
          </Enter>
        </div>

        <div className="space-y-4">
          {/* KPIs */}
          <Enter delay={0.08}>
            <SectionTitle>{L('Tu día', 'Your day')}</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <Kpi label={L('Viajes', 'Trips')} value={MARTIN_TODAY.viajes} icon={<Truck size={15} />} hint={L('hoy', 'today')} />
              <Kpi label={L('Generado', 'Earned')} value={uyu(MARTIN_TODAY.generado)} tone="green" className="[&_.mono]:text-[20px]" hint={L('bruto hoy', 'gross today')} />
              <Kpi
                label={L('En línea', 'Online')}
                value={`${(MARTIN_TODAY.horas + 1.5).toLocaleString('es-UY')} h`}
                icon={<Clock size={15} />}
                hint={L('desde las 7:40', 'since 7:40')}
              />
              <Kpi
                label={L('Calificación', 'Rating')}
                value={
                  <span className="inline-flex items-center gap-1">
                    <Star size={20} className="fill-amber-400 text-amber-400" />
                    {MARTIN.rating.toLocaleString('es-UY')}
                  </span>
                }
                hint={`${MARTIN.viajes} ${L('viajes', 'trips')}`}
              />
            </div>
          </Enter>

          <Enter delay={0.12}>
            <DevNotice
              title={L('Notificaciones push (APNs / Firebase Cloud Messaging)', 'Push notifications (APNs / Firebase Cloud Messaging)')}
              now={L('la solicitud aparece con el botón de simulación.', 'the request appears with the simulate button.')}
              later={L('push con sonido aunque la app esté cerrada.', 'push with sound even when the app is closed.')}
            />
          </Enter>

          {/* Today's trips */}
          <Enter delay={0.16}>
            <SectionTitle right={<span className="mono text-[12px] font-bold text-ink2">{todayTrips.length}</span>}>{L('Últimos viajes de hoy', 'Latest trips today')}</SectionTitle>
            <Card className="divide-y divide-line p-0">
              {todayTrips.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toast(L('Viaje #{id} · {total} · completado', 'Trip #{id} · {total} · completed', { id: t.id, total: uyu(t.total) }))}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle"
                >
                  <span className="mono w-11 shrink-0 text-[13px] font-bold text-ink">{fmtTime(t.fecha)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {t.origen.barrio} <ArrowRight size={11} className="inline text-ink2" /> {t.destino.barrio}
                    </span>
                    <MethodBadge method={t.metodo} className="text-[11.5px] text-ink2" />
                  </span>
                  <span className="mono shrink-0 text-[13.5px] font-bold text-ink">{uyu(t.total)}</span>
                </button>
              ))}
            </Card>
          </Enter>
        </div>
      </div>

      {reqOpen && <IncomingRequest onAccept={onAccept} onReject={onReject} onExpire={onExpire} />}
    </div>
  )
}

/* ───────── Incoming request (bottom sheet on mobile, centered card on desktop) ───────── */
function IncomingRequest({ onAccept, onReject, onExpire }: { onAccept: () => void; onReject: () => void; onExpire: () => void }) {
  const { L, P } = useT()
  const [left, setLeft] = useState(REQUEST_SECONDS)

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (left === 0) onExpire()
  }, [left, onExpire])

  const R = 26
  const C = 2 * Math.PI * R
  const frac = left / REQUEST_SECONDS
  const urgent = left <= 5

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      <motion.div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} />
      <motion.div
        className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl border border-line bg-card shadow-pop sm:inset-0 sm:m-auto sm:h-fit sm:w-[calc(100%-32px)] sm:max-w-md sm:rounded-3xl"
        initial={{ opacity: 0, translate: '0px 40px' }}
        animate={{ opacity: 1, translate: '0px 0px' }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-start gap-4 p-5 pb-3">
          <div className="min-w-0 flex-1">
            <Pill tone="accent" className="text-[10.5px] tracking-[.06em]">
              <Zap size={11} /> {L('NUEVA SOLICITUD', 'NEW REQUEST')}
            </Pill>
            <div className="mono mt-2 text-[32px] font-bold leading-none tracking-tight text-ink">{uyu(REQUEST_TOTAL)}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-ink2">
              <span className="inline-flex items-center gap-1 font-semibold text-st-green">
                <Banknote size={14} /> {L('Efectivo', 'Cash')}
              </span>
              <span>·</span>
              <span>
                <span className="mono font-bold text-ink">{L('1,8 km', '1.8 km')}</span> {L('de distancia', 'away')}
              </span>
            </div>
          </div>
          {/* countdown ring */}
          <div className="relative grid h-[68px] w-[68px] shrink-0 place-items-center">
            <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="32" cy="32" r={R} fill="none" stroke="var(--border)" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r={R}
                fill="none"
                stroke={urgent ? '#DC2626' : '#059669'}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - frac)}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}
              />
            </svg>
            <span className={cn('mono text-[20px] font-bold', urgent ? 'text-st-red' : 'text-ink')}>{left}</span>
          </div>
        </div>

        <div className="mx-5 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-line bg-subtle px-3 py-2.5">
            <div className="kpi-label">{L('Vehículo', 'Vehicle')}</div>
            <div className="mt-0.5 text-[13.5px] font-bold text-ink">{P(CATEGORY_LABEL.chico)}</div>
          </div>
          <div className="rounded-xl border border-line bg-subtle px-3 py-2.5">
            <div className="kpi-label">{L('Duración', 'Duration')}</div>
            <div className="mt-0.5 text-[13.5px] font-bold text-ink">
              <span className="mono">2 h</span> {L('estimadas', 'estimated')}
            </div>
          </div>
        </div>

        <div className="mx-5 mt-3 rounded-xl border border-line p-3">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-st-green ring-4 ring-[var(--green-soft)]" />
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-ink">{DEMO_ORIGIN.label}</div>
              <div className="text-[12px] text-ink2">{DEMO_ORIGIN.barrio}</div>
            </div>
          </div>
          <div className="ml-[4px] h-4 border-l-2 border-dashed border-line" />
          <div className="flex items-start gap-3">
            <MapPin size={14} className="mt-0.5 shrink-0 -translate-x-[2px] text-st-red" />
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-ink">{DEMO_DEST.label}</div>
              <div className="text-[12px] text-ink2">{DEMO_DEST.barrio}</div>
            </div>
          </div>
        </div>

        <div className="mx-5 mt-2 flex items-center gap-2 text-[12px] text-ink2">
          <span>{L('Clienta: Lucía F. · ★4,8', 'Customer: Lucía F. · ★4.8')}</span>
          <InfoDot text={L('Los datos de contacto se liberan al aceptar.', 'Contact details are shared once you accept.')} />
        </div>

        <div className="grid grid-cols-[1fr_2fr] gap-2 p-5 pt-4">
          <Button variant="secondary" size="xl" onClick={onReject} className="h-14">
            <X size={18} /> {L('Rechazar', 'Decline')}
          </Button>
          <Button data-trailer="accept-request" variant="success" size="xl" onClick={onAccept} className="h-14 text-[17px] shadow-card">
            {L('Aceptar', 'Accept')} <ArrowRight size={18} />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
