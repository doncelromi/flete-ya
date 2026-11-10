import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { useApp, type Role } from '@/store/app'
import { useTrip } from '@/store/trip'
import { useT } from '@/i18n'
import { findVisible, openWhatsApp } from '@/lib/utils'
import { LogoMark } from '@/components/brand'

type Pair = [string, string]
export interface TrailerScene {
  view?: string
  role?: Role
  selector?: string
  click?: string[]
  run?: () => Promise<void> | void
  position?: 'top' | 'bottom'
  chapter: Pair
  title: Pair
  body: Pair
  duration: number
  cta?: boolean
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const SCENES: TrailerScene[] = [
  {
    view: '/propuesta',
    role: 'cliente',
    selector: '[data-trailer="circuito"]',
    chapter: ['Propuesta', 'Proposal'],
    title: ['Todo lo que incluye Fletes ya', 'Everything Fletes ya includes'],
    body: ['Del pedido al cobro: un circuito completo con conductores verificados.', 'From booking to payment: a full loop with verified drivers.'],
    duration: 7000,
  },
  {
    view: '/propuesta',
    role: 'cliente',
    selector: '[data-trailer="modulos"]',
    chapter: ['Propuesta', 'Proposal'],
    title: ['9 entregables en la Fase 1', '9 deliverables in Phase 1'],
    body: ['Apps iOS y Android, web, matching, pagos, panel, verificación y calificaciones.', 'iOS and Android apps, web, matching, payments, panel, verification and ratings.'],
    duration: 6000,
  },
  {
    view: '/pedir',
    role: 'cliente',
    run: () => useTrip.getState().resetCustomer(),
    click: ['[data-trailer="vehicle-chico"]'],
    chapter: ['Cliente', 'Customer'],
    title: ['Elegís el vehículo mirando la foto', 'Pick the vehicle by its picture'],
    body: ['Fiorino, Traffic o Ducato, con la tarifa por hora a la vista.', 'Fiorino, Traffic or Ducato, with the hourly rate in plain sight.'],
    duration: 7000,
  },
  {
    view: '/pedir',
    role: 'cliente',
    click: ['[data-trailer="pedir-btn"]'],
    chapter: ['Cliente', 'Customer'],
    title: ['Matching con conductores verificados', 'Matching with verified drivers'],
    body: ['En segundos aparece Martín: ★4.9, Fiorino blanca, a 6 minutos.', 'In seconds Martín shows up: ★4.9, white Fiorino, 6 minutes away.'],
    duration: 8000,
  },
  {
    view: '/viaje',
    role: 'cliente',
    run: () => {
      const t = useTrip.getState()
      if (t.phase !== 'asignado') t.assign()
      t.setStatus('en_camino')
    },
    selector: '[data-trailer="driver-marker"]',
    chapter: ['Mi viaje', 'My trip'],
    title: ['Lo ves acercarse en el mapa', 'Watch him approach on the map'],
    body: ['GPS en vivo y el reloj de la hora corriendo, con el costo acumulado.', 'Live GPS and the hourly clock running, with the cost so far.'],
    duration: 8000,
  },
  {
    view: '/viaje',
    role: 'cliente',
    run: async () => {
      const t = useTrip.getState()
      for (const s of ['en_origen', 'cargando', 'en_viaje'] as const) {
        t.setStatus(s)
        await wait(700)
      }
      t.setStatus('completado')
    },
    selector: '[data-modal]',
    chapter: ['Mi viaje', 'My trip'],
    title: ['Entregado y cobrado', 'Delivered and paid'],
    body: ['Tarjeta aprobada o efectivo confirmado por el conductor, con comprobante al instante.', 'Card approved or cash confirmed by the driver, with an instant receipt.'],
    duration: 7000,
  },
  {
    view: '/viaje',
    role: 'cliente',
    click: ['[data-trailer="open-rating"]', '[data-trailer="star-5"]', '[data-trailer="send-rating"]'],
    chapter: ['Mi viaje', 'My trip'],
    title: ['Calificación mutua', 'Two-way rating'],
    body: ['5 estrellas para Martín; él también califica a Lucía.', '5 stars for Martín; he rates Lucía too.'],
    duration: 6000,
  },
  {
    view: '/conductor/inicio',
    role: 'conductor',
    click: ['[data-trailer="simulate-request"]', '[data-trailer="accept-request"]'],
    chapter: ['Conductor', 'Driver'],
    title: ['Al conductor le entra el viaje', 'The driver gets the trip'],
    body: ['Solicitud con cuenta regresiva: ruta, tarifa, método de pago y distancia.', 'Request with a countdown: route, fare, payment method and distance.'],
    duration: 7000,
  },
  {
    view: '/admin/operacion',
    role: 'admin',
    selector: '[data-trailer="ops-map"]',
    chapter: ['Admin', 'Admin'],
    title: ['31 conductores en línea, en vivo', '31 drivers online, live'],
    body: ['Viajes en curso, conductores libres y el radio de matching por zona.', 'Trips in progress, free drivers and the matching radius per zone.'],
    duration: 7000,
  },
  {
    view: '/admin/verificacion',
    role: 'admin',
    click: ['[data-trailer="approve"]'],
    chapter: ['Admin', 'Admin'],
    title: ['Nadie maneja sin papeles aprobados', 'Nobody drives without approved papers'],
    body: ['Cédula, licencia, antecedentes y seguro: aprobás y el conductor recibe la notificación.', 'ID, license, background and insurance: approve and the driver is notified.'],
    duration: 7000,
  },
  {
    view: '/admin/comisiones',
    role: 'admin',
    selector: '[data-trailer="saldo-col"]',
    chapter: ['Admin', 'Admin'],
    title: ['Efectivo y tarjeta, cruzados solos', 'Cash and card, reconciled automatically'],
    body: ['El saldo neto de cada conductor: quién le debe a quién, sin una sola cuenta a mano.', 'Each driver’s net balance: who owes whom, without a single manual calculation.'],
    duration: 9000,
    cta: true,
  },
]

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export default function Trailer() {
  const { t, lang } = useT()
  const navigateRaw = useNavigate()
  // useNavigate() changes identity on every route change; keep it in a ref so the scene loop never restarts
  const navRef = useRef(navigateRaw)
  navRef.current = navigateRaw
  const navigate = useCallback((to: string) => navRef.current(to), [])
  const on = useApp((s) => s.trailer)
  const setTrailer = useApp((s) => s.setTrailer)
  const setRole = useApp((s) => s.setRole)
  const [idx, setIdx] = useState(0)
  const [ring, setRing] = useState<Rect | null>(null)
  const [cursor, setCursor] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2, down: false })
  const runId = useRef(0)
  const P = (p: Pair) => (lang === 'en' ? p[1] : p[0])

  const exit = useCallback(() => {
    runId.current++
    setTrailer(false)
    setRing(null)
    navigate('/login')
  }, [setTrailer, navigate])

  useEffect(() => {
    if (!on) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && exit()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [on, exit])

  useEffect(() => {
    if (!on) return
    const my = ++runId.current
    const alive = () => runId.current === my
    const find = async (sel: string) => {
      for (let i = 0; i < 12 && alive(); i++) {
        const el = findVisible(sel)
        if (el) return el
        await wait(250)
      }
      return null
    }
    const frame = (el: HTMLElement) => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return wait(450).then(() => {
        const r = el.getBoundingClientRect()
        setRing({ x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 })
        return r
      })
    }
    ;(async () => {
      let i = 0
      while (alive()) {
        const sc = SCENES[i]
        setIdx(i)
        setRing(null)
        const started = Date.now()
        if (sc.role) setRole(sc.role)
        if (sc.view && window.location.pathname !== sc.view) navigate(sc.view)
        await wait(800)
        if (!alive()) return
        if (sc.run) await sc.run()
        if (sc.selector) {
          const el = await find(sc.selector)
          if (el && alive()) {
            const r = await frame(el)
            setCursor({ x: r.left + r.width / 2, y: r.top + r.height / 2, down: false })
          }
        }
        for (const sel of sc.click ?? []) {
          if (!alive()) return
          const el = await find(sel)
          if (!el) continue
          const r = await frame(el)
          setCursor({ x: r.left + r.width / 2, y: r.top + r.height / 2, down: false })
          await wait(750)
          if (!alive()) return
          setCursor((c) => ({ ...c, down: true }))
          el.click()
          await wait(260)
          setCursor((c) => ({ ...c, down: false }))
          await wait(1100)
        }
        const left = sc.duration - (Date.now() - started)
        if (left > 0) await wait(left)
        i = (i + 1) % SCENES.length
      }
    })()
    return () => {
      runId.current++
    }
  }, [on, navigate, setRole])

  if (!on) return null
  const sc = SCENES[idx]
  return (
    <>
      {/* click shield so the viewer doesn't break the sequence */}
      <div className="fixed inset-0 z-[9990]" />
      {ring && (
        <div
          className="pointer-events-none fixed z-[9991] rounded-[14px] border-2 border-accent transition-all duration-500"
          style={{ left: ring.x, top: ring.y, width: ring.w, height: ring.h, boxShadow: '0 0 0 4px rgba(31,91,255,.28), 0 0 36px 6px rgba(31,91,255,.45)' }}
        />
      )}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9993]"
        animate={{ x: cursor.x - 6, y: cursor.y - 4 }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
      >
        <svg width="26" height="30" viewBox="0 0 26 30" style={{ scale: cursor.down ? '0.85' : '1', transition: 'scale .15s' }}>
          <path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 16 L21 16 Z" fill="#1F5BFF" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        {cursor.down && <span className="absolute -left-3 -top-3 h-8 w-8 animate-ping rounded-full bg-accent/50" />}
      </motion.div>

      {/* glass caption */}
      <div className="fixed bottom-6 left-1/2 z-[9994] w-[min(640px,calc(100vw-32px))]" style={{ translate: '-50% 0' }}>
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-white/30 bg-white/70 p-4 shadow-pop backdrop-blur-xl dark:border-white/10 dark:bg-black/55"
        >
          <div className="flex items-start gap-3">
            <LogoMark size={34} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.1em] text-accent">
                <span className="pulse-dot" /> {P(sc.chapter)} · {idx + 1}/{SCENES.length}
              </div>
              <div className="mt-0.5 text-[17px] font-extrabold tracking-tight text-ink">{P(sc.title)}</div>
              <div className="text-[13.5px] text-ink2">{P(sc.body)}</div>
              {sc.cta && (
                <button onClick={openWhatsApp} className="relative z-[9995] mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-[14px] font-bold text-white shadow-sm">
                  <MessageCircle size={16} /> {t('trailer.cta')}
                </button>
              )}
            </div>
            <button onClick={exit} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/5 text-ink hover:bg-black/10 dark:bg-white/10" aria-label={t('trailer.exit')}>
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 flex gap-1">
            {SCENES.map((_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i <= idx ? 'bg-accent' : 'bg-black/10 dark:bg-white/15'}`} />
            ))}
          </div>
        </motion.div>
      </div>
    </>
  )
}
