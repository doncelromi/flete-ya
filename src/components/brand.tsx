import { Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-grid shrink-0 place-items-center rounded-[9px] bg-accent text-white shadow-sm', className)}
      style={{ width: size, height: size }}
    >
      <Truck size={size * 0.56} strokeWidth={2.2} />
    </span>
  )
}

export function Logo({ powered = true, size = 30, className }: { powered?: boolean; size?: number; className?: string }) {
  const { t } = useT()
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoMark size={size} />
      <div className="leading-none">
        <BrandName className="text-[18px]" />
        {powered && <div className="mt-0.5 text-[10px] font-medium text-ink2">{t('brand.powered')}</div>}
      </div>
    </div>
  )
}

export function BrandName({ className }: { className?: string }) {
  return (
    <span className={cn('block whitespace-nowrap font-extrabold tracking-tight text-ink', className)}>
      Fletes <span className="text-accent">ya</span>
    </span>
  )
}

/* Flat side-silhouette illustrations of generic vans. No brands, no logos. */
export function VehicleArt({ cat, className }: { cat: 'chico' | 'mediano' | 'grande'; className?: string }) {
  const body = 'var(--accent)'
  const glass = '#cfe0ff'
  const tyre = '#18181b'
  if (cat === 'chico')
    return (
      <svg viewBox="0 0 220 110" className={className} aria-hidden>
        <ellipse cx="110" cy="100" rx="92" ry="5" fill="currentColor" opacity=".08" />
        <path d="M22 78V52c0-6 4-10 10-10h82l26-22h44c6 0 10 4 10 10v48z" fill={body} />
        <path d="M22 78h172v8c0 3-2 5-5 5H27c-3 0-5-2-5-5z" fill="#1647D6" />
        <path d="M144 26h36c4 0 6 2 6 6v18h-60z" fill={glass} />
        <rect x="118" y="36" width="2" height="42" fill="#1647D6" />
        <rect x="30" y="50" width="6" height="4" rx="1" fill="#fff" opacity=".7" />
        <rect x="186" y="60" width="8" height="5" rx="1.5" fill="#fde68a" />
        <circle cx="58" cy="86" r="14" fill={tyre} />
        <circle cx="58" cy="86" r="6" fill="#a1a1aa" />
        <circle cx="160" cy="86" r="14" fill={tyre} />
        <circle cx="160" cy="86" r="6" fill="#a1a1aa" />
      </svg>
    )
  if (cat === 'mediano')
    return (
      <svg viewBox="0 0 240 120" className={className} aria-hidden>
        <ellipse cx="120" cy="110" rx="104" ry="5" fill="currentColor" opacity=".08" />
        <path d="M16 88V26c0-6 4-10 10-10h138c6 0 11 2 15 6l36 34c3 3 5 7 5 11v21z" fill={body} />
        <path d="M16 88h210v8c0 3-2 5-5 5H21c-3 0-5-2-5-5z" fill="#1647D6" />
        <path d="M168 24h8l34 32h-42z" fill={glass} />
        <rect x="120" y="22" width="40" height="30" rx="4" fill={glass} opacity=".85" />
        <rect x="112" y="18" width="2" height="70" fill="#1647D6" />
        <rect x="216" y="70" width="9" height="6" rx="2" fill="#fde68a" />
        <circle cx="56" cy="96" r="15" fill={tyre} />
        <circle cx="56" cy="96" r="6.5" fill="#a1a1aa" />
        <circle cx="182" cy="96" r="15" fill={tyre} />
        <circle cx="182" cy="96" r="6.5" fill="#a1a1aa" />
      </svg>
    )
  return (
    <svg viewBox="0 0 260 128" className={className} aria-hidden>
      <ellipse cx="130" cy="118" rx="116" ry="5" fill="currentColor" opacity=".08" />
      <path d="M12 94V14c0-6 4-10 10-10h160c6 0 11 2 15 6l42 44c3 3 5 7 5 11v29z" fill={body} />
      <path d="M12 94h232v8c0 3-2 5-5 5H17c-3 0-5-2-5-5z" fill="#1647D6" />
      <path d="M190 14h8l38 40h-46z" fill={glass} />
      <rect x="142" y="12" width="42" height="34" rx="4" fill={glass} opacity=".85" />
      <rect x="134" y="8" width="2" height="86" fill="#1647D6" />
      <rect x="234" y="76" width="10" height="6" rx="2" fill="#fde68a" />
      <circle cx="54" cy="104" r="16" fill={tyre} />
      <circle cx="54" cy="104" r="7" fill="#a1a1aa" />
      <circle cx="88" cy="104" r="16" fill={tyre} />
      <circle cx="88" cy="104" r="7" fill="#a1a1aa" />
      <circle cx="202" cy="104" r="16" fill={tyre} />
      <circle cx="202" cy="104" r="7" fill="#a1a1aa" />
    </svg>
  )
}
