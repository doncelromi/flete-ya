import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, ListChecks, MessageCircle, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, Button, Drawer, InfoDot } from '@/components/ui'
import { VerifPill } from '@/components/shared'
import { VehicleArt } from '@/components/brand'
import { CATEGORY_LABEL, COLOR_EN, DOC_LABEL, ZONE_LABEL } from '@/data/labels'
import { daysUntil, dayDiff, fmtAgo, fmtDate } from '@/data/dates'
import type { Driver } from '@/data/types'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { rating } from './kit'

export function DriverDrawer({ driver, onClose }: { driver: Driver | null; onClose: () => void }) {
  return (
    <Drawer open={!!driver} onClose={onClose}>
      {driver && <DriverProfile d={driver} />}
    </Drawer>
  )
}

function DriverProfile({ d }: { d: Driver }) {
  const { L, P, lang } = useT()
  const navigate = useNavigate()
  const days = -dayDiff(d.alta)
  const antig = days >= 60 ? L('{n} meses', '{n} months', { n: Math.floor(days / 30) }) : L('{n} días', '{n} days', { n: Math.max(1, days) })

  return (
    <div className="pb-8">
      <div className="border-b border-line px-5 pb-4 pt-5">
        <div className="flex items-start gap-3 pr-8">
          <Avatar name={d.nombre} size={52} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-bold leading-tight text-ink">{d.nombre}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <VerifPill status={d.verificacion} />
              {d.enLinea ? (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-st-green">
                  <span className="h-2 w-2 rounded-full bg-st-green" /> {d.ocupado ? L('En línea · en viaje', 'Online · on a trip') : L('En línea', 'Online')}
                </span>
              ) : (
                <span className="text-[11.5px] text-ink2">{L('Últ. conexión {a}', 'Last seen {a}', { a: fmtAgo(d.ultimaConexion, lang) })}</span>
              )}
            </div>
            <span className="mono mt-1.5 inline-flex items-center gap-1 text-[12.5px] text-ink2">
              <Phone size={12} /> {d.telefono}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-subtle p-3">
          <VehicleArt cat={d.vehiculo.categoria} className="h-auto w-24 shrink-0" />
          <div className="min-w-0 text-[12.5px]">
            <div className="font-semibold text-ink">
              {d.vehiculo.modelo} · {lang === 'en' ? COLOR_EN[d.vehiculo.color] ?? d.vehiculo.colorEn : d.vehiculo.color}
            </div>
            <div className="text-ink2">{P(CATEGORY_LABEL[d.vehiculo.categoria])}</div>
            <div className="mono mt-1 inline-block rounded border border-line bg-card px-1.5 py-0.5 text-[12px] font-bold tracking-wider text-ink">{d.vehiculo.patente}</div>
          </div>
        </div>
      </div>

      {/* metrics */}
      <div className="grid grid-cols-2 gap-2 px-5 pt-4 sm:grid-cols-4">
        <Metric label={L('Viajes', 'Trips')} value={<span className="mono">{d.viajes}</span>} />
        <Metric label="Rating" value={<span className="mono">{d.rating > 0 ? `★ ${rating(d.rating)}` : '—'}</span>} />
        <Metric label={L('Antigüedad', 'Tenure')} value={antig} />
        <Metric label={L('Zona', 'Zone')} value={P(ZONE_LABEL[d.zona])} sub={d.barrio} />
      </div>

      {/* documents */}
      <section className="px-5 pt-5">
        <h3 className="kpi-label mb-2">{L('Documentación', 'Documents')}</h3>
        <div className="overflow-hidden rounded-xl border border-line">
          {d.documentos.map((doc, i) => {
            const left = doc.vence ? daysUntil(doc.vence) : null
            return (
              <div key={doc.tipo} className={cn('flex items-center gap-3 px-3 py-2.5 text-[12.5px]', i > 0 && 'border-t border-line')}>
                <FileText size={15} className="shrink-0 text-ink2" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink">{P(DOC_LABEL[doc.tipo])}</div>
                  {doc.vence && (
                    <div className={cn('mono text-[11px]', left !== null && left < 30 ? 'text-st-amber' : 'text-ink2')}>
                      {L('vence', 'expires')} {fmtDate(doc.vence)}
                    </div>
                  )}
                </div>
                <VerifPill status={doc.estado} />
              </div>
            )
          })}
        </div>
        {d.motivoRechazo && (
          <p className="mt-2 rounded-lg bg-[var(--red-soft)] px-3 py-2 text-[12px] text-st-red">
            {L('Motivo del rechazo', 'Rejection reason')}: {P(d.motivoRechazo)}
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2 px-5 pt-5">
        <Button size="sm" onClick={() => navigate(`/admin/viajes?driver=${d.id}`)}>
          <ListChecks size={14} /> {L('Ver viajes', 'See trips')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => toast.success(L('Mensaje enviado a {n}', 'Message sent to {n}', { n: d.nombre.split(' ')[0] }), { description: L('Simulado: en la versión final llega por push y WhatsApp.', 'Simulated: the final version delivers via push and WhatsApp.') })}
        >
          <MessageCircle size={14} /> {L('Enviar mensaje', 'Send message')}
        </Button>
        <InfoDot text={L('Mensajería interna con el conductor (push + WhatsApp Business). Hoy se simula el envío.', 'In-app messaging with the driver (push + WhatsApp Business). Sending is simulated today.')} />
      </div>
    </div>
  )
}

function Metric({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-line p-2.5">
      <div className="kpi-label !text-[9.5px]">{label}</div>
      <div className="mt-1 text-[14px] font-bold text-ink">{value}</div>
      {sub && <div className="truncate text-[11px] text-ink2">{sub}</div>}
    </div>
  )
}
