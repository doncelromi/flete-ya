import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import { BrandName } from '@/components/brand'
import { CATEGORY_LABEL, METHOD_LABEL } from '@/data/labels'
import { DEMO_DEST, DEMO_KM, DEMO_MIN, DEMO_ORIGIN, DEMO_ROUTE, HELPER_PER_HOUR, MARTIN_APPROACH, makeRoute, pathKm, tariffOf } from '@/data/places'
import { TRIPS } from '@/data/trips'
import { fmtDate, fmtTime } from '@/data/dates'
import type { Driver, LatLng, PaymentMethod, Place, VehicleCategory } from '@/data/types'
import type { Lang } from '@/store/app'
import { useT } from '@/i18n'
import { uyu, cn } from '@/lib/utils'

/* ───────── text helpers ───────── */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

export const placeText = (p: Place | null | undefined) => (p ? `${p.label}, ${p.barrio}` : '')

export const hoursText = (h: number) => (Number.isInteger(h) ? String(h) : String(h).replace('.', ','))

export function vehicleText(d: Driver, lang: Lang) {
  return lang === 'en' ? `${d.vehiculo.colorEn} ${d.vehiculo.modelo}` : `${d.vehiculo.modelo} ${d.vehiculo.color.toLowerCase()}`
}

/* ───────── routes ───────── */
export function isDemoPair(o: Place | null, d: Place | null) {
  return !!o && !!d && o.id === DEMO_ORIGIN.id && d.id === DEMO_DEST.id
}

export function routeInfo(o: Place | null, d: Place | null): { route: LatLng[]; km: number; min: number } | null {
  if (!o || !d) return null
  if (isDemoPair(o, d)) return { route: DEMO_ROUTE, km: DEMO_KM, min: DEMO_MIN }
  const route = makeRoute([o.lat, o.lng], [d.lat, d.lng])
  const km = Math.max(0.8, Math.round(pathKm(route) * 1.3 * 10) / 10)
  return { route, km, min: Math.max(5, Math.round(km * 2.6)) }
}

/** Martín's approach to the pickup: the fixed demo path, or a synthetic one ~1.8 km away. */
export function approachFor(o: Place): LatLng[] {
  if (o.id === DEMO_ORIGIN.id) return MARTIN_APPROACH
  return makeRoute([o.lat + 0.0065, o.lng + 0.016], [o.lat, o.lng], 0.2)
}

/** Id for the live demo trip (next number after the mock history). */
export const LIVE_TRIP_ID = Math.max(...TRIPS.map((t) => t.id)) + 1

/* ───────── receipt ───────── */
export interface ReceiptData {
  id: number
  fecha: string
  origen: Place
  destino: Place
  categoria: VehicleCategory
  horas: number
  ayudante: boolean
  metodo: PaymentMethod
  conductor: string
  total: number
  km?: number
}

export function receiptLines(r: ReceiptData) {
  const rate = tariffOf(r.categoria).porHora
  return {
    rate,
    vehicle: Math.round(rate * r.horas),
    helper: r.ayudante ? Math.round(HELPER_PER_HOUR * r.horas) : 0,
  }
}

export function ReceiptCard({ r, className }: { r: ReceiptData; className?: string }) {
  const { L, P, lang } = useT()
  const ln = receiptLines(r)
  const Row = ({ k, v, strong }: { k: string; v: string; strong?: boolean }) => (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-[13px]">
      <span className={cn('text-ink2', strong && 'font-semibold text-ink')}>{k}</span>
      <span className={cn('mono text-right font-bold text-ink', strong && 'text-[17px]')}>{v}</span>
    </div>
  )
  return (
    <div className={cn('overflow-hidden rounded-card border border-line bg-card', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-line bg-subtle px-4 py-3">
        <BrandName className="text-[16px]" />
        <div className="text-right">
          <div className="kpi-label">{L('Comprobante', 'Receipt')}</div>
          <div className="mono text-[13px] font-bold text-ink">#{r.id}</div>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">
        <div className="text-[12px] text-ink2">
          {fmtDate(r.fecha)} · {fmtTime(r.fecha)} · {r.conductor}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-[13px] text-ink">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-ink" />
            {placeText(r.origen)}
          </div>
          <div className="flex items-start gap-2 text-[13px] text-ink">
            <MapPin size={13} className="mt-0.5 shrink-0 text-accent" />
            {placeText(r.destino)}
          </div>
        </div>
        <div className="border-t border-line pt-2">
          <Row k={`${P(CATEGORY_LABEL[r.categoria])} · ${hoursText(r.horas)} h × ${uyu(ln.rate, false)}`} v={uyu(ln.vehicle)} />
          {r.ayudante && <Row k={`${L('Ayudante', 'Helper')} · ${hoursText(r.horas)} h × ${uyu(HELPER_PER_HOUR, false)}`} v={uyu(ln.helper)} />}
          <Row k={L('Subtotal', 'Subtotal')} v={uyu(ln.vehicle + ln.helper)} />
        </div>
        <div className="border-t border-dashed border-line pt-1">
          <Row k={L('Total', 'Total')} v={uyu(r.total)} strong />
          <Row k={L('Medio de pago', 'Payment method')} v={r.metodo === 'tarjeta' ? 'Visa ··4417' : P(METHOD_LABEL.efectivo)} />
        </div>
        <p className="text-[11px] leading-snug text-ink2">
          {lang === 'en'
            ? 'Billed per 15-minute fraction after the first hour. Prices in Uruguayan pesos, VAT included.'
            : 'Se cobra por fracción de 15 min después de la primera hora. Precios en pesos uruguayos, IVA incluido.'}
        </p>
      </div>
    </div>
  )
}

/** Opens a printable HTML receipt in a new window. Returns false if the popup was blocked. */
export function printReceipt(r: ReceiptData, lang: Lang) {
  const w = window.open('', '_blank', 'width=720,height=900')
  if (!w) return false
  const T = (es: string, en: string) => (lang === 'en' ? en : es)
  const ln = receiptLines(r)
  const cat = lang === 'en' ? CATEGORY_LABEL[r.categoria][1] : CATEGORY_LABEL[r.categoria][0]
  const method = r.metodo === 'tarjeta' ? 'Visa ··4417' : T('Efectivo', 'Cash')
  const row = (k: string, v: string, b = false) =>
    `<tr${b ? ' class="tot"' : ''}><td>${k}</td><td class="n">${v}</td></tr>`
  w.document.write(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${T('Recibo', 'Receipt')} #${r.id} · Fletes ya</title>
<style>
*{box-sizing:border-box}body{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:#18181b;margin:0;padding:40px;background:#fff}
.wrap{max-width:560px;margin:0 auto;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden}
.hd{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;background:#f4f6fb;border-bottom:1px dashed #d4d4d8}
.brand{font-weight:800;font-size:22px;letter-spacing:-.02em}.brand span{color:#1F5BFF}
.k{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#71717a;font-weight:700}
.id{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700}
.bd{padding:20px 24px}.muted{color:#71717a;font-size:13px}
.route{margin:14px 0;font-size:14px;line-height:1.7}
table{width:100%;border-collapse:collapse;font-size:14px;margin-top:8px}td{padding:8px 0;border-top:1px solid #f0f0f2}
.n{text-align:right;font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700}
.tot td{font-size:17px;font-weight:800;border-top:2px solid #18181b}
.foot{margin-top:18px;font-size:11px;color:#71717a}
@media print{body{padding:0}.wrap{border:none}}
</style></head><body><div class="wrap">
<div class="hd"><div class="brand">Fletes <span>ya</span></div><div style="text-align:right"><div class="k">${T('Comprobante', 'Receipt')}</div><div class="id">#${r.id}</div></div></div>
<div class="bd">
<div class="muted">${fmtDate(r.fecha)} · ${fmtTime(r.fecha)} · ${T('Conductor', 'Driver')}: ${r.conductor}</div>
<div class="route">● ${placeText(r.origen)}<br/>➜ ${placeText(r.destino)}</div>
<table>
${row(`${cat} · ${hoursText(r.horas)} h × ${uyu(ln.rate, false)}`, uyu(ln.vehicle))}
${r.ayudante ? row(`${T('Ayudante', 'Helper')} · ${hoursText(r.horas)} h × ${uyu(HELPER_PER_HOUR, false)}`, uyu(ln.helper)) : ''}
${row(T('Medio de pago', 'Payment method'), method)}
${row(T('Total', 'Total'), uyu(r.total), true)}
</table>
<div class="foot">${T('Se cobra por fracción de 15 min después de la primera hora. Precios en pesos uruguayos, IVA incluido.', 'Billed per 15-minute fraction after the first hour. Prices in Uruguayan pesos, VAT included.')}<br/>Fletes ya · Montevideo, Uruguay</div>
</div></div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`)
  w.document.close()
  return true
}

/* ───────── small UI bits ───────── */
export function SectionHead({ n, title, right }: { n: number; title: string; right?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="mono grid h-6 w-6 place-items-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">{n}</span>
        <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
      </div>
      {right}
    </div>
  )
}
