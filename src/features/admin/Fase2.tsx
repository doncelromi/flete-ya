import { useMemo, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BarChart3, Check, Clock, Landmark, Lock, MessageCircle, Route, ShieldCheck, Star } from 'lucide-react'
import { DRIVERS, driverById } from '@/data/drivers'
import { weeklyBalances } from '@/data/trips'
import { Avatar, Button, Card, Pill, Progress, Tabs } from '@/components/ui'
import { DevNotice, PageHeader, PreviewBanner } from '@/components/shared'
import { useT } from '@/i18n'
import { uyu, cn, openWhatsApp } from '@/lib/utils'
import { hash } from './b/common'

type ModId = 'liquidaciones' | 'matching' | 'antecedentes' | 'analytics'
type Pair = [string, string]

const MODS: { id: ModId; n: string; icon: typeof Lock; title: Pair; short: Pair; body: Pair; bullets: Pair[] }[] = [
  {
    id: 'liquidaciones',
    n: '09',
    icon: Landmark,
    title: ['Liquidaciones automáticas a conductores', 'Automatic driver payouts'],
    short: ['Liquidaciones', 'Payouts'],
    body: [
      'En la Fase 1 el saldo semanal de cada conductor se calcula solo y se marca como liquidado a mano. Este módulo cierra el circuito: cada semana el sistema le paga a cada conductor lo que se le debe y cobra los saldos deudores, sin planillas ni transferencias manuales.',
      'In Phase 1 each driver’s weekly balance is computed automatically and marked as settled by hand. This module closes the loop: every week the system pays each driver what they are owed and collects outstanding balances, with no spreadsheets or manual transfers.',
    ],
    bullets: [
      ['Transferencia automática semanal a la cuenta bancaria (BROU, Itaú, Santander…) de cada conductor, con comprobante descargable.', 'Automatic weekly transfer to each driver’s bank account, with a downloadable receipt.'],
      ['Cobro de la comisión adeudada por viajes en efectivo: descuento de futuros pagos o link de pago.', 'Collection of commission owed on cash trips: deducted from future payouts or via a payment link.'],
      ['Bloqueo automático del conductor que supera el plazo sin rendir, con aviso previo.', 'Automatic suspension of drivers past the settlement deadline, with prior warning.'],
      ['Conciliación con el procesador de pagos y exportación para el contador.', 'Reconciliation with the payment processor and export for the accountant.'],
    ],
  },
  {
    id: 'matching',
    n: '10',
    icon: Route,
    title: ['Matching avanzado', 'Advanced matching'],
    short: ['Matching', 'Matching'],
    body: [
      'Hoy el pedido se ofrece al conductor disponible más cercano. El matching avanzado le asigna un puntaje a cada candidato y elige al mejor para ese viaje, no solo al que está más cerca.',
      'Today a request is offered to the nearest available driver. Advanced matching scores every candidate and picks the best one for that trip, not just the closest.',
    ],
    bullets: [
      ['Puntaje por cercanía real: tiempo estimado de llegada con tránsito, no distancia en línea recta.', 'Score by real proximity: estimated arrival time with traffic, not straight-line distance.'],
      ['Pondera rating, tasa de aceptación y cancelaciones de cada conductor.', 'Weighs each driver’s rating, acceptance rate and cancellations.'],
      ['Filtra por capacidad del vehículo según la carga y por la zona de trabajo preferida.', 'Filters by vehicle capacity for the load and by preferred work zone.'],
      ['Ofertas en cascada con tiempo límite y reasignación automática si nadie acepta.', 'Cascading offers with a time limit and automatic reassignment if nobody accepts.'],
    ],
  },
  {
    id: 'antecedentes',
    n: '11',
    icon: ShieldCheck,
    title: ['Antecedentes penales automáticos', 'Automatic criminal record checks'],
    short: ['Antecedentes', 'Background'],
    body: [
      'En la Fase 1 el certificado de antecedentes lo sube el conductor y lo revisás a mano. Con este módulo la consulta se hace sola al registrarse y se repite periódicamente, con alerta si algo cambia.',
      'In Phase 1 the driver uploads the criminal record certificate and you review it by hand. With this module the check runs automatically at sign-up and repeats periodically, alerting you if anything changes.',
    ],
    bullets: [
      ['Consulta automática al registro oficial de antecedentes con la cédula del conductor.', 'Automatic query to the official criminal records registry using the driver’s ID.'],
      ['Resultado adjunto al legajo con fecha y código de verificación.', 'Result attached to the driver’s file with date and verification code.'],
      ['Re-verificación periódica (cada 6 meses) y alerta inmediata si cambia el estado.', 'Periodic re-check (every 6 months) and instant alert if the status changes.'],
      ['Aviso anticipado de vencimiento de licencia y seguro al conductor y al admin.', 'Advance notice of license and insurance expiry to both driver and admin.'],
    ],
  },
  {
    id: 'analytics',
    n: '12',
    icon: BarChart3,
    title: ['Análisis y reportes avanzados', 'Advanced analytics & reports'],
    short: ['Análisis', 'Analytics'],
    body: [
      'Los reportes de la Fase 1 muestran viajes, facturación, comisión y mix de pagos. La Fase 2 suma el análisis para decidir dónde crecer: qué zonas piden más, qué clientes vuelven y qué conductores rinden mejor.',
      'Phase 1 reports show trips, revenue, commission and payment mix. Phase 2 adds the analysis to decide where to grow: which zones order most, which customers come back and which drivers perform best.',
    ],
    bullets: [
      ['Mapa de calor de pedidos por zona y franja horaria.', 'Heatmap of requests by zone and time slot.'],
      ['Retención y recompra de clientes por cohorte mensual.', 'Customer retention and repeat purchase by monthly cohort.'],
      ['Rentabilidad y productividad por conductor y por categoría de vehículo.', 'Profitability and productivity by driver and vehicle category.'],
      ['Envío automático del reporte semanal por email y exportación a Excel.', 'Automatic weekly report by email and export to Excel.'],
    ],
  },
]

export default function Fase2() {
  const { L, P } = useT()
  const navigate = useNavigate()
  const { mod } = useParams()
  const m = MODS.find((x) => x.id === mod) ?? MODS[0]
  const Icon = m.icon

  return (
    <div>
      <PreviewBanner id="admin-fase2" bullets={m.bullets.slice(0, 3).map((b) => P(b))} />
      <PageHeader
        title={L('Módulos Fase 2', 'Phase 2 modules')}
        subtitle={L('Lo que viene después de la Fase 1. Se ve el alcance, no es funcional.', 'What comes after Phase 1. Scope is visible, not functional.')}
      />
      <div className="mb-4">
          <Tabs
            value={m.id}
            onChange={(id) => navigate(`/admin/fase2/${id}`)}
            items={MODS.map((x) => ({
              id: x.id,
              label: (
                <>
                  <span className="mono text-ink2">{x.n}</span> {P(x.short)}
                </>
              ),
            }))}
          />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* hero */}
        <Card className="relative overflow-hidden p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent-soft" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-ink text-bg shadow-pop">
                <Lock size={30} strokeWidth={2.2} />
              </span>
              <div className="flex flex-col gap-1.5">
                <Pill tone="dark" className="w-fit">
                  <Lock size={10} /> {L('Fase 2 · USD 5.000 (todo el paquete)', 'Phase 2 · USD 5,000 (full package)')}
                </Pill>
                <span className="inline-flex items-center gap-1.5 text-[12px] text-ink2">
                  <Icon size={13} className="text-accent" /> {L('Módulo', 'Module')} <span className="mono font-semibold text-ink">{m.n}</span>
                </span>
              </div>
            </div>
            <h2 className="mt-5 text-[24px] font-extrabold leading-tight tracking-tight text-ink sm:text-[28px]">{P(m.title)}</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ink2">{P(m.body)}</p>
            <ul className="mt-5 space-y-2.5">
              {m.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {P(b)}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={openWhatsApp}>
                <MessageCircle size={16} /> {L('Consultar por la Fase 2', 'Ask about Phase 2')}
              </Button>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-ink2">
                <Clock size={13} /> {L('6 semanas · los 4 módulos', '6 weeks · all 4 modules')}
              </span>
            </div>
          </div>
        </Card>

        {/* locked preview */}
        <Card className="relative min-h-[360px] overflow-hidden p-4">
          <div className="pointer-events-none select-none blur-[2px]" aria-hidden>
            <Preview id={m.id} />
          </div>
          <div className="absolute inset-0 bg-card/55" />
          <div className="absolute inset-0 grid place-items-center p-6">
            <div className="flex flex-col items-center rounded-card border border-line bg-card px-6 py-5 text-center shadow-pop">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-subtle text-ink">
                <Lock size={22} />
              </span>
              <div className="mt-3 text-[14px] font-bold text-ink">{L('Vista previa bloqueada', 'Locked preview')}</div>
              <div className="mt-1 max-w-[240px] text-[12.5px] text-ink2">{L('Así se vería el módulo. Se habilita al contratar la Fase 2.', 'This is how the module would look. Unlocked with Phase 2.')}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MODS.map((x) => {
          const I = x.icon
          return (
            <button
              key={x.id}
              onClick={() => navigate(`/admin/fase2/${x.id}`)}
              className={cn(
                'flex items-start gap-3 rounded-card border p-3 text-left transition-colors',
                x.id === m.id ? 'border-accent bg-accent-soft' : 'border-dashed border-line bg-subtle hover:border-accent/40',
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card text-ink2 shadow-card">
                <I size={16} />
              </span>
              <div className="min-w-0">
                <div className="mono text-[11px] font-semibold text-ink2">
                  {x.n} · <Lock size={10} className="inline" />
                </div>
                <div className="text-[13px] font-semibold leading-snug text-ink">{P(x.title)}</div>
              </div>
            </button>
          )
        })}
      </div>

      <DevNotice
        className="mt-4"
        title={L('Módulos Fase 2', 'Phase 2 modules')}
        now={L('Módulo bloqueado, solo vista previa.', 'Locked module, preview only.')}
        later={L(
          'Se desarrolla en la Fase 2, 6 semanas, se abona recién cuando la Fase 1 está terminada y aprobada.',
          'Built in Phase 2, 6 weeks, paid only once Phase 1 is finished and approved.',
        )}
      />
    </div>
  )
}

/* ───────── static mock previews (rendered blurred) ───────── */
function Preview({ id }: { id: ModId }) {
  const { L } = useT()
  const balances = useMemo(() => weeklyBalances().slice(0, 6), [])
  const approved = useMemo(() => DRIVERS.filter((d) => d.verificacion === 'aprobado').slice(0, 6), [])

  const Head = ({ children }: { children: ReactNode }) => <div className="mb-3 text-[13px] font-bold text-ink">{children}</div>

  if (id === 'liquidaciones')
    return (
      <div>
        <Head>{L('Transferencias programadas · lunes 06:00', 'Scheduled transfers · Monday 06:00')}</Head>
        <div className="divide-y divide-line rounded-card border border-line">
          {balances.map((b, i) => {
            const d = driverById(b.driverId)
            return (
              <div key={b.driverId} className="flex items-center gap-3 px-3 py-2.5">
                <Avatar name={d.nombre} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-ink">{d.nombre}</div>
                  <div className="mono text-[11px] text-ink2">Cta. •••• {String(hash(d.id) % 9000 + 1000)}</div>
                </div>
                <span className={cn('mono text-[13px] font-bold', b.neto >= 0 ? 'text-st-green' : 'text-st-amber')}>
                  {b.neto >= 0 ? '+' : '−'} {uyu(Math.abs(b.neto))}
                </span>
                <Pill tone={b.neto < 0 ? 'amber' : i % 3 === 0 ? 'green' : 'accent'}>
                  {b.neto < 0 ? L('Débito', 'Debit') : i % 3 === 0 ? L('Enviada', 'Sent') : L('Programada', 'Scheduled')}
                </Pill>
              </div>
            )
          })}
        </div>
      </div>
    )

  if (id === 'matching')
    return (
      <div>
        <Head>{L('Candidatos para el viaje #4839 · Traffic', 'Candidates for trip #4839 · Traffic')}</Head>
        <div className="space-y-2.5">
          {approved.slice(0, 3).map((d, i) => {
            const scores = [
              [L('Cercanía', 'Proximity'), [94, 78, 70][i]],
              ['Rating', [96, 90, 82][i]],
              [L('Capacidad', 'Capacity'), [100, 100, 85][i]],
              [L('Zona', 'Zone'), [80, 72, 60][i]],
            ] as const
            return (
              <div key={d.id} className="rounded-card border border-line p-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={d.nombre} size={28} />
                  <span className="flex-1 text-[13px] font-semibold text-ink">{d.nombre}</span>
                  <span className="mono inline-flex items-center gap-1 text-[12px] text-ink2">
                    <Star size={11} /> {d.rating.toFixed(1)}
                  </span>
                  <span className="mono rounded-full bg-accent px-2 py-0.5 text-[12px] font-bold text-white">{[92, 83, 74][i]}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {scores.map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-[11px] text-ink2">
                      <span className="w-16 shrink-0">{k}</span>
                      <Progress value={v} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )

  if (id === 'antecedentes')
    return (
      <div>
        <Head>{L('Consultas automáticas de antecedentes', 'Automatic background checks')}</Head>
        <div className="divide-y divide-line rounded-card border border-line">
          {approved.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar name={d.nombre} size={28} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-ink">{d.nombre}</div>
                <div className="mono text-[11px] text-ink2">C.I. {d.dni}</div>
              </div>
              <span className="text-[11px] text-ink2">{L('hace {n} h', '{n} h ago', { n: i + 1 })}</span>
              <Pill tone={i === 2 ? 'amber' : 'green'}>{i === 2 ? L('En proceso', 'In progress') : L('Sin antecedentes', 'Clear')}</Pill>
            </div>
          ))}
        </div>
      </div>
    )

  // analytics
  const days = [L('lun', 'Mon'), L('mar', 'Tue'), L('mié', 'Wed'), L('jue', 'Thu'), L('vie', 'Fri'), L('sáb', 'Sat'), L('dom', 'Sun')]
  return (
    <div>
      <Head>{L('Mapa de calor · pedidos por día y hora', 'Heatmap · requests by day and hour')}</Head>
      <div className="grid grid-cols-[32px_repeat(12,minmax(0,1fr))] gap-1">
        {days.map((d, r) => (
          <div key={d} className="contents">
            <span className="text-[10px] leading-5 text-ink2">{d}</span>
            {Array.from({ length: 12 }, (_, c) => {
              const v = ((hash(`${r}-${c}`) % 100) / 100) * (c > 2 && c < 9 ? 1 : 0.45) * (r > 4 ? 1.15 : 1)
              return <span key={c} className="h-5 rounded-[4px] bg-accent" style={{ opacity: 0.1 + Math.min(0.9, v) }} />
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          [L('Recompra 90 días', '90-day repeat'), '38%'],
          [L('Zona top', 'Top zone'), 'Punta Carretas'],
          [L('Hora pico', 'Peak hour'), '10–12 h'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-card border border-line p-2.5">
            <div className="kpi-label">{k}</div>
            <div className="mono mt-1 text-[16px] font-bold text-ink">{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
