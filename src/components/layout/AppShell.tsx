import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { roleForPath, useApp } from '@/store/app'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { Button, Modal } from '@/components/ui'
import { BrandName, LogoMark } from '@/components/brand'
import { SubBar, Topbar } from './Topbar'
import { BottomNav, MobileSheet, MobileTopbar } from './MobileNav'

/** If a route of another role is opened by URL, switch to that role automatically. */
function useRoleFromPath() {
  const { pathname } = useLocation()
  const role = useApp((s) => s.role)
  const setRole = useApp((s) => s.setRole)
  useEffect(() => {
    // read the live URL: right after leaving the phone frame the router state can lag one tick
    const r = roleForPath(window.location.pathname)
    if (r && r !== role) setRole(r)
  }, [pathname, role, setRole])
}

export function BackToProposal() {
  const { t } = useT()
  const preview = useApp((s) => s.preview)
  const trailer = useApp((s) => s.trailer)
  const cerrar = useApp((s) => s.cerrarPreview)
  useEffect(() => {
    if (!preview) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [preview, cerrar])
  if (!preview || trailer) return null
  return (
    <div className="no-print pointer-events-none fixed left-3 top-[66px] z-[35] flex items-center gap-2 lg:left-5 lg:top-[116px]">
      <motion.button
        data-back-proposal
        initial={{ opacity: 0, translate: '-8px 0px' }}
        animate={{ opacity: 1, translate: '0px 0px' }}
        onClick={cerrar}
        className="halo-loop pointer-events-auto relative isolate inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-bold text-white shadow-pop"
      >
        <ArrowLeft size={15} /> {t('preview.back')}
      </motion.button>
      <span className="pointer-events-auto hidden max-w-[380px] truncate rounded-full border border-white/40 bg-white/60 px-3 py-1.5 text-[12px] font-medium text-ink shadow-card backdrop-blur-md dark:border-white/10 dark:bg-black/40 sm:inline-block">
        {t('preview.viewing')} <b>{preview.titulo}</b>
      </span>
    </div>
  )
}

export function WelcomeModal() {
  const { t } = useT()
  const open = useApp((s) => s.welcomeOpen)
  const close = useApp((s) => s.closeWelcome)
  return (
    <Modal open={open} closeOnBackdrop={false} showClose={false} className="max-w-[520px]" z="z-[85]">
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <LogoMark size={36} />
          <BrandName className="text-[22px] text-accent" />
        </div>
        <h2 className="mt-6 text-[26px] font-extrabold tracking-tight">{t('welcome.hi')}</h2>
        <p className="mt-3 text-[15px] font-medium leading-relaxed text-ink">{t('welcome.p1')}</p>
        <p className="mt-3 text-[14px] leading-relaxed text-ink2">{t('welcome.p2')}</p>
        <p className="mt-4 text-[14px] italic text-ink">{t('welcome.p3')}</p>
        <Button size="lg" className="mt-6 w-full" onClick={close}>
          {t('welcome.cta')}
        </Button>
        <p className="mt-3 text-center text-[10.5px] text-ink2">{t('brand.powered')}</p>
      </div>
    </Modal>
  )
}

export default function AppShell() {
  useRoleFromPath()
  const preview = useApp((s) => s.preview)
  const trailer = useApp((s) => s.trailer)
  const role = useApp((s) => s.role)
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="min-h-screen bg-bg">
      <Topbar />
      <SubBar />
      <MobileTopbar />
      <BackToProposal />
      <main
        className={cn(
          'mx-auto w-full px-4 pb-28 pt-5 lg:px-6 lg:pb-12',
          role === 'admin' ? 'max-w-[1400px]' : 'max-w-[1240px]',
          preview && !trailer && 'pt-[64px] lg:pt-[68px]',
        )}
      >
        <Outlet />
      </main>
      <BottomNav />
      <MobileSheet />
    </div>
  )
}
