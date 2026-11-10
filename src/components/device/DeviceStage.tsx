import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Maximize2, Signal, Sparkles, Wifi } from 'lucide-react'
import { useApp } from '@/store/app'
import { useT } from '@/i18n'
import { setFrameWindow, postToFrame } from '@/lib/frame'
import { Logo } from '@/components/brand'
import { Button } from '@/components/ui'
import { DeviceToggle, LangToggle, ThemeToggle } from '@/components/layout/toggles'
import { CtaBlock } from '@/components/layout/Topbar'
import { cleanPath, useParentBridge } from './bridges'

/** Real responsive preview: the same SPA inside a same-origin iframe at 390px (never a CSS scale). */
export default function DeviceStage() {
  const { t } = useT()
  const iframe = useRef<HTMLIFrameElement>(null)
  const setDevice = useApp((s) => s.setDevice)
  const theme = useApp((s) => s.theme)
  useParentBridge(iframe)

  // src is computed once: later navigation is synced by postMessage (no reloads)
  const [src] = useState(() => {
    const s = useApp.getState()
    const path = cleanPath(window.location.pathname, window.location.search)
    const sep = path.includes('?') ? '&' : '?'
    return `${path}${sep}device=frame&theme=${s.theme}&lang=${s.lang}&role=${s.role}`
  })

  useEffect(() => () => setFrameWindow(null), [])

  const dark = theme === 'dark'
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0b0d14] text-white">
      {/* ambience */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(31,91,255,.35),transparent_60%),radial-gradient(900px_500px_at_110%_110%,rgba(31,91,255,.25),transparent_60%)]" />
      <div className="pointer-events-none absolute left-[8%] top-[30%] h-[320px] w-[320px] rounded-full bg-accent opacity-20 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[5%] right-[10%] h-[280px] w-[280px] rounded-full bg-[#7aa2ff] opacity-15 blur-[110px]" />

      {/* slim control bar */}
      <div className="relative z-10 flex h-[56px] shrink-0 items-center justify-between px-6">
        <div className="[&_.text-ink]:!text-white [&_.text-ink2]:!text-white/60">
          <Logo />
        </div>
        <div className="flex items-center gap-2">
          <DeviceToggle compact={false} />
          <LangToggle />
          <ThemeToggle />
          <button
            onClick={() => postToFrame({ type: 'startTour' })}
            className="flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 text-[12.5px] font-bold text-white hover:bg-white/20"
          >
            <Sparkles size={14} /> {t('chrome.tour')}
          </button>
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center gap-10 px-6 pb-6">
        {/* left rail */}
        <div className="hidden w-[240px] flex-col gap-3 xl:flex">
          <span className="self-start rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] font-semibold backdrop-blur">
            iPhone 15 · <span className="mono">390 × 844</span>
          </span>
          <p className="text-[13px] leading-relaxed text-white/70">{t('device.tip')}.</p>
          <Button variant="secondary" size="sm" onClick={() => setDevice('desktop')} className="self-start border-white/20 bg-white/10 text-white hover:bg-white/20">
            <Maximize2 size={14} /> {t('device.fullscreen')}
          </Button>
        </div>

        {/* phone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative shrink-0 rounded-[44px] bg-[#111216] p-[11px] shadow-[0_40px_120px_-20px_rgba(0,0,0,.8),0_0_0_1px_rgba(255,255,255,.08)_inset]"
          style={{ height: 'min(844px, calc(100vh - 80px))' }}
        >
          <div className="pointer-events-none absolute inset-[3px] rounded-[41px] border border-white/10" />
          <div className={`relative flex h-full w-[390px] flex-col overflow-hidden rounded-[34px] ${dark ? 'bg-[#09090b]' : 'bg-white'}`}>
            {/* status bar */}
            <div className={`relative flex h-[44px] shrink-0 items-center justify-between px-7 text-[14px] font-semibold ${dark ? 'text-white' : 'text-black'}`}>
              <span className="mono">9:41</span>
              <span className="absolute left-1/2 top-[9px] h-[26px] w-[104px] -translate-x-1/2 rounded-full bg-black" />
              <span className="flex items-center gap-1.5">
                <Signal size={14} strokeWidth={2.6} />
                <Wifi size={14} strokeWidth={2.6} />
                <span className="relative inline-block h-[12px] w-[24px] rounded-[4px] border-[1.5px] border-current opacity-90">
                  <span className="absolute inset-[1.5px] right-[5px] rounded-[2px] bg-current" />
                </span>
              </span>
            </div>
            <iframe
              ref={(el) => {
                ;(iframe as React.MutableRefObject<HTMLIFrameElement | null>).current = el
                setFrameWindow(el?.contentWindow ?? null)
              }}
              onLoad={() => setFrameWindow(iframe.current?.contentWindow ?? null)}
              src={src}
              title="Fletes ya · mobile"
              className="min-h-0 w-full flex-1 border-0"
            />
            {/* gesture bar */}
            <div className="flex h-[22px] shrink-0 items-center justify-center">
              <span className={`h-[5px] w-[134px] rounded-full ${dark ? 'bg-white/80' : 'bg-black/80'}`} />
            </div>
          </div>
        </motion.div>

        {/* right rail */}
        <div className="hidden w-[240px] flex-col gap-3 xl:flex">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur [&_.text-ink]:!text-white [&_.text-ink2]:!text-white/60">
            <CtaBlock className="flex-wrap" compact />
            <p className="mt-2 text-[12.5px] text-white/80">{t('chrome.ctaText')}</p>
          </div>
        </div>
      </div>

      {/* compact rails for < xl */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 xl:hidden">
        <span className="self-start rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] font-semibold">
          iPhone 15 · <span className="mono">390 × 844</span>
        </span>
        <Button variant="secondary" size="sm" onClick={() => setDevice('desktop')} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
          <Maximize2 size={14} /> {t('device.fullscreen')}
        </Button>
      </div>
    </div>
  )
}
