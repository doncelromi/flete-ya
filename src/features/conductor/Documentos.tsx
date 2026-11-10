import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AlertTriangle, BadgeCheck, CarFront, Check, Clock, FileCheck, FileUp, IdCard, ScrollText, ShieldCheck, Umbrella, Upload, type LucideIcon } from 'lucide-react'
import { Button, Card, InfoDot, Modal, Pill, Progress, SectionTitle } from '@/components/ui'
import { DevNotice, PageHeader, PreviewBanner, VerifPill } from '@/components/shared'
import { MARTIN } from '@/data/drivers'
import { AUDIT_LABEL, DOC_LABEL } from '@/data/labels'
import { daysUntil, fmtDate, fmtTime } from '@/data/dates'
import type { AuditEntry, Doc, DocType } from '@/data/types'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { Enter } from './parts'

const DOC_ICON: Record<DocType, LucideIcon> = {
  dni: IdCard,
  licencia: BadgeCheck,
  antecedentes: ScrollText,
  seguro: Umbrella,
  cedula: CarFront,
}
const EXPIRY_WARN_DAYS = 30

export default function Documentos() {
  const { L, P } = useT()
  /** docs re-uploaded in this session → ISO of upload (now "En revisión") */
  const [resubmitted, setResubmitted] = useState<Partial<Record<DocType, string>>>({})
  const [uploading, setUploading] = useState<DocType | null>(null)

  const docs = MARTIN.documentos
  const approved = docs.filter((d) => d.estado === 'aprobado' && !resubmitted[d.tipo]).length
  const expiring = docs.filter((d) => d.vence && !resubmitted[d.tipo] && daysUntil(d.vence) <= EXPIRY_WARN_DAYS)

  const history = useMemo(() => {
    const rows: (AuditEntry & { tipo: DocType })[] = []
    for (const d of docs) for (const a of d.auditoria) rows.push({ ...a, tipo: d.tipo })
    for (const [tipo, fecha] of Object.entries(resubmitted) as [DocType, string][]) rows.push({ tipo, fecha, por: 'conductor', accion: 'subido' })
    return rows.sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [docs, resubmitted])

  const closeUpload = useCallback(() => setUploading(null), [])
  const onUploaded = useCallback(
    (tipo: DocType) => {
      setResubmitted((r) => ({ ...r, [tipo]: new Date().toISOString() }))
      setUploading(null)
      toast.success(L('Documento enviado a verificación', 'Document sent for verification'))
    },
    [L],
  )

  return (
    <div>
      <PreviewBanner
        id="conductor-documentos"
        bullets={[
          L('Subís tus documentos desde el celular con una foto, sin trámites en persona.', 'Upload your documents from your phone with a photo, no in-person paperwork.'),
          L('Te avisamos antes de que venza el seguro o la licencia para que no quedes inhabilitado.', 'We remind you before your insurance or license expires so you don’t get suspended.'),
          L('Cada aprobación queda registrada con fecha, hora y quién la revisó.', 'Every approval is logged with date, time and reviewer.'),
        ]}
      />
      <PageHeader
        title={L('Documentos', 'Documents')}
        subtitle={L('Tu legajo para manejar en Fletes ya', 'Your file to drive on Fletes ya')}
        actions={
          <Pill tone={approved === docs.length && expiring.length === 0 ? 'green' : 'amber'} className="text-[12px]">
            <ShieldCheck size={12} /> <span className="mono font-bold">{approved}/{docs.length}</span> {L('aprobados', 'approved')}
          </Pill>
        }
      />

      {expiring.length > 0 && (
        <Enter>
          <div className="mb-4 flex items-start gap-3 rounded-card border border-st-amber/30 bg-[var(--amber-soft)] p-3.5">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-st-amber" />
            <div className="min-w-0 flex-1 text-[13px] leading-snug text-ink">
              {expiring.map((d) => (
                <div key={d.tipo}>
                  <span className="font-bold">{P(DOC_LABEL[d.tipo])}</span> {L('vence en', 'expires in')}{' '}
                  <span className="mono font-bold text-st-amber">
                    {daysUntil(d.vence!)} {L('días', 'days')}
                  </span>
                  . {L('Subí la renovación para seguir recibiendo viajes.', 'Upload the renewal to keep getting trips.')}
                </div>
              ))}
            </div>
          </div>
        </Enter>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <Enter delay={0.05}>
          <SectionTitle>{L('Checklist', 'Checklist')}</SectionTitle>
          <Card className="divide-y divide-line p-0">
            {docs.map((d, i) => (
              <DocRow key={d.tipo} doc={d} index={i} pendingSince={resubmitted[d.tipo]} onUpload={() => setUploading(d.tipo)} />
            ))}
          </Card>
        </Enter>

        <Enter delay={0.1} className="space-y-4">
          <div>
            <SectionTitle right={<InfoDot text={L('Registro de auditoría inalterable: cada acción queda con fecha, hora y responsable.', 'Tamper-proof audit log: every action is stored with date, time and who did it.')} />}>
              {L('Historial de verificación', 'Verification history')}
            </SectionTitle>
            <Card className="p-4">
              <ol className="relative space-y-3.5 before:absolute before:bottom-1 before:left-[11px] before:top-1 before:w-px before:bg-line">
                {history.map((h, i) => {
                  const ok = h.accion === 'aprobado'
                  const bad = h.accion === 'rechazado' || h.accion === 'vencido'
                  return (
                    <li key={`${h.tipo}-${h.fecha}-${i}`} className="relative flex gap-3">
                      <span
                        className={cn(
                          'relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-card',
                          ok ? 'bg-st-green text-white' : bad ? 'bg-st-red text-white' : 'bg-accent-soft text-accent',
                        )}
                      >
                        {ok ? <Check size={12} strokeWidth={3} /> : <FileUp size={11} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-ink">
                          {P(AUDIT_LABEL[h.accion])} · {P(DOC_LABEL[h.tipo])}
                        </div>
                        <div className="text-[11.5px] text-ink2">
                          <span className="mono">
                            {fmtDate(h.fecha)} {fmtTime(h.fecha)}
                          </span>{' '}
                          · {h.por === 'conductor' ? L('por vos', 'by you') : L('por {p}', 'by {p}', { p: h.por })}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </Card>
          </div>
          <DevNotice
            title={L('Carga real de documentos (almacenamiento seguro)', 'Real document upload (secure storage)')}
            now={L('subida simulada.', 'simulated upload.')}
            later={L('fotos cifradas en almacenamiento seguro con vencimientos y recordatorios automáticos.', 'encrypted photos in secure storage with expiry dates and automatic reminders.')}
          />
        </Enter>
      </div>

      <Modal open={uploading !== null} onClose={closeUpload} className="max-w-md">
        {uploading && <UploadFlow tipo={uploading} onDone={onUploaded} />}
      </Modal>
    </div>
  )
}

function DocRow({ doc, index, pendingSince, onUpload }: { doc: Doc; index: number; pendingSince?: string; onUpload: () => void }) {
  const { L, P } = useT()
  const Icon = DOC_ICON[doc.tipo]
  const days = doc.vence ? daysUntil(doc.vence) : null
  const warn = !pendingSince && days !== null && days <= EXPIRY_WARN_DAYS
  const ok = !pendingSince && doc.estado === 'aprobado' && !warn

  return (
    <motion.div
      initial={{ opacity: 0, translate: '0px 6px' }}
      animate={{ opacity: 1, translate: '0px 0px' }}
      transition={{ delay: 0.05 + index * 0.04 }}
      className={cn('flex flex-wrap items-center gap-3 p-4', warn && 'bg-[var(--amber-soft)]/50')}
    >
      <span
        className={cn(
          'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
          ok ? 'bg-[var(--green-soft)] text-st-green' : pendingSince || warn ? 'bg-[var(--amber-soft)] text-st-amber' : 'bg-subtle text-ink2',
        )}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14.5px] font-bold text-ink">{P(DOC_LABEL[doc.tipo])}</span>
          {pendingSince ? (
            <Pill tone="amber">
              <Clock size={11} /> {L('En revisión', 'In review')}
            </Pill>
          ) : warn ? (
            <Pill tone="amber">
              <AlertTriangle size={11} /> {L('Vence en {n} días', 'Expires in {n} days', { n: days! })}
            </Pill>
          ) : (
            <VerifPill status={doc.estado} />
          )}
        </div>
        <div className="mt-0.5 text-[12px] text-ink2">
          {pendingSince ? (
            L('Enviado recién · lo revisa el equipo en menos de 24 h', 'Just sent · reviewed by the team within 24 h')
          ) : doc.vence ? (
            <>
              {L('Vence', 'Expires')} <span className={cn('mono font-semibold', warn ? 'text-st-amber' : 'text-ink')}>{fmtDate(doc.vence)}</span>
            </>
          ) : (
            L('Sin vencimiento', 'No expiry')
          )}
        </div>
      </div>
      <Button variant={warn ? 'primary' : 'secondary'} size="lg" onClick={onUpload} disabled={!!pendingSince} className="w-full sm:w-auto">
        <Upload size={16} /> {L('Subir nuevo', 'Upload new')}
      </Button>
    </motion.div>
  )
}

const FAKE_FILES: Record<DocType, [string, string]> = {
  dni: ['dni_frente_dorso.jpg', '1,8 MB'],
  licencia: ['licencia_profesional.jpg', '2,1 MB'],
  antecedentes: ['certificado_antecedentes.pdf', '640 KB'],
  seguro: ['poliza_seguro_2026.pdf', '1,2 MB'],
  cedula: ['cedula_verde.jpg', '1,5 MB'],
}

function UploadFlow({ tipo, onDone }: { tipo: DocType; onDone: (t: DocType) => void }) {
  const { L, P } = useT()
  const [picked, setPicked] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [name, size] = FAKE_FILES[tipo]

  useEffect(() => {
    if (progress === null || progress >= 100) return
    const id = setTimeout(() => setProgress((p) => Math.min(100, (p ?? 0) + 5)), 100)
    return () => clearTimeout(id)
  }, [progress])

  useEffect(() => {
    if (progress !== 100) return
    const id = setTimeout(() => onDone(tipo), 450)
    return () => clearTimeout(id)
  }, [progress, onDone, tipo])

  return (
    <div className="p-5">
      <div className="kpi-label">{L('Subir documento', 'Upload document')}</div>
      <h3 className="mt-1 pr-8 text-[18px] font-extrabold tracking-tight text-ink">{P(DOC_LABEL[tipo])}</h3>

      {!picked ? (
        <button
          onClick={() => {
            setPicked(true)
            toast(L('Archivo seleccionado (simulado)', 'File selected (simulated)'))
          }}
          className="mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-subtle px-4 py-8 text-center transition-colors hover:border-accent/50 hover:bg-accent-soft/40"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-card text-accent shadow-card">
            <FileUp size={22} />
          </span>
          <span className="text-[14px] font-bold text-ink">{L('Sacá una foto o elegí un archivo', 'Take a photo or choose a file')}</span>
          <span className="text-[12px] text-ink2">JPG, PNG {L('o', 'or')} PDF · {L('hasta 10 MB', 'up to 10 MB')}</span>
        </button>
      ) : (
        <div className="mt-4 rounded-2xl border border-line p-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
              {progress === 100 ? <FileCheck size={18} /> : <FileUp size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-semibold text-ink">{name}</div>
              <div className="mono text-[11.5px] text-ink2">{size}</div>
            </div>
            {progress !== null && <span className="mono text-[13px] font-bold text-ink">{progress}%</span>}
          </div>
          {progress !== null && <Progress value={progress} tone={progress === 100 ? 'green' : 'accent'} className="mt-3" />}
        </div>
      )}

      <Button
        size="xl"
        className="mt-5 h-14 w-full"
        disabled={!picked || progress !== null}
        onClick={() => setProgress(0)}
      >
        {progress === null ? (
          <>
            <Upload size={18} /> {L('Enviar a verificación', 'Send for verification')}
          </>
        ) : progress < 100 ? (
          L('Subiendo…', 'Uploading…')
        ) : (
          <>
            <Check size={18} /> {L('¡Listo!', 'Done!')}
          </>
        )}
      </Button>
    </div>
  )
}
