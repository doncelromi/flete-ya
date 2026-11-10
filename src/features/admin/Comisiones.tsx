import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BellRing,
  CheckCheck,
  CreditCard,
  Download,
  Equal,
  Minus,
  RotateCcw,
  Save,
  Search,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { driverById } from '@/data/drivers'
import { WEEK_TRIPS, weeklyBalances, type DriverBalance } from '@/data/trips'
import { COMMISSION, HELPER_PER_HOUR, MIN_FRACTION_MIN, TARIFFS } from '@/data/places'
import { CATEGORY_LABEL } from '@/data/labels'
import { at, fmtDM, fmtDow, fmtTime } from '@/data/dates'
import type { PaymentMethod, Trip, VehicleCategory } from '@/data/types'
import { Avatar, Button, Card, Drawer, InfoDot, Input, Kpi, Label, Pill, SectionTitle, Segmented, Tabs } from '@/components/ui'
import { DevNotice, MethodBadge, PageHeader, Phase2Card, PreviewBanner } from '@/components/shared'
import { VehicleArt } from '@/components/brand'
import { useT } from '@/i18n'
import { uyu, cn } from '@/lib/utils'
import { firstName } from './b/common'

type TabId = 'balance' | 'viajes' | 'tarifas'
type Filter = 'all' | 'pay' | 'collect'

const PCT = Math.round(COMMISSION * 100)
/** Days without settling cash, per driver (only Hernán is overdue in the demo). */
const OVERDUE: Record<string, number> = { 'd-hernan': 9 }
const n0 = (n: number) => uyu(n, false)

/* ───────────────────────── Net balance label ───────────────────────── */
function NetBlock({ neto, size = 'md' }: { neto: number; size?: 'md' | 'lg' }) {
  const { L } = useT()
  if (neto === 0)
    return (
      <Pill tone="neutral">{L('Sin saldo', 'No balance')}</Pill>
    )
  const pay = neto > 0
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-[10px] border px-2.5 py-1.5',
        pay ? 'border-st-green/25 bg-[var(--green-soft)] text-st-green' : 'border-st-amber/25 bg-[var(--amber-soft)] text-st-amber',
      )}
    >
      {pay ? <ArrowUpRight size={size === 'lg' ? 18 : 15} className="shrink-0" /> : <ArrowDownLeft size={size === 'lg' ? 18 : 15} className="shrink-0" />}
      <div className="leading-tight">
        <div className={cn('font-semibold', size === 'lg' ? 'text-[12.5px]' : 'text-[10.5px]')}>
          {pay ? L('La plataforma le debe', 'Platform owes driver') : L('Debe a la plataforma', 'Owes the platform')}
        </div>
        <div className={cn('mono font-bold', size === 'lg' ? 'text-[22px]' : 'text-[13.5px]')}>{uyu(Math.abs(neto))}</div>
      </div>
    </div>
  )
}

export default function Comisiones() {
  const { L, lang } = useT()
  const balances = useMemo(() => weeklyBalances(), [])
  const [tab, setTab] = useState<TabId>('balance')
  const [settled, setSettled] = useState<Record<string, boolean>>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [method, setMethod] = useState<'all' | PaymentMethod>('all')

  const period = L('Semana del {a} al {b}', 'Week of {a} to {b}', { a: fmtDM(at(-6)), b: fmtDM(at(0)) })

  const open = balances.filter((b) => !settled[b.driverId])
  const toPay = open.filter((b) => b.neto > 0).reduce((a, b) => a + b.neto, 0)
  const toCollect = open.filter((b) => b.neto < 0).reduce((a, b) => a - b.neto, 0)
  const commissionWeek = WEEK_TRIPS.reduce((a, t) => a + t.comision, 0)
  const billedWeek = WEEK_TRIPS.reduce((a, t) => a + t.total, 0)
  const nPay = open.filter((b) => b.neto > 0).length
  const nCollect = open.filter((b) => b.neto < 0).length
  const nSettled = balances.length - open.length

  const martin = balances.find((b) => b.driverId === 'd-martin')
  const hernan = balances.find((b) => b.driverId === 'd-hernan')

  const settle = useCallback(
    (id: string, on: boolean) => {
      setSettled((s) => ({ ...s, [id]: on }))
      const d = driverById(id)
      if (on)
        toast.success(L('Saldo de {n} marcado como liquidado', '{n}’s balance marked as settled', { n: d.nombre }), {
          description: L('Queda registrado con fecha de hoy.', 'Recorded with today’s date.'),
          action: { label: L('Deshacer', 'Undo'), onClick: () => setSettled((s) => ({ ...s, [id]: false })) },
        })
      else toast(L('Se deshizo la liquidación de {n}', 'Settlement of {n} undone', { n: d.nombre }))
    },
    [L],
  )

  const remind = useCallback(
    (id: string) => {
      const d = driverById(id)
      toast.success(L('Recordatorio enviado a {n}', 'Reminder sent to {n}', { n: d.nombre }), {
        description: L('Le llegó por WhatsApp y notificación en la app con el detalle del saldo.', 'Sent by WhatsApp and in-app notification with the balance detail.'),
      })
    },
    [L],
  )

  const closeDrawer = useCallback(() => setOpenId(null), [])

  const rows = balances.filter((b) => {
    if (filter === 'pay' && b.neto <= 0) return false
    if (filter === 'collect' && b.neto >= 0) return false
    if (q.trim() && !driverById(b.driverId).nombre.toLowerCase().includes(q.trim().toLowerCase())) return false
    return true
  })
  const tot = rows.reduce(
    (a, b) => ({
      viajes: a.viajes + b.viajes,
      efectivo: a.efectivo + b.efectivo,
      comisionEfectivo: a.comisionEfectivo + b.comisionEfectivo,
      tarjeta: a.tarjeta + b.tarjeta,
      parteTarjeta: a.parteTarjeta + b.parteTarjeta,
      neto: a.neto + b.neto,
    }),
    { viajes: 0, efectivo: 0, comisionEfectivo: 0, tarjeta: 0, parteTarjeta: 0, neto: 0 },
  )

  const exportCsv = () => {
    const head = ['conductor', 'viajes', 'efectivo', 'comision_efectivo', 'tarjeta', 'parte_tarjeta', 'saldo_neto', 'estado']
    const lines = balances.map((b) =>
      [driverById(b.driverId).nombre, b.viajes, b.efectivo, b.comisionEfectivo, b.tarjeta, b.parteTarjeta, b.neto, settled[b.driverId] ? 'liquidado' : 'pendiente'].join(';'),
    )
    const blob = new Blob(['﻿' + [head.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `fletesya-balance-${fmtDM(at(-6)).replace('/', '-')}_${fmtDM(at(0)).replace('/', '-')}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    toast.success(L('Balance exportado a CSV', 'Balance exported to CSV'))
  }

  const drawerBalance = openId ? balances.find((b) => b.driverId === openId) : undefined

  return (
    <div>
      <PreviewBanner
        id="admin-comisiones"
        bullets={[
          L('Cada viaje calcula solo su comisión (15%) y quién cobró: en efectivo cobra el conductor, con tarjeta cobra la plataforma.', 'Each trip computes its own commission (15%) and who collected: cash goes to the driver, card goes to the platform.'),
          L('Balance semanal por conductor que cruza efectivo y tarjeta y te dice quién le debe a quién y cuánto.', 'Weekly balance per driver that nets cash against card and tells you who owes whom and how much.'),
          L('Liquidación con un clic, historial de pagos y alertas de conductores que no rinden el efectivo.', 'One-click settlement, payment history and alerts for drivers who don’t hand in cash.'),
        ]}
      />
      <PageHeader
        title={L('Comisiones y liquidaciones', 'Commissions & settlements')}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="mono font-semibold text-ink">{period}</span>
            <span>· {L('{n} viajes completados', '{n} completed trips', { n: WEEK_TRIPS.length })}</span>
          </span>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              <Download size={14} /> {L('Exportar CSV', 'Export CSV')}
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Kpi
          label={L('Total a pagar a conductores', 'Total to pay drivers')}
          value={uyu(toPay)}
          tone="green"
          icon={<ArrowUpRight size={16} className="text-st-green" />}
          hint={L('{n} conductores · por viajes con tarjeta', '{n} drivers · from card trips', { n: nPay })}
        />
        <Kpi
          label={L('Total a cobrar a conductores', 'Total to collect from drivers')}
          value={uyu(toCollect)}
          tone="amber"
          icon={<ArrowDownLeft size={16} className="text-st-amber" />}
          hint={L('{n} conductores · comisión de viajes en efectivo', '{n} drivers · commission on cash trips', { n: nCollect })}
        />
        <Kpi
          label={L('Comisión neta de la semana', 'Net commission this week')}
          value={uyu(commissionWeek)}
          tone="accent"
          hint={
            <>
              {PCT}% {L('de', 'of')} <span className="mono">{uyu(billedWeek)}</span> {L('facturados', 'billed')}
              {nSettled > 0 && <span className="text-st-green">· {L('{n} liquidados', '{n} settled', { n: nSettled })}</span>}
            </>
          }
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'balance', label: L('Balance por conductor', 'Balance by driver'), count: balances.length },
            { id: 'viajes', label: L('Por viaje', 'By trip'), count: WEEK_TRIPS.length },
            { id: 'tarifas', label: L('Tarifas y categorías', 'Rates & categories') },
          ]}
        />
      </div>

      {tab === 'balance' && (
        <div className="space-y-4">
          {/* How it works */}
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-[13px] font-bold text-ink">{L('Cómo se calcula el saldo de cada conductor', 'How each driver’s balance is calculated')}</div>
              <Pill tone="accent">{L('Comisión {p}%', 'Commission {p}%', { p: PCT })}</Pill>
            </div>
            <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1.1fr]">
              <div className="rounded-[10px] border border-st-green/25 bg-[var(--green-soft)] p-3">
                <div className="flex items-center gap-2 text-[12.5px] font-bold text-st-green">
                  <CreditCard size={15} /> {L('Viaje con tarjeta', 'Card trip')}
                </div>
                <p className="mt-1 text-[12.5px] leading-snug text-ink">
                  {L('Cobró la plataforma → le debe al conductor su parte ({p}%).', 'The platform collected → it owes the driver their share ({p}%).', { p: 100 - PCT })}
                </p>
                {martin && (
                  <div className="mono mt-2 text-[12px] text-ink2">
                    {n0(martin.tarjeta)} × {100 - PCT}% = <b className="text-st-green">{n0(martin.parteTarjeta)}</b>
                  </div>
                )}
              </div>
              <div className="grid place-items-center text-ink2">
                <Minus size={18} />
              </div>
              <div className="rounded-[10px] border border-st-amber/25 bg-[var(--amber-soft)] p-3">
                <div className="flex items-center gap-2 text-[12.5px] font-bold text-st-amber">
                  <Banknote size={15} /> {L('Viaje en efectivo', 'Cash trip')}
                </div>
                <p className="mt-1 text-[12.5px] leading-snug text-ink">
                  {L('El conductor cobró todo → le debe la comisión ({p}%) a la plataforma.', 'The driver collected everything → owes the {p}% commission to the platform.', { p: PCT })}
                </p>
                {martin && (
                  <div className="mono mt-2 text-[12px] text-ink2">
                    {n0(martin.efectivo)} × {PCT}% = <b className="text-st-amber">{n0(martin.comisionEfectivo)}</b>
                  </div>
                )}
              </div>
              <div className="grid place-items-center text-ink2">
                <Equal size={18} />
              </div>
              <div className="rounded-[10px] border border-accent/25 bg-accent-soft p-3">
                <div className="text-[12.5px] font-bold text-accent">{L('Saldo neto', 'Net balance')}</div>
                <p className="mt-1 text-[12.5px] leading-snug text-ink">
                  {L('Parte por tarjeta − comisión por efectivo. Positivo: le pagás. Negativo: te paga.', 'Card share − cash commission. Positive: you pay them. Negative: they pay you.')}
                </p>
                {martin && (
                  <button onClick={() => setOpenId('d-martin')} className="mono mt-2 text-left text-[12px] text-ink2 hover:text-accent">
                    {L('Ej. Martín', 'e.g. Martín')}: {n0(martin.parteTarjeta)} − {n0(martin.comisionEfectivo)} = <b className="text-st-green">+{n0(martin.neto)}</b>
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 text-[11.5px] leading-snug text-ink2">
              {L(
                'Efectivo: el conductor cobró todo → le debe la comisión (15%) a la plataforma. Tarjeta: cobró la plataforma → le debe al conductor su parte (85%). Saldo = parte por tarjeta − comisión por efectivo.',
                'Cash: the driver collected everything → owes the commission (15%) to the platform. Card: the platform collected → owes the driver their share (85%). Balance = card share − cash commission.',
              )}
            </p>
          </Card>

          {/* Overdue alert */}
          {hernan && !settled['d-hernan'] && (
            <Card className="flex flex-wrap items-center gap-3 border-st-amber/35 bg-[var(--amber-soft)] p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-st-amber shadow-card">
                <AlertTriangle size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-ink">
                  {driverById('d-hernan').nombre} {L('debe', 'owes')} <span className="mono text-st-amber">{uyu(-hernan.neto)}</span> · {L('{n} días sin rendir', '{n} days without settling', { n: OVERDUE['d-hernan'] })}
                </div>
                <div className="text-[12.5px] text-ink2">
                  {L(
                    'Cobró {e} en efectivo en {v} viajes y no tuvo viajes con tarjeta que lo compensen.',
                    'Collected {e} in cash over {v} trips with no card trips to offset it.',
                    { e: uyu(hernan.efectivo), v: hernan.viajes },
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setOpenId('d-hernan')}>
                  {L('Ver detalle', 'View details')}
                </Button>
                <Button size="sm" className="bg-st-amber hover:bg-amber-700" onClick={() => remind('d-hernan')}>
                  <BellRing size={14} /> {L('Enviar recordatorio', 'Send reminder')}
                </Button>
              </div>
            </Card>
          )}

          {/* Balance table */}
          <Card data-trailer="balance-table" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3">
              <Segmented
                value={filter}
                onChange={setFilter}
                items={[
                  { id: 'all', label: `${L('Todos', 'All')} · ${balances.length}` },
                  { id: 'pay', label: `${L('Le debemos', 'We owe')} · ${balances.filter((b) => b.neto > 0).length}` },
                  { id: 'collect', label: `${L('Nos deben', 'They owe')} · ${balances.filter((b) => b.neto < 0).length}` },
                ]}
              />
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink2" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('Buscar conductor…', 'Search driver…')} className="h-9 pl-8 text-[13px]" />
              </div>
            </div>

            {/* desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1040px] text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-subtle text-left text-[10.5px] font-semibold uppercase tracking-[.06em] text-ink2">
                    <th className="px-4 py-2.5">{L('Conductor', 'Driver')}</th>
                    <th className="px-3 py-2.5 text-right">{L('Viajes', 'Trips')}</th>
                    <th className="px-3 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1">
                        <Banknote size={12} className="text-st-amber" /> {L('Cobrado efectivo', 'Cash collected')}
                      </span>
                    </th>
                    <th className="px-3 py-2.5 text-right">{L('Comisión adeudada por efectivo', 'Commission owed on cash')}</th>
                    <th className="px-3 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1">
                        <CreditCard size={12} className="text-accent" /> {L('Cobrado tarjeta', 'Card collected')}
                      </span>
                    </th>
                    <th className="px-3 py-2.5 text-right">{L('Parte del conductor por tarjeta', 'Driver share from card')}</th>
                    <th data-trailer="saldo-col" className="bg-accent-soft px-3 py-2.5 text-accent">
                      {L('Saldo neto', 'Net balance')}
                    </th>
                    <th className="px-4 py-2.5 text-right">{L('Acción', 'Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => {
                    const d = driverById(b.driverId)
                    const done = !!settled[b.driverId]
                    const overdue = OVERDUE[b.driverId] && !done
                    return (
                      <tr
                        key={b.driverId}
                        onClick={() => setOpenId(b.driverId)}
                        className={cn(
                          'cursor-pointer border-b border-line transition-colors last:border-b-0',
                          overdue ? 'bg-[var(--amber-soft)]/60 hover:bg-[var(--amber-soft)]' : 'hover:bg-subtle',
                          done && 'opacity-50',
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={d.nombre} size={30} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 font-semibold text-ink">
                                {d.nombre}
                                {overdue && (
                                  <Pill tone="amber" className="px-1.5 text-[10px]">
                                    {L('{n} días sin rendir', '{n} days unsettled', { n: OVERDUE[b.driverId] })}
                                  </Pill>
                                )}
                              </div>
                              <div className="text-[11.5px] text-ink2">
                                {d.vehiculo.modelo} · <span className="mono">{d.vehiculo.patente}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="mono px-3 py-2.5 text-right">{b.viajes}</td>
                        <td className="mono px-3 py-2.5 text-right text-ink">{b.efectivo ? n0(b.efectivo) : <span className="text-ink2">—</span>}</td>
                        <td className="mono px-3 py-2.5 text-right text-st-amber">{b.comisionEfectivo ? `− ${n0(b.comisionEfectivo)}` : <span className="text-ink2">—</span>}</td>
                        <td className="mono px-3 py-2.5 text-right text-ink">{b.tarjeta ? n0(b.tarjeta) : <span className="text-ink2">—</span>}</td>
                        <td className="mono px-3 py-2.5 text-right text-st-green">{b.parteTarjeta ? `+ ${n0(b.parteTarjeta)}` : <span className="text-ink2">—</span>}</td>
                        <td className="bg-accent-soft/40 px-3 py-2">
                          {done ? (
                            <div className="flex items-center gap-2">
                              <Pill tone="neutral">
                                <CheckCheck size={11} /> {L('Liquidado hoy', 'Settled today')}
                              </Pill>
                            </div>
                          ) : (
                            <NetBlock neto={b.neto} />
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          {done ? (
                            <Button variant="ghost" size="sm" onClick={() => settle(b.driverId, false)}>
                              <RotateCcw size={13} /> {L('Deshacer', 'Undo')}
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" onClick={() => settle(b.driverId, true)}>
                              <CheckCheck size={13} /> {L('Marcar como liquidado', 'Mark as settled')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-line bg-subtle font-semibold">
                    <td className="px-4 py-3 text-[12px] uppercase tracking-wide text-ink2">
                      {L('Total', 'Total')} · {rows.length} {L('conductores', 'drivers')}
                    </td>
                    <td className="mono px-3 py-3 text-right">{tot.viajes}</td>
                    <td className="mono px-3 py-3 text-right">{n0(tot.efectivo)}</td>
                    <td className="mono px-3 py-3 text-right text-st-amber">− {n0(tot.comisionEfectivo)}</td>
                    <td className="mono px-3 py-3 text-right">{n0(tot.tarjeta)}</td>
                    <td className="mono px-3 py-3 text-right text-st-green">+ {n0(tot.parteTarjeta)}</td>
                    <td className="bg-accent-soft/40 px-3 py-3">
                      <span className="mono text-[13px]">{tot.neto >= 0 ? '+' : '−'} {n0(Math.abs(tot.neto))}</span>
                      <span className="ml-1 text-[11px] font-normal text-ink2">{L('neto', 'net')}</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* mobile cards */}
            <div className="divide-y divide-line md:hidden">
              {rows.map((b) => {
                const d = driverById(b.driverId)
                const done = !!settled[b.driverId]
                const overdue = OVERDUE[b.driverId] && !done
                return (
                  <div key={b.driverId} onClick={() => setOpenId(b.driverId)} className={cn('p-3', overdue && 'bg-[var(--amber-soft)]/60', done && 'opacity-50')}>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={d.nombre} size={34} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold text-ink">{d.nombre}</div>
                        <div className="text-[11.5px] text-ink2">
                          {d.vehiculo.modelo} · {b.viajes} {b.viajes === 1 ? L('viaje', 'trip') : L('viajes', 'trips')}
                        </div>
                      </div>
                      {overdue && (
                        <Pill tone="amber" className="px-1.5 text-[10px]">
                          {L('{n} días', '{n} days', { n: OVERDUE[b.driverId] })}
                        </Pill>
                      )}
                    </div>
                    <div className="mono mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11.5px]">
                      <span className="text-ink2">
                        {L('Efectivo', 'Cash')} {n0(b.efectivo)}
                      </span>
                      <span className="text-right text-st-amber">− {n0(b.comisionEfectivo)}</span>
                      <span className="text-ink2">
                        {L('Tarjeta', 'Card')} {n0(b.tarjeta)}
                      </span>
                      <span className="text-right text-st-green">+ {n0(b.parteTarjeta)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      {done ? (
                        <Pill tone="neutral">
                          <CheckCheck size={11} /> {L('Liquidado hoy', 'Settled today')}
                        </Pill>
                      ) : (
                        <NetBlock neto={b.neto} />
                      )}
                      <Button variant={done ? 'ghost' : 'secondary'} size="sm" onClick={() => settle(b.driverId, !done)}>
                        {done ? <RotateCcw size={13} /> : <CheckCheck size={13} />}
                        {done ? L('Deshacer', 'Undo') : L('Liquidar', 'Settle')}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            {rows.length === 0 && <div className="p-6 text-center text-[13px] text-ink2">{L('No hay resultados para este filtro.', 'No results for this filter.')}</div>}
          </Card>
        </div>
      )}

      {tab === 'viajes' && <ByTrip method={method} setMethod={setMethod} onOpen={setOpenId} lang={lang} />}

      {tab === 'tarifas' && <TariffsForm />}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Phase2Card
          title={L('Liquidación automática por transferencia', 'Automatic settlement by bank transfer')}
          body={L(
            'Cada lunes el sistema transfiere a cada conductor lo que se le debe y le cobra al que debe, sin tocar una planilla.',
            'Every Monday the system transfers what is owed to each driver and collects from those who owe, without touching a spreadsheet.',
          )}
        />
        <DevNotice
          title={L('Módulos Fase 2', 'Phase 2 modules')}
          now={L('El saldo se marca como liquidado a mano.', 'The balance is marked as settled by hand.')}
          later={L('Transferencias automáticas semanales a cada conductor y cobro de saldos deudores.', 'Automatic weekly transfers to each driver and collection of outstanding balances.')}
        />
      </div>

      <Drawer open={!!drawerBalance} onClose={closeDrawer}>
        {drawerBalance && (
          <BalanceDetail
            b={drawerBalance}
            settled={!!settled[drawerBalance.driverId]}
            onSettle={settle}
            onRemind={remind}
            period={period}
          />
        )}
      </Drawer>
    </div>
  )
}

/* ───────────────────────── Drawer: trip-by-trip breakdown ───────────────────────── */
function BalanceDetail({
  b,
  settled,
  onSettle,
  onRemind,
  period,
}: {
  b: DriverBalance
  settled: boolean
  onSettle: (id: string, on: boolean) => void
  onRemind: (id: string) => void
  period: string
}) {
  const { L, lang } = useT()
  const d = driverById(b.driverId)
  const card = b.trips.filter((t) => t.metodo === 'tarjeta').sort((x, y) => x.fecha.localeCompare(y.fecha))
  const cash = b.trips.filter((t) => t.metodo === 'efectivo').sort((x, y) => x.fecha.localeCompare(y.fecha))

  const TripLine = ({ t }: { t: Trip }) => {
    const isCard = t.metodo === 'tarjeta'
    return (
      <li className="rounded-[10px] border border-line bg-card px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <span className="font-semibold text-ink">
            {L('Viaje', 'Trip')} <span className="mono">#{t.id}</span>
            <span className="font-normal text-ink2">
              {' '}
              · {isCard ? L('tarjeta', 'card') : L('efectivo', 'cash')} · {fmtDow(t.fecha, lang)} {fmtDM(t.fecha)}
            </span>
          </span>
          <span className="mono font-semibold text-ink">{uyu(t.total)}</span>
        </div>
        <div className="mono mt-1 text-[11.5px] text-ink2">
          {L('comisión', 'commission')} {PCT}% = {n0(t.comision)} ·{' '}
          {isCard ? (
            <span className="font-semibold text-st-green">
              {L('al conductor', 'to driver')} {n0(t.total - t.comision)}
            </span>
          ) : (
            <span className="font-semibold text-st-amber">{L('a rendir por el conductor', 'to be handed in by driver')}</span>
          )}
        </div>
      </li>
    )
  }

  const Section = ({ title, icon, tone, trips, subLabel, sub }: { title: string; icon: ReactNode; tone: string; trips: Trip[]; subLabel: string; sub: string }) => (
    <div>
      <div className={cn('mb-2 flex items-center gap-2 text-[12.5px] font-bold', tone)}>
        {icon} {title} <span className="mono font-semibold text-ink2">· {trips.length}</span>
      </div>
      {trips.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-line px-3 py-3 text-[12.5px] text-ink2">{L('Sin viajes esta semana.', 'No trips this week.')}</div>
      ) : (
        <ul className="space-y-1.5">
          {trips.map((t) => (
            <TripLine key={t.id} t={t} />
          ))}
        </ul>
      )}
      <div className="mt-2 flex items-center justify-between px-1 text-[12.5px]">
        <span className="text-ink2">{subLabel}</span>
        <span className={cn('mono font-bold', tone)}>{sub}</span>
      </div>
    </div>
  )

  const pay = b.neto > 0
  return (
    <div className="p-5">
      <div className="flex items-center gap-3 pr-8">
        <Avatar name={d.nombre} size={44} />
        <div className="min-w-0">
          <div className="text-[17px] font-extrabold tracking-tight text-ink">{d.nombre}</div>
          <div className="text-[12px] text-ink2">
            {d.vehiculo.modelo} · <span className="mono">{d.vehiculo.patente}</span> · <span className="mono">{period}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-subtle p-3">
        {settled ? (
          <Pill tone="neutral" className="text-[12px]">
            <CheckCheck size={13} /> {L('Liquidado hoy', 'Settled today')}
          </Pill>
        ) : (
          <NetBlock neto={b.neto} size="lg" />
        )}
        {OVERDUE[b.driverId] && !settled && <Pill tone="amber">{L('{n} días sin rendir', '{n} days unsettled', { n: OVERDUE[b.driverId] })}</Pill>}
      </div>

      <div className="mt-5 space-y-5">
        <Section
          title={L('Tarjeta · cobró la plataforma', 'Card · platform collected')}
          icon={<CreditCard size={14} />}
          tone="text-st-green"
          trips={card}
          subLabel={L('Parte del conductor ({p}% de {t})', 'Driver share ({p}% of {t})', { p: 100 - PCT, t: n0(b.tarjeta) })}
          sub={`+ ${uyu(b.parteTarjeta)}`}
        />
        <Section
          title={L('Efectivo · cobró el conductor', 'Cash · driver collected')}
          icon={<Banknote size={14} />}
          tone="text-st-amber"
          trips={cash}
          subLabel={L('Comisión a rendir ({p}% de {t})', 'Commission to hand in ({p}% of {t})', { p: PCT, t: n0(b.efectivo) })}
          sub={`− ${uyu(b.comisionEfectivo)}`}
        />
      </div>

      {/* step-by-step computation */}
      <div className="mt-5 rounded-card border border-accent/25 bg-accent-soft/50 p-4">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[.08em] text-accent">{L('Cálculo del saldo', 'Balance calculation')}</div>
        <div className="mono space-y-1.5 text-[13px]">
          <div className="flex justify-between gap-3">
            <span className="font-sans text-ink">{L('Parte por tarjeta', 'Card share')}</span>
            <span className="text-st-green">+ {uyu(b.parteTarjeta)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="font-sans text-ink">− {L('Comisión por efectivo', 'Cash commission')}</span>
            <span className="text-st-amber">− {uyu(b.comisionEfectivo)}</span>
          </div>
          <div className="flex justify-between gap-3 border-t border-accent/25 pt-2 text-[15px] font-bold">
            <span className="font-sans text-ink">= {L('Saldo neto', 'Net balance')}</span>
            <span className={pay ? 'text-st-green' : 'text-st-amber'}>
              {pay ? '+' : '−'} {uyu(Math.abs(b.neto))}
            </span>
          </div>
        </div>
        <div className="mt-2 text-[12.5px] font-semibold text-ink">
          {b.neto === 0
            ? L('No hay saldo pendiente.', 'No outstanding balance.')
            : pay
              ? L('→ La plataforma le debe a {n} {x}', '→ The platform owes {n} {x}', { n: firstName(d.nombre), x: uyu(b.neto) })
              : L('→ {n} debe a la plataforma {x}', '→ {n} owes the platform {x}', { n: firstName(d.nombre), x: uyu(-b.neto) })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {settled ? (
          <Button variant="secondary" onClick={() => onSettle(b.driverId, false)}>
            <RotateCcw size={15} /> {L('Deshacer', 'Undo')}
          </Button>
        ) : (
          <Button onClick={() => onSettle(b.driverId, true)}>
            <CheckCheck size={15} /> {L('Marcar como liquidado', 'Mark as settled')}
          </Button>
        )}
        <Button variant="secondary" onClick={() => (pay ? toast.success(L('Resumen enviado a {n}', 'Summary sent to {n}', { n: d.nombre })) : onRemind(b.driverId))}>
          {pay ? <Send size={15} /> : <BellRing size={15} />}
          {pay ? L('Enviar resumen', 'Send summary') : L('Enviar recordatorio', 'Send reminder')}
        </Button>
      </div>
    </div>
  )
}

/* ───────────────────────── Tab: by trip ───────────────────────── */
function ByTrip({
  method,
  setMethod,
  onOpen,
  lang,
}: {
  method: 'all' | PaymentMethod
  setMethod: (m: 'all' | PaymentMethod) => void
  onOpen: (id: string) => void
  lang: 'es' | 'en'
}) {
  const { L } = useT()
  const trips = useMemo(() => [...WEEK_TRIPS].sort((a, b) => b.fecha.localeCompare(a.fecha)), [])
  const rows = trips.filter((t) => method === 'all' || t.metodo === method)
  const tot = rows.reduce(
    (a, t) => ({
      total: a.total + t.total,
      com: a.com + t.comision,
      toDriver: a.toDriver + (t.metodo === 'tarjeta' ? t.total - t.comision : 0),
      toHand: a.toHand + (t.metodo === 'efectivo' ? t.comision : 0),
    }),
    { total: 0, com: 0, toDriver: 0, toHand: 0 },
  )
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3">
        <Segmented
          value={method}
          onChange={setMethod}
          items={[
            { id: 'all', label: `${L('Todos', 'All')} · ${trips.length}` },
            {
              id: 'tarjeta',
              label: (
                <>
                  <CreditCard size={12} /> {L('Tarjeta', 'Card')} · {trips.filter((t) => t.metodo === 'tarjeta').length}
                </>
              ),
            },
            {
              id: 'efectivo',
              label: (
                <>
                  <Banknote size={12} /> {L('Efectivo', 'Cash')} · {trips.filter((t) => t.metodo === 'efectivo').length}
                </>
              ),
            },
          ]}
        />
        <span className="text-[12px] text-ink2">{L('Tocá un viaje para ver el balance del conductor', 'Tap a trip to see the driver’s balance')}</span>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-[13px]">
          <thead>
            <tr className="border-b border-line bg-subtle text-left text-[10.5px] font-semibold uppercase tracking-[.06em] text-ink2">
              <th className="px-4 py-2.5">#</th>
              <th className="px-3 py-2.5">{L('Fecha', 'Date')}</th>
              <th className="px-3 py-2.5">{L('Conductor', 'Driver')}</th>
              <th className="px-3 py-2.5">{L('Método', 'Method')}</th>
              <th className="px-3 py-2.5 text-right">{L('Total', 'Total')}</th>
              <th className="px-3 py-2.5 text-right">
                {L('Comisión', 'Commission')} {PCT}%
              </th>
              <th className="px-4 py-2.5 text-right">{L('Al conductor / a rendir', 'To driver / to hand in')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const d = driverById(t.conductorId)
              const isCard = t.metodo === 'tarjeta'
              return (
                <tr key={t.id} onClick={() => onOpen(t.conductorId)} className="cursor-pointer border-b border-line last:border-b-0 hover:bg-subtle">
                  <td className="mono px-4 py-2 text-ink2">#{t.id}</td>
                  <td className="mono px-3 py-2 text-ink">
                    {fmtDow(t.fecha, lang)} {fmtDM(t.fecha)} <span className="text-ink2">{fmtTime(t.fecha)}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={d.nombre} size={22} />
                      {d.nombre}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <MethodBadge method={t.metodo} />
                  </td>
                  <td className="mono px-3 py-2 text-right">{n0(t.total)}</td>
                  <td className="mono px-3 py-2 text-right text-accent">{n0(t.comision)}</td>
                  <td className="px-4 py-2 text-right">
                    {isCard ? (
                      <span className="mono font-semibold text-st-green">
                        <span className="font-sans text-[11px] font-normal text-ink2">{L('al conductor', 'to driver')} </span>+ {n0(t.total - t.comision)}
                      </span>
                    ) : (
                      <span className="mono font-semibold text-st-amber">
                        <span className="font-sans text-[11px] font-normal text-ink2">{L('a rendir', 'to hand in')} </span>− {n0(t.comision)}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line bg-subtle font-semibold">
              <td className="px-4 py-3 text-[12px] uppercase tracking-wide text-ink2" colSpan={4}>
                {L('Total', 'Total')} · {rows.length} {L('viajes', 'trips')}
              </td>
              <td className="mono px-3 py-3 text-right">{n0(tot.total)}</td>
              <td className="mono px-3 py-3 text-right text-accent">{n0(tot.com)}</td>
              <td className="mono px-4 py-3 text-right text-[12px]">
                {tot.toDriver > 0 && <span className="text-st-green">+ {n0(tot.toDriver)}</span>}
                {tot.toDriver > 0 && tot.toHand > 0 && <span className="text-ink2"> · </span>}
                {tot.toHand > 0 && <span className="text-st-amber">− {n0(tot.toHand)}</span>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="divide-y divide-line md:hidden">
        {rows.map((t) => {
          const d = driverById(t.conductorId)
          const isCard = t.metodo === 'tarjeta'
          return (
            <button key={t.id} onClick={() => onOpen(t.conductorId)} className="block w-full p-3 text-left">
              <div className="flex items-center justify-between gap-2 text-[13px]">
                <span className="font-semibold text-ink">
                  <span className="mono text-ink2">#{t.id}</span> · {d.nombre}
                </span>
                <span className="mono font-semibold">{n0(t.total)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[11.5px]">
                <span className="flex items-center gap-2 text-ink2">
                  <MethodBadge method={t.metodo} /> <span className="mono">{fmtDM(t.fecha)} {fmtTime(t.fecha)}</span>
                </span>
                <span className={cn('mono font-semibold', isCard ? 'text-st-green' : 'text-st-amber')}>
                  {isCard ? `+ ${n0(t.total - t.comision)}` : `− ${n0(t.comision)}`}
                </span>
              </div>
            </button>
          )
        })}
        <div className="mono flex justify-between bg-subtle p-3 text-[12.5px] font-semibold">
          <span className="font-sans">
            {L('Total', 'Total')} · {rows.length}
          </span>
          <span>
            {n0(tot.total)} · <span className="text-accent">{n0(tot.com)}</span>
          </span>
        </div>
      </div>
    </Card>
  )
}

/* ───────────────────────── Tab: tariffs ───────────────────────── */
function TariffsForm() {
  const { L, P } = useT()
  const initial = useMemo(
    () => ({
      rates: Object.fromEntries(TARIFFS.map((t) => [t.categoria, t.porHora])) as Record<VehicleCategory, number>,
      helper: HELPER_PER_HOUR,
      mode: 'pct' as 'pct' | 'fijo',
      value: PCT,
      frac: String(MIN_FRACTION_MIN) as '15' | '30' | '60',
    }),
    [],
  )
  const [f, setF] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const dirty = JSON.stringify(f) !== JSON.stringify(saved)

  const num = (s: string) => Math.max(0, Number(s.replace(/\D/g, '')) || 0)
  const commissionOf = (total: number) => (f.mode === 'pct' ? Math.round((total * f.value) / 100) : f.value)
  const ex1 = f.rates.chico * 2
  const ex2 = (f.rates.mediano + f.helper) * 3

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card className="p-4 sm:p-5">
        <SectionTitle right={dirty ? <Pill tone="amber">{L('Cambios sin guardar', 'Unsaved changes')}</Pill> : <Pill tone="green">{L('Al día', 'Up to date')}</Pill>}>
          {L('Tarifa por hora según categoría', 'Hourly rate by category')}
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {TARIFFS.map((t) => (
            <div key={t.categoria} className="rounded-card border border-line p-3">
              <div className="grid h-16 place-items-center rounded-lg bg-subtle">
                <VehicleArt cat={t.categoria} className="h-12 w-auto" />
              </div>
              <div className="mt-2 text-[13px] font-bold text-ink">{P(CATEGORY_LABEL[t.categoria])}</div>
              <div className="text-[11px] text-ink2">
                {t.modelos.join(' · ')} · <span className="mono">{t.capacidadKg} kg</span>
              </div>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-ink2">$U</span>
                <Input
                  inputMode="numeric"
                  className="mono pl-11 pr-9"
                  value={n0(f.rates[t.categoria])}
                  onChange={(e) => setF((s) => ({ ...s, rates: { ...s.rates, [t.categoria]: num(e.target.value) } }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink2">/h</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{L('Ayudante (precio por hora)', 'Helper (price per hour)')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-ink2">$U</span>
              <Input inputMode="numeric" className="mono pl-11 pr-9" value={n0(f.helper)} onChange={(e) => setF((s) => ({ ...s, helper: num(e.target.value) }))} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink2">/h</span>
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-1">
              {L('Fracción mínima', 'Minimum fraction')}
              <InfoDot text={L('Después de la primera hora se cobra por fracciones de este tamaño. Hoy se aplica a los viajes nuevos de la demo.', 'After the first hour, time is billed in fractions of this size. Applies to new trips.')} />
            </Label>
            <Segmented
              size="md"
              value={f.frac}
              onChange={(v) => setF((s) => ({ ...s, frac: v }))}
              items={[
                { id: '15', label: '15 min' },
                { id: '30', label: '30 min' },
                { id: '60', label: '60 min' },
              ]}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>{L('Comisión de la plataforma', 'Platform commission')}</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                size="md"
                value={f.mode}
                onChange={(v) => setF((s) => ({ ...s, mode: v, value: v === 'pct' ? PCT : 300 }))}
                items={[
                  { id: 'pct', label: '%' },
                  { id: 'fijo', label: L('Monto fijo', 'Fixed amount') },
                ]}
              />
              <div className="relative w-40">
                {f.mode === 'fijo' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-ink2">$U</span>}
                <Input
                  inputMode="numeric"
                  className={cn('mono', f.mode === 'fijo' ? 'pl-11' : 'pr-8')}
                  value={f.mode === 'pct' ? String(f.value) : n0(f.value)}
                  onChange={(e) => setF((s) => ({ ...s, value: s.mode === 'pct' ? Math.min(100, num(e.target.value)) : num(e.target.value) }))}
                />
                {f.mode === 'pct' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink2">%</span>}
              </div>
              <span className="text-[12px] text-ink2">{f.mode === 'pct' ? L('sobre el total del viaje', 'of the trip total') : L('por viaje', 'per trip')}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" disabled={!dirty} onClick={() => setF(saved)}>
            <RotateCcw size={14} /> {L('Descartar', 'Discard')}
          </Button>
          <Button
            onClick={() => {
              setSaved(f)
              toast.success(L('Tarifas actualizadas · aplican a nuevos viajes', 'Rates updated · apply to new trips'))
            }}
          >
            <Save size={15} /> {L('Guardar cambios', 'Save changes')}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-4 sm:p-5">
          <SectionTitle>{L('Ejemplo en vivo', 'Live example')}</SectionTitle>
          {[
            { label: L('Viaje de 2 h en {c}', '2 h trip in {c}', { c: P(CATEGORY_LABEL.chico) }), total: ex1 },
            { label: L('Viaje de 3 h en {c} + ayudante', '3 h trip in {c} + helper', { c: P(CATEGORY_LABEL.mediano) }), total: ex2 },
          ].map((e) => {
            const c = commissionOf(e.total)
            return (
              <div key={e.label} className="mb-3 rounded-[10px] border border-line bg-subtle p-3 last:mb-0">
                <div className="text-[13px] font-semibold text-ink">
                  {e.label}: <span className="mono">{uyu(e.total)}</span> → {L('comisión', 'commission')} <span className="mono text-accent">{uyu(c)}</span>
                </div>
                <div className="mono mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink2">
                  <span>
                    <CreditCard size={11} className="mr-1 inline text-st-green" />
                    {L('tarjeta: al conductor', 'card: to driver')} {n0(e.total - c)}
                  </span>
                  <span>
                    <Banknote size={11} className="mr-1 inline text-st-amber" />
                    {L('efectivo: rinde', 'cash: hands in')} {n0(c)}
                  </span>
                </div>
              </div>
            )
          })}
        </Card>
        <Card className="p-4 text-[12.5px] leading-snug text-ink2">
          <div className="mb-1 font-semibold text-ink">{L('¿A qué viajes aplica?', 'Which trips does it apply to?')}</div>
          {L(
            'Los cambios aplican a los viajes que se pidan a partir de ahora. Los viajes ya realizados mantienen la tarifa y comisión con la que se cobraron, así los balances no se mueven.',
            'Changes apply to trips requested from now on. Completed trips keep the rate and commission they were charged with, so balances don’t shift.',
          )}
        </Card>
      </div>
    </div>
  )
}
