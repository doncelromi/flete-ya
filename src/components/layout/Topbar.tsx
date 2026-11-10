import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Lock, LogOut, MessageCircle, Sparkles, User } from 'lucide-react'
import { toast } from 'sonner'
import { useApp, type Role } from '@/store/app'
import { useT } from '@/i18n'
import { cn, openWhatsApp } from '@/lib/utils'
import { Avatar, Popover, PopoverContent, PopoverTrigger } from '@/components/ui'
import { Logo } from '@/components/brand'
import { DeviceToggle, LangToggle, ThemeToggle } from './toggles'
import { NAV, PHASE2, PROPUESTA, isActive, type NavItem } from './navConfig'

export const USER_NAME: Record<Role, string> = { cliente: 'Lucía Ferreyra', conductor: 'Martín Gómez', admin: 'Jonathan' }

export function useNavGo() {
  const navigate = useNavigate()
  const cancelPreview = useApp((s) => s.cancelPreview)
  const setMoreOpen = useApp((s) => s.setMoreOpen)
  const setSheetOpen = useApp((s) => s.setSheetOpen)
  return useCallback(
    (path: string) => {
      cancelPreview()
      setMoreOpen(false)
      setSheetOpen(false)
      navigate(path)
    },
    [cancelPreview, setMoreOpen, setSheetOpen, navigate],
  )
}

function NavPill({ item, active, onClick, highlight }: { item: NavItem; active: boolean; onClick: () => void; highlight?: boolean }) {
  // role pills drop their icon below 1536px so more items fit before "Más"; Propuesta keeps it
  const { t } = useT()
  const Icon = item.icon
  return (
    <button
      data-tour={`nav-${item.id}`}
      onClick={onClick}
      className={cn(
        'flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[13px] font-semibold transition-colors',
        active ? 'bg-accent text-white' : 'text-ink2 hover:bg-subtle hover:text-ink',
        !active && highlight && 'border border-accent/50 text-accent',
      )}
    >
      <Icon size={14} className={highlight ? '' : 'hidden 2xl:block'} />
      {t(item.label)}
    </button>
  )
}

export function Topbar() {
  const { t } = useT()
  const { pathname } = useLocation()
  const role = useApp((s) => s.role)
  const moreOpen = useApp((s) => s.moreOpen)
  const setMoreOpen = useApp((s) => s.setMoreOpen)
  const startTour = useApp((s) => s.startTour)
  const trailer = useApp((s) => s.trailer)
  const goTo = useNavGo()
  const items = NAV[role]

  const [scrolled, setScrolled] = useState(false)
  useLayoutEffect(() => {
    const h = () => setScrolled(window.scrollY > 4)
    h()
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  // Overflow: measure pill widths offscreen, decide how many fit, rest go into "Más ▾"
  const wrapRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(items.length)
  useLayoutEffect(() => {
    const calc = () => {
      const wrap = wrapRef.current
      const m = measureRef.current
      if (!wrap || !m) return
      const avail = wrap.clientWidth
      const kids = Array.from(m.children) as HTMLElement[]
      const fixed = kids.filter((k) => k.dataset.fixed).reduce((a, k) => a + k.offsetWidth + 4, 0)
      const pills = kids.filter((k) => !k.dataset.fixed)
      const moreW = 86
      let used = fixed
      let n = 0
      for (let i = 0; i < pills.length; i++) {
        const w = pills[i].offsetWidth + 4
        const needMore = i < pills.length - 1 ? moreW : 0
        if (used + w + needMore > avail) break
        used += w
        n++
      }
      setVisible(n)
    }
    calc()
    const ro = new ResizeObserver(calc)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [items, t])

  const shown = items.slice(0, visible)
  const hidden = items.slice(visible)
  const hiddenActive = hidden.some((i) => isActive(pathname, i.path))

  return (
    <header
      className={cn(
        'sticky top-0 z-40 hidden h-[60px] border-b border-line lg:block',
        scrolled ? 'bg-bg/80 backdrop-blur-md' : 'bg-bg',
      )}
    >
      <div className="flex h-full items-center gap-4 px-5">
        <button onClick={() => goTo('/propuesta')} className="shrink-0">
          <Logo />
        </button>

        {/* offscreen measurer */}
        <div ref={measureRef} aria-hidden className="pointer-events-none invisible fixed left-0 top-0 flex gap-1">
          <div data-fixed="1" className="flex items-center gap-2 pl-1 pr-2">
            <span className="text-[9.5px] font-bold tracking-[.1em]">{t('chrome.comercial')}</span>
            <span className="flex h-8 items-center gap-1.5 px-2.5 text-[13px] font-semibold">
              <span className="w-[14px]" />
              {t('nav.propuesta')}
            </span>
            <span className="mx-1 h-5 w-px" />
          </div>
          {role === 'admin' && (
            <span data-fixed="1" className="flex h-8 items-center gap-1.5 px-3 text-[13px] font-semibold">
              <span className="w-[14px]" />
              {t('chrome.phase2')} <span className="w-3" />
            </span>
          )}
          {items.map((it) => (
            <span key={it.id} className="flex h-8 items-center gap-1.5 whitespace-nowrap px-2.5 text-[13px] font-semibold">
              <span className="hidden w-[14px] 2xl:block" />
              {t(it.label)}
            </span>
          ))}
        </div>

        <nav ref={wrapRef} data-tour="main-nav" className="flex min-w-0 flex-1 items-center gap-1">
          <span className="pl-1 pr-1 text-[9.5px] font-bold tracking-[.1em] text-ink2">{t('chrome.comercial')}</span>
          <NavPill item={PROPUESTA} active={isActive(pathname, PROPUESTA.path)} onClick={() => goTo(PROPUESTA.path)} highlight />
          <span className="mx-1.5 h-5 w-px shrink-0 bg-line" />
          {shown.map((it) => (
            <NavPill key={it.id} item={it} active={isActive(pathname, it.path)} onClick={() => goTo(it.path)} />
          ))}
          {hidden.length > 0 && (
            <Popover open={moreOpen} onOpenChange={setMoreOpen}>
              <PopoverTrigger asChild>
                <button
                  data-tour="nav-more"
                  className={cn(
                    'flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-semibold',
                    hiddenActive ? 'bg-accent text-white' : 'text-ink2 hover:bg-subtle hover:text-ink',
                  )}
                >
                  {t('chrome.more')} <ChevronDown size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-1.5" onOpenAutoFocus={(e) => e.preventDefault()}>
                {hidden.map((it) => {
                  const Icon = it.icon
                  const act = isActive(pathname, it.path)
                  return (
                    <button
                      key={it.id}
                      data-tour={`nav-${it.id}`}
                      onClick={() => goTo(it.path)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold',
                        act ? 'bg-accent text-white' : 'text-ink hover:bg-subtle',
                      )}
                    >
                      <Icon size={15} /> {t(it.label)}
                    </button>
                  )
                })}
              </PopoverContent>
            </Popover>
          )}
          {role === 'admin' && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  data-tour="nav-fase2"
                  className={cn(
                    'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold',
                    pathname.startsWith('/admin/fase2') ? 'bg-accent text-white' : 'text-ink2 hover:bg-subtle hover:text-ink',
                  )}
                >
                  <Lock size={13} /> {t('chrome.phase2')} <ChevronDown size={13} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-1.5">
                <div className="px-2.5 pb-1.5 pt-1 text-[10.5px] font-bold uppercase tracking-[.08em] text-ink2">{t('chrome.phase2Menu')}</div>
                {PHASE2.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => goTo(it.path)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-ink hover:bg-subtle"
                  >
                    <Lock size={13} className="text-ink2" /> {t(it.label)}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <DeviceToggle />
          <LangToggle />
          <ThemeToggle />
          <button
            onClick={startTour}
            disabled={trailer}
            className="flex h-8 items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 text-[12.5px] font-bold text-accent hover:bg-accent hover:text-white disabled:opacity-50"
          >
            <Sparkles size={14} /> {t('chrome.tour')}
          </button>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

export function UserMenu() {
  const { t } = useT()
  const role = useApp((s) => s.role)
  const logout = useApp((s) => s.logout)
  const name = USER_NAME[role]
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="rounded-full ring-accent/30 hover:ring-2" aria-label={name}>
          <Avatar name={name} size={32} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-1.5">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <Avatar name={name} size={34} />
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-bold">{name}</div>
            <div className="text-[12px] text-ink2">{t(`role.${role}`)}</div>
          </div>
        </div>
        <div className="my-1 h-px bg-line" />
        <button
          onClick={() => toast(t('chrome.profile'), { description: t('common.toastDemo') })}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold hover:bg-subtle"
        >
          <User size={15} /> {t('chrome.profile')}
        </button>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-st-red hover:bg-subtle">
          <LogOut size={15} /> {t('chrome.logout')}
        </button>
      </PopoverContent>
    </Popover>
  )
}

export function RoleSwitcher({ className, tour = true }: { className?: string; tour?: boolean }) {
  const { t } = useT()
  const role = useApp((s) => s.role)
  const switchRole = useApp((s) => s.switchRole)
  const trailer = useApp((s) => s.trailer)
  const roles: Role[] = ['cliente', 'conductor', 'admin']
  return (
    <div data-tour={tour ? 'switch-user' : undefined} className={cn('flex items-center gap-2', className)}>
      <span className="text-[10px] font-bold uppercase tracking-[.1em] text-ink2">{t('chrome.switchView')}</span>
      <div className="inline-flex rounded-full border border-line bg-card p-0.5">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => !trailer && r !== role && switchRole(r)}
            className={cn(
              'h-7 rounded-full px-3 text-[12px] font-semibold transition-colors',
              role === r ? 'bg-accent text-white' : 'text-ink2 hover:text-ink',
            )}
          >
            {t(`role.${r}`)}
          </button>
        ))}
      </div>
    </div>
  )
}

export function CtaBlock({ className, compact }: { className?: string; compact?: boolean }) {
  const { t } = useT()
  return (
    <div data-tour="whatsapp-cta" className={cn('flex items-center gap-3', className)}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-2.5 py-0.5 text-[10px] font-bold tracking-[.08em] text-accent">
        <span className="pulse-dot" /> {t('brand.demo')}
      </span>
      {!compact && <span className="hidden text-[12.5px] font-medium text-ink xl:inline">{t('chrome.ctaText')}</span>}
      <button
        onClick={openWhatsApp}
        className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#25D366] px-3 text-[12px] font-bold text-white shadow-sm hover:brightness-95"
      >
        <MessageCircle size={13} /> {t('chrome.ctaBtn')}
      </button>
      <span className="text-[10px] text-ink2">{t('brand.powered')}</span>
    </div>
  )
}

export function SubBar() {
  return (
    <div className="no-print sticky top-[60px] z-30 hidden h-[44px] items-center justify-between border-b border-line bg-subtle px-5 lg:flex">
      <RoleSwitcher />
      <CtaBlock />
    </div>
  )
}
