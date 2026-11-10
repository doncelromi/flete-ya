import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Check, CheckCircle2, Clock, FileText, RotateCcw, ShieldAlert, Send, ShieldCheck, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DRIVERS } from '@/data/drivers'
import { AUDIT_LABEL, CATEGORY_LABEL, DOC_LABEL, VERIF_LABEL } from '@/data/labels'
import { daysUntil, fmtAgo, fmtDate, fmtDM, fmtTime } from '@/data/dates'
import type { DocType, Driver, VerificationStatus } from '@/data/types'
import { Avatar, Button, Card, InfoDot, Kpi, Modal, Pill, SectionTitle, Tabs, Textarea } from '@/components/ui'
import { DevNotice, PageHeader, PreviewBanner, VerifPill } from '@/components/shared'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { DocMock } from './b/DocMock'
import { shortName } from './b/common'

type FieldId = 'nombre' | 'dni' | 'licencia' | 'seguro' | 'vehiculo'
type AuditAction = 'subido' | 'aprobado' | 'rechazado' | 'vencido' | 'recordatorio'
interface ExtraAudit {
  accion: AuditAction
  fecha: string
  por: string
  nota?: string
}

const DOC_ORDER: DocType[] = ['dni', 'licencia', 'antecedentes', 'seguro', 'cedula']
const DOC_SHORT: Record<DocType, [string, string]> = {
  dni: ['Cédula', 'ID'],
  licencia: ['Licencia', 'License'],
  antecedentes: ['Antecedentes', 'Record'],
  seguro: ['Seguro', 'Insurance'],
  cedula: ['Libreta', 'Registration'],
}
const PRIORITY = ['d-diego', 'd-walter']
const ADMIN = 'Jonathan'

const QUICK_REASONS: [string, string][] = [
  ['Foto de la cédula ilegible, pedir una nueva', 'ID photo unreadable, request a new one'],
  ['Seguro vencido, pedir póliza renovada', 'Insurance expired, request the renewed policy'],
  ['La licencia no es profesional', 'The license is not a professional one'],
  ['Antecedentes con más de 90 días', 'Criminal record older than 90 days'],
  ['Los datos no coinciden con el documento', 'Data does not match the document'],
]

function insurance(d: Driver) {
  const doc = d.documentos.find((x) => x.tipo === 'seguro')
  const vence = doc?.vence ?? d.alta
  const days = daysUntil(vence)
  return { vence, days, expired: days < 0 }
}

export default function Verificacion() {
  const { L, P, lang } = useT()

  const [status, setStatus] = useState<Record<string, VerificationStatus>>(() => Object.fromEntries(DRIVERS.map((d) => [d.id, d.verificacion])))
  const [decided, setDecided] = useState<Record<string, number>>({})
  const [extra, setExtra] = useState<Record<string, ExtraAudit[]>>({})
  const [motivos, setMotivos] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<VerificationStatus>('pendiente')
  const [selId, setSelId] = useState<string>('d-diego')
  const [docTab, setDocTab] = useState<DocType>('dni')
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const detailRef = useRef<HTMLDivElement>(null)

  const lists = useMemo(() => {
    const by = (s: VerificationStatus) => DRIVERS.filter((d) => status[d.id] === s)
    const recency = (a: Driver, b: Driver) => (decided[b.id] ?? 0) - (decided[a.id] ?? 0) || b.alta.localeCompare(a.alta)
    const pending = by('pendiente').sort((a, b) => {
      const pa = PRIORITY.indexOf(a.id)
      const pb = PRIORITY.indexOf(b.id)
      if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
      return b.alta.localeCompare(a.alta)
    })
    return { pendiente: pending, aprobado: by('aprobado').sort(recency), rechazado: by('rechazado').sort(recency) }
  }, [status, decided])

  const sel = DRIVERS.find((d) => d.id === selId) ?? lists.pendiente[0] ?? DRIVERS[0]
  const selStatus = status[sel.id]
  const ins = insurance(sel)

  const expiringSoon = useMemo(
    () => DRIVERS.filter((d) => status[d.id] === 'aprobado' && insurance(d).days >= 0 && insurance(d).days <= 30).length,
    [status],
  )

  const select = useCallback((id: string) => {
    setSelId(id)
    setDocTab('dni')
    if (typeof window !== 'undefined' && window.innerWidth < 1024)
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
  }, [])

  const changeTab = (t: VerificationStatus) => {
    setTab(t)
    const first = lists[t][0]
    if (first) {
      setSelId(first.id)
      setDocTab('dni')
    }
  }

  const isChecked = (f: FieldId) => checks[`${sel.id}:${f}`] ?? selStatus === 'aprobado'
  const toggleCheck = (f: FieldId) => setChecks((c) => ({ ...c, [`${sel.id}:${f}`]: !isChecked(f) }))

  const pushAudit = (id: string, e: ExtraAudit) => setExtra((x) => ({ ...x, [id]: [...(x[id] ?? []), e] }))
  const stamp = useRef(1)

  const nextPendingAfter = (id: string) => {
    const rest = lists.pendiente.filter((d) => d.id !== id)
    return rest[0]
  }

  const approve = () => {
    if (ins.expired) {
      toast.error(L('No se puede aprobar: el seguro venció hace {n} días', 'Can’t approve: insurance expired {n} days ago', { n: Math.abs(ins.days) }), {
        description: L('Rechazalo con motivo “Seguro vencido” para que suba la póliza renovada.', 'Reject it with reason “Insurance expired” so they upload the renewed policy.'),
      })
      return
    }
    const now = new Date().toISOString()
    const next = nextPendingAfter(sel.id)
    setStatus((s) => ({ ...s, [sel.id]: 'aprobado' }))
    setDecided((d) => ({ ...d, [sel.id]: stamp.current++ }))
    setChecks((c) => ({ ...c, ...Object.fromEntries((['nombre', 'dni', 'licencia', 'seguro', 'vehiculo'] as FieldId[]).map((f) => [`${sel.id}:${f}`, true])) }))
    pushAudit(sel.id, { accion: 'aprobado', fecha: now, por: ADMIN })
    toast.success(L('Aprobado · se notificó a {n}', 'Approved · {n} was notified', { n: shortName(sel.nombre) }), {
      description: L('Ya puede conectarse y recibir viajes.', 'They can now go online and receive trips.'),
    })
    if (next) {
      setSelId(next.id)
      setDocTab('dni')
    }
  }

  const confirmReject = () => {
    const r = reason.trim()
    if (!r) return
    const now = new Date().toISOString()
    const next = nextPendingAfter(sel.id)
    setStatus((s) => ({ ...s, [sel.id]: 'rechazado' }))
    setDecided((d) => ({ ...d, [sel.id]: stamp.current++ }))
    setMotivos((m) => ({ ...m, [sel.id]: r }))
    pushAudit(sel.id, { accion: 'rechazado', fecha: now, por: ADMIN, nota: r })
    toast(L('Rechazado · se notificó a {n} con el motivo', 'Rejected · {n} was notified with the reason', { n: shortName(sel.nombre) }), { description: r })
    setRejectOpen(false)
    setReason('')
    if (next && tab === 'pendiente') {
      setSelId(next.id)
      setDocTab('dni')
    }
  }

  const reopen = () => {
    setStatus((s) => ({ ...s, [sel.id]: 'pendiente' }))
    pushAudit(sel.id, { accion: 'recordatorio', fecha: new Date().toISOString(), por: ADMIN, nota: L('Vuelto a revisión', 'Sent back to review') })
    setTab('pendiente')
    toast(L('{n} volvió a la cola de pendientes', '{n} is back in the pending queue', { n: shortName(sel.nombre) }))
  }

  const closeReject = useCallback(() => setRejectOpen(false), [])

  /* audit timeline */
  const audit = useMemo(() => {
    const rows: { accion: AuditAction; fecha: string; por: string; doc?: DocType; nota?: string }[] = []
    for (const doc of sel.documentos) for (const a of doc.auditoria) rows.push({ ...a, doc: doc.tipo })
    if (ins.expired) rows.push({ accion: 'vencido', fecha: ins.vence, por: 'sistema', doc: 'seguro' })
    for (const e of extra[sel.id] ?? []) rows.push(e)
    return rows.sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [sel, extra, ins.expired, ins.vence])

  const who = (p: string) => (p === 'conductor' ? L('el conductor', 'the driver') : p === 'sistema' ? L('el sistema', 'the system') : p)

  const licVence = sel.documentos.find((d) => d.tipo === 'licencia')?.vence
  const fields: { id: FieldId; label: string; value: ReactNode; doc: DocType; bad?: boolean }[] = [
    { id: 'nombre', label: L('Nombre y apellido', 'Full name'), value: sel.nombre, doc: 'dni' },
    { id: 'dni', label: 'Cédula', value: <span className="mono">{sel.dni}</span>, doc: 'dni' },
    {
      id: 'licencia',
      label: L('Clase de licencia', 'License class'),
      value: (
        <>
          {sel.licenciaClase}
          {licVence && <span className="text-ink2"> · {L('vence', 'expires')} <span className="mono">{fmtDate(licVence)}</span></span>}
        </>
      ),
      doc: 'licencia',
    },
    {
      id: 'seguro',
      label: L('Vencimiento del seguro', 'Insurance expiry'),
      value: ins.expired ? (
        <span className="text-st-red">
          <span className="mono">{fmtDate(ins.vence)}</span> · <b>{L('VENCIDO hace {n} días', 'EXPIRED {n} days ago', { n: Math.abs(ins.days) })}</b>
        </span>
      ) : (
        <>
          <span className="mono">{fmtDate(ins.vence)}</span>
          <span className={cn(ins.days <= 30 ? 'text-st-amber' : 'text-ink2')}> · {L('vigente, {n} días', 'valid, {n} days', { n: ins.days })}</span>
        </>
      ),
      doc: 'seguro',
      bad: ins.expired,
    },
    {
      id: 'vehiculo',
      label: L('Vehículo y patente', 'Vehicle and plate'),
      value: (
        <>
          {sel.vehiculo.modelo} · {P(CATEGORY_LABEL[sel.vehiculo.categoria])} · <span className="mono">{sel.vehiculo.patente}</span>
        </>
      ),
      doc: 'cedula',
    },
  ]
  const checkedCount = fields.filter((f) => isChecked(f.id)).length

  const list = lists[tab]
  const shown = tab === 'aprobado' ? list.slice(0, 20) : list

  return (
    <div>
      <PreviewBanner
        id="admin-verificacion"
        bullets={[
          L('Cada conductor sube cédula, licencia, antecedentes, seguro y libreta desde la app y queda en cola de revisión.', 'Each driver uploads ID, license, criminal record, insurance and registration from the app and enters the review queue.'),
          L('Comparás cada documento con los datos cargados, aprobás o rechazás con motivo y el conductor recibe el aviso.', 'You compare each document with the entered data, approve or reject with a reason and the driver gets notified.'),
          L('Alertas de documentos vencidos y auditoría de quién aprobó qué y cuándo.', 'Alerts for expired documents and an audit trail of who approved what and when.'),
        ]}
      />
      <PageHeader
        title={L('Verificación de conductores', 'Driver verification')}
        subtitle={L('Nadie maneja para Fletes ya sin pasar por acá.', 'Nobody drives for Fletes ya without passing through here.')}
        actions={
          <Button variant="secondary" size="sm" onClick={() => toast(L('Se envió un recordatorio a los {n} conductores con documentación pendiente', 'A reminder was sent to the {n} drivers with pending documents', { n: lists.pendiente.length }))}>
            <Clock size={14} /> {L('Recordar a pendientes', 'Remind pending')}
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={L('Pendientes', 'Pending')} value={lists.pendiente.length} tone="amber" hint={L('en cola de revisión', 'in review queue')} />
        <Kpi label={L('Aprobados', 'Approved')} value={lists.aprobado.length} tone="green" hint={L('conductores activos', 'active drivers')} />
        <Kpi label={L('Rechazados', 'Rejected')} value={lists.rechazado.length} tone="red" hint={L('con motivo informado', 'with reason sent')} />
        <Kpi label={L('Seguros por vencer', 'Insurance expiring')} value={expiringSoon} hint={L('próximos 30 días', 'next 30 days')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
        {/* ───── Queue ───── */}
        <Card className="flex flex-col overflow-hidden lg:max-h-[calc(100vh-140px)] lg:self-start lg:sticky lg:top-[88px]">
          <div className="border-b border-line p-3">
            <Tabs
              value={tab}
              onChange={changeTab}
              className="w-full"
              items={[
                { id: 'pendiente', label: L('Pendientes', 'Pending'), count: lists.pendiente.length },
                { id: 'aprobado', label: L('Aprobados', 'Approved'), count: lists.aprobado.length },
                { id: 'rechazado', label: L('Rechazados', 'Rejected'), count: lists.rechazado.length },
              ]}
            />
          </div>
          <div className="max-h-[420px] flex-1 overflow-y-auto lg:max-h-none">
            {shown.length === 0 && (
              <div className="p-6 text-center text-[13px] text-ink2">
                <CheckCircle2 className="mx-auto mb-2 text-st-green" size={22} />
                {L('No hay conductores en esta cola.', 'No drivers in this queue.')}
              </div>
            )}
            {shown.map((d) => {
              const i = insurance(d)
              const active = d.id === sel.id
              return (
                <button
                  key={d.id}
                  onClick={() => select(d.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left transition-colors last:border-b-0',
                    active ? 'bg-accent-soft' : 'hover:bg-subtle',
                  )}
                >
                  <Avatar name={d.nombre} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13.5px] font-semibold text-ink">{d.nombre}</span>
                    </div>
                    <div className="truncate text-[11.5px] text-ink2">
                      {d.vehiculo.modelo} · {d.barrio}
                    </div>
                    {status[d.id] === 'rechazado' && (
                      <div className="mt-0.5 truncate text-[11px] text-st-red">{motivos[d.id] ?? (d.motivoRechazo ? P(d.motivoRechazo) : '')}</div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {status[d.id] === 'pendiente' && i.expired ? (
                      <Pill tone="red" className="px-2 text-[10px]">
                        {L('Seguro vencido', 'Insurance expired')}
                      </Pill>
                    ) : (
                      <VerifPill status={status[d.id]} className="px-2 text-[10px]" />
                    )}
                    <span className="text-[10.5px] text-ink2">{L('alta', 'joined')} {fmtAgo(d.alta, lang)}</span>
                  </div>
                </button>
              )
            })}
            {tab === 'aprobado' && list.length > 20 && (
              <div className="px-3 py-3 text-center text-[12px] text-ink2">
                {L('Mostrando los 20 más recientes de {n} aprobados', 'Showing the 20 most recent of {n} approved', { n: list.length })}
              </div>
            )}
          </div>
        </Card>

        {/* ───── Detail ───── */}
        <div ref={detailRef} className="min-w-0 scroll-mt-20 space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start gap-3">
              <Avatar name={sel.nombre} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[18px] font-extrabold tracking-tight text-ink">{sel.nombre}</h2>
                  <VerifPill status={selStatus} />
                </div>
                <div className="mt-0.5 text-[12.5px] text-ink2">
                  {sel.vehiculo.modelo} · {P(CATEGORY_LABEL[sel.vehiculo.categoria])} · {sel.barrio} · <span className="mono">{sel.telefono}</span>
                </div>
                <div className="mt-0.5 text-[12px] text-ink2">
                  {L('Se registró el', 'Signed up on')} <span className="mono">{fmtDate(sel.alta)}</span> · {L('5 documentos cargados', '5 documents uploaded')}
                </div>
              </div>
            </div>

            {ins.expired && selStatus !== 'aprobado' && (
              <div className="mt-4 flex items-start gap-3 rounded-[10px] border border-st-red/30 bg-[var(--red-soft)] p-3">
                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-st-red" />
                <div className="text-[13px] leading-snug text-ink">
                  <b className="text-st-red">{L('Seguro VENCIDO hace {n} días', 'Insurance EXPIRED {n} days ago', { n: Math.abs(ins.days) })}</b>
                  <span className="text-ink2"> · {L('venció el', 'expired on')} <span className="mono">{fmtDate(ins.vence)}</span>. </span>
                  {L('No puede aprobarse hasta que suba la póliza renovada.', 'Cannot be approved until the renewed policy is uploaded.')}
                </div>
              </div>
            )}
            {selStatus === 'rechazado' && (
              <div className="mt-4 flex items-start gap-3 rounded-[10px] border border-st-red/30 bg-[var(--red-soft)] p-3 text-[13px] text-ink">
                <XCircle size={18} className="mt-0.5 shrink-0 text-st-red" />
                <div>
                  <b className="text-st-red">{L('Motivo del rechazo', 'Rejection reason')}: </b>
                  {motivos[sel.id] ?? (sel.motivoRechazo ? P(sel.motivoRechazo) : '—')}
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              {/* document viewer */}
              <div className="min-w-0">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {DOC_ORDER.map((tipo) => {
                    const bad = tipo === 'seguro' && ins.expired
                    const active = docTab === tipo
                    return (
                      <button
                        key={tipo}
                        onClick={() => setDocTab(tipo)}
                        className={cn(
                          'group w-[84px] shrink-0 rounded-[10px] border p-1.5 text-left transition-colors',
                          active ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent/40',
                          bad && 'border-st-red/60 bg-[var(--red-soft)]',
                          bad && active && 'ring-2 ring-st-red/30',
                        )}
                      >
                        <div className="grid h-[52px] place-items-center overflow-hidden rounded-md bg-subtle">
                          <div className={tipo === 'antecedentes' || tipo === 'seguro' ? 'w-[38px]' : 'w-[70px]'}>
                            <DocMock driver={sel} tipo={tipo} expired={bad} className="shadow-none" />
                          </div>
                        </div>
                        <div className={cn('mt-1 truncate text-[10.5px] font-semibold', bad ? 'text-st-red' : 'text-ink')}>{P(DOC_SHORT[tipo])}</div>
                        <div className={cn('text-[9.5px] font-bold uppercase tracking-wide', bad ? 'text-st-red' : 'text-ink2')}>
                          {bad ? L('Vencido', 'Expired') : P(VERIF_LABEL[sel.documentos.find((x) => x.tipo === tipo)?.estado ?? 'pendiente'])}
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="rounded-card border border-line bg-subtle p-4 sm:p-6">
                  <div className={cn('mx-auto', docTab === 'antecedentes' || docTab === 'seguro' ? 'max-w-[300px]' : 'max-w-[440px]')}>
                    <DocMock driver={sel} tipo={docTab} expired={docTab === 'seguro' && ins.expired} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-ink2">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText size={13} /> {P(DOC_LABEL[docTab])} · {L('subido', 'uploaded')} <span className="mono">{fmtDM(sel.documentos.find((d) => d.tipo === docTab)!.auditoria[0].fecha)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {L('Imagen de muestra', 'Sample image')} <InfoDot text={L('En la demo los documentos son imágenes de muestra. En producción se ven las fotos reales que sube el conductor, con zoom.', 'In the demo documents are sample images. In production you see the real photos the driver uploads, with zoom.')} />
                    </span>
                  </div>
                </div>
              </div>

              {/* entered data */}
              <div className="min-w-0">
                <SectionTitle right={<span className="mono text-[12px] font-semibold text-ink2">{checkedCount}/5</span>}>
                  {L('Datos cargados por el conductor', 'Data entered by the driver')}
                </SectionTitle>
                <div className="divide-y divide-line rounded-card border border-line">
                  {fields.map((f) => {
                    const on = isChecked(f.id)
                    return (
                      <div key={f.id} className={cn('flex items-center gap-3 px-3 py-2.5', f.bad && 'bg-[var(--red-soft)]')}>
                        <button onClick={() => setDocTab(f.doc)} className="min-w-0 flex-1 text-left">
                          <div className={cn('text-[11px] font-semibold uppercase tracking-wide', f.bad ? 'text-st-red' : 'text-ink2')}>{f.label}</div>
                          <div className="mt-0.5 text-[13.5px] font-semibold text-ink">{f.value}</div>
                        </button>
                        <button
                          onClick={() => toggleCheck(f.id)}
                          className={cn(
                            'flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[11.5px] font-semibold transition-colors',
                            on ? 'border-st-green/30 bg-[var(--green-soft)] text-st-green' : 'border-line text-ink2 hover:border-accent/40 hover:text-ink',
                          )}
                        >
                          <span className={cn('grid h-4 w-4 place-items-center rounded border', on ? 'border-st-green bg-st-green text-white' : 'border-line bg-card')}>
                            {on && <Check size={11} strokeWidth={3} />}
                          </span>
                          {L('Coincide', 'Matches')}
                        </button>
                      </div>
                    )
                  })}
                </div>

                {selStatus === 'pendiente' ? (
                  <div className="mt-4">
                    <div className="mb-2 text-[12px] text-ink2">
                      {checkedCount === 5
                        ? L('Todo coincide. Podés aprobar.', 'Everything matches. You can approve.')
                        : L('Tildá cada dato después de compararlo con el documento.', 'Tick each field after comparing it with the document.')}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="success" size="lg" data-trailer="approve" onClick={approve}>
                        <ShieldCheck size={17} /> {L('Aprobar', 'Approve')}
                      </Button>
                      <Button variant="danger" size="lg" onClick={() => setRejectOpen(true)}>
                        <XCircle size={17} /> {L('Rechazar', 'Reject')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-card border border-line bg-subtle p-3">
                    <span className="text-[12.5px] text-ink2">
                      {selStatus === 'aprobado' ? L('Conductor habilitado para recibir viajes.', 'Driver enabled to receive trips.') : L('El conductor puede volver a subir la documentación.', 'The driver can upload the documents again.')}
                    </span>
                    <Button variant="secondary" size="sm" onClick={reopen}>
                      <RotateCcw size={13} /> {L('Volver a revisión', 'Back to review')}
                    </Button>
                  </div>
                )}

                {/* audit */}
                <div className="mt-5">
                  <SectionTitle>{L('Auditoría', 'Audit trail')}</SectionTitle>
                  <ol className="relative ml-2 border-l border-line">
                    {audit.slice(0, 9).map((a, i) => {
                      const tone =
                        a.accion === 'aprobado' ? 'bg-st-green' : a.accion === 'rechazado' || a.accion === 'vencido' ? 'bg-st-red' : a.accion === 'recordatorio' ? 'bg-st-amber' : 'bg-accent'
                      return (
                        <li key={`${a.fecha}-${i}`} className="relative pb-3 pl-4 last:pb-0">
                          <span className={cn('absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-card', tone)} />
                          <div className="text-[12.5px] text-ink">
                            <b>{a.nota && a.accion === 'recordatorio' ? a.nota : P(AUDIT_LABEL[a.accion])}</b> {L('por', 'by')} {who(a.por)} ·{' '}
                            <span className="mono text-ink2">
                              {fmtDM(a.fecha)} {a.por === 'sistema' ? '00:00' : fmtTime(a.fecha)}
                            </span>
                          </div>
                          <div className="text-[11.5px] text-ink2">
                            {a.doc ? P(DOC_LABEL[a.doc]) : a.accion === 'rechazado' && a.nota ? a.nota : L('Legajo completo', 'Full file')}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-3 md:grid-cols-2">
            <DevNotice
              title={L('Carga real de documentos (almacenamiento seguro)', 'Real document upload (secure storage)')}
              now={L('Los documentos son imágenes de muestra generadas para la demo.', 'Documents are sample images generated for the demo.')}
              later={L('El conductor sube fotos desde la app; se guardan cifradas y solo el admin puede verlas.', 'The driver uploads photos from the app; they are stored encrypted and only admins can see them.')}
            />
            <DevNotice
              title={L('Consulta automática de antecedentes', 'Automatic background check')}
              now={L('La consulta automática de antecedentes es Fase 2; hoy la validación es manual.', 'The automatic background check is Phase 2; today validation is manual.')}
              later={L('Integración con el registro de antecedentes penales y alerta automática.', 'Integration with the criminal records registry and automatic alerts.')}
            />
          </div>
        </div>
      </div>

      <Modal open={rejectOpen} onClose={closeReject}>
        <div className="p-5">
          <div className="flex items-center gap-2 text-[16px] font-extrabold text-ink">
            <AlertTriangle size={18} className="text-st-red" />
            {L('Rechazar a {n}', 'Reject {n}', { n: sel.nombre })}
          </div>
          <p className="mt-1 text-[13px] text-ink2">{L('El conductor recibe este motivo por notificación y puede volver a subir los documentos.', 'The driver receives this reason as a notification and can upload the documents again.')}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((q) => (
              <button
                key={q[0]}
                onClick={() => setReason(P(q))}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors',
                  reason === P(q) ? 'border-st-red/40 bg-[var(--red-soft)] text-st-red' : 'border-line text-ink2 hover:text-ink',
                )}
              >
                {P(q)}
              </button>
            ))}
          </div>
          <Textarea className="mt-3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={L('Escribí el motivo (obligatorio)…', 'Write the reason (required)…')} />
          {!reason.trim() && <div className="mt-1.5 text-[11.5px] text-st-amber">{L('El motivo es obligatorio para rechazar.', 'A reason is required to reject.')}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={closeReject}>
              {L('Cancelar', 'Cancel')}
            </Button>
            <Button variant="danger" disabled={!reason.trim()} onClick={confirmReject}>
              <Send size={15} /> {L('Rechazar y notificar', 'Reject and notify')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
