import { Marker, Polyline } from 'react-leaflet'
import { ArrowRight, Check, Star, X } from 'lucide-react'
import { Drawer, Avatar, Stars } from '@/components/ui'
import { MapView, icons, ACCENT } from '@/components/map/MapView'
import { MethodBadge, StatusPill } from '@/components/shared'
import { driverById } from '@/data/drivers'
import { userById } from '@/data/users'
import { HELPER_PER_HOUR, tariffOf } from '@/data/places'
import { CATEGORY_LABEL, STATUS_LABEL } from '@/data/labels'
import { fmtDate, fmtRelative, fmtTime } from '@/data/dates'
import type { Trip, TripStatus } from '@/data/types'
import { useT } from '@/i18n'
import { uyu, cn } from '@/lib/utils'
import { fmtHours } from './kit'

const ICON_O = icons.origin()
const ICON_D = icons.dest()

const STEPS: { st: TripStatus | 'solicitado' | 'entregado'; min: number }[] = [
  { st: 'solicitado', min: -24 },
  { st: 'asignado', min: -21 },
  { st: 'en_camino', min: -20 },
  { st: 'en_origen', min: 0 },
  { st: 'cargando', min: 4 },
  { st: 'en_viaje', min: 22 },
  { st: 'entregado', min: 0 }, // computed from horas
]
const REACHED: Partial<Record<TripStatus, number>> = { buscando: 0, asignado: 1, en_camino: 2, en_origen: 3, cargando: 4, en_viaje: 5, completado: 6 }

function plus(iso: string, min: number) {
  return new Date(new Date(iso).getTime() + min * 60000).toISOString()
}

export function TripDrawer({ trip, onClose }: { trip: Trip | null; onClose: () => void }) {
  return (
    <Drawer open={!!trip} onClose={onClose}>
      {trip && <TripDetail trip={trip} />}
    </Drawer>
  )
}

function TripDetail({ trip }: { trip: Trip }) {
  const { L, P, lang } = useT()
  const u = userById(trip.usuarioId)
  const d = driverById(trip.conductorId)
  const tariff = tariffOf(trip.categoria)
  const cancelled = trip.estado === 'cancelado'
  const reached = REACHED[trip.estado] ?? 0
  const stepLabel = (s: (typeof STEPS)[number]['st']) =>
    s === 'solicitado' ? L('Solicitado', 'Requested') : s === 'entregado' ? L('Entregado', 'Delivered') : P(STATUS_LABEL[s])

  const base = trip.horas * tariff.porHora
  const helper = trip.ayudante ? trip.horas * HELPER_PER_HOUR : 0
  const gross = base + helper

  return (
    <div className="pb-8">
      {/* header */}
      <div className="border-b border-line px-5 pb-4 pt-5">
        <div className="kpi-label">{L('Viaje', 'Trip')}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 pr-8">
          <h2 className="mono text-[22px] font-bold text-ink">#{trip.id}</h2>
          <StatusPill status={trip.estado} />
          <MethodBadge method={trip.metodo} className="ml-1" />
        </div>
        <div className="mt-1 text-[12.5px] text-ink2">
          {fmtRelative(trip.fecha, lang)} · {P(CATEGORY_LABEL[trip.categoria])} · <span className="mono">{trip.km.toLocaleString(lang === 'en' ? 'en-US' : 'es-UY')} km</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-subtle p-2">
            <Avatar name={u.nombre} size={28} />
            <div className="min-w-0">
              <div className="kpi-label !text-[9.5px]">{L('Usuario', 'Customer')}</div>
              <div className="truncate text-[12.5px] font-semibold text-ink">{u.nombre}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-subtle p-2">
            <Avatar name={d.nombre} size={28} />
            <div className="min-w-0">
              <div className="kpi-label !text-[9.5px]">{L('Conductor', 'Driver')}</div>
              <div className="truncate text-[12.5px] font-semibold text-ink">{d.nombre}</div>
            </div>
          </div>
        </div>
      </div>

      {/* map */}
      <div className="px-5 pt-4">
        <MapView center={trip.ruta[0]} zoom={13} fit={trip.ruta} fitKey={trip.id} fitPadding={28} className="h-52">
          <Polyline positions={trip.ruta} pathOptions={{ color: ACCENT, weight: 4, opacity: 0.85 }} />
          <Marker position={[trip.origen.lat, trip.origen.lng]} icon={ICON_O} />
          <Marker position={[trip.destino.lat, trip.destino.lng]} icon={ICON_D} />
        </MapView>
        <div className="mt-2 flex items-start gap-2 text-[12.5px] text-ink">
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{trip.origen.label}</div>
            <div className="text-ink2">{trip.origen.barrio}</div>
          </div>
          <ArrowRight size={14} className="mt-0.5 shrink-0 text-ink2" />
          <div className="min-w-0 flex-1 text-right">
            <div className="font-semibold">{trip.destino.label}</div>
            <div className="text-ink2">{trip.destino.barrio}</div>
          </div>
        </div>
      </div>

      {/* timeline */}
      <section className="px-5 pt-5">
        <h3 className="kpi-label mb-2">{L('Línea de tiempo', 'Timeline')}</h3>
        <ol className="relative ml-2 border-l border-line">
          {trip.estado === 'programado' ? (
            <>
              <TL done time={fmtTime(plus(trip.fecha, -60 * 24 * 3))} label={L('Solicitado', 'Requested')} />
              <TL current time={fmtDate(trip.fecha)} label={L('Programado para {d} {h}', 'Scheduled for {d} {h}', { d: fmtDate(trip.fecha), h: fmtTime(trip.fecha) })} />
            </>
          ) : cancelled ? (
            <>
              <TL done time={fmtTime(plus(trip.fecha, -24))} label={L('Solicitado', 'Requested')} />
              <TL done time={fmtTime(plus(trip.fecha, -21))} label={P(STATUS_LABEL.asignado)} />
              <TL
                cancelled
                time={fmtTime(plus(trip.fecha, -12))}
                label={trip.canceladoPor === 'conductor' ? L('Cancelado por el conductor', 'Cancelled by the driver') : L('Cancelado por el usuario', 'Cancelled by the customer')}
              />
            </>
          ) : (
            STEPS.map((s, i) => {
              const done = i <= reached
              const current = i === reached && trip.estado !== 'completado'
              const time = s.st === 'entregado' ? plus(trip.fecha, Math.round(trip.horas * 60)) : plus(trip.fecha, s.min)
              return <TL key={s.st} done={done && !current} current={current} time={done ? fmtTime(time) : '—'} label={stepLabel(s.st)} />
            })
          )}
        </ol>
      </section>

      {/* breakdown */}
      <section className="px-5 pt-5">
        <h3 className="kpi-label mb-2">{L('Desglose', 'Breakdown')}</h3>
        <div className="rounded-xl border border-line text-[13px]">
          <Row label={L('{h} × tarifa {c}', '{h} × {c} rate', { h: fmtHours(trip.horas, lang), c: P(CATEGORY_LABEL[trip.categoria]).toLowerCase() })} sub={`${uyu(tariff.porHora)}/h`} value={uyu(cancelled ? 0 : base)} />
          <Row label={L('Ayudante', 'Helper')} sub={trip.ayudante ? `${uyu(HELPER_PER_HOUR)}/h` : L('No', 'No')} value={uyu(cancelled ? 0 : helper)} />
          <Row label={L('Total', 'Total')} value={uyu(trip.total)} strong />
          <Row label={L('Comisión Fletes ya (15%)', 'Fletes ya commission (15%)')} value={uyu(trip.comision)} tone="text-st-green" />
          <Row label={L('Al conductor', 'To the driver')} value={uyu(trip.total - trip.comision)} last />
        </div>
        {cancelled && <p className="mt-2 text-[12px] text-ink2">{L('Viaje cancelado antes de iniciar: no se cobró (estimado {g}).', 'Trip cancelled before start: nothing was charged (estimate {g}).', { g: uyu(gross) })}</p>}
      </section>

      {/* ratings */}
      <section className="px-5 pt-5">
        <h3 className="kpi-label mb-2">{L('Calificaciones cruzadas', 'Cross ratings')}</h3>
        <div className="grid gap-2">
          <div className="rounded-xl border border-line p-3">
            <div className="flex items-center justify-between gap-2 text-[12.5px]">
              <span className="font-semibold text-ink">{L('Usuario → conductor', 'Customer → driver')}</span>
              {trip.calificacionConductor ? (
                <span className="flex items-center gap-1.5">
                  <Stars value={trip.calificacionConductor} size={13} />
                  <span className="mono font-bold text-ink">{trip.calificacionConductor}</span>
                </span>
              ) : (
                <span className="text-ink2">{L('Sin calificar', 'Not rated')}</span>
              )}
            </div>
            {trip.comentario && <p className="mt-1.5 text-[12.5px] italic leading-snug text-ink2">“{P(trip.comentario)}”</p>}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-line p-3 text-[12.5px]">
            <span className="font-semibold text-ink">{L('Conductor → usuario', 'Driver → customer')}</span>
            {trip.calificacionUsuario ? (
              <span className="flex items-center gap-1 font-bold text-ink">
                <Star size={13} className="fill-amber-500 text-amber-500" />
                <span className="mono">{trip.calificacionUsuario}</span>
              </span>
            ) : (
              <span className="text-ink2">{L('Sin calificar', 'Not rated')}</span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function TL({ time, label, done, current, cancelled }: { time: string; label: string; done?: boolean; current?: boolean; cancelled?: boolean }) {
  return (
    <li className="relative pb-3 pl-5 last:pb-0">
      <span
        className={cn(
          'absolute -left-[7px] top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-card',
          cancelled ? 'bg-st-red' : done ? 'bg-st-green' : current ? 'bg-accent ring-4 ring-accent/20' : 'bg-line',
        )}
      >
        {done && <Check size={8} className="text-white" strokeWidth={4} />}
        {cancelled && <X size={8} className="text-white" strokeWidth={4} />}
      </span>
      <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
        <span className={cn('font-semibold', cancelled ? 'text-st-red' : current ? 'text-accent' : done ? 'text-ink' : 'text-ink2')}>{label}</span>
        <span className="mono text-[11.5px] text-ink2">{time}</span>
      </div>
    </li>
  )
}

function Row({ label, sub, value, strong, tone, last }: { label: string; sub?: string; value: string; strong?: boolean; tone?: string; last?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-3 py-2', !last && 'border-b border-line', strong && 'bg-subtle')}>
      <div className="min-w-0">
        <div className={cn('text-ink', strong && 'font-bold')}>{label}</div>
        {sub && <div className="mono text-[11px] text-ink2">{sub}</div>}
      </div>
      <div className={cn('mono whitespace-nowrap', strong ? 'font-bold text-ink' : 'text-ink', tone)}>{value}</div>
    </div>
  )
}
