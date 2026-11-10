import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, FileUp, RotateCcw, Send, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { DevNotice } from '@/components/shared'
import { Button, Card, InfoDot, Pill, Progress, SectionTitle } from '@/components/ui'
import { CONTACTS } from '@/data/contacts'
import { driverById } from '@/data/drivers'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { SearchInput, useCountUp } from './kit'

type Stage = 'idle' | 'loading' | 'done'
const DEFAULT_SEL = () => new Set(CONTACTS.filter((c) => !c.duplicadoDe).map((c) => c.id))
const FUNNEL = { registrados: 64, docs: 41, aprobados: 33 } // for 97 invites

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function ImportTab() {
  const { L } = useT()
  const [stage, setStage] = useState<Stage>('idle')
  const [pct, setPct] = useState(0)
  const [drag, setDrag] = useState(false)
  const [sel, setSel] = useState<Set<string>>(DEFAULT_SEL)
  const [sent, setSent] = useState(0)
  const [q, setQ] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current)
  }, [])

  const startImport = () => {
    if (stage !== 'idle') return
    setStage('loading')
    setPct(0)
    const t0 = Date.now()
    timer.current = setInterval(() => {
      const k = Math.min(100, ((Date.now() - t0) / 1500) * 100)
      setPct(k)
      if (k >= 100) {
        if (timer.current) clearInterval(timer.current)
        timer.current = null
        setStage('done')
        toast.success(L('Agenda importada: 100 contactos', 'Contacts imported: 100 contacts'), {
          description: L('Detectamos 3 que ya están registrados como conductores.', 'We found 3 already registered as drivers.'),
        })
      }
    }, 60)
  }

  const reset = () => {
    setStage('idle')
    setPct(0)
    setSel(DEFAULT_SEL())
    setSent(0)
    setQ('')
  }

  const visible = useMemo(() => {
    const nq = norm(q.trim())
    return nq ? CONTACTS.filter((c) => norm(`${c.nombre} ${c.telefono}`).includes(nq)) : CONTACTS
  }, [q])

  const allSelectable = CONTACTS.filter((c) => !c.duplicadoDe)
  const allOn = allSelectable.every((c) => sel.has(c.id))
  const toggleAll = () => setSel(allOn ? new Set() : DEFAULT_SEL())
  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const count = sel.size
  const send = () => {
    if (!count) return
    setSent(count)
    toast.success(L('Invitación enviada por WhatsApp a {n} conductores', 'WhatsApp invite sent to {n} drivers', { n: count }), {
      description: L('Cada uno recibe un link personalizado para registrarse en Fletes ya.', 'Each one gets a personalized link to sign up on Fletes ya.'),
    })
  }

  const scale = (v: number) => Math.round((v * sent) / 97)

  return (
    <div className="grid gap-4">
      {/* dropzone */}
      {stage !== 'done' ? (
        <Card className="p-4 sm:p-5">
          <SectionTitle right={<Pill tone="accent">{L('Entregable 00', 'Deliverable 00')}</Pill>}>{L('Migrá tu agenda', 'Migrate your contacts')}</SectionTitle>
          <p className="-mt-1 mb-4 text-[13px] text-ink2">
            {L(
              'Subí el archivo exportado de tu celular (.vcf o .csv) y detectamos a tus fleteros de confianza para invitarlos a la app.',
              'Upload the file exported from your phone (.vcf or .csv) and we’ll detect your trusted drivers to invite them to the app.',
            )}
          </p>
          <button
            onClick={startImport}
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              startImport()
            }}
            data-trailer="import-dropzone"
            className={cn(
              'flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-4 py-10 text-center transition-colors',
              drag ? 'border-accent bg-accent-soft' : 'border-line bg-subtle hover:border-accent/50 hover:bg-accent-soft/40',
            )}
          >
            {stage === 'loading' ? (
              <div className="w-full max-w-sm">
                <div className="mb-2 flex items-center justify-between text-[12.5px]">
                  <span className="mono font-semibold text-ink">agenda_sion.vcf</span>
                  <span className="mono text-ink2">{Math.round(pct)}%</span>
                </div>
                <Progress value={pct} />
                <div className="mt-2 text-[12px] text-ink2">{L('Leyendo contactos y buscando duplicados…', 'Reading contacts and checking duplicates…')}</div>
              </div>
            ) : (
              <>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-card text-accent shadow-card">
                  <FileUp size={22} />
                </span>
                <span className="text-[14px] font-bold text-ink">{L('Arrastrá tu archivo o hacé clic para elegirlo', 'Drag your file or click to choose it')}</span>
                <span className="mono text-[11.5px] text-ink2">.vcf · .csv</span>
              </>
            )}
          </button>
          <div className="mt-3 flex items-start gap-2 text-[12px] text-ink2">
            <Smartphone size={14} className="mt-0.5 shrink-0" />
            {L('En Android: Contactos → Exportar. En iPhone: iCloud → Contactos → Exportar vCard.', 'On Android: Contacts → Export. On iPhone: iCloud → Contacts → Export vCard.')}
          </div>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, translate: '0px 8px' }} animate={{ opacity: 1, translate: '0px 0px' }} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* contacts */}
          <Card className="min-w-0 p-0">
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
              <CheckCircle2 size={16} className="text-st-green" />
              <span className="mono text-[13px] font-semibold text-ink">agenda_sion.vcf</span>
              <span className="text-[12.5px] text-ink2">· {L('100 contactos', '100 contacts')}</span>
              <Pill tone="amber" className="ml-auto">
                <AlertTriangle size={11} /> {L('3 ya registrados', '3 already registered')}
              </Pill>
              <button onClick={reset} className="grid h-7 w-7 place-items-center rounded-full text-ink2 hover:bg-subtle hover:text-ink" title={L('Volver a importar', 'Import again')}>
                <RotateCcw size={14} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
              <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-semibold text-ink">
                <input type="checkbox" checked={allOn} onChange={toggleAll} className="h-4 w-4 cursor-pointer" style={{ accentColor: 'var(--accent)' }} />
                {L('Seleccionar todos', 'Select all')}
              </label>
              <span className="text-[12.5px] text-ink2">
                <span className="mono font-bold text-accent">{count}</span> {L('seleccionados', 'selected')}
              </span>
              <SearchInput value={q} onChange={setQ} placeholder={L('Buscar contacto', 'Search contact')} className="ml-auto w-full sm:w-56" />
            </div>
            <ul className="max-h-[440px] overflow-y-auto">
              {visible.map((c) => {
                const dup = c.duplicadoDe ? driverById(c.duplicadoDe) : null
                const on = sel.has(c.id)
                return (
                  <li key={c.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 border-b border-line px-4 py-2 text-[13px] transition-colors hover:bg-subtle',
                        dup && 'bg-[var(--amber-soft)]/60',
                      )}
                    >
                      <input type="checkbox" checked={on} onChange={() => toggle(c.id)} className="h-4 w-4 shrink-0 cursor-pointer" style={{ accentColor: 'var(--accent)' }} />
                      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
                        <span className={cn('block truncate font-medium sm:w-56', dup ? 'text-ink2' : 'text-ink')}>{c.nombre}</span>
                        <span className="mono block text-[12px] text-ink2">{c.telefono}</span>
                      </div>
                      {dup && (
                        <span className="hidden shrink-0 items-center gap-1 text-[11.5px] font-semibold text-st-amber sm:inline-flex">
                          <AlertTriangle size={12} /> {L('Ya registrado como {n}', 'Already registered as {n}', { n: dup.nombre })}
                        </span>
                      )}
                      {dup && <AlertTriangle size={14} className="shrink-0 text-st-amber sm:hidden" aria-label={dup.nombre} />}
                    </label>
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-2 px-4 py-3">
              <Button onClick={send} disabled={!count} className="w-full sm:w-auto" data-trailer="whatsapp-invite">
                <Send size={15} /> {L('Enviar invitación por WhatsApp a {n} conductores', 'Send WhatsApp invite to {n} drivers', { n: count })}
              </Button>
              <InfoDot text={L('Envío masivo vía WhatsApp Business API con link de registro personalizado.', 'Bulk sending via WhatsApp Business API with a personalized sign-up link.')} />
            </div>
          </Card>

          <Funnel sent={sent} scale={scale} />
        </motion.div>
      )}

      {stage === 'done' && (
        <DevNotice
          title={L('Envío masivo de invitaciones por WhatsApp', 'Bulk WhatsApp invitations')}
          now={L('el envío de las invitaciones (no sale ningún mensaje real).', 'sending the invitations (no real message goes out).')}
          later={L('WhatsApp Business API con link de registro personalizado y seguimiento de apertura.', 'WhatsApp Business API with a personalized sign-up link and open tracking.')}
        />
      )}
    </div>
  )
}

function Funnel({ sent, scale }: { sent: number; scale: (v: number) => number }) {
  const { L } = useT()
  const steps = [
    { label: L('Invitados', 'Invited'), v: sent, tone: 'accent' as const },
    { label: L('Registrados', 'Signed up'), v: sent ? scale(FUNNEL.registrados) : 0, tone: 'accent' as const },
    { label: L('Con documentos', 'With documents'), v: sent ? scale(FUNNEL.docs) : 0, tone: 'amber' as const },
    { label: L('Aprobados', 'Approved'), v: sent ? scale(FUNNEL.aprobados) : 0, tone: 'green' as const },
  ]
  return (
    <Card className="h-fit p-4">
      <div className="flex items-center gap-1.5">
        <h3 className="text-[14px] font-bold text-ink">{L('Progreso del onboarding', 'Onboarding progress')}</h3>
        <InfoDot text={L('En la versión final se actualiza en tiempo real a medida que cada conductor avanza en el registro.', 'In the final version it updates in real time as each driver progresses through sign-up.')} />
      </div>
      <p className="mt-0.5 text-[12px] text-ink2">
        {sent ? L('Proyección a 14 días de la invitación', '14-day projection after the invite') : L('Enviá las invitaciones para empezar', 'Send the invites to get started')}
      </p>
      <div className="mt-4 grid gap-3.5">
        {steps.map((s, i) => (
          <FunnelRow key={i} label={s.label} v={s.v} max={Math.max(1, sent)} tone={s.tone} delay={i * 150} />
        ))}
      </div>
      {sent > 0 && (
        <div className="mt-4 rounded-lg bg-[var(--green-soft)] px-3 py-2 text-[12px] text-st-green">
          {L('Conversión invitación → aprobado', 'Invite → approved conversion')}: <span className="mono font-bold">{Math.round((scale(FUNNEL.aprobados) / sent) * 100)}%</span>
        </div>
      )}
    </Card>
  )
}

function FunnelRow({ label, v, max, tone, delay }: { label: string; v: number; max: number; tone: 'accent' | 'amber' | 'green'; delay: number }) {
  const [target, setTarget] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setTarget(v), delay)
    return () => clearTimeout(t)
  }, [v, delay])
  const n = useCountUp(target, 900)
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
        <span className="font-semibold text-ink">{label}</span>
        <span className="mono text-[15px] font-bold text-ink">{n}</span>
      </div>
      <Progress value={(target / max) * 100} tone={tone} />
    </div>
  )
}
