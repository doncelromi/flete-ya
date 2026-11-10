import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Marker, Polyline } from 'react-leaflet'
import { toast } from 'sonner'
import {
  BadgeCheck,
  Banknote,
  Box,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  CreditCard,
  FileText,
  Flag,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  RotateCcw,
  Star,
  Truck,
} from 'lucide-react'
import { Avatar, Button, Card, InfoDot, Modal, Pill, Textarea } from '@/components/ui'
import { DevNotice, PageHeader, PreviewBanner } from '@/components/shared'
import { ACCENT, MapView, icons } from '@/components/map/MapView'
import { CATEGORY_LABEL, CHIP_LABEL, STATUS_LABEL } from '@/data/labels'
import { DEMO_DEST, DEMO_ORIGIN, HELPER_PER_HOUR, pointAt, tariffOf } from '@/data/places'
import { MARTIN } from '@/data/drivers'
import { LUCIA } from '@/data/users'
import type { LatLng, TripStatus } from '@/data/types'
import { LIVE_STEPS, useTrip } from '@/store/trip'
import { Lnow, useT } from '@/i18n'
import { uyu, clock, cn } from '@/lib/utils'
import { LIVE_TRIP_ID, ReceiptCard, approachFor, routeInfo, vehicleText, type ReceiptData } from './lib'

const IC = { origin: icons.origin(), dest: icons.dest(), truck: icons.truck() }
const APPROACH_MS = 75_000
const ROUTE_MS = 90_000
const APPROACH_SEC = 6 * 60

const STEP_LABEL = (s: TripStatus) => (s === 'completado' ? (['Entregado', 'Delivered'] as const) : STATUS_LABEL[s])
const STEP_ICON: Record<string, typeof Truck> = {
  asignado: Check,
  en_camino: Navigation,
  en_origen: MapPin,
  cargando: Box,
  en_viaje: Truck,
  completado: Flag,
}
const PUSH: Partial<Record<TripStatus, [string, string]>> = {
  en_camino: ['Martín está en camino al origen', 'Martín is on the way to the pickup'],
  en_origen: ['Martín llegó al origen · arranca el reloj', 'Martín arrived at the pickup · clock started'],
  cargando: ['Empezó la carga', 'Loading started'],
  en_viaje: ['Tu flete va camino a destino', 'Your van is heading to the drop-off'],
  completado: ['¡Entregado! Todo llegó a destino', 'Delivered! Everything arrived'],
}

type ModalKind = null | 'pay' | 'receipt' | 'rate'

export default function Viaje() {
  const { L, P, t, lang } = useT()
  const navigate = useNavigate()
  const phase = useTrip((s) => s.phase)
  const status = useTrip((s) => s.status)
  const req = useTrip((s) => s.req)
  const assign = useTrip((s) => s.assign)
  const advance = useTrip((s) => s.advance)
  const setStatus = useTrip((s) => s.setStatus)
  const elapsed = useTrip((s) => s.elapsed)
  const totalFn = useTrip((s) => s.total)
  const rated = useTrip((s) => s.rated)
  const setPaid = useTrip((s) => s.setPaid)
  const setRated = useTrip((s) => s.setRated)
  const resetCustomer = useTrip((s) => s.resetCustomer)

  const [modal, setModal] = useState<ModalKind>(null)
  const [stars, setStars] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [fecha] = useState(() => new Date().toISOString())

  /* landing without a request → treat as a demo trip already assigned */
  useEffect(() => {
    if (useTrip.getState().phase !== 'asignado') assign()
  }, [assign])

  /* 2 Hz tick: smooth marker interpolation + running clock */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  /* auto-advance asignado → en_camino */
  useEffect(() => {
    if (status !== 'asignado' || phase !== 'asignado') return
    const id = setTimeout(() => {
      if (useTrip.getState().status === 'asignado') setStatus('en_camino')
    }, 4000)
    return () => clearTimeout(id)
  }, [status, phase, setStatus])

  /* simulated push notifications on every status change */
  const prev = useRef(status)
  useEffect(() => {
    if (prev.current !== status) {
      const msg = PUSH[status]
      if (msg) toast(Lnow(msg[0], msg[1]), { icon: <Truck size={16} className="text-accent" /> })
      prev.current = status
    }
  }, [status])

  /* payment modal when delivered — also when the status is set externally (trailer / presenter) */
  const payShown = useRef(false)
  const sawLive = useRef(false)
  useEffect(() => {
    if (status !== 'completado') {
      payShown.current = false
      sawLive.current = true
      return
    }
    const st = useTrip.getState()
    if (payShown.current || (!sawLive.current && st.paid && st.rated)) return
    const id = setTimeout(() => {
      payShown.current = true
      setPaid()
      setModal('pay')
    }, 600)
    return () => clearTimeout(id)
  }, [status, setPaid])

  /* geometry */
  const o = req.origen ?? DEMO_ORIGIN
  const d = req.destino && req.destino.id !== o.id ? req.destino : DEMO_DEST
  const info = useMemo(() => routeInfo(o, d)!, [o, d])
  const approach = useMemo(() => approachFor(o), [o])
  const fit = useMemo<LatLng[]>(() => [...approach, ...info.route], [approach, info])

  const seg = status === 'asignado' || status === 'en_camino' ? 'approach' : status === 'en_viaje' ? 'route' : 'still'
  const [segStart, setSegStart] = useState(() => Date.now())
  useEffect(() => setSegStart(Date.now()), [seg])
  const f = seg === 'approach' ? Math.min(1, (now - segStart) / APPROACH_MS) : seg === 'route' ? Math.min(1, (now - segStart) / ROUTE_MS) : 0

  const truckPos: LatLng =
    seg === 'approach' ? pointAt(approach, f) : seg === 'route' ? pointAt(info.route, f) : status === 'completado' ? [d.lat, d.lng] : [o.lat, o.lng]
  const etaSec = Math.max(0, Math.round(APPROACH_SEC * (1 - f)))
  const etaTxt = `${Math.floor(etaSec / 60)}:${String(etaSec % 60).padStart(2, '0')}`
  const routeMin = Math.max(1, Math.ceil(info.min * (1 - f)))

  /* money */
  const rate = tariffOf(req.categoria).porHora + (req.ayudante ? HELPER_PER_HOUR : 0)
  const el = elapsed()
  const idx = LIVE_STEPS.indexOf(status)
  const clockOn = idx >= LIVE_STEPS.indexOf('en_origen')
  const costSoFar = (rate * el) / 3600
  const total = totalFn()
  const done = status === 'completado'

  const receipt: ReceiptData = {
    id: LIVE_TRIP_ID,
    fecha,
    origen: o,
    destino: d,
    categoria: req.categoria,
    horas: req.horas,
    ayudante: req.ayudante,
    metodo: req.metodo,
    conductor: MARTIN.nombre,
    total,
    km: info.km,
  }

  const onAdvance = () => {
    if (done) {
      toast(L('El viaje ya finalizó', 'The trip is already finished'))
      return
    }
    advance()
  }
  const closeModal = useCallback(() => setModal(null), [])
  const openRate = useCallback((n: number) => {
    setStars(n)
    setModal('rate')
  }, [])

  const head = headline(status)

  return (
    <div>
      <PreviewBanner
        id="Viaje"
        bullets={[
          L('GPS real del conductor cada 5-10 s con ETA calculada con tráfico', 'Real driver GPS every 5-10 s with traffic-aware ETA'),
          L('Notificaciones push en cada cambio de estado del viaje', 'Push notifications on every trip status change'),
          L('Cobro automático al finalizar y calificación mutua', 'Automatic charge on completion and two-way rating'),
        ]}
      />
      <PageHeader
        title={L('Mi viaje', 'My trip')}
        subtitle={
          <>
            <span className="mono font-bold">#{LIVE_TRIP_ID}</span> · {o.label} → {d.label}
          </>
        }
        actions={
          <Button data-trailer="advance-status" variant="soft" onClick={onAdvance}>
            {L('Avanzar estado', 'Advance status')} <ChevronRight size={16} />
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        {/* MAP */}
        <div className="lg:sticky lg:top-20">
          <div className="relative h-[45vh] min-h-[300px] lg:h-[600px]">
            <MapView center={[o.lat, o.lng]} zoom={14} fit={fit} fitKey={`${o.id}_${d.id}`} fitPadding={48} className="h-full w-full shadow-card">
              <Polyline positions={info.route} pathOptions={{ color: ACCENT, weight: 5, opacity: seg === 'approach' ? 0.45 : 0.9, lineCap: 'round', lineJoin: 'round' }} />
              {seg === 'approach' && <Polyline positions={approach} pathOptions={{ color: ACCENT, weight: 4, opacity: 0.85, dashArray: '2 9', lineCap: 'round' }} />}
              <Marker position={[o.lat, o.lng]} icon={IC.origin} interactive={false} />
              <Marker position={[d.lat, d.lng]} icon={IC.dest} interactive={false} />
              <Marker position={truckPos} icon={IC.truck} interactive={false} zIndexOffset={1000} />
            </MapView>
            <div className="pointer-events-none absolute left-3 top-3 z-[500] flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold shadow-card backdrop-blur',
                  done ? 'border-st-green/30 bg-[var(--green-soft)] text-st-green' : 'border-accent/25 bg-card/95 text-accent',
                )}
              >
                {!done && <span className="pulse-dot" />}
                {P(STEP_LABEL(status))}
              </span>
              {seg === 'approach' && (
                <span className="rounded-full border border-line bg-card/95 px-3 py-1.5 text-[12px] font-semibold text-ink shadow-card backdrop-blur">
                  {L('Llega en', 'Arrives in')} <span className="mono font-bold text-accent">{etaTxt}</span>
                </span>
              )}
              {seg === 'route' && (
                <span className="rounded-full border border-line bg-card/95 px-3 py-1.5 text-[12px] font-semibold text-ink shadow-card backdrop-blur">
                  {L('A destino', 'To drop-off')} <span className="mono font-bold text-accent">~{routeMin} min</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SIDE / SHEET */}
        <div className="space-y-4">
          {/* status */}
          <Card className="p-4 sm:p-5">
            <motion.div key={status} initial={{ opacity: 0, translate: '0px 6px' }} animate={{ opacity: 1, translate: '0px 0px' }}>
              <div className={cn('text-[21px] font-extrabold leading-tight tracking-tight', done ? 'text-st-green' : 'text-ink')}>{P(head[0])}</div>
              <div className="mt-1 text-[13.5px] text-ink2">
                {status === 'en_camino' || status === 'asignado' ? (
                  <>
                    {L('Llega en', 'Arrives in')} <span className="mono text-[15px] font-bold text-accent">{etaTxt}</span> · {vehicleText(MARTIN, lang)}{' '}
                    <span className="mono font-bold text-ink">{MARTIN.vehiculo.patente}</span>
                  </>
                ) : status === 'en_viaje' ? (
                  <>
                    {L('Llega a destino en', 'Reaches drop-off in')} <span className="mono text-[15px] font-bold text-accent">~{routeMin} min</span> · {d.label}
                  </>
                ) : (
                  P(head[1])
                )}
              </div>
            </motion.div>
            <Stepper status={status} />
          </Card>

          {/* hour clock */}
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="kpi-label flex items-center gap-1.5">
                <Clock size={12} /> {L('Reloj por hora', 'Hourly clock')}
              </span>
              <span className="text-[11.5px] text-ink2">
                <span className="mono font-bold text-ink">{uyu(rate, false)}/h</span>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className={cn('mono text-[30px] font-bold leading-none tracking-tight', clockOn || done ? 'text-ink' : 'text-ink2/50')}>{clock(el)}</span>
              {(clockOn || done) && (
                <span className="text-[13px] text-ink2">
                  · <span className="mono font-bold text-ink">{uyu(done ? total : costSoFar)}</span> {done ? L('total', 'total') : L('hasta ahora', 'so far')}
                </span>
              )}
            </div>
            {!clockOn && !done ? (
              <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-ink2">
                <CircleDot size={13} className="text-st-amber" />
                {L('El reloj arranca cuando el conductor llega al origen', 'The clock starts when the driver reaches the pickup')}
              </p>
            ) : (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-subtle">
                  <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.min(100, (el / (req.horas * 3600)) * 100)}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[11.5px] text-ink2">
                  <span>{L('Estimado', 'Estimate')}: <span className="mono font-bold">{req.horas} h</span></span>
                  <span className="mono font-bold">{uyu(total)}</span>
                </div>
              </div>
            )}
          </Card>

          {/* completion */}
          {done && (
            <motion.div initial={{ opacity: 0, translate: '0px 10px' }} animate={{ opacity: 1, translate: '0px 0px' }}>
              <Card className="border-st-green/30 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-st-green text-white">
                    <Check size={22} strokeWidth={3} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-ink">{L('Viaje finalizado', 'Trip completed')}</div>
                    <div className="text-[12.5px] text-ink2">
                      <span className="mono font-bold text-ink">{uyu(total)}</span> · {req.metodo === 'tarjeta' ? 'Visa ··4417' : L('Efectivo', 'Cash')}
                    </div>
                  </div>
                </div>
                <div className="mt-3.5 grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="lg" onClick={() => setModal('receipt')}>
                    <FileText size={15} /> {L('Comprobante', 'Receipt')}
                  </Button>
                  {rated ? (
                    <Button variant="secondary" size="lg" onClick={() => toast(L('Ya calificaste este viaje', 'You already rated this trip'))}>
                      <Star size={15} className="fill-amber-400 text-amber-400" /> {stars ? `${stars}★` : L('Calificado', 'Rated')}
                    </Button>
                  ) : (
                    <Button data-trailer="open-rating" size="lg" onClick={() => openRate(stars)}>
                      <Star size={15} /> {L('Calificar', 'Rate')}
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() => {
                    resetCustomer()
                    navigate('/pedir')
                  }}
                >
                  <RotateCcw size={15} /> {L('Pedir otro flete', 'Book another van')}
                </Button>
              </Card>
            </motion.div>
          )}

          {/* driver */}
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Avatar name={MARTIN.nombre} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[16px] font-bold text-ink">{MARTIN.nombre}</span>
                  <Pill tone="green">
                    <BadgeCheck size={11} /> {t('common.verified')}
                  </Pill>
                </div>
                <div className="mt-0.5 text-[12.5px] text-ink2">
                  <span className="text-amber-500">★</span> <span className="mono font-bold text-ink">{MARTIN.rating.toFixed(1)}</span> · {MARTIN.viajes} {t('common.trips')} ·{' '}
                  {P(CATEGORY_LABEL[MARTIN.vehiculo.categoria])}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-subtle px-3 py-2.5">
              <span className="text-[13px] font-semibold text-ink">{vehicleText(MARTIN, lang)}</span>
              <span className="mono rounded-md border-2 border-ink/80 bg-white px-2 py-0.5 text-[13px] font-bold tracking-wider text-zinc-900">{MARTIN.vehiculo.patente}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="lg" onClick={() => toast(L('Llamada simulada · función en desarrollo', 'Simulated call · feature in development'))}>
                <Phone size={16} /> {L('Llamar', 'Call')}
              </Button>
              <Button variant="secondary" size="lg" onClick={() => toast(L('Chat simulado · función en desarrollo', 'Simulated chat · feature in development'))}>
                <MessageCircle size={16} /> {L('Mensaje', 'Message')}
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-[11.5px] text-ink2">
              {L('Tu número queda oculto para el conductor', 'Your number stays hidden from the driver')}
              <InfoDot text={L('La llamada enmascarada y el chat in-app se integran en la versión final.', 'Masked calling and in-app chat are integrated in the final version.')} />
            </div>
            {req.nota && (
              <div className="mt-3 rounded-lg border border-dashed border-line px-3 py-2 text-[12.5px] text-ink2">
                <span className="font-semibold text-ink">{L('Tu nota', 'Your note')}:</span> {req.nota}
              </div>
            )}
          </Card>

          <DevNotice
            title={L('Llamar / mensaje al conductor', 'Call / message the driver')}
            now={L('botones simulados', 'simulated buttons')}
            later={L('llamada enmascarada y chat in-app', 'masked calling and in-app chat')}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <DevNotice
          title={L('Notificaciones push (APNs / Firebase Cloud Messaging)', 'Push notifications (APNs / Firebase Cloud Messaging)')}
          now={L('toasts in-app', 'in-app toasts')}
          later={L('push real al iPhone/Android en cada cambio de estado', 'real push to iPhone/Android on every status change')}
        />
        <DevNotice
          title={L('GPS real de conductores (Core Location / Google Play Services)', 'Real driver GPS (Core Location / Google Play Services)')}
          now={L('posición interpolada sobre una ruta fija', 'position interpolated along a fixed route')}
          later={L('GPS del teléfono del conductor cada 5-10 s', 'driver’s phone GPS every 5-10 s')}
        />
      </div>

      {/* ── payment ── */}
      <Modal open={modal === 'pay'} onClose={closeModal} className="max-w-md">
        <div className="p-5 text-center sm:p-6">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className={cn('mx-auto grid h-16 w-16 place-items-center rounded-full text-white', req.metodo === 'tarjeta' ? 'bg-st-green' : 'bg-st-amber')}
          >
            {req.metodo === 'tarjeta' ? <Check size={32} strokeWidth={3} /> : <Banknote size={30} />}
          </motion.span>
          <h3 className="mt-3 text-[20px] font-extrabold tracking-tight text-ink">
            {req.metodo === 'tarjeta' ? L('Pago aprobado', 'Payment approved') : L('Pago en efectivo', 'Cash payment')}
          </h3>
          {req.metodo === 'tarjeta' ? (
            <div className="mt-2 text-[14px] text-ink2">
              {L('Total', 'Total')} <span className="mono font-bold text-ink">{uyu(total)}</span> ·{' '}
              <span className="inline-flex items-center gap-1">
                <CreditCard size={13} className="text-accent" /> <span className="mono font-bold text-ink">Visa ··4417</span>
              </span>{' '}
              · <span className="font-bold text-st-green">{L('Aprobado', 'Approved')}</span>
            </div>
          ) : (
            <div className="mt-2 text-[14px] text-ink2">
              {L('Pagale', 'Pay')} <span className="mono font-bold text-ink">{uyu(total)}</span> {L('al conductor', 'to the driver')} ·{' '}
              {L('el conductor confirma el cobro', 'the driver confirms the payment')}
            </div>
          )}
          <div className="mt-5 rounded-card border border-line bg-subtle p-3.5">
            <div className="text-[13px] font-semibold text-ink">{L('¿Cómo estuvo tu viaje con Martín?', 'How was your trip with Martín?')}</div>
            <StarRow value={stars} onPick={openRate} size="md" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="lg" onClick={() => setModal('receipt')}>
              <FileText size={15} /> {L('Ver comprobante', 'View receipt')}
            </Button>
            <Button data-trailer="open-rating" size="lg" onClick={() => openRate(stars)}>
              {L('Calificar a Martín', 'Rate Martín')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── receipt ── */}
      <Modal open={modal === 'receipt'} onClose={closeModal} className="max-w-md">
        <div className="p-5 sm:p-6">
          <h3 className="mb-3 pr-8 text-[18px] font-extrabold tracking-tight text-ink">{L('Comprobante', 'Receipt')}</h3>
          <ReceiptCard r={receipt} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => toast.success(L('Comprobante enviado a {m}', 'Receipt sent to {m}', { m: LUCIA.email }))}
            >
              <Mail size={15} /> {L('Enviar por email', 'Email it')}
            </Button>
            {rated ? (
              <Button size="lg" onClick={closeModal}>
                {L('Listo', 'Done')}
              </Button>
            ) : (
              <Button data-trailer="open-rating" size="lg" onClick={() => openRate(stars)}>
                {L('Calificar a Martín', 'Rate Martín')}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* ── rating ── */}
      <RateModal
        open={modal === 'rate'}
        onClose={closeModal}
        stars={stars}
        setStars={setStars}
        onSent={(n) => {
          setRated()
          setModal(null)
          toast.success(Lnow(`Gracias, calificaste a Martín con ${n}★`, `Thanks, you rated Martín ${n}★`))
        }}
      />
    </div>
  )
}

function headline(s: TripStatus): [[string, string], [string, string]] {
  switch (s) {
    case 'en_camino':
      return [['Martín está en camino', 'Martín is on the way'], ['', '']]
    case 'en_origen':
      return [['Martín llegó al origen', 'Martín is at the pickup'], ['Te espera en la puerta. El reloj ya está corriendo.', 'He’s waiting at the door. The clock is running.']]
    case 'cargando':
      return [['Cargando tus cosas', 'Loading your things'], ['Martín está cargando la camioneta.', 'Martín is loading the van.']]
    case 'en_viaje':
      return [['En viaje a destino', 'Heading to drop-off'], ['', '']]
    case 'completado':
      return [['¡Entregado!', 'Delivered!'], ['Todo llegó a destino. ¡Gracias por viajar con Fletes ya!', 'Everything arrived. Thanks for riding with Fletes ya!']]
    default:
      return [['Martín aceptó tu viaje', 'Martín accepted your trip'], ['', '']]
  }
}

function Stepper({ status }: { status: TripStatus }) {
  const { P } = useT()
  const idx = LIVE_STEPS.indexOf(status)
  const done = status === 'completado'
  return (
    <div className="mt-4">
      <div className="relative grid grid-cols-6">
        <div className="absolute left-[8.33%] right-[8.33%] top-[15px] h-[3px] rounded-full bg-subtle" />
        <motion.div
          className={cn('absolute left-[8.33%] top-[15px] h-[3px] rounded-full', done ? 'bg-st-green' : 'bg-accent')}
          animate={{ width: `${(idx / (LIVE_STEPS.length - 1)) * 83.33}%` }}
          transition={{ duration: 0.5 }}
        />
        {LIVE_STEPS.map((s, i) => {
          const Icon = STEP_ICON[s]
          const past = i < idx || done
          const cur = i === idx && !done
          return (
            <div key={s} className="relative flex flex-col items-center">
              <span
                className={cn(
                  'relative grid h-8 w-8 place-items-center rounded-full border-2 transition-colors',
                  past && (done ? 'border-st-green bg-st-green text-white' : 'border-accent bg-accent text-white'),
                  cur && 'border-accent bg-card text-accent ring-4 ring-accent/15',
                  !past && !cur && 'border-line bg-card text-ink2/60',
                )}
              >
                <Icon size={14} strokeWidth={2.4} />
              </span>
              <span className={cn('mt-1.5 px-0.5 text-center text-[10px] font-semibold leading-tight sm:text-[11px]', cur ? 'text-accent' : past ? 'text-ink' : 'text-ink2/70')}>
                {P(STEP_LABEL(s))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StarRow({ value, onPick, size = 'lg' }: { value: number; onPick: (n: number) => void; size?: 'md' | 'lg' }) {
  return (
    <div className="mt-2 flex items-center justify-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          data-trailer={`star-${n}`}
          whileTap={{ scale: 0.85 }}
          onClick={() => onPick(n)}
          className={cn('grid place-items-center rounded-full transition-colors hover:bg-amber-500/10', size === 'lg' ? 'h-12 w-12' : 'h-10 w-10')}
          aria-label={`${n}`}
        >
          <Star size={size === 'lg' ? 36 : 28} className={cn(n <= value ? 'fill-amber-400 text-amber-400' : 'text-ink2/30')} strokeWidth={1.6} />
        </motion.button>
      ))}
    </div>
  )
}

const RATE_WORD: [string, string][] = [
  ['Tocá una estrella', 'Tap a star'],
  ['Malo', 'Bad'],
  ['Regular', 'Fair'],
  ['Bueno', 'Good'],
  ['Muy bueno', 'Very good'],
  ['¡Excelente!', 'Excellent!'],
]

function RateModal({
  open,
  onClose,
  stars,
  setStars,
  onSent,
}: {
  open: boolean
  onClose: () => void
  stars: number
  setStars: (n: number) => void
  onSent: (n: number) => void
}) {
  const { L, P } = useT()
  const [chips, setChips] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const toggle = (c: string) => setChips((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]))
  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="p-5 text-center sm:p-6">
        <Avatar name={MARTIN.nombre} size={60} className="mx-auto" />
        <h3 className="mt-3 text-[19px] font-extrabold tracking-tight text-ink">{L('Calificar a Martín', 'Rate Martín')}</h3>
        <p className="text-[13px] text-ink2">{L('Tu opinión ayuda a mantener la calidad del servicio', 'Your feedback keeps service quality high')}</p>
        <StarRow value={stars} onPick={setStars} />
        <div className={cn('mt-1 text-[13px] font-semibold', stars ? 'text-amber-600' : 'text-ink2')}>{P(RATE_WORD[stars])}</div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {(['puntual', 'cuidadoso', 'amable'] as const).map((c) => {
            const on = chips.includes(c)
            return (
              <button
                key={c}
                onClick={() => toggle(c)}
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
                  on ? 'border-accent bg-accent text-white' : 'border-line bg-card text-ink hover:border-accent/40',
                )}
              >
                {on && <Check size={13} strokeWidth={3} />}
                {P(CHIP_LABEL[c])}
              </button>
            )
          })}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={L('Contanos algo más (opcional)', 'Tell us more (optional)')}
          className="mt-4 min-h-[76px] text-left"
        />
        <Button
          data-trailer="send-rating"
          size="xl"
          className="mt-4 w-full"
          onClick={() => {
            const n = stars || 5
            if (!stars) setStars(5)
            onSent(n)
          }}
        >
          {L('Enviar calificación', 'Submit rating')}
        </Button>
      </div>
    </Modal>
  )
}
