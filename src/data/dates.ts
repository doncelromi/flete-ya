/** All mock dates are relative to "today" so the demo always looks current. */
export const NOW = new Date()
export const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate())

export function at(daysOffset: number, h = 12, m = 0): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + daysOffset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export function dayDiff(iso: string) {
  const d = new Date(iso)
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((d0.getTime() - TODAY.getTime()) / 86400000)
}

export function isToday(iso: string) {
  return dayDiff(iso) === 0
}

/** Inside the current weekly window (last 7 days including today). */
export function inWeek(iso: string) {
  const d = dayDiff(iso)
  return d <= 0 && d >= -6
}

const DOW_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 28/09 */
export function fmtDM(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** 28/09/2026 */
export function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${fmtDM(iso)}/${d.getFullYear()}`
}

export function fmtDow(iso: string, lang: 'es' | 'en') {
  const d = new Date(iso)
  return (lang === 'en' ? DOW_EN : DOW_ES)[d.getDay()]
}

export function fmtMonth(iso: string, lang: 'es' | 'en') {
  const d = new Date(iso)
  return `${(lang === 'en' ? MON_EN : MON_ES)[d.getMonth()]} ${d.getFullYear()}`
}

/** "Hoy 14:30" / "Ayer 09:10" / "lun 22/09 14:30" */
export function fmtRelative(iso: string, lang: 'es' | 'en') {
  const dd = dayDiff(iso)
  const t = fmtTime(iso)
  if (dd === 0) return `${lang === 'en' ? 'Today' : 'Hoy'} ${t}`
  if (dd === -1) return `${lang === 'en' ? 'Yesterday' : 'Ayer'} ${t}`
  if (dd === 1) return `${lang === 'en' ? 'Tomorrow' : 'Mañana'} ${t}`
  return `${fmtDow(iso, lang)} ${fmtDM(iso)} ${t}`
}

/** "hace 5 min" style for last-connection */
export function fmtAgo(iso: string, lang: 'es' | 'en') {
  const mins = Math.max(1, Math.round((NOW.getTime() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return lang === 'en' ? `${mins} min ago` : `hace ${mins} min`
  const h = Math.round(mins / 60)
  if (h < 24) return lang === 'en' ? `${h} h ago` : `hace ${h} h`
  const d = Math.round(h / 24)
  return lang === 'en' ? `${d} d ago` : `hace ${d} d`
}

/** Days until an ISO date (negative = expired) */
export function daysUntil(iso: string) {
  return dayDiff(iso)
}
