import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, LogOut, Menu, MoreHorizontal, Sparkles, X } from 'lucide-react'
import { useApp } from '@/store/app'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { Logo } from '@/components/brand'
import { LangToggle, ThemeToggle } from './toggles'
import { CtaBlock, RoleSwitcher, USER_NAME, useNavGo } from './Topbar'
import { NAV, PHASE2, PROPUESTA, isActive, navFor } from './navConfig'

export function MobileTopbar() {
  const { t } = useT()
  const setSheetOpen = useApp((s) => s.setSheetOpen)
  const startTour = useApp((s) => s.startTour)
  const trailer = useApp((s) => s.trailer)
  const goTo = useNavGo()
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur-md lg:hidden">
      <button onClick={() => goTo('/propuesta')}>
        <Logo size={28} />
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={startTour}
          disabled={trailer}
          className="flex h-8 items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-2.5 text-[12px] font-bold text-accent"
        >
          <Sparkles size={13} /> {t('chrome.tour')}
        </button>
        <button onClick={() => setSheetOpen(true)} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card" aria-label={t('chrome.menu')}>
          <Menu size={17} />
        </button>
      </div>
    </header>
  )
}

/** Bottom nav: Propuesta + next 3 views of the role + "Más" (opens the sheet with everything). */
export function BottomNav() {
  const { t } = useT()
  const { pathname } = useLocation()
  const role = useApp((s) => s.role)
  const sheetOpen = useApp((s) => s.sheetOpen)
  const setSheetOpen = useApp((s) => s.setSheetOpen)
  const goTo = useNavGo()
  const items = navFor(role).slice(0, 4)
  return (
    <nav
      data-tour="main-nav"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto grid h-[62px] max-w-xl grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon
          const act = isActive(pathname, it.path)
          return (
            <button
              key={it.id}
              data-tour={`nav-${it.id}`}
              onClick={() => goTo(it.path)}
              className={cn('flex flex-col items-center justify-center gap-1 text-[10.5px] font-semibold', act ? 'text-accent' : 'text-ink2')}
            >
              <span className={cn('grid h-7 w-11 place-items-center rounded-full transition-colors', act && 'bg-accent-soft')}>
                <Icon size={18} />
              </span>
              <span className="max-w-full truncate px-0.5">{t(it.label)}</span>
            </button>
          )
        })}
        <button
          data-tour="nav-more-mobile"
          onClick={() => setSheetOpen(!sheetOpen)}
          className={cn('flex flex-col items-center justify-center gap-1 text-[10.5px] font-semibold', sheetOpen ? 'text-accent' : 'text-ink2')}
        >
          <span className={cn('grid h-7 w-11 place-items-center rounded-full', sheetOpen && 'bg-accent-soft')}>
            <MoreHorizontal size={18} />
          </span>
          {t('chrome.more')}
        </button>
      </div>
    </nav>
  )
}

export function MobileSheet() {
  const { t } = useT()
  const { pathname } = useLocation()
  const role = useApp((s) => s.role)
  const open = useApp((s) => s.sheetOpen)
  const setOpen = useApp((s) => s.setSheetOpen)
  const logout = useApp((s) => s.logout)
  const startTour = useApp((s) => s.startTour)
  const tourOpen = useApp((s) => s.tourOpen)
  const goTo = useNavGo()
  if (!open) return null
  const all = [PROPUESTA, ...NAV[role]]
  return (
    <div className="fixed inset-0 z-[45] lg:hidden">
      <motion.div className="absolute inset-0 bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => !tourOpen && setOpen(false)} />
      <motion.div
        data-tour="mobile-sheet"
        className="absolute inset-x-0 bottom-0 max-h-[86%] overflow-y-auto rounded-t-[22px] border-t border-line bg-card pb-[80px] shadow-pop"
        initial={{ translate: '0px 40px', opacity: 0 }}
        animate={{ translate: '0px 0px', opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={USER_NAME[role]} size={32} />
            <div>
              <div className="text-[13.5px] font-bold">{USER_NAME[role]}</div>
              <div className="text-[11.5px] text-ink2">{t(`role.${role}`)}</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-subtle" aria-label={t('chrome.close')}>
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 px-4 pt-4">
          <div className="grid grid-cols-2 gap-2">
            {all.map((it) => {
              const Icon = it.icon
              const act = isActive(pathname, it.path)
              return (
                <button
                  key={it.id}
                  data-tour={`nav-${it.id}`}
                  onClick={() => goTo(it.path)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-[13px] font-semibold',
                    act ? 'border-accent bg-accent text-white' : it.id === 'propuesta' ? 'border-accent/40 text-accent' : 'border-line text-ink',
                  )}
                >
                  <Icon size={16} /> {t(it.label)}
                </button>
              )
            })}
            {role === 'admin' &&
              PHASE2.map((it, i) => (
                <button
                  key={it.id}
                  data-tour={i === 0 ? 'nav-fase2' : undefined}
                  onClick={() => goTo(it.path)}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-3 text-left text-[12.5px] font-semibold text-ink2"
                >
                  <Lock size={14} /> {t(it.label)}
                </button>
              ))}
          </div>

          <div className="rounded-xl border border-line bg-subtle p-3">
            <RoleSwitcher className="flex-col items-start gap-2" />
          </div>

          <div className="rounded-xl border border-line bg-subtle p-3">
            <CtaBlock className="flex-wrap" compact />
            <p className="mt-2 text-[12.5px] text-ink">{t('chrome.ctaText')}</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-ink2">
              {t('chrome.language')} · {t('chrome.theme')}
            </span>
            <div className="flex items-center gap-2">
              <LangToggle />
              <ThemeToggle />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setOpen(false)
                startTour()
              }}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-accent/30 bg-accent-soft text-[13px] font-bold text-accent"
            >
              <Sparkles size={15} /> {t('chrome.tour')}
            </button>
            <button onClick={logout} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line text-[13px] font-semibold text-st-red">
              <LogOut size={15} /> {t('chrome.logout')}
            </button>
          </div>
          <p className="text-center text-[10px] text-ink2">{t('brand.powered')}</p>
        </div>
      </motion.div>
    </div>
  )
}
