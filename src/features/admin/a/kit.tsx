import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui'

/** "Martín Gómez" → "Martín G." */
export function shortName(n: string) {
  const [a, b] = n.split(' ')
  return b ? `${a} ${b[0]}.` : a
}

/** 1.5 → "1,5 h" (es) / "1.5 h" (en) */
export function fmtHours(h: number, lang: 'es' | 'en') {
  return `${h.toLocaleString(lang === 'en' ? 'en-US' : 'es-UY', { maximumFractionDigits: 2 })} h`
}

export function rating(v: number) {
  return v > 0 ? v.toFixed(1) : '—'
}

/* ───────── Table primitives ───────── */
export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('hidden overflow-hidden rounded-card border border-line bg-card shadow-card md:block', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">{children}</table>
      </div>
    </div>
  )
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn('kpi-label whitespace-nowrap border-b border-line bg-subtle px-3 py-2.5 text-left', className)}>{children}</th>
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('whitespace-nowrap border-b border-line px-3 py-2.5 align-middle text-ink', className)}>{children}</td>
}

export const rowCls = 'cursor-pointer transition-colors hover:bg-subtle'

/** Mobile (<md) card list wrapper */
export function MobileList({ children }: { children: ReactNode }) {
  return <div className="grid gap-2 md:hidden">{children}</div>
}

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="pointer-events-none absolute inset-y-0 left-3 my-auto text-ink2" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-card border border-dashed border-line bg-subtle px-4 py-10 text-center text-[13px] text-ink2">{children}</div>
}

/** Animated number (count-up), cleaned up. */
export function useCountUp(target: number, duration = 900) {
  const [v, setV] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = from.current
    const t0 = Date.now()
    // setInterval (not rAF) so the count still lands when the tab is not painting
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / duration)
      const e = 1 - Math.pow(1 - k, 3)
      const cur = Math.round(start + (target - start) * e)
      setV(cur)
      from.current = cur
      if (k >= 1) clearInterval(id)
    }, 30)
    return () => clearInterval(id)
  }, [target, duration])
  return v
}
