import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Banknote, Check, CreditCard, Eye, Lock, Mail, Plus, Printer, Star, Trash2 } from 'lucide-react'
import { Button, Card, Input, Label, Modal, Pill, Switch } from '@/components/ui'
import { DevNotice, PageHeader, PreviewBanner } from '@/components/shared'
import { LUCIA_TRIPS } from '@/data/trips'
import { LUCIA } from '@/data/users'
import { driverById } from '@/data/drivers'
import { fmtRelative } from '@/data/dates'
import type { Trip } from '@/data/types'
import { useT } from '@/i18n'
import { uyu, cn } from '@/lib/utils'
import { ReceiptCard, printReceipt, type ReceiptData } from './lib'

interface SavedCard {
  id: string
  marca: 'Visa' | 'Mastercard'
  last4: string
  exp: string
  def: boolean
}

const INITIAL: SavedCard[] = [
  { id: 'c1', marca: 'Visa', last4: '4417', exp: '08/29', def: true },
  { id: 'c2', marca: 'Mastercard', last4: '0921', exp: '03/28', def: false },
]

const toReceipt = (t: Trip): ReceiptData => ({
  id: t.id,
  fecha: t.fecha,
  origen: t.origen,
  destino: t.destino,
  categoria: t.categoria,
  horas: t.horas,
  ayudante: t.ayudante,
  metodo: t.metodo,
  conductor: driverById(t.conductorId).nombre,
  total: t.total,
  km: t.km,
})

export default function Pagos() {
  const { L, lang } = useT()
  const [cards, setCards] = useState<SavedCard[]>(INITIAL)
  const [cash, setCash] = useState(true)
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState<SavedCard | null>(null)
  const [viewing, setViewing] = useState<Trip | null>(null)
  const closeAdd = useCallback(() => setAdding(false), [])
  const closeDel = useCallback(() => setToDelete(null), [])
  const closeView = useCallback(() => setViewing(null), [])

  const receipts = useMemo(() => LUCIA_TRIPS.filter((t) => t.estado === 'completado').slice(0, 5), [])

  const makeDefault = (c: SavedCard) => {
    setCards((cs) => cs.map((x) => ({ ...x, def: x.id === c.id })))
    toast.success(L('{m} ··{n} es tu tarjeta predeterminada', '{m} ··{n} is now your default card', { m: c.marca, n: c.last4 }))
  }
  const confirmDelete = () => {
    if (!toDelete) return
    setCards((cs) => {
      const rest = cs.filter((x) => x.id !== toDelete.id)
      if (toDelete.def && rest.length) rest[0] = { ...rest[0], def: true }
      return rest
    })
    toast.success(L('Eliminamos {m} ··{n}', 'Removed {m} ··{n}', { m: toDelete.marca, n: toDelete.last4 }))
    setToDelete(null)
  }
  const addCard = () => {
    setCards((cs) => [...cs, { id: `c${Date.now()}`, marca: 'Visa', last4: '5582', exp: '11/30', def: cs.length === 0 }])
    setAdding(false)
    toast.success(L('Tarjeta Visa ··5582 agregada', 'Visa ··5582 card added'))
  }

  return (
    <div>
      <PreviewBanner
        id="Pagos"
        bullets={[
          L('Tarjetas tokenizadas con Plexo o dLocal (cumplimiento PCI)', 'Cards tokenized with Plexo or dLocal (PCI compliant)'),
          L('Cobro automático al finalizar cada viaje', 'Automatic charge when each trip ends'),
          L('Comprobantes PDF enviados por email al instante', 'PDF receipts emailed instantly'),
        ]}
      />
      <PageHeader
        title={L('Pagos', 'Payments')}
        subtitle={L('Tus medios de pago y comprobantes.', 'Your payment methods and receipts.')}
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} /> {L('Agregar tarjeta', 'Add card')}
          </Button>
        }
      />

      <h2 className="mb-3 text-[15px] font-bold tracking-tight text-ink">{L('Tarjetas guardadas', 'Saved cards')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, translate: '0px 10px' }} animate={{ opacity: 1, translate: '0px 0px' }} transition={{ delay: i * 0.06 }}>
            <CardVisual c={c} />
            <div className="mt-2.5 flex items-center gap-2">
              {c.def ? (
                <Pill tone="accent" className="h-9 px-3 text-[12px]">
                  <Check size={12} strokeWidth={3} /> {L('Predeterminada', 'Default')}
                </Pill>
              ) : (
                <Button variant="secondary" size="md" onClick={() => makeDefault(c)}>
                  <Star size={14} /> {L('Predeterminar', 'Make default')}
                </Button>
              )}
              <Button variant="ghost" size="md" className="ml-auto text-st-red hover:bg-[var(--red-soft)] hover:text-st-red" onClick={() => setToDelete(c)}>
                <Trash2 size={14} /> {L('Eliminar', 'Remove')}
              </Button>
            </div>
          </motion.div>
        ))}
        <button
          onClick={() => setAdding(true)}
          className="grid aspect-[1.586/1] w-full place-items-center rounded-2xl border-2 border-dashed border-line text-ink2 transition-colors hover:border-accent/50 hover:text-accent"
        >
          <span className="flex flex-col items-center gap-2 text-[14px] font-semibold">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-subtle">
              <Plus size={20} />
            </span>
            {L('Agregar tarjeta', 'Add card')}
          </span>
        </button>
      </div>

      {/* cash */}
      <Card className="mt-6 flex items-center gap-3 p-4 sm:p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--green-soft)] text-st-green">
          <Banknote size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-bold text-ink">{L('Efectivo habilitado', 'Cash enabled')}</div>
          <div className="text-[12.5px] text-ink2">{L('Le pagás al conductor al terminar y él confirma el cobro', 'Pay the driver at the end and they confirm the payment')}</div>
        </div>
        <Switch
          checked={cash}
          onChange={(v) => {
            setCash(v)
            toast(v ? L('Efectivo habilitado', 'Cash enabled') : L('Efectivo deshabilitado: solo tarjeta', 'Cash disabled: card only'))
          }}
        />
      </Card>

      {/* receipts */}
      <div className="mb-3 mt-8 flex items-end justify-between gap-3">
        <h2 className="text-[15px] font-bold tracking-tight text-ink">{L('Últimos comprobantes enviados por email', 'Latest receipts sent by email')}</h2>
      </div>
      <Card className="divide-y divide-line overflow-hidden">
        {receipts.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <Mail size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="truncate text-[13.5px] font-semibold text-ink">{t.destino.label}</span>
                <span className="mono text-[13px] font-bold text-ink">{uyu(t.total)}</span>
              </div>
              <div className="truncate text-[12px] text-ink2">
                {fmtRelative(t.fecha, lang)} · {L('Enviado a', 'Sent to')} {LUCIA.email}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setViewing(t)}>
              <Eye size={14} /> {L('Ver', 'View')}
            </Button>
          </div>
        ))}
      </Card>

      <DevNotice
        className="mt-5"
        title={L('Comprobantes por email', 'Email receipts')}
        now={L('recibo imprimible', 'printable receipt')}
        later={L('PDF enviado automáticamente por email', 'PDF sent automatically by email')}
      />

      {/* add card */}
      <Modal open={adding} onClose={closeAdd} className="max-w-md">
        <form
          className="p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault()
            addCard()
          }}
        >
          <h3 className="pr-8 text-[19px] font-extrabold tracking-tight text-ink">{L('Agregar tarjeta', 'Add card')}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink2">
            <Lock size={12} /> {L('Formulario de demostración: no se guarda ningún dato', 'Demo form: no data is stored')}
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <Label>{L('Número de tarjeta', 'Card number')}</Label>
              <Input inputMode="numeric" autoComplete="off" placeholder="1234 5678 9012 3456" className="mono h-11" />
            </div>
            <div>
              <Label>{L('Nombre como figura en la tarjeta', 'Name as shown on card')}</Label>
              <Input autoComplete="off" placeholder="LUCIA FERREYRA" className="h-11 uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{L('Vencimiento', 'Expiry')}</Label>
                <Input autoComplete="off" placeholder={L('MM/AA', 'MM/YY')} className="mono h-11" />
              </div>
              <div>
                <Label>CVV</Label>
                <Input autoComplete="off" inputMode="numeric" placeholder="123" className="mono h-11" />
              </div>
            </div>
          </div>
          <DevNotice
            className="mt-4"
            title={L('Pagos con tarjeta (tokenización Plexo / dLocal)', 'Card payments (Plexo / dLocal tokenization)')}
            now={L('formulario simulado, no se guarda ningún dato', 'simulated form, no data is stored')}
            later={L('tokenización PCI con Plexo o dLocal, varias tarjetas por usuario', 'PCI tokenization with Plexo or dLocal, multiple cards per user')}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" size="lg" onClick={closeAdd}>
              {L('Cancelar', 'Cancel')}
            </Button>
            <Button type="submit" size="lg">
              <CreditCard size={15} /> {L('Guardar tarjeta', 'Save card')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* delete confirm */}
      <Modal open={!!toDelete} onClose={closeDel} className="max-w-sm">
        {toDelete && (
          <div className="p-5 text-center sm:p-6">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--red-soft)] text-st-red">
              <Trash2 size={20} />
            </span>
            <h3 className="mt-3 text-[18px] font-extrabold tracking-tight text-ink">
              {L('¿Eliminar {m} ··{n}?', 'Remove {m} ··{n}?', { m: toDelete.marca, n: toDelete.last4 })}
            </h3>
            <p className="mt-1 text-[13px] text-ink2">
              {toDelete.def
                ? L('Es tu tarjeta predeterminada. Vamos a usar la siguiente como predeterminada.', 'It’s your default card. We’ll make the next one default.')
                : L('Podés volver a agregarla cuando quieras.', 'You can add it again anytime.')}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="lg" onClick={closeDel}>
                {L('Cancelar', 'Cancel')}
              </Button>
              <Button variant="danger" size="lg" onClick={confirmDelete}>
                {L('Eliminar', 'Remove')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* receipt preview */}
      <Modal open={!!viewing} onClose={closeView} className="max-w-md">
        {viewing && (
          <div className="p-5 sm:p-6">
            <h3 className="mb-3 pr-8 text-[18px] font-extrabold tracking-tight text-ink">{L('Comprobante', 'Receipt')}</h3>
            <ReceiptCard r={toReceipt(viewing)} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="lg" onClick={() => toast.success(L('Reenviamos el comprobante a {m}', 'Receipt re-sent to {m}', { m: LUCIA.email }))}>
                <Mail size={15} /> {L('Reenviar', 'Resend')}
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  const ok = printReceipt(toReceipt(viewing), lang)
                  if (ok) toast.success(L('Recibo listo para imprimir', 'Receipt ready to print'))
                  else toast.error(L('Habilitá las ventanas emergentes para imprimir', 'Allow pop-ups to print'))
                }}
              >
                <Printer size={15} /> {L('Imprimir', 'Print')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function CardVisual({ c }: { c: SavedCard }) {
  const { L } = useT()
  const visa = c.marca === 'Visa'
  return (
    <div
      className={cn(
        'relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl p-5 text-white shadow-pop',
        visa ? 'bg-gradient-to-br from-[#1F5BFF] via-[#1B4FE0] to-[#0B2A8A]' : 'bg-gradient-to-br from-zinc-800 via-zinc-900 to-black',
        c.def && 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--bg)]',
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-8 h-44 w-44 rounded-full bg-white/5" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 opacity-90" />
          {visa ? (
            <span className="text-[22px] font-extrabold italic tracking-tight">VISA</span>
          ) : (
            <span className="flex items-center">
              <span className="h-7 w-7 rounded-full bg-[#EB001B]" />
              <span className="-ml-3 h-7 w-7 rounded-full bg-[#F79E1B]/90" />
            </span>
          )}
        </div>
        <div className="mono text-[17px] font-bold tracking-[.14em] sm:text-[18px]">•••• •••• •••• {c.last4}</div>
        <div className="flex items-end justify-between text-[11px] uppercase tracking-wider">
          <div>
            <div className="text-white/60">{L('Titular', 'Cardholder')}</div>
            <div className="font-semibold">{LUCIA.nombre}</div>
          </div>
          <div className="text-right">
            <div className="text-white/60">{L('Vence', 'Expires')}</div>
            <div className="mono font-bold">{c.exp}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
