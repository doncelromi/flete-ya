import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Marker, Polyline } from 'react-leaflet'
import { toast } from 'sonner'
import {
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  PackageCheck,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Timer,
  Truck,
} from 'lucide-react'
import { Avatar, Button, Card, InfoDot, Pill, SectionTitle } from '@/components/ui'
import { MethodBadge, PageHeader, PreviewBanner } from '@/components/shared'
import { MapView, icons, ACCENT } from '@/components/map/MapView'
import { COMMISSION, DEMO_DEST, DEMO_KM, DEMO_MIN, DEMO_ORIGIN, DEMO_ROUTE, MARTIN_APPROACH, pointAt, tariffOf } from '@/data/places'
import { CATEGORY_LABEL, CHIP_LABEL } from '@/data/labels'
import { fmtTime } from '@/data/dates'
import type { LatLng } from '@/data/types'
import { useTrip } from '@/store/trip'
import { useT } from '@/i18n'
import { uyu, clock, cn } from '@/lib/utils'
import { Enter } from './parts'

const TRIP_TOTAL = 2400
const TRIP_HOURS = 2
const RATE = tariffOf('chico').porHora // 18.000/h
const COMMISSION_AMOUNT = Math.round(TRIP_TOTAL * COMMISSION) // 5.400
const CUSTOMER = 'Lucía Ferreyra'
const DRIVER_CHIPS = ['claro', 'listo', 'respetuoso'] as const
const FULL_ROUTE: LatLng[] = [...MARTIN_APPROACH, ...DEMO_ROUTE]

export default function ConductorViaje() {
  const { L, P } = useT()
  const navigate = useNavigate()
  const step = useTrip((s) => s.driverStep)
  const setStep = useTrip((s) => s.setDriverStep)
  const cashConfirmedAt = useTrip((s) => s.cashConfirmedAt)
  const confirmCash = useTrip((s) => s.confirmCash)
  const rated = useTrip((s) => s.driverRated)
  const setRated = useTrip((s) => s.setDriverRated)
  const resetDriver = useTrip((s) => s.resetDriver)

  /* ── hour clock (local): starts at "Inicié carga", freezes at "Entregué" ── */
  const [clockStart, setClockStart] = useState<number | null>(() => (step >= 2 ? Date.now() : null))
  const [clockEnd, setClockEnd] = useState<number | null>(() => (step >= 4 ? Date.now() : null))
  const [bonus, setBonus] = useState(() => (step >= 4 ? TRIP_HOURS * 3600 : step >= 3 ? 37 * 60 : 0))
  const [now, setNow] = useState(() => Date.now())
  const running = clockStart !== null && clockEnd === null

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])

  const elapsed = clockStart === null ? 0 : bonus + Math.max(0, ((clockEnd ?? now) - clockStart) / 1000)
  const costSoFar = Math.round((RATE * elapsed) / 3600)

  /* ── rating ── */
  const [stars, setStars] = useState(5)
  const [chips, setChips] = useState<string[]>(['claro', 'listo'])

  const steps = useMemo(
    () => [
      { label: L('Yendo al origen', 'Heading to pickup'), sub: L('a 1,8 km · 6 min', '1.8 km away · 6 min') },
      { label: L('En el origen', 'At pickup'), sub: DEMO_ORIGIN.label },
      { label: L('Cargando', 'Loading'), sub: L('corre el reloj por hora', 'hourly clock running') },
      { label: L('En viaje', 'In transit'), sub: `${DEMO_KM.toLocaleString('es-UY')} km · ${DEMO_MIN} min` },
      { label: L('Entregado', 'Delivered'), sub: DEMO_DEST.label },
    ],
    [L],
  )

  const ACTIONS = [
    { label: L('Llegué al origen', 'I’m at the pickup'), icon: MapPin, toast: L('Le avisamos a Lucía que llegaste', 'We let Lucía know you arrived') },
    { label: L('Inicié carga', 'Start loading'), icon: PackageCheck, toast: L('Arrancó el reloj por hora', 'Hourly clock started') },
    { label: L('Inicié viaje', 'Start trip'), icon: Truck, toast: L('Viaje en curso hacia Cordón', 'Trip in progress to Cordón') },
    { label: L('Entregué', 'Delivered'), icon: CheckCircle2, toast: L('¡Entrega registrada!', 'Delivery recorded!') },
  ]

  const advance = () => {
    const a = ACTIONS[step]
    if (!a) return
    const next = step + 1
    if (next === 2) {
      setClockStart(Date.now())
      setClockEnd(null)
      setBonus(0)
      setNow(Date.now())
    }
    // demo: loading took ~37 min, and the trip closes at the 2 h estimate so the clock matches $U 2.400
    if (next === 3) setBonus((b) => b + 37 * 60)
    if (next === 4) {
      const start = clockStart ?? Date.now()
      const sofar = bonus + (Date.now() - start) / 1000
      setClockStart(start)
      setBonus(Math.max(Math.floor(sofar), TRIP_HOURS * 3600))
      setClockEnd(start)
    }
    setStep(next)
    toast.success(a.toast)
  }

  const addQuarter = () => {
    setBonus((b) => b + 15 * 60)
    toast(L('+15 min al reloj (demo para el presentador)', '+15 min on the clock (presenter demo)'))
  }

  const onConfirmCash = () => {
    confirmCash()
    toast.success(L('Cobro en efectivo confirmado y registrado', 'Cash payment confirmed and recorded'))
  }

  const sendRating = () => {
    setRated()
    toast.success(L('¡Gracias! Calificaste a Lucía con {n} estrellas', 'Thanks! You rated Lucía {n} stars', { n: stars }))
  }

  const restart = useCallback(() => {
    resetDriver()
    setClockStart(null)
    setClockEnd(null)
    setBonus(0)
    setStars(5)
    setChips(['claro', 'listo'])
    toast(L('Demo reiniciada: volvés a salir hacia el origen', 'Demo restarted: heading to the pickup again'))
  }, [L, resetDriver])

  const truckPos: LatLng = step === 0 ? MARTIN_APPROACH[0] : step <= 2 ? DEMO_ROUTE[0] : step === 3 ? pointAt(DEMO_ROUTE, 0.5) : DEMO_ROUTE[DEMO_ROUTE.length - 1]
  const action = ACTIONS[step]

  return (
    <div>
      <PreviewBanner
        id="conductor-viaje"
        bullets={[
          L('Navegás al origen y al destino con un toque, con el recorrido siempre visible.', 'Navigate to pickup and drop-off with one tap, route always visible.'),
          L('Cada paso (llegada, carga, viaje, entrega) le avisa al cliente y queda registrado.', 'Each step (arrival, loading, transit, delivery) notifies the customer and gets logged.'),
          L('El cobro en efectivo queda auditado con hora y comisión a rendir.', 'Cash payments are audited with time and commission owed.'),
        ]}
      />
      <PageHeader
        title={L('Viaje activo', 'Active trip')}
        subtitle={
          <span>
            {CUSTOMER} · {P(CATEGORY_LABEL.chico)} · <span className="mono font-bold text-ink">{TRIP_HOURS} h</span>
          </span>
        }
        actions={
          <Button variant="ghost" size="sm" onClick={restart}>
            <RotateCcw size={14} /> {L('Reiniciar demo', 'Restart demo')}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        {/* Map */}
        <Enter className="lg:col-start-1 lg:row-start-1">
          <Card className="overflow-hidden p-0">
            <MapView center={DEMO_ROUTE[4]} className="h-[240px] rounded-none border-0 sm:h-[340px] lg:h-[400px]" fit={FULL_ROUTE} fitKey="trip" fitPadding={36}>
              {step === 0 && <Polyline positions={MARTIN_APPROACH} pathOptions={{ color: ACCENT, weight: 4, opacity: 0.55, dashArray: '6 8' }} />}
              <Polyline positions={DEMO_ROUTE} pathOptions={{ color: ACCENT, weight: 5, opacity: step >= 3 ? 0.95 : 0.7 }} />
              <Marker position={DEMO_ROUTE[0]} icon={icons.origin()} />
              <Marker position={DEMO_ROUTE[DEMO_ROUTE.length - 1]} icon={icons.dest()} />
              <Marker position={truckPos} icon={icons.truck()} />
            </MapView>
            <div className="flex items-center gap-2 border-t border-line p-3">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() =>
                  toast(
                    step < 2
                      ? L('Abriendo Google Maps hacia {a}', 'Opening Google Maps to {a}', { a: DEMO_ORIGIN.label })
                      : L('Abriendo Google Maps hacia {a}', 'Opening Google Maps to {a}', { a: DEMO_DEST.label }),
                  )
                }
              >
                <Navigation size={16} className="text-accent" /> {L('Abrir en Google Maps', 'Open in Google Maps')}
              </Button>
              <InfoDot text={L('En la app nativa abre Google Maps o Waze con la dirección cargada.', 'In the native app it opens Google Maps or Waze with the address preloaded.')} />
            </div>
          </Card>
        </Enter>

        {/* Actions panel */}
        <div className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {/* Clock */}
          <Enter delay={0.05}>
            <Card className={cn('p-4', running && 'border-accent/30')}>
              <div className="flex items-center justify-between gap-2">
                <span className="kpi-label inline-flex items-center gap-1.5">
                  <Timer size={13} /> {L('Reloj por hora', 'Hourly clock')}
                </span>
                {running ? (
                  <Pill tone="accent">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> {L('Corriendo', 'Running')}
                  </Pill>
                ) : clockEnd ? (
                  <Pill tone="green">{L('Finalizado', 'Stopped')}</Pill>
                ) : (
                  <Pill>{L('Arranca al cargar', 'Starts at loading')}</Pill>
                )}
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className={cn('mono text-[40px] font-bold leading-none tracking-tight', running ? 'text-ink' : 'text-ink2')}>{clock(elapsed)}</div>
                {running && (
                  <Button variant="soft" size="sm" onClick={addQuarter}>
                    <Plus size={13} /> 15 min
                  </Button>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[13px]">
                <span className="text-ink2">
                  {clockEnd ? L('Costo final', 'Final cost') : L('Costo hasta ahora', 'Cost so far')} ·<span className="mono">{uyu(RATE)}/h</span>
                </span>
                <span className="mono text-[16px] font-bold text-ink">{uyu(costSoFar)}</span>
              </div>
            </Card>
          </Enter>

          {/* Primary step action */}
          {action && (
            <Enter delay={0.08}>
              <Button key={step} size="xl" variant={step === 3 ? 'success' : 'primary'} onClick={advance} className="h-16 w-full text-[17px] shadow-pop">
                <action.icon size={20} /> {action.label} <ArrowRight size={18} className="ml-auto" />
              </Button>
              <p className="mt-2 text-center text-[12px] text-ink2">
                {L('Paso {n} de 4 · el cliente ve cada cambio en vivo', 'Step {n} of 4 · the customer sees every change live', { n: step + 1 })}
              </p>
            </Enter>
          )}

          {/* Cash confirmation */}
          {step >= 4 && !cashConfirmedAt && (
            <motion.div initial={{ opacity: 0, translate: '0px 12px' }} animate={{ opacity: 1, translate: '0px 0px' }}>
              <Card className="border-st-green/30 bg-[var(--green-soft)] p-4">
                <div className="flex items-center gap-2 text-[13px] font-bold text-st-green">
                  <Banknote size={17} /> {L('Pago en efectivo', 'Cash payment')}
                </div>
                <div className="mt-1 text-[15px] font-semibold text-ink">{L('Confirmar cobro en efectivo:', 'Confirm cash collected:')}</div>
                <div className="mono mt-1 text-[34px] font-bold leading-none text-ink">{uyu(TRIP_TOTAL)}</div>
                <p className="mt-2 text-[12.5px] leading-snug text-ink2">
                  {L('Confirmalo cuando tengas la plata en la mano. Queda registrado con hora para la liquidación.', 'Confirm once you have the cash in hand. It gets logged with a timestamp for settlement.')}
                </p>
                <Button size="xl" variant="success" className="mt-3 h-14 w-full" onClick={onConfirmCash}>
                  <Check size={20} /> {L('Confirmar cobro', 'Confirm payment')}
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Audit record */}
          {cashConfirmedAt && (
            <motion.div initial={{ opacity: 0, translate: '0px 12px' }} animate={{ opacity: 1, translate: '0px 0px' }}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--green-soft)] text-st-green">
                    <ShieldCheck size={20} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-bold text-ink">
                      {L('Cobro confirmado', 'Payment confirmed')} <span className="mono">{fmtTime(cashConfirmedAt)}</span>
                    </div>
                    <div className="text-[13px] text-ink2">
                      {L('Comisión a rendir', 'Commission owed')} <span className="mono font-bold text-st-amber">{uyu(COMMISSION_AMOUNT)}</span>{' '}
                      <span className="mono">({Math.round(COMMISSION * 100)}%)</span>
                    </div>
                  </div>
                </div>
                <ul className="mt-3 space-y-2 border-t border-line pt-3">
                  {[
                    { who: L('Martín Gómez (conductor)', 'Martín Gómez (driver)'), what: L('Confirmó cobro en efectivo {a}', 'Confirmed cash collected {a}', { a: uyu(TRIP_TOTAL) }) },
                    { who: L('Sistema', 'System'), what: L('Registró comisión a rendir {a}', 'Recorded commission owed {a}', { a: uyu(COMMISSION_AMOUNT) }) },
                    { who: L('Sistema', 'System'), what: L('Sumó el movimiento a Comisiones del panel Admin', 'Added the entry to Admin › Commissions') },
                  ].map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[12.5px]">
                      <span className="mono mt-px w-10 shrink-0 font-bold text-ink">{fmtTime(cashConfirmedAt)}</span>
                      <span className="min-w-0">
                        <span className="font-semibold text-ink">{r.who}</span>
                        <span className="text-ink2"> · {r.what}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}

          {/* Rate customer */}
          {cashConfirmedAt && !rated && (
            <motion.div initial={{ opacity: 0, translate: '0px 12px' }} animate={{ opacity: 1, translate: '0px 0px' }} transition={{ delay: 0.1 }}>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={CUSTOMER} size={40} />
                  <div className="text-[15px] font-bold text-ink">{L('Calificá a Lucía', 'Rate Lucía')}</div>
                </div>
                <div className="mt-3 flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setStars(n)}
                      className={cn('grid h-12 w-12 place-items-center rounded-xl text-[30px] transition-colors hover:bg-subtle', n <= stars ? 'text-amber-400' : 'text-ink2/30')}
                      aria-label={`${n}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {DRIVER_CHIPS.map((c) => {
                    const on = chips.includes(c)
                    return (
                      <button
                        key={c}
                        onClick={() => setChips((cs) => (on ? cs.filter((x) => x !== c) : [...cs, c]))}
                        className={cn(
                          'h-10 rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
                          on ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-card text-ink2 hover:text-ink',
                        )}
                      >
                        {on && <Check size={13} className="mr-1 inline" />}
                        {P(CHIP_LABEL[c])}
                      </button>
                    )
                  })}
                </div>
                <Button size="xl" className="mt-4 h-14 w-full" onClick={sendRating}>
                  {L('Enviar calificación', 'Send rating')}
                </Button>
              </Card>
            </motion.div>
          )}

          {rated && (
            <motion.div initial={{ opacity: 0, translate: '0px 12px' }} animate={{ opacity: 1, translate: '0px 0px' }}>
              <Card className="p-5 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--green-soft)] text-st-green">
                  <CheckCircle2 size={28} />
                </span>
                <div className="mt-3 text-[17px] font-extrabold text-ink">{L('¡Viaje terminado!', 'Trip completed!')}</div>
                <p className="mt-1 text-[13px] text-ink2">
                  {L('Sumaste', 'You added')} <span className="mono font-bold text-st-green">{uyu(TRIP_TOTAL - COMMISSION_AMOUNT)}</span> {L('netos a tu semana.', 'net to your week.')}
                </p>
                <Button size="xl" variant="success" className="mt-4 h-14 w-full" onClick={() => navigate('/conductor/inicio')}>
                  <Home size={18} /> {L('Volver al inicio', 'Back to home')}
                </Button>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Trip details + stepper */}
        <div className="space-y-4 lg:col-start-1 lg:row-start-2">
          <Enter delay={0.1}>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={CUSTOMER} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-ink">{CUSTOMER}</div>
                  <div className="text-[12.5px] text-ink2">★4,8 · {L('12 viajes en Fletes ya', '12 trips on Fletes ya')}</div>
                </div>
                <Button variant="secondary" size="icon" className="h-11 w-11 rounded-full" onClick={() => toast(L('Llamando a Lucía (número enmascarado)…', 'Calling Lucía (masked number)…'))}>
                  <Phone size={17} />
                </Button>
                <Button variant="secondary" size="icon" className="h-11 w-11 rounded-full" onClick={() => toast(L('Abriendo chat con Lucía…', 'Opening chat with Lucía…'))}>
                  <MessageCircle size={17} />
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3">
                <div>
                  <div className="kpi-label">{L('Total', 'Total')}</div>
                  <div className="mono mt-0.5 text-[15px] font-bold text-ink">{uyu(TRIP_TOTAL)}</div>
                </div>
                <div>
                  <div className="kpi-label">{L('Pago', 'Payment')}</div>
                  <MethodBadge method="efectivo" className="mt-1" />
                </div>
                <div>
                  <div className="kpi-label">{L('Estimado', 'Estimate')}</div>
                  <div className="mono mt-0.5 text-[15px] font-bold text-ink">{TRIP_HOURS} h</div>
                </div>
              </div>
            </Card>
          </Enter>

          <Enter delay={0.14}>
            <Card className="p-4">
              <SectionTitle>{L('Progreso del viaje', 'Trip progress')}</SectionTitle>
              <ol className="relative">
                {steps.map((s, i) => {
                  const done = i < step || (i === 4 && step >= 4)
                  const current = i === step && step < 4
                  const last = i === steps.length - 1
                  return (
                    <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                      {!last && <span className={cn('absolute left-[13px] top-7 h-[calc(100%-24px)] w-0.5', i < step ? 'bg-st-green' : 'bg-line')} />}
                      <span
                        className={cn(
                          'relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-[12px] font-bold transition-colors',
                          done && 'border-st-green bg-st-green text-white',
                          current && 'border-accent bg-accent-soft text-accent',
                          !done && !current && 'border-line bg-card text-ink2',
                        )}
                      >
                        {done ? <Check size={14} strokeWidth={3} /> : <span className="mono">{i + 1}</span>}
                        {current && <span className="absolute inset-0 animate-ping rounded-full border-2 border-accent/40" />}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <div className={cn('text-[14px] font-bold', done || current ? 'text-ink' : 'text-ink2')}>{s.label}</div>
                        <div className="truncate text-[12px] text-ink2">{s.sub}</div>
                      </div>
                      {current && (
                        <Pill tone="accent" className="ml-auto self-start">
                          {L('Ahora', 'Now')}
                        </Pill>
                      )}
                    </li>
                  )
                })}
              </ol>
            </Card>
          </Enter>
        </div>
      </div>
    </div>
  )
}
