import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, BarChart3, FileDown, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { TRIPS } from '@/data/trips'
import { driverById } from '@/data/drivers'
import { CATEGORY_LABEL, METHOD_LABEL } from '@/data/labels'
import { at, dayDiff, fmtDM, fmtDow, fmtTime } from '@/data/dates'
import type { PaymentMethod, Trip, VehicleCategory } from '@/data/types'
import { Button, Card, InfoDot, Kpi, Pill, SectionTitle, Segmented } from '@/components/ui'
import { PageHeader, PreviewBanner } from '@/components/shared'
import { useT } from '@/i18n'
import { uyu, cn } from '@/lib/utils'
import { AXIS_TICK, C_ACCENT, C_GREEN, TOOLTIP_ITEM, TOOLTIP_LABEL, TOOLTIP_STYLE, compact } from './b/common'
import { printReport } from './b/printReport'

type Mode = 'diario' | 'semanal' | 'mensual'

/** The demo dataset holds the full "today" but only a sample of past days.
 *  Past days are extrapolated with a fixed multiplier so the series reads like real operation. */
const PAST_SCALE = 6
const PREV_WEEK_RATIO = 0.93
const MONTH_WEEK_FACTORS = [0.86, 0.94] // weeks -3 and -2 relative to week -1

interface W {
  t: Trip
  w: number
}
interface Bucket {
  key: string
  label: string
  viajes: number
  facturacion: number
  comision: number
}

const CATS: VehicleCategory[] = ['chico', 'mediano', 'grande']
const counted = (t: Trip) => t.estado !== 'cancelado' && t.estado !== 'programado'

function agg(items: W[]) {
  let viajes = 0
  let facturacion = 0
  let comision = 0
  const cat: Record<VehicleCategory, number> = { chico: 0, mediano: 0, grande: 0 }
  const met: Record<PaymentMethod, number> = { tarjeta: 0, efectivo: 0 }
  for (const { t, w } of items) {
    viajes += w
    cat[t.categoria] += w
    met[t.metodo] += w
    if (t.estado === 'completado') {
      facturacion += t.total * w
      comision += t.comision * w
    }
  }
  return { viajes: Math.round(viajes), facturacion: Math.round(facturacion), comision: Math.round(comision), cat, met }
}

export default function Reportes() {
  const { L, P, lang } = useT()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('semanal')

  const data = useMemo(() => {
    const live = TRIPS.filter(counted)
    const inRange = (t: Trip, from: number, to: number) => dayDiff(t.fecha) >= from && dayDiff(t.fecha) <= to
    // previous week: scaled so it lands at ~93% of the current week (steady growth, no artificial jumps)
    const curWeek = live.filter((t) => inRange(t, -6, 0)).reduce((a, t) => a + (dayDiff(t.fecha) === 0 ? 1 : PAST_SCALE), 0)
    const rawPrev = live.filter((t) => inRange(t, -13, -7)).length || 1
    const OLD_SCALE = (curWeek * PREV_WEEK_RATIO) / rawPrev
    const weightOf = (t: Trip) => {
      const d = dayDiff(t.fecha)
      return d === 0 ? 1 : d >= -6 ? PAST_SCALE : OLD_SCALE
    }
    const range = (from: number, to: number): W[] => live.filter((t) => inRange(t, from, to)).map((t) => ({ t, w: weightOf(t) }))

    let buckets: Bucket[] = []
    let items: W[] = []
    let prev = { viajes: 0, facturacion: 0, comision: 0 }
    let periodLabel = ''

    if (mode === 'diario') {
      items = range(0, 0)
      const hours = Array.from({ length: 14 }, (_, i) => 7 + i)
      buckets = hours.map((h) => {
        const a = agg(items.filter((x) => new Date(x.t.fecha).getHours() === h))
        return { key: String(h), label: `${String(h).padStart(2, '0')}h`, viajes: a.viajes, facturacion: a.facturacion, comision: a.comision }
      })
      prev = agg(range(-1, -1))
      periodLabel = L('Hoy, {d}', 'Today, {d}', { d: `${fmtDow(at(0), lang)} ${fmtDM(at(0))}` })
    } else if (mode === 'semanal') {
      items = range(-6, 0)
      buckets = Array.from({ length: 7 }, (_, i) => i - 6).map((d) => {
        const a = agg(items.filter((x) => dayDiff(x.t.fecha) === d))
        return { key: String(d), label: `${fmtDow(at(d), lang)} ${fmtDM(at(d))}`, viajes: a.viajes, facturacion: a.facturacion, comision: a.comision }
      })
      prev = agg(range(-13, -7))
      periodLabel = L('Semana del {a} al {b}', 'Week of {a} to {b}', { a: fmtDM(at(-6)), b: fmtDM(at(0)) })
    } else {
      const w0 = agg(range(-6, 0))
      const w1 = agg(range(-13, -7))
      const synth = (f: number) => ({ viajes: Math.round(w1.viajes * f), facturacion: Math.round(w1.facturacion * f), comision: Math.round(w1.comision * f) })
      const weeks = [synth(MONTH_WEEK_FACTORS[0]), synth(MONTH_WEEK_FACTORS[1]), w1, w0]
      buckets = weeks.map((w, i) => {
        const end = -7 * (3 - i)
        return { key: String(i), label: `${fmtDM(at(end - 6))}–${fmtDM(at(end))}`, viajes: w.viajes, facturacion: w.facturacion, comision: w.comision }
      })
      items = range(-13, 0)
      prev = { viajes: Math.round(buckets.reduce((a, b) => a + b.viajes, 0) * 0.91), facturacion: Math.round(buckets.reduce((a, b) => a + b.facturacion, 0) * 0.91), comision: Math.round(buckets.reduce((a, b) => a + b.comision, 0) * 0.91) }
      periodLabel = L('Últimas 4 semanas · {a} al {b}', 'Last 4 weeks · {a} to {b}', { a: fmtDM(at(-27)), b: fmtDM(at(0)) })
    }

    const mix = agg(items)
    const totals = buckets.reduce((a, b) => ({ viajes: a.viajes + b.viajes, facturacion: a.facturacion + b.facturacion, comision: a.comision + b.comision }), { viajes: 0, facturacion: 0, comision: 0 })
    const mixTotal = mix.viajes || 1
    const catMix = CATS.map((c) => ({ cat: c, pct: Math.round((mix.cat[c] / mixTotal) * 100), n: Math.round((mix.cat[c] / mixTotal) * totals.viajes) }))
    const metMix = (['tarjeta', 'efectivo'] as PaymentMethod[]).map((m) => ({ m, pct: Math.round((mix.met[m] / mixTotal) * 100), n: Math.round((mix.met[m] / mixTotal) * totals.viajes) }))

    // top drivers by billed amount in the window (real trips, unscaled)
    const byDriver = new Map<string, { viajes: number; total: number }>()
    for (const { t } of items)
      if (t.estado === 'completado') {
        const r = byDriver.get(t.conductorId) ?? { viajes: 0, total: 0 }
        r.viajes++
        r.total += t.total
        byDriver.set(t.conductorId, r)
      }
    const top = [...byDriver.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 5)

    return { buckets, totals, prev, catMix, metMix, periodLabel, top }
  }, [mode, lang, L])

  const { totals, prev } = data
  const ticket = totals.viajes ? totals.facturacion / totals.viajes : 0
  const prevTicket = prev.viajes ? prev.facturacion / prev.viajes : 0
  const delta = (a: number, b: number) => {
    if (!b) return undefined
    const d = ((a - b) / b) * 100
    return { v: `${d >= 0 ? '+' : ''}${d.toFixed(0)}%`, up: d >= 0 }
  }
  const vsLabel = mode === 'diario' ? L('vs. ayer', 'vs. yesterday') : mode === 'semanal' ? L('vs. semana anterior', 'vs. previous week') : L('vs. mes anterior', 'vs. previous month')

  const tooltipMoney = (v: number | string, name: string) => [uyu(Number(v)), name]

  const downloadPdf = () => {
    const ok = printReport({
      lang,
      title: L('Reporte de operación', 'Operations report'),
      subtitle: `${L(mode === 'diario' ? 'Diario' : mode === 'semanal' ? 'Semanal' : 'Mensual', mode === 'diario' ? 'Daily' : mode === 'semanal' ? 'Weekly' : 'Monthly')} · ${data.periodLabel}`,
      generated: `${L('Generado', 'Generated')} ${fmtDM(new Date().toISOString())} ${fmtTime(new Date().toISOString())}`,
      kpis: [
        { label: L('Viajes', 'Trips'), value: totals.viajes.toLocaleString('es-UY') },
        { label: L('Facturación', 'Revenue'), value: uyu(totals.facturacion) },
        { label: L('Comisión', 'Commission'), value: uyu(totals.comision) },
        { label: L('Ticket promedio', 'Average ticket'), value: uyu(ticket) },
      ],
      sections: [
        {
          title: L('Detalle del período', 'Period breakdown'),
          head: [L('Período', 'Period'), L('Viajes', 'Trips'), L('Facturación', 'Revenue'), L('Comisión', 'Commission')],
          rows: data.buckets.map((b) => [b.label, b.viajes, uyu(b.facturacion), uyu(b.comision)]),
          alignRight: [1, 2, 3],
        },
        {
          title: L('Mix de vehículos', 'Vehicle mix'),
          head: [L('Categoría', 'Category'), L('Viajes', 'Trips'), '%'],
          rows: data.catMix.map((c) => [P(CATEGORY_LABEL[c.cat]), c.n, `${c.pct}%`]),
          alignRight: [1, 2],
        },
        {
          title: L('Métodos de pago', 'Payment methods'),
          head: [L('Método', 'Method'), L('Viajes', 'Trips'), '%'],
          rows: data.metMix.map((m) => [P(METHOD_LABEL[m.m]), m.n, `${m.pct}%`]),
          alignRight: [1, 2],
        },
        {
          title: L('Conductores con más facturación', 'Top drivers by revenue'),
          head: [L('Conductor', 'Driver'), L('Viajes', 'Trips'), L('Facturación', 'Revenue')],
          rows: data.top.map(([id, r]) => [driverById(id).nombre, r.viajes, uyu(r.total)]),
          alignRight: [1, 2],
        },
      ],
      footer: L('Fletes ya · Reporte generado desde el panel de operación. Datos de demostración.', 'Fletes ya · Report generated from the operations panel. Demo data.'),
    })
    if (ok) toast.success(L('Reporte listo · elegí “Guardar como PDF” en la ventana de impresión', 'Report ready · choose “Save as PDF” in the print dialog'))
    else toast.error(L('El navegador bloqueó la ventana emergente. Permití pop-ups para descargar el PDF.', 'The browser blocked the pop-up. Allow pop-ups to download the PDF.'))
  }

  return (
    <div>
      <PreviewBanner
        id="admin-reportes"
        bullets={[
          L('Viajes, facturación y comisión por día, semana o mes, calculados de los viajes reales.', 'Trips, revenue and commission by day, week or month, computed from real trips.'),
          L('Mix de vehículos y de métodos de pago para decidir a qué conductores sumar.', 'Vehicle and payment-method mix to decide which drivers to add.'),
          L('Descarga en PDF lista para compartir con socios o el contador.', 'PDF download ready to share with partners or the accountant.'),
        ]}
      />
      <PageHeader
        title={L('Reportes', 'Reports')}
        subtitle={
          <span className="inline-flex items-center gap-1">
            <span className="mono font-semibold text-ink">{data.periodLabel}</span>
            <InfoDot
              text={L(
                'La demo tiene el día de hoy completo y una muestra de los días anteriores; esos días se extrapolan con un multiplicador fijo para mostrar una operación real.',
                'The demo holds today in full plus a sample of previous days; those days are extrapolated with a fixed multiplier to show real operation.',
              )}
            />
          </span>
        }
        actions={
          <>
            <Segmented
              size="md"
              value={mode}
              onChange={setMode}
              items={[
                { id: 'diario', label: L('Diario', 'Daily') },
                { id: 'semanal', label: L('Semanal', 'Weekly') },
                { id: 'mensual', label: L('Mensual', 'Monthly') },
              ]}
            />
            <Button onClick={downloadPdf}>
              <FileDown size={16} /> {L('Descargar PDF', 'Download PDF')}
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={L('Viajes', 'Trips')} value={totals.viajes.toLocaleString('es-UY')} delta={delta(totals.viajes, prev.viajes)} hint={vsLabel} />
        <Kpi label={L('Facturación', 'Revenue')} value={uyu(totals.facturacion)} delta={delta(totals.facturacion, prev.facturacion)} hint={vsLabel} />
        <Kpi label={L('Comisión', 'Commission')} value={uyu(totals.comision)} tone="accent" delta={delta(totals.comision, prev.comision)} hint={vsLabel} />
        <Kpi label={L('Ticket promedio', 'Average ticket')} value={uyu(ticket)} delta={delta(ticket, prevTicket)} hint={vsLabel} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle>{mode === 'diario' ? L('Viajes por hora', 'Trips by hour') : mode === 'semanal' ? L('Viajes por día', 'Trips by day') : L('Viajes por semana', 'Trips by week')}</SectionTitle>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.buckets} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={mode === 'diario' ? 1 : 0} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'var(--bg-subtle)' }} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} formatter={(v) => [String(v), L('viajes', 'trips')]} />
                <Bar dataKey="viajes" fill={C_ACCENT} radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle>{L('Facturación vs. comisión', 'Revenue vs. commission')}</SectionTitle>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.buckets} margin={{ top: 6, right: 4, left: -6, bottom: 0 }}>
                <defs>
                  <linearGradient id="rep-fact" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_ACCENT} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={C_ACCENT} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rep-com" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_GREEN} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={C_GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={mode === 'diario' ? 1 : 0} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => compact(v)} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} formatter={(v, name) => tooltipMoney(v as number, String(name))} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-2)' }} />
                <Area type="monotone" dataKey="facturacion" name={L('Facturación', 'Revenue')} stroke={C_ACCENT} strokeWidth={2} fill="url(#rep-fact)" />
                <Area type="monotone" dataKey="comision" name={L('Comisión', 'Commission')} stroke={C_GREEN} strokeWidth={2} fill="url(#rep-com)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle>{L('Mix de vehículos', 'Vehicle mix')}</SectionTitle>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.catMix.map((c) => ({ ...c, name: P(CATEGORY_LABEL[c.cat]) }))} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} width={104} />
                <Tooltip
                  cursor={{ fill: 'var(--bg-subtle)' }}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL}
                  itemStyle={TOOLTIP_ITEM}
                  formatter={(v, _n, item) => [`${v}% · ${(item?.payload as { n: number } | undefined)?.n ?? 0} ${L('viajes', 'trips')}`, L('Participación', 'Share')]}
                />
                <Bar dataKey="pct" fill={C_ACCENT} radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle>{L('Métodos de pago', 'Payment methods')}</SectionTitle>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-[200px] w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.metMix} dataKey="pct" nameKey="m" innerRadius="62%" outerRadius="88%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
                    {data.metMix.map((m) => (
                      <Cell key={m.m} fill={m.m === 'tarjeta' ? C_ACCENT : C_GREEN} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM} formatter={(v, n) => [`${v}%`, P(METHOD_LABEL[n as PaymentMethod])]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="mono text-[22px] font-bold text-ink">{data.metMix[0].pct}%</div>
                  <div className="text-[11px] text-ink2">{L('con tarjeta', 'by card')}</div>
                </div>
              </div>
            </div>
            <div className="w-full space-y-2 sm:w-1/2">
              {data.metMix.map((m) => (
                <div key={m.m} className="flex items-center justify-between rounded-[10px] border border-line px-3 py-2">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.m === 'tarjeta' ? C_ACCENT : C_GREEN }} />
                    {P(METHOD_LABEL[m.m])}
                  </span>
                  <span className="mono text-[13px] text-ink">
                    {m.pct}% <span className="text-ink2">· {m.n}</span>
                  </span>
                </div>
              ))}
              <p className="text-[11.5px] leading-snug text-ink2">
                {L('Los viajes en efectivo generan comisión a cobrar al conductor; los de tarjeta, saldo a pagarle.', 'Cash trips create commission to collect from the driver; card trips create a balance to pay them.')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <button
        onClick={() => navigate('/admin/fase2/analytics')}
        className={cn('mt-4 flex w-full items-center gap-4 rounded-card border border-dashed border-line bg-subtle p-4 text-left transition-colors hover:border-accent/40')}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-card text-ink2 shadow-card">
          <Lock size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[14px] font-bold text-ink">
            <BarChart3 size={15} className="text-accent" />
            {L('Reportes avanzados', 'Advanced reports')}
            <Pill tone="neutral">
              <Lock size={10} /> {L('Fase 2', 'Phase 2')}
            </Pill>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink2">
            {L('Mapas de calor por zona, retención de clientes, horas pico y rentabilidad por conductor.', 'Zone heatmaps, customer retention, peak hours and profitability per driver.')}
          </p>
        </div>
        <ArrowRight size={18} className="shrink-0 text-ink2" />
      </button>
    </div>
  )
}
