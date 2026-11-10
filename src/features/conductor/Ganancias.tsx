import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, Equal, Minus, Wallet } from 'lucide-react'
import { Card, InfoDot, Kpi, Pill, SectionTitle } from '@/components/ui'
import { DevNotice, MethodBadge, PageHeader, PreviewBanner, Phase2Card } from '@/components/shared'
import { driverWeek } from '@/data/trips'
import { COMMISSION } from '@/data/places'
import { at, dayDiff, fmtDM, fmtDow } from '@/data/dates'
import { useT } from '@/i18n'
import { uyu, cn } from '@/lib/utils'
import { Enter } from './parts'

const C_CARD = '#1F5BFF'
const C_CASH = '#059669'

export default function Ganancias() {
  const { L, lang } = useT()
  const w = useMemo(() => driverWeek('d-martin'), [])

  const bruto = w.efectivo + w.tarjeta
  const comision = w.comisionEfectivo + (w.tarjeta - w.parteTarjeta)
  const neto = bruto - comision
  const pct = `${Math.round(COMMISSION * 100)}%`

  const days = useMemo(
    () =>
      [-6, -5, -4, -3, -2, -1, 0].map((d) => {
        const iso = at(d)
        const ts = w.trips.filter((t) => dayDiff(t.fecha) === d)
        return {
          day: d === 0 ? (lang === 'en' ? 'Today' : 'Hoy') : fmtDow(iso, lang),
          efectivo: ts.filter((t) => t.metodo === 'efectivo').reduce((a, t) => a + t.total, 0),
          tarjeta: ts.filter((t) => t.metodo === 'tarjeta').reduce((a, t) => a + t.total, 0),
        }
      }),
    [w, lang],
  )

  const trips = useMemo(() => [...w.trips].sort((a, b) => b.fecha.localeCompare(a.fecha)), [w])
  const cashLabel = L('Efectivo', 'Cash')
  const cardLabel = L('Tarjeta', 'Card')

  return (
    <div>
      <PreviewBanner
        id="conductor-ganancias"
        bullets={[
          L('Ves cuánto generaste en la semana, separado por efectivo y tarjeta.', 'See what you earned this week, split by cash and card.'),
          L('El sistema compensa solo: la comisión del efectivo se descuenta de lo que cobraste con tarjeta.', 'Netting is automatic: cash commission is deducted from your card earnings.'),
          L('Los mismos números que ve el Admin en Comisiones, sin planillas.', 'The same numbers Admin sees in Commissions, no spreadsheets.'),
        ]}
      />
      <PageHeader
        title={L('Ganancias', 'Earnings')}
        subtitle={L('Últimos 7 días · {n} viajes', 'Last 7 days · {n} trips', { n: w.viajes })}
        actions={<Pill tone="green">{L('Comisión plataforma {p}', 'Platform fee {p}', { p: pct })}</Pill>}
      />

      {/* Weekly summary */}
      <Enter>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Kpi label={L('Bruto semanal', 'Weekly gross')} value={uyu(bruto)} hint={L('efectivo + tarjeta', 'cash + card')} className="[&_.mono]:text-[21px] sm:[&_.mono]:text-[26px]" />
          <Kpi
            label={L('Comisión {p}', 'Fee {p}', { p: pct })}
            value={`− ${uyu(comision)}`}
            tone="amber"
            hint={L('plataforma', 'platform')}
            className="[&_.mono]:text-[21px] sm:[&_.mono]:text-[26px]"
          />
          <Kpi
            label={L('Neto', 'Net')}
            value={uyu(neto)}
            tone="green"
            hint={L('lo que te queda', 'what you keep')}
            className="col-span-2 lg:col-span-1 [&_.mono]:text-[26px]"
          />
        </div>
      </Enter>

      {/* Split by method */}
      <Enter delay={0.06} className="mt-5">
        <SectionTitle right={<InfoDot text={L('Compensación semanal: lo que te debe la plataforma por tarjeta menos la comisión del efectivo que cobraste vos.', 'Weekly netting: what the platform owes you for card trips minus the commission on cash you collected.')} />}>
          {L('Cómo se compensa tu semana', 'How your week nets out')}
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.15fr]">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-[13px] font-bold text-st-green">
              <Banknote size={16} /> {L('Cobrado en efectivo', 'Collected in cash')}
            </div>
            <div className="mono mt-2 text-[24px] font-bold leading-none text-ink">{uyu(w.efectivo)}</div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--amber-soft)] px-3 py-2 text-[12.5px] text-ink">
              <ArrowUpRight size={15} className="shrink-0 text-st-amber" />
              <span>
                {L('Debés comisión', 'You owe commission')} <span className="mono font-bold text-st-amber">{uyu(w.comisionEfectivo)}</span>
              </span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-[13px] font-bold text-accent">
              <CreditCard size={16} /> {L('Cobrado con tarjeta', 'Collected by card')}
            </div>
            <div className="mono mt-2 text-[24px] font-bold leading-none text-ink">{uyu(w.tarjeta)}</div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2 text-[12.5px] text-ink">
              <ArrowDownLeft size={15} className="shrink-0 text-accent" />
              <span>
                {L('La plataforma te debe', 'Platform owes you')} <span className="mono font-bold text-accent">{uyu(w.parteTarjeta)}</span>
              </span>
            </div>
          </Card>
          <Card className="border-st-green/30 bg-[var(--green-soft)] p-4">
            <div className="flex items-center gap-2 text-[13px] font-bold text-st-green">
              <Wallet size={16} /> {L('Saldo a tu favor', 'Balance in your favor')}
            </div>
            <div className="mono mt-2 text-[34px] font-bold leading-none tracking-tight text-st-green">{uyu(w.neto)}</div>
            <div className="mono mt-3 flex flex-wrap items-center gap-1.5 text-[12.5px] font-bold text-ink">
              <span className="text-accent">{uyu(w.parteTarjeta, false)}</span>
              <Minus size={12} className="text-ink2" />
              <span className="text-st-amber">{uyu(w.comisionEfectivo, false)}</span>
              <Equal size={12} className="text-ink2" />
              <span className="text-st-green">{uyu(w.neto, false)}</span>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-snug text-ink2">{L('Se liquida al cierre de la semana.', 'Paid out at week close.')}</p>
          </Card>
        </div>
      </Enter>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* Chart */}
        <Enter delay={0.1}>
          <Card className="p-4">
            <SectionTitle
              right={
                <div className="flex items-center gap-3 text-[11.5px] font-semibold text-ink2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: C_CARD }} /> {cardLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: C_CASH }} /> {cashLabel}
                  </span>
                </div>
              }
            >
              {L('Por día', 'By day')}
            </SectionTitle>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={days} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: 'var(--text-2)' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                  tickFormatter={(v: number) => (v === 0 ? '0' : `${Math.round(v / 1000)}k`)}
                />
                <Tooltip
                  cursor={{ fill: 'var(--bg-subtle)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const ef = Number(payload.find((p) => p.dataKey === 'efectivo')?.value ?? 0)
                    const tj = Number(payload.find((p) => p.dataKey === 'tarjeta')?.value ?? 0)
                    return (
                      <div className="rounded-xl border border-line bg-card px-3 py-2 text-[12px] shadow-pop">
                        <div className="mb-1 font-bold capitalize text-ink">{label}</div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-ink2">{cardLabel}</span>
                          <span className="mono font-bold text-accent">{uyu(tj)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-ink2">{cashLabel}</span>
                          <span className="mono font-bold text-st-green">{uyu(ef)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-4 border-t border-line pt-1">
                          <span className="text-ink2">Total</span>
                          <span className="mono font-bold text-ink">{uyu(ef + tj)}</span>
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="efectivo" stackId="a" fill={C_CASH} name={cashLabel} />
                <Bar dataKey="tarjeta" stackId="a" fill={C_CARD} name={cardLabel} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Enter>

        {/* Trip list */}
        <Enter delay={0.14}>
          <Card className="p-0">
            <div className="px-4 pt-4">
              <SectionTitle right={<span className="mono text-[12px] font-bold text-ink2">{trips.length}</span>}>{L('Viajes de la semana', 'This week’s trips')}</SectionTitle>
            </div>
            <ul className="divide-y divide-line">
              {trips.map((t) => {
                const cash = t.metodo === 'efectivo'
                return (
                  <li key={t.id}>
                    <button
                      onClick={() =>
                        toast(
                          cash
                            ? L('#{id}: cobraste {tot} en efectivo, rendís {c}', '#{id}: you collected {tot} cash, you owe {c}', { id: t.id, tot: uyu(t.total), c: uyu(t.comision) })
                            : L('#{id}: pagó con tarjeta, te corresponden {n}', '#{id}: paid by card, you get {n}', { id: t.id, n: uyu(t.total - t.comision) }),
                        )
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle"
                    >
                      <div className="w-14 shrink-0">
                        <div className="mono text-[12.5px] font-bold text-ink">#{t.id}</div>
                        <div className="text-[11.5px] capitalize text-ink2">
                          {fmtDow(t.fecha, lang)} {fmtDM(t.fecha)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mono text-[14px] font-bold text-ink">{uyu(t.total)}</div>
                        <div className="flex flex-wrap items-center gap-x-2 text-[11.5px] text-ink2">
                          <MethodBadge method={t.metodo} className="text-[11.5px]" />
                          <span>
                            · {L('com.', 'fee')} <span className="mono">{uyu(t.comision, false)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={cn('mono text-[13.5px] font-bold', cash ? 'text-st-amber' : 'text-st-green')}>
                          {cash ? `− ${uyu(t.comision, false)}` : `+ ${uyu(t.total - t.comision, false)}`}
                        </div>
                        <div className={cn('text-[10.5px] font-bold uppercase tracking-[.06em]', cash ? 'text-st-amber' : 'text-st-green')}>
                          {cash ? L('a rendir', 'to remit') : L('a tu favor', 'in your favor')}
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </Enter>
      </div>

      <Enter delay={0.18} className="mt-5 space-y-3">
        <Phase2Card
          title={L('Liquidación automática a tu cuenta', 'Automatic payout to your account')}
          body={L(
            'Cada lunes el saldo a tu favor se transfiere solo a tu cuenta bancaria (BROU, Itaú, Santander…), con comprobante y detalle de viajes.',
            'Every Monday your balance is transferred automatically to your bank account, with receipt and trip breakdown.',
          )}
          onClick={() => toast(L('Módulo de Fase 2: se activa en la próxima etapa', 'Phase 2 module: enabled in the next stage'))}
        />
        <DevNotice
          title={L('Módulos Fase 2', 'Phase 2 modules')}
          now={L('el saldo se liquida a mano desde el panel.', 'the balance is settled manually from the panel.')}
          later={L('transferencia automática semanal a tu cuenta bancaria (BROU, Itaú, Santander…).', 'automatic weekly transfer to your bank account (BROU, Itaú, Santander…).')}
        />
      </Enter>
    </div>
  )
}
