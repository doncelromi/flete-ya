import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, Check, ChevronDown, ChevronUp, CreditCard, Lock, Wrench } from 'lucide-react'
import { METHOD_LABEL, STATUS_LABEL, STATUS_TONE, VERIF_LABEL, VERIF_TONE } from '@/data/labels'
import type { PaymentMethod, TripStatus, VerificationStatus } from '@/data/types'
import { useApp } from '@/store/app'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { Pill } from '@/components/ui'

/** "Qué hace este módulo cuando esté funcional" — top of every module view (never on /propuesta). */
export function PreviewBanner({ id, bullets }: { id: string; bullets: string[] }) {
  const { t } = useT()
  const collapsed = useApp((s) => !!s.bannerCollapsed[id])
  const toggle = useApp((s) => s.toggleBanner)
  return (
    <div className="no-print mb-5 rounded-card border border-accent/20 bg-accent-soft/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="accent" className="text-[10px] tracking-[.06em]">{t('banner.preview')}</Pill>
        <Pill tone="neutral" className="text-[10px] tracking-[.06em]">{t('banner.mock')}</Pill>
        <span className="text-[13px] font-semibold text-ink">{collapsed ? t('banner.expand') : t('banner.title')}</span>
        <button
          onClick={() => toggle(id)}
          className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-semibold text-ink2 hover:bg-card hover:text-ink"
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {collapsed ? '' : t('banner.collapse')}
        </button>
      </div>
      {!collapsed && (
        <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-3">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink">
              <Check size={14} className="mt-0.5 shrink-0 text-accent" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Amber notice: "<Función> · función en desarrollo" with what is simulated now vs. what gets built. */
export function DevNotice({ title, now, later, className }: { title: string; now: string; later: string; className?: string }) {
  const { t } = useT()
  return (
    <div className={cn('rounded-card border border-st-amber/30 bg-[var(--amber-soft)] p-3.5', className)}>
      <div className="flex items-center gap-2 text-[13px] font-bold text-st-amber">
        <Wrench size={15} /> {title} · {t('dev.suffix')}
      </div>
      <div className="mt-2 grid gap-2 text-[12.5px] leading-snug text-ink sm:grid-cols-2">
        <div>
          <span className="font-semibold text-ink2">{t('dev.now')}: </span>
          {now}
        </div>
        <div>
          <span className="font-semibold text-ink2">{t('dev.later')}: </span>
          {later}
        </div>
      </div>
    </div>
  )
}

/** Page header with per-role kicker. Driver role gets the soft green header. */
export function PageHeader({ title, subtitle, actions, className }: { title: string; subtitle?: ReactNode; actions?: ReactNode; className?: string }) {
  const { t } = useT()
  const role = useApp((s) => s.role)
  return (
    <div
      className={cn(
        'mb-5 flex flex-wrap items-end justify-between gap-3',
        role === 'conductor' && '-mx-4 rounded-none border-b border-st-green/15 bg-[var(--driver-soft)] px-4 py-4 sm:mx-0 sm:rounded-card sm:border',
        className,
      )}
    >
      <div className="min-w-0">
        <div className={cn('text-[10.5px] font-bold tracking-[.12em]', role === 'conductor' ? 'text-st-green' : 'text-accent')}>{t(`kicker.${role}`)}</div>
        <h1 className={cn('mt-1 font-extrabold tracking-tight text-ink', role === 'admin' ? 'text-[22px]' : 'text-[24px] sm:text-[26px]')}>{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-ink2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Locked Phase-2 card. */
export function Phase2Card({ title, body, onClick, className }: { title: string; body: string; onClick?: () => void; className?: string }) {
  const { t } = useT()
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-card border border-dashed border-line bg-subtle p-4 opacity-90',
        onClick && 'cursor-pointer hover:border-accent/40',
        className,
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card text-ink2 shadow-card">
        <Lock size={16} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-bold text-ink">{title}</span>
          <Pill tone="neutral">
            <Lock size={10} /> {t('common.phase2')}
          </Pill>
        </div>
        <p className="mt-1 text-[12.5px] leading-snug text-ink2">{body}</p>
      </div>
    </div>
  )
}

export function Reveal({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}


/* ───────── Data pills (status / verification / method) ───────── */
export function StatusPill({ status, className }: { status: TripStatus; className?: string }) {
  const { P } = useT()
  return (
    <Pill tone={STATUS_TONE[status]} className={className}>
      {P(STATUS_LABEL[status])}
    </Pill>
  )
}

export function VerifPill({ status, className }: { status: VerificationStatus; className?: string }) {
  const { P } = useT()
  return (
    <Pill tone={VERIF_TONE[status]} className={className}>
      {P(VERIF_LABEL[status])}
    </Pill>
  )
}

export function MethodBadge({ method, className }: { method: PaymentMethod; className?: string }) {
  const { P } = useT()
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12px] font-semibold text-ink', className)}>
      {method === 'tarjeta' ? <CreditCard size={13} className="text-accent" /> : <Banknote size={13} className="text-st-green" />}
      {P(METHOD_LABEL[method])}
    </span>
  )
}
