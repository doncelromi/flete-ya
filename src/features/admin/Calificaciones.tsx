import { useCallback, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowRight, Ban, MessageCircle, Phone, RotateCcw, Star, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { DRIVERS, driverById } from '@/data/drivers'
import { COMMENTS_BAD, TRIPS } from '@/data/trips'
import { USERS, userById } from '@/data/users'
import { CATEGORY_LABEL, CHIP_LABEL } from '@/data/labels'
import { at, fmtRelative } from '@/data/dates'
import { Avatar, Button, Card, Kpi, Modal, Pill, SectionTitle, Segmented, Stars } from '@/components/ui'
import { PageHeader, PreviewBanner } from '@/components/shared'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { AXIS_TICK, C_ACCENT, C_AMBER, C_GREY, TOOLTIP_ITEM, TOOLTIP_LABEL, TOOLTIP_STYLE, firstName } from './b/common'

interface Review {
  key: string
  fecha: string
  driverId: string
  userId: string
  stars: number
  comentario?: [string, string]
  chips: string[]
}

/** Recent complaints about Carlos Medina (the "at risk" case of the demo). */
const CARLOS_COMPLAINTS: Review[] = COMMENTS_BAD.map((c, i) => ({
  key: `carlos-${i}`,
  fecha: at([-1, -4, -9][i], [15, 11, 17][i], [20, 5, 40][i]),
  driverId: 'd-carlos',
  userId: USERS[[7, 13, 21][i]].id,
  stars: [2, 3, 2][i],
  comentario: c,
  chips: [],
}))

const RISK_NOTE: Record<string, [string, string]> = {
  'd-carlos': ['3 quejas por demora', '3 late-arrival complaints'],
}

type Feed = 'all' | 'pos' | 'neg'

export default function Calificaciones() {
  const { L, P, lang } = useT()
  const [feed, setFeed] = useState<Feed>('all')
  const [shown, setShown] = useState(10)
  const [suspendId, setSuspendId] = useState<string | null>(null)
  const [duration, setDuration] = useState<'48h' | '7d'>('48h')
  const [suspended, setSuspended] = useState<Record<string, string>>({})
  const f1 = (n: number) => (lang === 'es' ? n.toFixed(1).replace('.', ',') : n.toFixed(1))

  const reviews = useMemo<Review[]>(() => {
    const fromTrips: Review[] = TRIPS.filter((t) => t.estado === 'completado' && t.calificacionConductor).map((t) => ({
      key: String(t.id),
      fecha: t.fecha,
      driverId: t.conductorId,
      userId: t.usuarioId,
      stars: t.calificacionConductor!,
      comentario: t.comentario,
      chips: t.chips ?? [],
    }))
    return [...fromTrips, ...CARLOS_COMPLAINTS].sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [])

  const stats = useMemo(() => {
    const active = DRIVERS.filter((d) => d.verificacion === 'aprobado' && d.rating > 0)
    const w = active.reduce((a, d) => a + d.viajes, 0)
    const avgDrivers = reviews.reduce((a, r) => a + r.stars, 0) / Math.max(1, reviews.length)
    const userRatings = TRIPS.filter((t) => t.calificacionUsuario).map((t) => t.calificacionUsuario!)
    const avgUsers = userRatings.reduce((a, b) => a + b, 0) / userRatings.length
    const completed = TRIPS.filter((t) => t.estado === 'completado').length
    const rateOfReview = reviews.length / Math.max(1, completed)
    const totalReviews = Math.round(w * Math.min(1, rateOfReview))
    const five = reviews.filter((r) => r.stars === 5).length / reviews.length
    const dist = [5, 4, 3, 2, 1].map((s) => ({ s: `${s}★`, stars: s, n: reviews.filter((r) => r.stars === s).length }))
    return { avgDrivers, avgUsers, totalReviews, five, dist, activeCount: active.length }
  }, [reviews])

  const ranking = useMemo(
    () =>
      DRIVERS.filter((d) => d.verificacion === 'aprobado' && d.viajes >= 50)
        .sort((a, b) => b.rating - a.rating || b.viajes - a.viajes)
        .slice(0, 5),
    [],
  )
  const atRisk = useMemo(() => DRIVERS.filter((d) => d.verificacion === 'aprobado' && d.rating > 0 && d.rating < 4.2), [])
  const watch = useMemo(
    () =>
      DRIVERS.filter((d) => d.verificacion === 'aprobado' && d.rating >= 4.2 && d.rating < 4.3)
        .sort((a, b) => b.viajes - a.viajes)
        .slice(0, 3),
    [],
  )

  const feedRows = reviews.filter((r) => r.comentario && (feed === 'all' || (feed === 'pos' ? r.stars >= 4 : r.stars <= 3)))
  const closeSuspend = useCallback(() => setSuspendId(null), [])
  const suspendDriver = suspendId ? driverById(suspendId) : null

  const contact = (id: string) => {
    const d = driverById(id)
    toast(L('Llamando a {n}…', 'Calling {n}…', { n: d.nombre }), {
      description: `${d.telefono} · ${L('también podés escribirle por WhatsApp desde su ficha.', 'you can also message them on WhatsApp from their profile.')}`,
      icon: <Phone size={15} />,
    })
  }

  const confirmSuspend = () => {
    if (!suspendDriver) return
    const label = duration === '48h' ? L('48 h', '48 h') : L('7 días', '7 days')
    setSuspended((s) => ({ ...s, [suspendDriver.id]: label }))
    toast.success(L('{n} suspendido por {d}', '{n} suspended for {d}', { n: suspendDriver.nombre, d: label }), {
      description: L('No recibe viajes hasta que vuelva a habilitarse. Se le notificó el motivo.', 'Receives no trips until re-enabled. The reason was notified.'),
    })
    setSuspendId(null)
  }

  return (
    <div>
      <PreviewBanner
        id="admin-calificaciones"
        bullets={[
          L('Después de cada viaje el cliente califica al conductor y el conductor al cliente, con comentario y etiquetas.', 'After every trip the customer rates the driver and the driver rates the customer, with comments and tags.'),
          L('Ranking de los mejores conductores y alerta automática de los que bajan de 4,2 estrellas.', 'Ranking of top drivers and automatic alerts for those falling below 4.2 stars.'),
          L('Podés contactar o suspender temporalmente a un conductor desde acá, con registro de la decisión.', 'You can contact or temporarily suspend a driver from here, with the decision logged.'),
        ]}
      />
      <PageHeader
        title={L('Calificaciones', 'Ratings')}
        subtitle={L('La reputación es lo que hace que un cliente vuelva a pedir.', 'Reputation is what makes a customer book again.')}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={L('Promedio conductores', 'Driver average')} value={`★ ${f1(stats.avgDrivers)}`} tone="accent" hint={L('{n} reseñas recientes · {c} activos', '{n} recent reviews · {c} active', { n: reviews.length, c: stats.activeCount })} />
        <Kpi label={L('Promedio usuarios', 'Customer average')} value={`★ ${f1(stats.avgUsers)}`} hint={L('calificados por conductores', 'rated by drivers')} />
        <Kpi label={L('Reseñas totales', 'Total reviews')} value={stats.totalReviews.toLocaleString('es-UY')} hint={L('histórico de la plataforma', 'platform history')} />
        <Kpi label={L('Viajes con 5 ★', '5 ★ trips')} value={`${Math.round(stats.five * 100)}%`} tone="green" hint={L('de las reseñas', 'of reviews')} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
        {/* at risk */}
        <Card className="border-st-amber/35 p-4 lg:col-span-2">
          <SectionTitle right={<Pill tone="amber">{L('Menos de ★ 4,2', 'Below ★ 4.2')}</Pill>}>
            <span className="inline-flex items-center gap-2">
              <AlertTriangle size={16} className="text-st-amber" /> {L('Conductores en riesgo', 'Drivers at risk')}
            </span>
          </SectionTitle>
          {atRisk.map((d) => {
            const complaints = reviews.filter((r) => r.driverId === d.id && r.stars <= 3)
            const susp = suspended[d.id]
            return (
              <div key={d.id} className={cn('rounded-card border p-3.5', susp ? 'border-line bg-subtle' : 'border-st-red/25 bg-[var(--red-soft)]/50')}>
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar name={d.nombre} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[14.5px] font-bold text-ink">
                      {d.nombre}
                      <span className="mono text-st-red">★ {f1(d.rating)}</span>
                      <span className="text-ink2">·</span>
                      <span className="text-st-amber">{RISK_NOTE[d.id] ? P(RISK_NOTE[d.id]) : L('{n} quejas', '{n} complaints', { n: complaints.length })}</span>
                      {susp && <Pill tone="red">{L('Suspendido {d}', 'Suspended {d}', { d: susp })}</Pill>}
                    </div>
                    <div className="text-[12px] text-ink2">
                      {d.vehiculo.modelo} · {P(CATEGORY_LABEL[d.vehiculo.categoria])} · <span className="mono">{d.viajes}</span> {L('viajes', 'trips')} · {d.barrio}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => contact(d.id)}>
                      <MessageCircle size={14} /> {L('Contactar', 'Contact')}
                    </Button>
                    {susp ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSuspended((s) => {
                            const n = { ...s }
                            delete n[d.id]
                            return n
                          })
                          toast(L('{n} volvió a estar habilitado', '{n} is enabled again', { n: d.nombre }))
                        }}
                      >
                        <RotateCcw size={14} /> {L('Rehabilitar', 'Re-enable')}
                      </Button>
                    ) : (
                      <Button variant="danger" size="sm" onClick={() => setSuspendId(d.id)}>
                        <Ban size={14} /> {L('Suspender temporalmente', 'Suspend temporarily')}
                      </Button>
                    )}
                  </div>
                </div>
                <ul className="mt-3 grid gap-2 md:grid-cols-3">
                  {complaints.slice(0, 3).map((r) => (
                    <li key={r.key} className="rounded-[10px] border border-line bg-card p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <Stars value={r.stars} size={12} />
                        <span className="mono text-[10.5px] text-ink2">{fmtRelative(r.fecha, lang)}</span>
                      </div>
                      <p className="mt-1 text-[12px] leading-snug text-ink">“{r.comentario ? P(r.comentario) : ''}”</p>
                      <div className="mt-1 text-[10.5px] text-ink2">— {userById(r.userId).nombre}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          {watch.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.08em] text-ink2">{L('En observación (★ 4,2 – 4,3)', 'Watch list (★ 4.2 – 4.3)')}</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {watch.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => toast(L('{n} queda en observación', '{n} stays on the watch list', { n: d.nombre }), { description: L('Te avisamos si baja de 4,2.', 'We’ll alert you if it drops below 4.2.') })}
                    className="flex items-center gap-2 rounded-[10px] border border-line px-2.5 py-2 text-left hover:bg-subtle"
                  >
                    <Avatar name={d.nombre} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-semibold text-ink">{d.nombre}</div>
                      <div className="mono text-[11px] text-st-amber">★ {f1(d.rating)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* ranking */}
        <Card className="p-4">
          <SectionTitle right={<span className="text-[11px] text-ink2">{L('mín. 50 viajes', 'min. 50 trips')}</span>}>
            <span className="inline-flex items-center gap-2">
              <Trophy size={16} className="text-accent" /> {L('Top 5 conductores', 'Top 5 drivers')}
            </span>
          </SectionTitle>
          <ol className="space-y-1">
            {ranking.map((d, i) => (
              <li key={d.id}>
                <button
                  onClick={() => toast(L('{n}: ★ {r} en {v} viajes', '{n}: ★ {r} over {v} trips', { n: d.nombre, r: f1(d.rating), v: d.viajes }), { description: L('Candidato a bonificación del mes.', 'Candidate for this month’s bonus.') })}
                  className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left hover:bg-subtle"
                >
                  <span className={cn('mono grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold', i === 0 ? 'bg-accent text-white' : 'bg-subtle text-ink2')}>{i + 1}</span>
                  <Avatar name={d.nombre} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">{d.nombre}</div>
                    <div className="text-[11.5px] text-ink2">
                      {d.vehiculo.modelo} · <span className="mono">{d.viajes}</span> {L('viajes', 'trips')}
                    </div>
                  </div>
                  <span className="mono inline-flex items-center gap-1 text-[13px] font-bold text-ink">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    {f1(d.rating)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Card>

        {/* distribution */}
        <Card className="p-4">
          <SectionTitle right={<span className="mono text-[11px] text-ink2">{reviews.length} {L('reseñas', 'reviews')}</span>}>{L('Distribución de estrellas', 'Star distribution')}</SectionTitle>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dist} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="s" tick={AXIS_TICK} axisLine={false} tickLine={false} width={34} />
                <Tooltip
                  cursor={{ fill: 'var(--bg-subtle)' }}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL}
                  itemStyle={TOOLTIP_ITEM}
                  formatter={(v) => [String(v), L('reseñas', 'reviews')]}
                />
                <Bar dataKey="n" radius={[0, 6, 6, 0]} barSize={18}>
                  {stats.dist.map((d) => (
                    <Cell key={d.s} fill={d.stars >= 4 ? C_ACCENT : d.stars === 3 ? C_GREY : C_AMBER} />
                  ))}
                  <LabelList dataKey="n" position="right" style={{ fontSize: 11, fill: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* latest reviews */}
        <Card className="p-4 lg:col-span-2">
          <SectionTitle
            right={
              <Segmented
                value={feed}
                onChange={(v) => {
                  setFeed(v)
                  setShown(10)
                }}
                items={[
                  { id: 'all', label: L('Todas', 'All') },
                  { id: 'pos', label: L('Positivas', 'Positive') },
                  { id: 'neg', label: L('Negativas', 'Negative') },
                ]}
              />
            }
          >
            {L('Últimas reseñas', 'Latest reviews')}
          </SectionTitle>
          <ul className="divide-y divide-line">
            {feedRows.slice(0, shown).map((r) => {
              const d = driverById(r.driverId)
              const u = userById(r.userId)
              return (
                <li key={r.key} className="flex gap-3 py-3">
                  <Avatar name={u.nombre} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink2">
                      <span className="font-semibold text-ink">{u.nombre}</span>
                      <ArrowRight size={12} />
                      <span className="font-semibold text-ink">{d.nombre}</span>
                      <span className="mono ml-auto">{fmtRelative(r.fecha, lang)}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <Stars value={r.stars} size={13} />
                      {r.stars <= 3 && <Pill tone="amber">{L('Revisar', 'Review')}</Pill>}
                    </div>
                    {r.comentario && <p className="mt-1 text-[13px] leading-snug text-ink">“{P(r.comentario)}”</p>}
                    {r.chips.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {r.chips.map((c) => (
                          <Pill key={c} tone="neutral">
                            {CHIP_LABEL[c] ? P(CHIP_LABEL[c]) : c}
                          </Pill>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          {feedRows.length === 0 && <div className="py-6 text-center text-[13px] text-ink2">{L('No hay resultados para este filtro.', 'No results for this filter.')}</div>}
          {feedRows.length > shown && (
            <div className="mt-2 text-center">
              <Button variant="ghost" size="sm" onClick={() => setShown((s) => s + 10)}>
                {L('Ver más reseñas ({n})', 'Show more reviews ({n})', { n: feedRows.length - shown })}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Modal open={!!suspendDriver} onClose={closeSuspend}>
        {suspendDriver && (
          <div className="p-5">
            <div className="flex items-center gap-2 text-[16px] font-extrabold text-ink">
              <Ban size={18} className="text-st-red" />
              {L('¿Suspender a {n}?', 'Suspend {n}?', { n: suspendDriver.nombre })}
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-ink2">
              {L(
                'No va a recibir viajes nuevos durante la suspensión. Los viajes en curso terminan normalmente y {n} recibe una notificación con el motivo.',
                'They won’t receive new trips during the suspension. Trips in progress finish normally and {n} gets a notification with the reason.',
                { n: firstName(suspendDriver.nombre) },
              )}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[12.5px] font-semibold text-ink">{L('Duración', 'Duration')}</span>
              <Segmented
                value={duration}
                onChange={setDuration}
                items={[
                  { id: '48h', label: '48 h' },
                  { id: '7d', label: L('7 días', '7 days') },
                ]}
              />
            </div>
            <div className="mt-3 rounded-[10px] border border-line bg-subtle p-2.5 text-[12px] text-ink2">
              {L('Motivo', 'Reason')}: <b className="text-ink">{RISK_NOTE[suspendDriver.id] ? P(RISK_NOTE[suspendDriver.id]) : L('Calificación baja', 'Low rating')}</b> · ★ {f1(suspendDriver.rating)}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={closeSuspend}>
                {L('Cancelar', 'Cancel')}
              </Button>
              <Button variant="danger" onClick={confirmSuspend}>
                {L('Suspender', 'Suspend')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
