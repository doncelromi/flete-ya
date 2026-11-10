import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** $U 2.400 (pesos uruguayos) */
export function uyu(n: number, withPrefix = true) {
  const s = Math.round(n).toLocaleString('es-UY')
  return withPrefix ? `$U ${s}` : s
}

export function usd(n: number) {
  return `USD ${n.toLocaleString('es-UY')}`
}

export const WHATSAPP_URL =
  'https://wa.me/5491139375146?text=Vi%20el%20demo%20de%20Fletes%20ya%2C%20quiero%20que%20avancemos!'

export function openWhatsApp() {
  window.open(WHATSAPP_URL, '_blank', 'noopener')
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** hh:mm:ss */
export function clock(totalSec: number) {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.floor(totalSec % 60)
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

/** Deterministic PRNG so mock data is stable across reloads */
export function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function lsGet(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
export function lsSet(key: string, v: string) {
  try {
    localStorage.setItem(key, v)
  } catch {
    /* ignore */
  }
}
export function ssGet(key: string) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}
export function ssSet(key: string, v: string) {
  try {
    sessionStorage.setItem(key, v)
  } catch {
    /* ignore */
  }
}
export function ssRemove(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Returns the first element matching selector that is actually rendered (non-zero box). */
export function findVisible(selector: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector))
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}
