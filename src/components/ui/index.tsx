import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

/* ───────────── Button ───────────── */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm',
        secondary: 'border border-line bg-card text-ink hover:bg-subtle',
        ghost: 'text-ink2 hover:bg-subtle hover:text-ink',
        soft: 'bg-accent-soft text-accent hover:bg-accent/15',
        danger: 'bg-st-red text-white hover:bg-red-700',
        success: 'bg-st-green text-white hover:bg-emerald-700',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4',
        lg: 'h-12 px-5 text-[15px]',
        xl: 'h-14 px-6 text-base rounded-xl',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
})
Button.displayName = 'Button'

/* ───────────── Card ───────────── */
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-line bg-card shadow-card', className)} {...p} />
}

/* ───────────── Pill / Badge ───────────── */
type Tone = 'neutral' | 'accent' | 'amber' | 'green' | 'red' | 'dark'
const toneCls: Record<Tone, string> = {
  neutral: 'bg-subtle text-ink2 border-line',
  accent: 'bg-accent-soft text-accent border-accent/20',
  amber: 'bg-[var(--amber-soft)] text-st-amber border-st-amber/20',
  green: 'bg-[var(--green-soft)] text-st-green border-st-green/20',
  red: 'bg-[var(--red-soft)] text-st-red border-st-red/20',
  dark: 'bg-ink text-bg border-transparent',
}
export function Pill({ tone = 'neutral', className, children, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        toneCls[tone],
        className,
      )}
      {...p}
    >
      {children}
    </span>
  )
}

/* ───────────── KPI ───────────── */
export function Kpi({
  label,
  value,
  delta,
  hint,
  tone,
  className,
  icon,
}: {
  label: string
  value: React.ReactNode
  delta?: { v: string; up?: boolean }
  hint?: React.ReactNode
  tone?: 'amber' | 'green' | 'red' | 'accent'
  className?: string
  icon?: React.ReactNode
}) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="kpi-label">{label}</span>
        {icon && <span className="text-ink2">{icon}</span>}
      </div>
      <div
        className={cn(
          'mono mt-2 text-[26px] font-bold leading-none tracking-tight',
          tone === 'amber' && 'text-st-amber',
          tone === 'green' && 'text-st-green',
          tone === 'red' && 'text-st-red',
          tone === 'accent' && 'text-accent',
        )}
      >
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-ink2">
        {delta && (
          <span
            className={cn(
              'mono rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
              delta.up ? 'bg-[var(--green-soft)] text-st-green' : 'bg-[var(--red-soft)] text-st-red',
            )}
          >
            {delta.v}
          </span>
        )}
        {hint}
      </div>
    </Card>
  )
}

/* ───────────── Modal (centered: fixed inset-0 m-auto h-fit; animates scale/translate/opacity, never transform) ───────────── */
export function Modal({
  open,
  onClose,
  children,
  className,
  closeOnBackdrop = true,
  showClose = true,
  z = 'z-[80]',
}: {
  open: boolean
  onClose?: () => void
  children: React.ReactNode
  className?: string
  closeOnBackdrop?: boolean
  showClose?: boolean
  z?: string
}) {
  React.useEffect(() => {
    if (!open || !onClose) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && closeOnBackdrop && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose, closeOnBackdrop])
  if (!open) return null
  return (
    <div className={cn('fixed inset-0', z)} role="dialog" aria-modal="true">
      <motion.div
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={() => closeOnBackdrop && onClose?.()}
      />
      <motion.div
        data-modal
        className={cn(
          'fixed inset-0 m-auto h-fit max-h-[88vh] w-[calc(100%-32px)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-card shadow-pop',
          className,
        )}
        initial={{ opacity: 0, scale: 0.95, translate: '0px 12px' }}
        animate={{ opacity: 1, scale: 1, translate: '0px 0px' }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {showClose && onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-ink2 hover:bg-subtle hover:text-ink"
            aria-label="close"
          >
            <X size={16} />
          </button>
        )}
        {children}
      </motion.div>
    </div>
  )
}

/* ───────────── Drawer (right side) ───────────── */
export function Drawer({ open, onClose, children, className }: { open: boolean; onClose: () => void; children: React.ReactNode; className?: string }) {
  React.useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70]">
      <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.aside
        className={cn('absolute right-0 top-0 h-full w-full max-w-[520px] overflow-y-auto border-l border-line bg-card shadow-pop', className)}
        initial={{ translate: '40px 0px', opacity: 0 }}
        animate={{ translate: '0px 0px', opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <button onClick={onClose} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-ink2 hover:bg-subtle" aria-label="close">
          <X size={16} />
        </button>
        {children}
      </motion.aside>
    </div>
  )
}

/* ───────────── Tabs ───────────── */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T
  onChange: (v: T) => void
  items: { id: T; label: React.ReactNode; count?: number }[]
  className?: string
}) {
  return (
    <div className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-[10px] border border-line bg-subtle p-1 scrollbar-none', className)}>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            'flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold transition-colors',
            value === it.id ? 'bg-card text-ink shadow-card' : 'text-ink2 hover:text-ink',
          )}
        >
          {it.label}
          {it.count !== undefined && <span className="mono rounded-full bg-bg px-1.5 text-[10.5px] text-ink2">{it.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* ───────────── Segmented ───────────── */
export function Segmented<T extends string>({
  value,
  onChange,
  items,
  className,
  size = 'sm',
}: {
  value: T
  onChange: (v: T) => void
  items: { id: T; label: React.ReactNode; title?: string }[]
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-full border border-line bg-card p-0.5', className)}>
      {items.map((it) => (
        <button
          key={it.id}
          title={it.title}
          onClick={() => onChange(it.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-full font-semibold transition-colors',
            size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-9 px-3.5 text-[13px]',
            value === it.id ? 'bg-accent text-white' : 'text-ink2 hover:text-ink',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

/* ───────────── Switch ───────────── */
export function Switch({ checked, onChange, className, big }: { checked: boolean; onChange: (v: boolean) => void; className?: string; big?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative shrink-0 rounded-full transition-colors',
        big ? 'h-9 w-16' : 'h-6 w-11',
        checked ? 'bg-accent' : 'bg-zinc-300 dark:bg-zinc-700',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-1 rounded-full bg-white shadow transition-[left]',
          big ? 'h-7 w-7' : 'h-4 w-4',
          checked ? (big ? 'left-8' : 'left-6') : 'left-1',
        )}
      />
    </button>
  )
}

/* ───────────── Info popover "En desarrollo" ───────────── */
export function InfoDot({ text, className }: { text: string; className?: string }) {
  const { t } = useT()
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn('inline-grid h-5 w-5 place-items-center rounded-full text-ink2 hover:bg-subtle hover:text-accent', className)}
          aria-label={t('dev.inDev')}
        >
          <Info size={14} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={6}
          className="z-[95] max-w-[260px] rounded-[10px] border border-line bg-card p-3 text-xs text-ink shadow-pop"
        >
          <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[.08em] text-st-amber">{t('dev.inDev')}</div>
          {text}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export function PopoverContent({ className, ...p }: PopoverPrimitive.PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={8}
        className={cn('z-[95] rounded-xl border border-line bg-card p-2 text-sm text-ink shadow-pop', className)}
        {...p}
      />
    </PopoverPrimitive.Portal>
  )
}

/* ───────────── Inputs ───────────── */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-[10px] border border-line bg-card px-3 text-sm text-ink placeholder:text-ink2/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20',
      className,
    )}
    {...p}
  />
))
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-[80px] w-full rounded-[10px] border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-ink2/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20',
      className,
    )}
    {...p}
  />
))
Textarea.displayName = 'Textarea'

export function Select({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-[10px] border border-line bg-card px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20',
        className,
      )}
      {...p}
    />
  )
}

export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-[12.5px] font-semibold text-ink', className)} {...p} />
}

/* ───────────── Avatar ───────────── */
const AV_COLORS = ['#1F5BFF', '#059669', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D', '#EA580C']
export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const bg = AV_COLORS[h % AV_COLORS.length]
  return (
    <span
      className={cn('inline-grid shrink-0 place-items-center rounded-full font-bold text-white', className)}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}

/* ───────────── Stars ───────────── */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? '' : 'opacity-25'}>
          ★
        </span>
      ))}
    </span>
  )
}

/* ───────────── Section title ───────────── */
export function SectionTitle({ children, right, className }: { children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <h2 className="text-[15px] font-bold tracking-tight text-ink">{children}</h2>
      {right}
    </div>
  )
}

/* ───────────── Progress ───────────── */
export function Progress({ value, className, tone = 'accent' }: { value: number; className?: string; tone?: 'accent' | 'green' | 'amber' }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-subtle border border-line', className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', tone === 'accent' ? 'bg-accent' : tone === 'green' ? 'bg-st-green' : 'bg-st-amber')}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}
