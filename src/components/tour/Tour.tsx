import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, MessageCircle, Sparkles } from 'lucide-react'
import { useApp } from '@/store/app'
import { useT } from '@/i18n'
import { findVisible, lsGet, lsSet, openWhatsApp } from '@/lib/utils'
import { Button, Modal } from '@/components/ui'
import { getTourSteps } from './steps'

interface Box {
  x: number
  y: number
  w: number
  h: number
}
const PAD = 8

export default function Tour() {
  const { t } = useT()
  const navigateRaw = useNavigate()
  const navRef = useRef(navigateRaw)
  navRef.current = navigateRaw
  const navigate = useCallback((to: string) => navRef.current(to), [])
  const open = useApp((s) => s.tourOpen)
  const tourKey = useApp((s) => s.tourKey)
  const role = useApp((s) => s.role)
  const lang = useApp((s) => s.lang)
  const stopTour = useApp((s) => s.stopTour)
  const setMoreOpen = useApp((s) => s.setMoreOpen)
  const setSheetOpen = useApp((s) => s.setSheetOpen)
  const [mobile, setMobile] = useState(() => window.innerWidth < 1024)
  const steps = useMemo(() => getTourSteps(role, lang, mobile), [role, lang, mobile])
  const [idx, setIdx] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [finalOpen, setFinalOpen] = useState(false)
  const timers = useRef<number[]>([])
  const targetEl = useRef<HTMLElement | null>(null)

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => clearTimeout(id))
    timers.current = []
  }, [])
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  // restart on open / role / language change
  useEffect(() => {
    setIdx(0)
  }, [tourKey, role, lang])

  useEffect(() => {
    const h = () => {
      setMobile(window.innerWidth < 1024)
      setVp({ w: window.innerWidth, h: window.innerHeight })
    }
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const measure = useCallback(() => {
    const el = targetEl.current
    if (!el) return setBox(null)
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return
    setBox({ x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 })
    setVp({ w: window.innerWidth, h: window.innerHeight })
  }, [])

  // prepare + measure each step
  useEffect(() => {
    if (!open) return
    clearTimers()
    const step = steps[idx]
    if (!step) return
    targetEl.current = null
    setBox(null)
    if (step.path && window.location.pathname !== step.path.split('?')[0]) navigate(step.path)
    if (!step.target) {
      setMoreOpen(false)
      setSheetOpen(false)
      return
    }
    const sel = `[data-tour="${step.target}"]`
    const locate = (attempt: number) => {
      let el = findVisible(sel)
      // desktop: if the item lives inside "Más ▾" open it; mobile: open the sheet
      if (!el && attempt === 0) {
        if (mobile) setSheetOpen(true)
        else setMoreOpen(true)
        later(() => locate(1), 260)
        return
      }
      if (!el && attempt < 3) {
        later(() => locate(attempt + 1), 220)
        return
      }
      if (!el) return
      el = el as HTMLElement
      targetEl.current = el
      el.scrollIntoView({ block: 'center' })
      later(measure, 260)
      later(measure, 480)
    }
    // close containers first unless the target is already visible without them
    const visibleNow = findVisible(sel)
    const inSheet = visibleNow?.closest('[data-tour="mobile-sheet"]')
    const inMore = visibleNow?.closest('[data-radix-popper-content-wrapper]')
    if (!visibleNow || (!inSheet && !inMore)) {
      setMoreOpen(false)
      setSheetOpen(false)
    }
    later(() => locate(0), 120)
    return clearTimers
  }, [open, idx, steps, mobile, navigate, clearTimers, later, measure, setMoreOpen, setSheetOpen])

  // re-measure on resize/scroll (no scrollIntoView here)
  useEffect(() => {
    if (!open) return
    const h = () => measure()
    window.addEventListener('resize', h)
    window.addEventListener('scroll', h, true)
    return () => {
      window.removeEventListener('resize', h)
      window.removeEventListener('scroll', h, true)
    }
  }, [open, measure])

  const teardown = useCallback(() => {
    clearTimers()
    targetEl.current = null
    setBox(null)
    stopTour()
  }, [clearTimers, stopTour])

  const finish = useCallback(() => {
    const key = `fleta_tour_completed_${role}`
    const already = lsGet(key)
    teardown()
    lsSet(key, '1')
    if (!already) setFinalOpen(true)
  }, [role, teardown])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') teardown()
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, steps.length - 1))
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, teardown, steps.length])

  const step = steps[idx]
  const last = idx === steps.length - 1

  // tooltip placement
  const tipW = Math.min(360, vp.w - 24)
  let tipStyle: React.CSSProperties
  if (!step?.target || !box) {
    tipStyle = { left: '50%', top: '50%', translate: '-50% -50%', width: tipW }
  } else {
    const below = box.y + box.h + 14
    const estH = 230
    const top = below + estH < vp.h ? below : Math.max(12, box.y - estH - 14)
    const left = Math.min(Math.max(12, box.x + box.w / 2 - tipW / 2), vp.w - tipW - 12)
    tipStyle = { left, top, width: tipW }
  }

  return (
    <>
      {open && step && (
        <div className="fixed inset-0 z-[9000]" aria-live="polite">
          {/* overlay with a clean hole via SVG mask (no 9999px box-shadow) */}
          <svg className="absolute inset-0 h-full w-full" width={vp.w} height={vp.h}>
            <defs>
              <mask id="fleta-tour-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {box && step.target && <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="12" fill="black" />}
              </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(10,10,10,.55)" mask="url(#fleta-tour-mask)" />
          </svg>

          {box && step.target && (
            <div
              className="pointer-events-none absolute rounded-[12px] border-2 border-accent transition-all duration-200"
              style={{ left: box.x, top: box.y, width: box.w, height: box.h, boxShadow: '0 0 0 4px rgba(31,91,255,.25), 0 0 28px 4px rgba(31,91,255,.45)' }}
            >
              <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-blue-500 ring-2 ring-white" />
              </span>
            </div>
          )}

          <motion.div
            key={`${tourKey}-${idx}`}
            className="absolute rounded-2xl border border-line bg-card p-5 text-ink shadow-pop"
            style={tipStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-bold text-accent">
              <Sparkles size={12} /> {t('tour.step', { x: idx + 1, y: steps.length })}
            </span>
            <h3 className="mt-2.5 text-[17px] font-extrabold tracking-tight">{step.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink2">{step.body}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button onClick={teardown} className="text-[12.5px] font-semibold text-ink2 hover:text-ink">
                {t('tour.skip')}
              </button>
              <div className="flex gap-2">
                {idx > 0 && (
                  <Button variant="secondary" size="sm" onClick={() => setIdx(idx - 1)}>
                    <ArrowLeft size={14} /> {t('common.back')}
                  </Button>
                )}
                <Button size="sm" onClick={() => (last ? finish() : setIdx(idx + 1))}>
                  {last ? t('tour.finish') : t('common.next')} {!last && <ArrowRight size={14} />}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Modal open={finalOpen} onClose={() => setFinalOpen(false)} className="max-w-[440px]" z="z-[9001]">
        <div className="p-7 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
            <Sparkles size={22} />
          </span>
          <h3 className="mt-4 text-[20px] font-extrabold tracking-tight">{t('tour.doneTitle')}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-ink2">{t('tour.doneBody')}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" className="flex-1" onClick={() => setFinalOpen(false)}>
              {t('tour.explore')}
            </Button>
            <Button
              className="flex-1 bg-[#25D366] hover:bg-[#1fb957]"
              onClick={() => {
                setFinalOpen(false)
                openWhatsApp()
              }}
            >
              <MessageCircle size={16} /> {t('tour.want')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
