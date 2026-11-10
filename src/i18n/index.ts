import { useCallback, useMemo } from 'react'
import { useApp, type Lang } from '@/store/app'
import { dict, type DictKey } from './dict'

export type Pair = readonly [string, string]

function interp(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`))
}

export function translate(lang: Lang, key: DictKey, vars?: Record<string, string | number>) {
  const e = dict[key]
  return interp(lang === 'en' ? e[1] : e[0], vars)
}

/**
 * useT() — i18n hook.
 *  t('key')            → dictionary entry (src/i18n/dict.ts, {clave: [es, en]})
 *  L('es', 'en')       → inline bilingual pair authored next to the component
 *  P(['es','en'])      → pair from mock data
 */
export function useT() {
  const lang = useApp((s) => s.lang)
  const t = useCallback((key: DictKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang])
  const L = useCallback(
    (es: string, en: string, vars?: Record<string, string | number>) => interp(lang === 'en' ? en : es, vars),
    [lang],
  )
  const P = useCallback((p: Pair, vars?: Record<string, string | number>) => interp(lang === 'en' ? p[1] : p[0], vars), [lang])
  return useMemo(() => ({ t, L, P, lang }), [t, L, P, lang])
}

/** Non-hook access for store/toasts */
export function Lnow(es: string, en: string) {
  return useApp.getState().lang === 'en' ? en : es
}
