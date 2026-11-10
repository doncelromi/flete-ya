import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Marker, Polyline } from 'react-leaflet'
import { toast } from 'sonner'
import { ArrowRight, CalendarClock, ChevronRight, Download, MapPin, Truck, UserPlus } from 'lucide-react'
import { Avatar, Button, Card, Drawer, InfoDot, Pill, Segmented, Select, Stars } from '@/components/ui'
import { DevNotice, MethodBadge, PageHeader, PreviewBanner, StatusPill } from '@/components/shared'
import { VehicleArt } from '@/components/brand'
import { ACCENT, MapView, icons } from '@/components/map/MapView'
import { CATEGORY_LABEL, CHIP_LABEL } from '@/data/labels'
import { HELPER_PER_HOUR, tariffOf } from '@/data/places'
import { LUCIA_TRIPS, SCHEDULED_TRIP } from '@/data/trips'
import { driverById, MARTIN } from '@/data/drivers'
import { fmtDate, fmtMonth, fmtRelative, fmtTime, fmtDow } from '@/data/dates'
import type { Trip } from '@/data/types'
import { useTrip } from '@/store/trip'
import { useT } from '@/i18n'
import { uyu } from '@/lib/utils'
import { hoursText, placeText, printReceipt, type ReceiptData } from './lib'

const IC = { origin: icons.origin(), dest: icons.dest() }
type StatusFilter = 'todos' | 'completado' | 'cancelado'

const monthKey = (iso: string) => iso.slice(0, 7)

function toReceipt(t: Trip): ReceiptData {
  return {
    id: t.id,
    fecha: t.fecha,
    origen: t.origen,
    destino: t.destino,
    categoria: t.categoria,
    horas: t.horas,
    ayudante: t.ayudante,
    metodo: t.metodo,
    conductor: driverById(t.conductorId).nombre,
    total: t.total,
    km: t.km,
  }
}

export default function MisViajes() {
  const { L, P, t, lang } = useT()
  const navigate = useNavigate()
  const phase = useTrip((s) => s.phase)
  const status = useTrip((s) => s.status)
  const req = useTrip((s) => s.req)
  const liveTotal = useTrip((s) => s.total)

  const [sf, setSf] = useState<StatusFilter>('todos')
  const [month, setMonth] = useState('all')
  const [open, setOpen] = useState<Trip | null>(null)
  const close = useCallback(() => setOpen(null), [])

  const months = useMemo(() => {
    const seen = new Map<string, string>()
    LUCIA_TRIPS.forEach((tr) => {
      const k = monthKey(tr.fecha)
      if (!seen.has(k)) seen.set(k, tr.fecha)
    })
    return [...seen.entries()].map(([k, iso]) => ({ k, iso }))
  }, [])

  const rows = useMemo(
    () =>
      LUCIA_TRIPS.filter((tr) => (sf === 'todos' ? true : tr.estado === sf)).filter((tr) => (month === 'all' ? true : monthKey(tr.fecha) === month)),
    [sf, month],
  )

  const live = phase === 'asignado' && status !== 'completado'
  const spent = LUCIA_TRIPS.filter((x) => x.estado === 'completado').reduce((a, x) => a + x.total, 0)
  const sched = SCHEDULED_TRIP
  const schedDriver = driverById(sched.conductorId)

  return (
    <div>
      <PreviewBanner
        id="MisViajes"
        bullets={[
          L('Historial completo sincronizado entre app y web', 'Full history synced between app and web'),
          L('Recibos PDF enviados automáticamente por email', 'PDF receipts sent automatically by email'),
          L('Repetir un viaje o reprogramar en un toque', 'Repeat or reschedule a trip in one tap'),
        ]}
      />
      <PageHeader
        title={L('Mis viajes', 'My trips')}
        subtitle={L('Tus fletes activos, programados y el historial completo.', 'Your active and scheduled vans, plus full history.')}
        actions={
          <Button onClick={() => navigate('/pedir')}>
            <Truck size={16} /> {L('Pedir flete', 'Book a van')}
          </Button>
        }
      />

      {/* active & pending */}
      <h2 className="mb-3 text-[15px] font-bold tracking-tight text-ink">{L('Viajes activos y pendientes', 'Active and pending trips')}</h2>
      <div className="mb-7 grid gap-3 md:grid-cols-2 [&>*]:min-w-0">
        {live && (
          <motion.button
            initial={{ opacity: 0, translate: '0px 8px' }}
            animate={{ opacity: 1, translate: '0px 0px' }}
            onClick={() => navigate('/viaje')}
            className="group flex items-center gap-3 rounded-card border-2 border-accent/40 bg-accent-soft/60 p-4 text-left shadow-card"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-white">
              <Truck size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Pill tone="accent">
                  <span className="pulse-dot" /> {L('En curso', 'In progress')}
                </Pill>
                <StatusPill status={status} />
              </div>
              <div className="mt-1 truncate text-[14px] font-bold text-ink">
                {req.origen?.label ?? '—'} → {req.destino?.label ?? '—'}
              </div>
              <div className="text-[12.5px] text-ink2">
                {MARTIN.nombre} · <span className="mono font-bold text-ink">{uyu(liveTotal())}</span>
              </div>
            </div>
            <ChevronRight size={18} className="shrink-0 text-accent transition-[translate] group-hover:translate-x-0.5" />
          </motion.button>
        )}
        <motion.div initial={{ opacity: 0, translate: '0px 8px' }} animate={{ opacity: 1, translate: '0px 0px' }} transition={{ delay: 0.05 }}>
          <Card className="flex h-full items-center gap-3 p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-subtle text-center leading-none">
              <div>
                <div className="text-[10px] font-bold uppercase text-accent">{fmtDow(sched.fecha, lang)}</div>
                <div className="mono text-[17px] font-bold text-ink">{new Date(sched.fecha).getDate()}</div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusPill status="programado" />
                <span className="text-[12px] text-ink2">
                  <CalendarClock size={12} className="mr-0.5 inline" /> <span className="mono font-bold text-ink">{fmtTime(sched.fecha)}</span>
                </span>
              </div>
              <div className="mt-1 truncate text-[14px] font-bold text-ink">
                {sched.origen.label} → {sched.destino.label}
              </div>
              <div className="truncate text-[12.5px] text-ink2">
                {P(CATEGORY_LABEL[sched.categoria])} · {tariffOf(sched.categoria).modelos[0]} · {schedDriver.nombre} · <span className="mono font-bold text-ink">{uyu(sched.total)}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => setOpen(sched)}>
                {L('Ver', 'View')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toast(L('Reprogramación simulada · te avisamos 24 h antes', 'Simulated reschedule · we’ll remind you 24 h before'))}
              >
                {L('Cambiar', 'Change')}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* history */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-ink">{L('Historial', 'History')}</h2>
          <div className="text-[12.5px] text-ink2">
            {L('{n} viajes · gastaste', '{n} trips · you spent', { n: LUCIA_TRIPS.length })} <span className="mono font-bold text-ink">{uyu(spent)}</span>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Segmented
            value={sf}
            onChange={setSf}
            size="md"
            items={[
              { id: 'todos', label: t('common.all') },
              { id: 'completado', label: L('Completados', 'Completed') },
              { id: 'cancelado', label: L('Cancelados', 'Cancelled') },
            ]}
          />
          <Select value={month} onChange={(e) => setMonth(e.target.value)} className="h-10 w-auto min-w-[130px] flex-1 rounded-full sm:flex-none">
            <option value="all">{L('Todos los meses', 'All months')}</option>
            {months.map((m) => (
              <option key={m.k} value={m.k}>
                {fmtMonth(m.iso, lang)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {rows.length === 0 && <Card className="p-8 text-center text-[13px] text-ink2">{t('common.empty')}</Card>}

      {/* desktop table */}
      {rows.length > 0 && (
        <Card className="hidden overflow-hidden md:block">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-subtle">
              <tr className="[&>th]:px-4 [&>th]:py-2.5">
                <th className="kpi-label">{L('Fecha', 'Date')}</th>
                <th className="kpi-label">{L('Recorrido', 'Route')}</th>
                <th className="kpi-label">{L('Vehículo', 'Vehicle')}</th>
                <th className="kpi-label">{L('Conductor', 'Driver')}</th>
                <th className="kpi-label text-right">{L('Horas', 'Hours')}</th>
                <th className="kpi-label text-right">{L('Total', 'Total')}</th>
                <th className="kpi-label">{L('Pago', 'Payment')}</th>
                <th className="kpi-label">{L('Estado', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tr) => (
                <tr key={tr.id} onClick={() => setOpen(tr)} className="cursor-pointer border-b border-line last:border-0 hover:bg-subtle/70 [&>td]:px-4 [&>td]:py-3">
                  <td className="whitespace-nowrap">
                    <div className="font-semibold text-ink">{fmtRelative(tr.fecha, lang)}</div>
                    <div className="mono text-[11px] text-ink2">#{tr.id}</div>
                  </td>
                  <td className="max-w-[260px]">
                    <div className="truncate text-ink">{tr.origen.label}</div>
                    <div className="truncate text-ink2">→ {tr.destino.label}</div>
                  </td>
                  <td className="whitespace-nowrap text-ink">{P(CATEGORY_LABEL[tr.categoria])}</td>
                  <td className="whitespace-nowrap text-ink">{driverById(tr.conductorId).nombre}</td>
                  <td className="mono text-right font-bold text-ink">{hoursText(tr.horas)} h</td>
                  <td className="mono whitespace-nowrap text-right font-bold text-ink">{tr.estado === 'cancelado' ? '—' : uyu(tr.total)}</td>
                  <td>
                    <MethodBadge method={tr.metodo} />
                  </td>
                  <td>
                    <StatusPill status={tr.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* mobile cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.map((tr, i) => (
          <motion.button
            key={tr.id}
            initial={{ opacity: 0, translate: '0px 6px' }}
            animate={{ opacity: 1, translate: '0px 0px' }}
            transition={{ delay: Math.min(i, 8) * 0.03 }}
            onClick={() => setOpen(tr)}
            className="w-full rounded-card border border-line bg-card p-3.5 text-left shadow-card active:bg-subtle"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-semibold text-ink2">{fmtRelative(tr.fecha, lang)}</span>
              <StatusPill status={tr.estado} />
            </div>
            <div className="mt-2 flex items-start gap-2.5">
              <div className="mt-1 flex flex-col items-center">
                <span className="h-2 w-2 rounded-full bg-ink" />
                <span className="my-0.5 h-3.5 w-px bg-line" />
                <MapPin size={11} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1 text-[13.5px] leading-[1.45]">
                <div className="truncate font-semibold text-ink">{tr.origen.label}</div>
                <div className="truncate font-semibold text-ink">{tr.destino.label}</div>
              </div>
              <div className="text-right">
                <div className="mono text-[14.5px] font-bold text-ink">{tr.estado === 'cancelado' ? '—' : uyu(tr.total)}</div>
                <div className="mono text-[11.5px] text-ink2">{hoursText(tr.horas)} h</div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[12px] text-ink2">
              <span className="truncate">
                {P(CATEGORY_LABEL[tr.categoria])} · {driverById(tr.conductorId).nombre}
              </span>
              <MethodBadge method={tr.metodo} />
            </div>
          </motion.button>
        ))}
      </div>

      <DevNotice
        className="mt-6"
        title={L('Comprobantes por email', 'Email receipts')}
        now={L('recibo imprimible', 'printable receipt')}
        later={L('PDF enviado automáticamente por email', 'PDF sent automatically by email')}
      />

      <Drawer open={!!open} onClose={close}>
        {open && <TripDetail trip={open} />}
      </Drawer>
    </div>
  )
}

function TripDetail({ trip }: { trip: Trip }) {
  const { L, P, lang } = useT()
  const driver = driverById(trip.conductorId)
  const rate = tariffOf(trip.categoria).porHora
  const cancelled = trip.estado === 'cancelado'
  const scheduled = trip.estado === 'programado'
  const download = () => {
    const ok = printReceipt(toReceipt(trip), lang)
    if (ok) toast.success(L('Recibo #{id} listo para imprimir o guardar como PDF', 'Receipt #{id} ready to print or save as PDF', { id: trip.id }))
    else toast.error(L('Habilitá las ventanas emergentes para descargar el recibo', 'Allow pop-ups to download the receipt'))
  }
  return (
    <div className="p-5 sm:p-6">
      <div className="pr-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono text-[13px] font-bold text-ink2">#{trip.id}</span>
          <StatusPill status={trip.estado} />
        </div>
        <h3 className="mt-1.5 text-[19px] font-extrabold tracking-tight text-ink">{fmtRelative(trip.fecha, lang)}</h3>
        <div className="text-[12.5px] text-ink2">
          {fmtDate(trip.fecha)} · <span className="mono">{trip.km.toLocaleString(lang === 'en' ? 'en-US' : 'es-UY')} km</span>
        </div>
      </div>

      <MapView
        center={[trip.origen.lat, trip.origen.lng]}
        fit={trip.ruta}
        fitKey={trip.id}
        fitPadding={28}
        interactive={false}
        className="mt-4 h-48"
      >
        <Polyline positions={trip.ruta} pathOptions={{ color: ACCENT, weight: 4, opacity: cancelled ? 0.35 : 0.9, dashArray: cancelled ? '4 8' : undefined }} />
        <Marker position={[trip.origen.lat, trip.origen.lng]} icon={IC.origin} interactive={false} />
        <Marker position={[trip.destino.lat, trip.destino.lng]} icon={IC.dest} interactive={false} />
      </MapView>

      <div className="mt-4 space-y-1.5 text-[13.5px]">
        <div className="flex items-start gap-2 text-ink">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink" /> {placeText(trip.origen)}
        </div>
        <div className="flex items-start gap-2 text-ink">
          <MapPin size={14} className="mt-0.5 shrink-0 text-accent" /> {placeText(trip.destino)}
        </div>
      </div>

      {/* driver + vehicle */}
      <div className="mt-4 flex items-center gap-3 rounded-card border border-line p-3">
        <Avatar name={driver.nombre} size={42} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold text-ink">{driver.nombre}</div>
          <div className="text-[12px] text-ink2">
            {P(CATEGORY_LABEL[trip.categoria])} · {driver.vehiculo.modelo} · <span className="mono font-bold text-ink">{driver.vehiculo.patente}</span>
          </div>
        </div>
        <VehicleArt cat={trip.categoria} className="h-8 w-auto text-ink" />
      </div>

      {/* breakdown */}
      <div className="mt-4 rounded-card border border-line">
        <div className="kpi-label border-b border-line px-3.5 py-2.5">{L('Detalle del cobro', 'Charge breakdown')}</div>
        <div className="space-y-2 px-3.5 py-3 text-[13px]">
          {cancelled ? (
            <div className="text-ink2">
              {L('Cancelado por vos antes de que el conductor llegue. Sin cargo.', 'Cancelled by you before the driver arrived. No charge.')}
            </div>
          ) : (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-ink2">
                  {L('Vehículo', 'Vehicle')} · <span className="mono">{hoursText(trip.horas)} h × {uyu(rate, false)}</span>
                </span>
                <span className="mono font-bold text-ink">{uyu(rate * trip.horas)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="flex items-center gap-1 text-ink2">
                  <UserPlus size={13} /> {L('Ayudante', 'Helper')}
                  {trip.ayudante && <span className="mono"> · {hoursText(trip.horas)} h × {uyu(HELPER_PER_HOUR, false)}</span>}
                </span>
                <span className="mono font-bold text-ink">{trip.ayudante ? uyu(HELPER_PER_HOUR * trip.horas) : L('No', 'No')}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-dashed border-line pt-2">
                <span className="font-semibold text-ink">{scheduled ? L('Total estimado', 'Estimated total') : L('Total', 'Total')}</span>
                <span className="mono text-[17px] font-bold text-ink">{uyu(trip.total)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink2">{L('Medio de pago', 'Payment method')}</span>
                <MethodBadge method={trip.metodo} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* rating given */}
      {trip.calificacionConductor && (
        <div className="mt-4 rounded-card border border-line p-3.5">
          <div className="kpi-label">{L('Tu calificación', 'Your rating')}</div>
          <div className="mt-1.5 flex items-center gap-2">
            <Stars value={trip.calificacionConductor} size={18} />
            <span className="mono text-[13px] font-bold text-ink">{trip.calificacionConductor}/5</span>
          </div>
          {trip.comentario && <p className="mt-2 text-[13px] italic text-ink">“{P(trip.comentario)}”</p>}
          {!!trip.chips?.length && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {trip.chips.map((c) => (
                <Pill key={c}>{P(CHIP_LABEL[c] ?? [c, c])}</Pill>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-2">
        {!cancelled && !scheduled && (
          <Button size="lg" onClick={download}>
            <Download size={16} /> {L('Descargar recibo PDF', 'Download PDF receipt')}
          </Button>
        )}
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => toast(L('Copiamos origen, destino y vehículo en un nuevo pedido', 'We copied pickup, drop-off and vehicle into a new request'))}
          >
            {L('Repetir este viaje', 'Repeat this trip')} <ArrowRight size={15} />
          </Button>
          <InfoDot text={L('Repetir un viaje con un toque llega en la versión final.', 'One-tap repeat trips arrive in the final version.')} />
        </div>
      </div>
    </div>
  )
}
