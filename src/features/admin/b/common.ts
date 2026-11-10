import type { CSSProperties } from 'react'

/** Recharts tooltip as a white card that follows the theme tokens. */
export const TOOLTIP_STYLE: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  boxShadow: '0 12px 40px -12px rgba(0,0,0,.25)',
  fontSize: 12,
  color: 'var(--text)',
  padding: '8px 10px',
}
export const TOOLTIP_LABEL: CSSProperties = { color: 'var(--text-2)', fontWeight: 600, marginBottom: 2 }
export const TOOLTIP_ITEM: CSSProperties = { color: 'var(--text)', padding: 0 }
export const AXIS_TICK = { fontSize: 11, fill: 'var(--text-2)' }

export const C_ACCENT = '#1F5BFF'
export const C_GREEN = '#059669'
export const C_AMBER = '#D97706'
export const C_GREY = '#a1a1aa'

/** Stable small hash for deterministic mock values. */
export function hash(s: string) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  return h
}

/** "Diego Romero" → "Diego R." */
export function shortName(nombre: string) {
  const [first, last] = nombre.split(' ')
  return last ? `${first} ${last[0]}.` : first
}

export function firstName(nombre: string) {
  return nombre.split(' ')[0]
}

/** Compact thousands for chart axes: 1.250.000 → 1,3 M / 36.000 → 36 k */
export function compact(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`
  if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)} k`
  return String(n)
}
