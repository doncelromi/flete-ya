import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Check, Eye, EyeOff, Lock, MessageCircle, Printer, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import { useApp } from '@/store/app'
import { useT } from '@/i18n'
import { cn, openWhatsApp, usd } from '@/lib/utils'
import { Button, Card, Pill } from '@/components/ui'
import { CIRCUITO, FASE2, MODULOS, type Modulo } from './content'

function ModuloCard({ m, highlighted, setRef }: { m: Modulo; highlighted: boolean; setRef: (el: HTMLDivElement | null) => void }) {
  const { P, L } = useT()
  const abrirPreview = useApp((s) => s.abrirPreview)
  const num = String(m.n).padStart(2, '0')
  return (
    <div
      ref={setRef}
      data-modulo={m.n}
      className={cn(
        'flex flex-col rounded-card border bg-card p-5 shadow-card transition-all duration-500',
        highlighted ? '-translate-y-1 border-accent shadow-pop ring-4 ring-accent/25' : 'border-line',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="mono text-[13px] font-bold text-accent">{num}</span>
        {highlighted && (
          <Pill tone="accent" className="text-[10px]">
            {L('Recién visto', 'Just viewed')}
          </Pill>
        )}
      </div>
      <h3 className="mt-2 text-[13.5px] font-semibold uppercase tracking-[.04em] text-ink">{P(m.title)}</h3>
      <p className="mt-1.5 text-[13.5px] leading-snug text-ink2">{P(m.desc)}</p>
      <ul className="mt-3 space-y-1.5">
        {m.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-ink">
            <Check size={14} className="mt-0.5 shrink-0 text-accent" strokeWidth={2.6} />
            {P(b)}
          </li>
        ))}
      </ul>
      {m.link && (
        <button
          onClick={() => abrirPreview(m.n, m.link!.view, m.link!.role, `${num} · ${P(m.title)}`, m.link!.device)}
          className="mt-auto inline-flex items-center gap-1 self-start pt-4 text-[13px] font-bold text-accent hover:underline"
        >
          {L('Ver en el demo', 'See it in the demo')} <ArrowUpRight size={15} />
          {m.link.device === 'mobile' && <span className="ml-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold">{L('vista celular', 'mobile view')}</span>}
        </button>
      )}
    </div>
  )
}

function Inversion() {
  const { L } = useT()
  const [open, setOpen] = useState(false)
  return (
    <Card className="overflow-hidden p-5 sm:p-7" data-inversion>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="kpi-label">{L('Propuesta económica', 'Pricing')}</div>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-tight">{L('Inversión', 'Investment')}</h2>
        </div>
        {!open && <span className="mono select-none text-[30px] font-bold tracking-[.2em] text-ink2">••••••</span>}
        <Button variant={open ? 'secondary' : 'primary'} size="lg" onClick={() => setOpen((v) => !v)} className="no-print min-w-[180px]">
          {open ? <EyeOff size={17} /> : <Eye size={17} />}
          {open ? L('Ocultar inversión', 'Hide investment') : L('Ver inversión', 'Show investment')}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="inv"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-6">
              <div className="rounded-card border border-accent/30 bg-accent-soft/50 p-5">
                <div className="kpi-label text-accent">{L('Inversión total del proyecto', 'Total project investment')}</div>
                <div className="mono mt-2 text-[44px] font-bold leading-none tracking-tight text-ink sm:text-[56px]">{usd(5000)}</div>
                <div className="mt-2 text-[13.5px] font-semibold text-ink2">{L('12 semanas · entregables 00 a 08', '12 weeks · deliverables 00 to 08')}</div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-card border border-line p-5">
                  <div className="kpi-label">{L('Opción A · En dos pagos', 'Option A · Two payments')}</div>
                  <div className="mono mt-2 text-[30px] font-bold leading-none tracking-tight">{usd(5000)}</div>
                  <div className="mt-4 overflow-hidden rounded-card border border-line">
                    <table className="w-full text-[13.5px]">
                      <tbody>
                        <tr>
                          <td className="px-4 py-3 font-semibold">{L('50% al firmar', '50% on signing')}</td>
                          <td className="mono px-4 py-3 text-right">{usd(2500)}</td>
                        </tr>
                        <tr className="border-t border-line">
                          <td className="px-4 py-3 font-semibold">{L('50% a 30 días', '50% at 30 days')}</td>
                          <td className="mono px-4 py-3 text-right">{usd(2500)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-card border-2 border-accent bg-accent-soft p-5">
                  <div className="flex items-center gap-2 text-[15px] font-extrabold text-accent">
                    <Sparkles size={17} /> {L('Opción B · Pago único: 15% de descuento', 'Option B · Single payment: 15% off')}
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="mono text-[16px] text-ink2 line-through">{usd(5000)}</span>
                    <span className="mono text-[30px] font-bold leading-none text-accent">{usd(4250)}</span>
                  </div>
                  <p className="mt-4 rounded-lg bg-card px-4 py-3 text-[13px] font-semibold">
                    {L('Ahorrás {n} pagando el 100% al firmar.', 'You save {n} by paying 100% on signing.', { n: usd(750) })}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[12.5px] text-ink2">
                {L(
                  'Los módulos de Fase 2 (09 a 12) no están incluidos: se cotizan aparte cuando la plataforma esté funcionando.',
                  'Phase 2 modules (09 to 12) are not included: they are quoted separately once the platform is live.',
                )}
              </p>

              <p className="mt-4 flex items-start gap-2 text-[12.5px] text-ink2">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-st-green" />
                {L(
                  'Garantía: si el primer prototipo no cumple lo acordado, te devolvemos el 100%. Incluye 1 mes de soporte post-entrega.',
                  'Guarantee: if the first prototype doesn’t meet what we agreed, we refund 100%. Includes 1 month of post-delivery support.',
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default function Propuesta() {
  const { L, P, t } = useT()
  const destacado = useApp((s) => s.moduloDestacado)
  const limpiar = useApp((s) => s.limpiarDestacado)
  const refs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    if (destacado === null) return
    const t1 = setTimeout(() => refs.current[destacado]?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120)
    // fallback if smooth scrolling was skipped (background tab, reduced motion)
    const t3 = setTimeout(() => {
      const el = refs.current[destacado]
      if (!el) return
      const r = el.getBoundingClientRect()
      if (Math.abs(r.top + r.height / 2 - window.innerHeight / 2) > 160) el.scrollIntoView({ block: 'center' })
    }, 950)
    const t2 = setTimeout(() => limpiar(), 4200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [destacado, limpiar])

  return (
    <div className="print-page mx-auto max-w-[1180px]">
      {/* 7.1 header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[720px]">
          <Pill tone="accent" className="text-[10.5px] tracking-[.08em]">
            {L('PROPUESTA COMERCIAL', 'SALES PROPOSAL')}
          </Pill>
          <h1 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight sm:text-[40px]">{L('Propuesta para Jonathan', 'Proposal for Jonathan')}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink2">
            {L(
              'Plataforma completa de fletes: apps iOS y Android, web responsive y panel de administración, con conductores verificados y pagos con tarjeta o efectivo.',
              'A complete moving-van platform: iOS and Android apps, responsive web and an admin panel, with verified drivers and card or cash payments.',
            )}
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} /> {L('Imprimir', 'Print')}
          </Button>
          <Button onClick={openWhatsApp} className="bg-[#25D366] hover:bg-[#1fb957]">
            <MessageCircle size={16} /> {L('Avanzar por WhatsApp', 'Move forward on WhatsApp')}
          </Button>
        </div>
      </div>

      {/* 7.2 circuit */}
      <section className="mt-10" data-trailer="circuito">
        <h2 className="text-[18px] font-extrabold tracking-tight">{L('El circuito', 'The loop')}</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {CIRCUITO.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, translate: '0px 10px' }}
              animate={{ opacity: 1, translate: '0px 0px' }}
              transition={{ delay: 0.05 * i }}
              className={cn(
                'relative flex flex-col rounded-card border p-4',
                c.highlight ? 'border-accent bg-accent-soft shadow-pop' : 'border-line bg-card shadow-card',
              )}
            >
              <span className={cn('mono text-[10.5px] font-bold tracking-[.1em]', c.highlight ? 'text-accent' : 'text-ink2')}>
                {L('PASO', 'STEP')} {i + 1}
              </span>
              <h3 className="mt-1.5 text-[14.5px] font-bold leading-snug text-ink">{P(c.title)}</h3>
              <p className="mt-1.5 text-[12.5px] leading-snug text-ink2">{P(c.body)}</p>
              {c.highlight && (
                <span className="mt-3 inline-flex self-start rounded-full bg-accent px-2.5 py-0.5 text-[10.5px] font-bold text-white">
                  {L('Lo que te diferencia', 'What sets you apart')}
                </span>
              )}
            </motion.div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-[13px] text-ink2">
          <RotateCcw size={14} />
          {L(
            'Y vuelve a empezar: cada viaje suma reputación y datos para asignar mejor el próximo.',
            'And it starts again: every trip adds reputation and data to assign the next one better.',
          )}
        </p>
      </section>

      {/* 7.3 modules */}
      <section className="mt-12" data-trailer="modulos">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[18px] font-extrabold tracking-tight">{L('Qué incluye la plataforma', 'What the platform includes')}</h2>
          <div className="text-right">
            <div className="mono text-[14px] font-bold text-ink">{L('9 entregables · Fase 1', '9 deliverables · Phase 1')}</div>
            <div className="text-[12px] text-ink2">{L('+ 4 módulos Fase 2', '+ 4 Phase 2 modules')}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((m) => (
            <ModuloCard key={m.n} m={m} highlighted={destacado === m.n} setRef={(el) => (refs.current[m.n] = el)} />
          ))}
        </div>

        <h3 className="mt-10 text-[12px] font-bold uppercase tracking-[.1em] text-ink2">{L('Fase 2 · Extensión', 'Phase 2 · Extension')}</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FASE2.map((m) => (
            <div key={m.n} className="rounded-card border border-dashed border-line bg-subtle p-5 opacity-75">
              <div className="flex items-center justify-between">
                <span className="mono text-[13px] font-bold text-ink2">{m.n}</span>
                <Pill tone="neutral">
                  <Lock size={10} /> {t('common.phase2')}
                </Pill>
              </div>
              <h4 className="mt-2 flex items-start gap-2 text-[13.5px] font-semibold uppercase tracking-[.03em] text-ink">
                <Lock size={14} className="mt-0.5 shrink-0 text-ink2" /> {P(m.title)}
              </h4>
              <p className="mt-1.5 text-[12.5px] text-ink2">{P(m.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7.4 investment — always last, hidden by default, never persisted */}
      <section className="mt-12">
        <Inversion />
      </section>

      {/* 7.5 close */}
      <section className="no-print mt-10 pb-6">
        <Button size="xl" onClick={openWhatsApp} className="w-full bg-[#25D366] text-[16px] hover:bg-[#1fb957]">
          <MessageCircle size={19} /> {L('Avanzar por WhatsApp', 'Move forward on WhatsApp')}
        </Button>
        <p className="mt-3 text-center text-[11px] text-ink2">{t('brand.powered')}</p>
      </section>
    </div>
  )
}
