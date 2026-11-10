import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AlertTriangle, Camera, ChevronRight, CircleDollarSign, HelpCircle, ImageIcon, LifeBuoy, MessageSquare, PackageX, Send, UserX, X } from 'lucide-react'
import { Button, Card, Drawer, InfoDot, Label, Pill, Select, Textarea } from '@/components/ui'
import { PageHeader, PreviewBanner } from '@/components/shared'
import { INCIDENT_LABEL } from '@/data/labels'
import { LUCIA_TRIPS } from '@/data/trips'
import { at, fmtDM, fmtRelative } from '@/data/dates'
import { useT, type Pair } from '@/i18n'
import { cn } from '@/lib/utils'

type IncType = 'danado' | 'cobro' | 'no_llego' | 'otro'
interface Incident {
  id: string
  tipo: IncType
  tripId: number
  fecha: string
  resumen: Pair
  descripcion: Pair
  estado: 'resuelta' | 'revision'
  foto?: string
  timeline: { fecha: string; texto: Pair; done?: boolean }[]
}

const TYPE_ICON: Record<IncType, typeof AlertTriangle> = { danado: PackageX, cobro: CircleDollarSign, no_llego: UserX, otro: HelpCircle }

const done = LUCIA_TRIPS.filter((t) => t.estado === 'completado')
const tripA = done[3] ?? LUCIA_TRIPS[0]
const tripB = done[0] ?? LUCIA_TRIPS[0]

const INITIAL: Incident[] = [
  {
    id: 'INC-2317',
    tipo: 'danado',
    tripId: tripB.id,
    fecha: at(-1, 18, 20),
    resumen: ['Espejo con un raspón', 'Mirror with a scratch'],
    descripcion: [
      'El espejo del placard llegó con un raspón en la esquina inferior. Estaba envuelto en film.',
      'The wardrobe mirror arrived with a scratch on the lower corner. It was wrapped in film.',
    ],
    estado: 'revision',
    foto: 'IMG_2041.jpg',
    timeline: [
      { fecha: at(-1, 18, 20), texto: ['Recibimos tu reclamo con 1 foto', 'We received your claim with 1 photo'], done: true },
      { fecha: at(-1, 18, 45), texto: ['Asignado a un agente de soporte', 'Assigned to a support agent'], done: true },
      { fecha: at(0, 10, 5), texto: ['Pedimos el descargo del conductor', 'We requested the driver’s statement'], done: true },
      { fecha: at(1, 12, 0), texto: ['Resolución estimada', 'Estimated resolution'] },
    ],
  },
  {
    id: 'INC-2291',
    tipo: 'cobro',
    tripId: tripA.id,
    fecha: at(-30, 16, 10),
    resumen: ['Se reintegraron $U 600', '$U 600 refunded'],
    descripcion: [
      'Me cobraron 15 minutos más de lo que duró el viaje según el reloj de la app.',
      'I was charged 15 minutes more than the trip lasted according to the app clock.',
    ],
    estado: 'resuelta',
    timeline: [
      { fecha: at(-30, 16, 10), texto: ['Recibimos tu reclamo', 'We received your claim'], done: true },
      { fecha: at(-30, 17, 0), texto: ['Revisamos el recorrido GPS y el reloj del viaje', 'We reviewed the GPS track and the trip clock'], done: true },
      { fecha: at(-29, 11, 30), texto: ['Reintegro de $U 600 a tu Visa ··4417', '$U 600 refunded to your Visa ··4417'], done: true },
      { fecha: at(-29, 11, 31), texto: ['Reclamo resuelto', 'Claim resolved'], done: true },
    ],
  },
]

export default function Soporte() {
  const { L, P, lang } = useT()
  const [items, setItems] = useState<Incident[]>(INITIAL)
  const [tipo, setTipo] = useState<IncType | null>(null)
  const [tripId, setTripId] = useState<number>(LUCIA_TRIPS[0].id)
  const [desc, setDesc] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ tipo?: boolean; desc?: boolean }>({})
  const [open, setOpen] = useState<Incident | null>(null)
  const close = useCallback(() => setOpen(null), [])

  const tripOptions = useMemo(() => LUCIA_TRIPS.map((t) => ({ id: t.id, label: `#${t.id} · ${fmtDM(t.fecha)} · ${t.destino.label}` })), [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs = { tipo: !tipo, desc: desc.trim().length < 5 }
    setErrors(errs)
    if (errs.tipo || errs.desc || !tipo) {
      toast.error(L('Completá el tipo de problema y una descripción', 'Pick the issue type and add a description'))
      return
    }
    const id = `INC-${2318 + items.length - INITIAL.length}`
    const now = new Date().toISOString()
    const inc: Incident = {
      id,
      tipo,
      tripId,
      fecha: now,
      resumen: [desc.trim().slice(0, 60), desc.trim().slice(0, 60)],
      descripcion: [desc.trim(), desc.trim()],
      estado: 'revision',
      foto: foto ?? undefined,
      timeline: [
        { fecha: now, texto: foto ? ['Recibimos tu reclamo con 1 foto', 'We received your claim with 1 photo'] : ['Recibimos tu reclamo', 'We received your claim'], done: true },
        { fecha: now, texto: ['Te respondemos en menos de 24 h', 'We’ll reply within 24 h'] },
      ],
    }
    setItems((xs) => [inc, ...xs])
    toast.success(L('Recibimos tu reclamo #{id}', 'We received your claim #{id}', { id }))
    setTipo(null)
    setDesc('')
    setFoto(null)
    setErrors({})
  }

  return (
    <div>
      <PreviewBanner
        id="Soporte"
        bullets={[
          L('Reclamos con fotos vinculados al viaje y al recorrido GPS', 'Claims with photos linked to the trip and GPS track'),
          L('Panel de soporte para el equipo con seguimiento y reintegros', 'Support panel for the team with tracking and refunds'),
          L('Notificaciones por email y push en cada avance del reclamo', 'Email and push notifications on every claim update'),
        ]}
      />
      <PageHeader
        title={L('Soporte', 'Support')}
        subtitle={L('¿Algo salió mal? Contanos y lo resolvemos.', 'Something went wrong? Tell us and we’ll fix it.')}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        {/* form */}
        <Card className="p-4 sm:p-5">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label>{L('¿Qué pasó?', 'What happened?')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(INCIDENT_LABEL) as IncType[]).map((k) => {
                  const Icon = TYPE_ICON[k]
                  const sel = tipo === k
                  return (
                    <button
                      type="button"
                      key={k}
                      onClick={() => {
                        setTipo(k)
                        setErrors((e) => ({ ...e, tipo: false }))
                      }}
                      className={cn(
                        'flex min-h-[52px] items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left text-[13px] font-semibold transition-colors',
                        sel ? 'border-accent bg-accent-soft/70 text-ink' : 'border-line bg-card text-ink hover:border-accent/40',
                        errors.tipo && !sel && 'border-st-red/40',
                      )}
                    >
                      <Icon size={17} className={sel ? 'text-accent' : 'text-ink2'} />
                      <span className="leading-tight">{P(INCIDENT_LABEL[k])}</span>
                    </button>
                  )
                })}
              </div>
              {errors.tipo && <p className="mt-1.5 text-[12px] font-semibold text-st-red">{L('Elegí un tipo de problema', 'Choose an issue type')}</p>}
            </div>

            <div>
              <Label>{L('Viaje relacionado', 'Related trip')}</Label>
              <Select value={tripId} onChange={(e) => setTripId(Number(e.target.value))} className="h-11">
                {tripOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>{L('Descripción', 'Description')}</Label>
              <Textarea
                value={desc}
                onChange={(e) => {
                  setDesc(e.target.value)
                  if (e.target.value.trim().length >= 5) setErrors((x) => ({ ...x, desc: false }))
                }}
                placeholder={L('Contanos qué pasó con el mayor detalle posible…', 'Tell us what happened in as much detail as possible…')}
                className={cn('min-h-[104px]', errors.desc && 'border-st-red/60')}
              />
              {errors.desc && <p className="mt-1.5 text-[12px] font-semibold text-st-red">{L('Agregá una descripción', 'Add a description')}</p>}
            </div>

            <div>
              <Label className="flex items-center gap-1">
                {L('Adjuntar foto', 'Attach photo')} <span className="font-normal text-ink2">({L('opcional', 'optional')})</span>
                <InfoDot text={L('La carga real de fotos a la nube llega en la versión final.', 'Real photo upload to the cloud comes in the final version.')} />
              </Label>
              {foto ? (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-subtle p-2.5">
                  <FakeThumb />
                  <div className="min-w-0 flex-1">
                    <div className="mono truncate text-[13px] font-bold text-ink">{foto}</div>
                    <div className="text-[11.5px] text-ink2">2,4 MB · {L('lista para enviar', 'ready to send')}</div>
                  </div>
                  <button type="button" onClick={() => setFoto(null)} className="grid h-9 w-9 place-items-center rounded-full text-ink2 hover:bg-card hover:text-ink" aria-label={L('Quitar', 'Remove')}>
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFoto(`IMG_${2040 + Math.floor(Math.random() * 60)}.jpg`)
                    toast(L('Foto adjuntada', 'Photo attached'))
                  }}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-line px-4 py-6 text-center transition-colors hover:border-accent/50 hover:bg-accent-soft/30"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
                    <Camera size={19} />
                  </span>
                  <span className="text-[13.5px] font-semibold text-ink">{L('Tocá para subir una foto', 'Tap to upload a photo')}</span>
                  <span className="text-[11.5px] text-ink2">JPG, PNG · {L('hasta 10 MB', 'up to 10 MB')}</span>
                </button>
              )}
            </div>

            <Button type="submit" size="xl" className="w-full">
              <Send size={16} /> {L('Enviar reclamo', 'Submit claim')}
            </Button>
          </form>
        </Card>

        {/* list */}
        <div>
          <h2 className="mb-3 text-[15px] font-bold tracking-tight text-ink">{L('Mis reclamos', 'My claims')}</h2>
          <div className="space-y-2.5">
            {items.map((inc, i) => {
              const Icon = TYPE_ICON[inc.tipo]
              return (
                <motion.button
                  key={inc.id}
                  layout="position"
                  initial={{ opacity: 0, translate: '0px 8px' }}
                  animate={{ opacity: 1, translate: '0px 0px' }}
                  transition={{ delay: i < 2 ? i * 0.05 : 0 }}
                  onClick={() => setOpen(inc)}
                  className="flex w-full items-center gap-3 rounded-card border border-line bg-card p-3.5 text-left shadow-card hover:border-accent/30"
                >
                  <span
                    className={cn(
                      'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                      inc.estado === 'resuelta' ? 'bg-[var(--green-soft)] text-st-green' : 'bg-[var(--amber-soft)] text-st-amber',
                    )}
                  >
                    <Icon size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[13.5px] font-bold text-ink">{P(INCIDENT_LABEL[inc.tipo])}</span>
                      <Pill tone={inc.estado === 'resuelta' ? 'green' : 'amber'}>
                        {inc.estado === 'resuelta' ? L('Resuelta', 'Resolved') : L('En revisión', 'Under review')}
                      </Pill>
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px] text-ink2">
                      {L('viaje', 'trip')} <span className="mono font-bold">#{inc.tripId}</span> · {P(inc.resumen)}
                    </div>
                    <div className="mono mt-0.5 text-[11px] text-ink2">
                      {inc.id} · {fmtRelative(inc.fecha, lang)}
                    </div>
                  </div>
                  <ChevronRight size={17} className="shrink-0 text-ink2" />
                </motion.button>
              )
            })}
          </div>

          <Card className="mt-4 flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <LifeBuoy size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-ink">{L('¿Urgencia durante un viaje?', 'Urgent issue during a trip?')}</div>
              <div className="text-[12px] text-ink2">{L('Chat en vivo con soporte, todos los días de 8 a 22 h', 'Live chat with support, daily 8 am to 10 pm')}</div>
            </div>
            <Button variant="soft" size="sm" onClick={() => toast(L('Chat de soporte simulado · función en desarrollo', 'Simulated support chat · feature in development'))}>
              <MessageSquare size={14} /> Chat
            </Button>
          </Card>
        </div>
      </div>

      <Drawer open={!!open} onClose={close}>
        {open && <IncidentDetail inc={open} />}
      </Drawer>
    </div>
  )
}

function FakeThumb({ big }: { big?: boolean }) {
  return (
    <div
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600 text-white/90',
        big ? 'h-40 w-full' : 'h-12 w-12',
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
      <div className="absolute left-[30%] top-[20%] h-[55%] w-[40%] rounded-sm border-2 border-white/50 bg-white/20" />
      <ImageIcon size={big ? 26 : 16} className="relative" />
    </div>
  )
}

function IncidentDetail({ inc }: { inc: Incident }) {
  const { L, P, lang } = useT()
  const trip = LUCIA_TRIPS.find((t) => t.id === inc.tripId)
  return (
    <div className="p-5 sm:p-6">
      <div className="pr-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono text-[13px] font-bold text-ink2">{inc.id}</span>
          <Pill tone={inc.estado === 'resuelta' ? 'green' : 'amber'}>{inc.estado === 'resuelta' ? L('Resuelta', 'Resolved') : L('En revisión', 'Under review')}</Pill>
        </div>
        <h3 className="mt-1.5 text-[20px] font-extrabold tracking-tight text-ink">{P(INCIDENT_LABEL[inc.tipo])}</h3>
        {trip && (
          <div className="text-[12.5px] text-ink2">
            {L('Viaje', 'Trip')} <span className="mono font-bold text-ink">#{trip.id}</span> · {fmtRelative(trip.fecha, lang)} · {trip.destino.label}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-card border border-line bg-subtle p-3.5 text-[13.5px] leading-relaxed text-ink">{P(inc.descripcion)}</div>
      {inc.foto && (
        <div className="mt-3">
          <FakeThumb big />
          <div className="mono mt-1.5 text-[11.5px] text-ink2">{inc.foto}</div>
        </div>
      )}

      <div className="kpi-label mb-3 mt-6">{L('Seguimiento', 'Timeline')}</div>
      <ol className="relative space-y-4 pl-6">
        <span className="absolute bottom-2 left-[7px] top-2 w-px bg-line" />
        {inc.timeline.map((ev, i) => (
          <li key={i} className="relative">
            <span
              className={cn(
                'absolute -left-6 top-0.5 grid h-[15px] w-[15px] place-items-center rounded-full border-2',
                ev.done ? (inc.estado === 'resuelta' ? 'border-st-green bg-st-green' : 'border-accent bg-accent') : 'border-st-amber bg-card',
              )}
            />
            <div className={cn('text-[13.5px] font-semibold', ev.done ? 'text-ink' : 'text-st-amber')}>{P(ev.texto)}</div>
            <div className="mono text-[11.5px] text-ink2">{fmtRelative(ev.fecha, lang)}</div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => toast(L('Comentario agregado al reclamo {id}', 'Comment added to claim {id}', { id: inc.id }))}
        >
          <MessageSquare size={15} /> {L('Agregar comentario', 'Add comment')}
        </Button>
        <InfoDot text={L('La conversación con soporte dentro del reclamo llega en la versión final.', 'In-claim conversation with support comes in the final version.')} />
      </div>
    </div>
  )
}
