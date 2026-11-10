import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, Download, FilterX } from 'lucide-react'
import { toast } from 'sonner'
import { MethodBadge, PageHeader, PreviewBanner, StatusPill } from '@/components/shared'
import { Button, Card, Select } from '@/components/ui'
import { TRIPS } from '@/data/trips'
import { driverById } from '@/data/drivers'
import { userById } from '@/data/users'
import { CATEGORY_LABEL, METHOD_LABEL } from '@/data/labels'
import { dayDiff, fmtRelative } from '@/data/dates'
import type { PaymentMethod, Trip } from '@/data/types'
import { useT } from '@/i18n'
import { uyu } from '@/lib/utils'
import { Empty, MobileList, SearchInput, TableWrap, Td, Th, fmtHours, rowCls, shortName } from './a/kit'
import { TripDrawer } from './a/TripDrawer'

type EstadoF = 'todos' | 'en_curso' | 'completado' | 'cancelado'
type FechaF = 'hoy' | '7' | '14' | 'todo'
const LIVE = new Set(['buscando', 'asignado', 'en_camino', 'en_origen', 'cargando', 'en_viaje'])
const SORTED = [...TRIPS].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
const DRIVER_OPTS = [...new Set(TRIPS.map((t) => t.conductorId))].map(driverById).sort((a, b) => a.nombre.localeCompare(b.nombre))
const PAGE = 20

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export default function AdminViajes() {
  const { L, P, lang } = useT()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [estado, setEstado] = useState<EstadoF>('todos')
  const [fecha, setFecha] = useState<FechaF>(params.get('driver') ? 'todo' : '14')
  const [driver, setDriver] = useState(params.get('driver') ?? '')
  const [metodo, setMetodo] = useState<'' | PaymentMethod>('')
  const [shown, setShown] = useState(PAGE)
  const [open, setOpen] = useState<Trip | null>(null)

  // follow external navigation (?q= / ?driver=)
  useEffect(() => {
    const pq = params.get('q')
    const pd = params.get('driver')
    if (pq !== null) setQ(pq)
    if (pd !== null) {
      setDriver(pd)
      setFecha('todo')
    }
  }, [params])

  const filtered = useMemo(() => {
    const nq = norm(q.trim().replace(/^#/, ''))
    return SORTED.filter((t) => {
      if (estado === 'en_curso' ? !LIVE.has(t.estado) : estado !== 'todos' && t.estado !== estado) return false
      const dd = dayDiff(t.fecha)
      if (fecha === 'hoy' && dd !== 0) return false
      if (fecha === '7' && dd < -6) return false
      if (fecha === '14' && dd < -13) return false
      if (driver && t.conductorId !== driver) return false
      if (metodo && t.metodo !== metodo) return false
      if (nq) {
        const hay = norm(
          [t.id, userById(t.usuarioId).nombre, driverById(t.conductorId).nombre, t.origen.label, t.origen.barrio, t.destino.label, t.destino.barrio].join(' '),
        )
        if (!hay.includes(nq)) return false
      }
      return true
    })
  }, [q, estado, fecha, driver, metodo])

  useEffect(() => setShown(PAGE), [q, estado, fecha, driver, metodo])

  const sum = useMemo(() => {
    const billed = filtered.filter((t) => t.estado === 'completado')
    return {
      total: billed.reduce((a, t) => a + t.total, 0),
      comision: billed.reduce((a, t) => a + t.comision, 0),
      live: filtered.filter((t) => LIVE.has(t.estado)).length,
    }
  }, [filtered])

  const hasFilters = !!q || estado !== 'todos' || fecha !== '14' || !!driver || !!metodo
  const clear = () => {
    setQ('')
    setEstado('todos')
    setFecha('14')
    setDriver('')
    setMetodo('')
  }
  const closeDrawer = useCallback(() => setOpen(null), [])
  const rows = filtered.slice(0, shown)
  const route = (t: Trip) => (
    <span className="inline-flex items-center gap-1">
      {t.origen.barrio} <ArrowRight size={11} className="text-ink2" /> {t.destino.barrio}
    </span>
  )

  return (
    <div>
      <PreviewBanner
        id="admin-viajes"
        bullets={[
          L('Historial completo de viajes con búsqueda y filtros sobre la base real', 'Full trip history with search and filters over the real database'),
          L('Detalle de cada viaje: línea de tiempo, ruta GPS registrada y calificaciones', 'Per-trip detail: timeline, recorded GPS route and ratings'),
          L('Exportación a Excel/CSV para contabilidad y conciliación de pagos', 'Excel/CSV export for accounting and payment reconciliation'),
        ]}
      />
      <PageHeader
        title={L('Viajes', 'Trips')}
        subtitle={L('Todos los viajes de las últimas dos semanas, incluidos los que están en curso.', 'Every trip from the last two weeks, including those in progress.')}
        actions={
          <Button variant="secondary" size="sm" onClick={() => toast(L('Exportación CSV', 'CSV export'), { description: L('Se genera con los {n} viajes filtrados en la versión final.', 'The final version exports the {n} filtered trips.', { n: filtered.length }) })}>
            <Download size={14} /> {L('Exportar', 'Export')}
          </Button>
        }
      />

      {/* filters */}
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
          <SearchInput value={q} onChange={setQ} placeholder={L('Buscar por #ID, usuario, conductor o dirección', 'Search by #ID, customer, driver or address')} />
          <Select value={estado} onChange={(e) => setEstado(e.target.value as EstadoF)} aria-label={L('Estado', 'Status')}>
            <option value="todos">{L('Todos los estados', 'All statuses')}</option>
            <option value="en_curso">{L('En curso', 'In progress')}</option>
            <option value="completado">{L('Completado', 'Completed')}</option>
            <option value="cancelado">{L('Cancelado', 'Cancelled')}</option>
          </Select>
          <Select value={fecha} onChange={(e) => setFecha(e.target.value as FechaF)} aria-label={L('Fecha', 'Date')}>
            <option value="hoy">{L('Hoy', 'Today')}</option>
            <option value="7">{L('Últimos 7 días', 'Last 7 days')}</option>
            <option value="14">{L('Últimos 14 días', 'Last 14 days')}</option>
            <option value="todo">{L('Todo el historial', 'All history')}</option>
          </Select>
          <Select value={driver} onChange={(e) => setDriver(e.target.value)} aria-label={L('Conductor', 'Driver')}>
            <option value="">{L('Todos los conductores', 'All drivers')}</option>
            {DRIVER_OPTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </Select>
          <Select value={metodo} onChange={(e) => setMetodo(e.target.value as '' | PaymentMethod)} aria-label={L('Método', 'Method')}>
            <option value="">{L('Todos los métodos', 'All methods')}</option>
            <option value="tarjeta">{P(METHOD_LABEL.tarjeta)}</option>
            <option value="efectivo">{P(METHOD_LABEL.efectivo)}</option>
          </Select>
        </div>
      </Card>

      {/* summary strip */}
      <div className="my-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-card border border-line bg-subtle px-4 py-2.5 text-[12.5px]">
        <span className="text-ink2">
          <span className="mono font-bold text-ink">{filtered.length}</span> {L('viajes', 'trips')}
          {sum.live > 0 && (
            <>
              {' '}
              · <span className="mono font-bold text-accent">{sum.live}</span> {L('en curso', 'in progress')}
            </>
          )}
        </span>
        <span className="text-ink2">
          {L('Total facturado', 'Total billed')} <span className="mono font-bold text-ink">{uyu(sum.total)}</span>
        </span>
        <span className="text-ink2">
          {L('Comisión', 'Commission')} <span className="mono font-bold text-st-green">{uyu(sum.comision)}</span>
        </span>
        {hasFilters && (
          <button onClick={clear} className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline">
            <FilterX size={13} /> {L('Limpiar filtros', 'Clear filters')}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Empty>{L('No hay viajes que coincidan con los filtros.', 'No trips match the filters.')}</Empty>
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>{L('Fecha', 'Date')}</Th>
                <Th>{L('Usuario', 'Customer')}</Th>
                <Th>{L('Conductor', 'Driver')}</Th>
                <Th>{L('Vehículo', 'Vehicle')}</Th>
                <Th>{L('Origen → destino', 'Pickup → drop-off')}</Th>
                <Th className="text-right">{L('Duración', 'Duration')}</Th>
                <Th className="text-right">Total</Th>
                <Th>{L('Método', 'Method')}</Th>
                <Th className="text-right">{L('Comisión', 'Commission')}</Th>
                <Th>{L('Estado', 'Status')}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className={rowCls} onClick={() => setOpen(t)}>
                  <Td className="mono font-semibold">#{t.id}</Td>
                  <Td className="text-ink2">{fmtRelative(t.fecha, lang)}</Td>
                  <Td>{userById(t.usuarioId).nombre}</Td>
                  <Td>{driverById(t.conductorId).nombre}</Td>
                  <Td className="text-ink2">{P(CATEGORY_LABEL[t.categoria])}</Td>
                  <Td>{route(t)}</Td>
                  <Td className="mono text-right">{fmtHours(t.horas, lang)}</Td>
                  <Td className="mono text-right font-semibold">{uyu(t.total)}</Td>
                  <Td>
                    <MethodBadge method={t.metodo} />
                  </Td>
                  <Td className="mono text-right text-ink2">{uyu(t.comision)}</Td>
                  <Td>
                    <StatusPill status={t.estado} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <MobileList>
            {rows.map((t) => (
              <button key={t.id} onClick={() => setOpen(t)} className="rounded-card border border-line bg-card p-3 text-left shadow-card transition-colors hover:bg-subtle">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono text-[13px] font-bold text-ink">#{t.id}</span>
                  <StatusPill status={t.estado} />
                </div>
                <div className="mt-1 text-[12.5px] text-ink">{route(t)}</div>
                <div className="mt-1 text-[12px] text-ink2">
                  {fmtRelative(t.fecha, lang)} · {shortName(userById(t.usuarioId).nombre)} → {shortName(driverById(t.conductorId).nombre)}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2 text-[12px]">
                  <MethodBadge method={t.metodo} />
                  <span className="mono text-ink2">{fmtHours(t.horas, lang)}</span>
                  <span className="mono font-bold text-ink">{uyu(t.total)}</span>
                </div>
              </button>
            ))}
          </MobileList>

          <div className="mt-3 flex items-center justify-between gap-3 text-[12.5px] text-ink2">
            <span>
              {L('Mostrando', 'Showing')} <span className="mono text-ink">{rows.length}</span> {L('de', 'of')} <span className="mono text-ink">{filtered.length}</span>
            </span>
            {shown < filtered.length && (
              <Button variant="secondary" size="sm" onClick={() => setShown((s) => s + PAGE)}>
                {L('Ver más', 'Show more')}
              </Button>
            )}
          </div>
        </>
      )}

      <TripDrawer trip={open} onClose={closeDrawer} />
    </div>
  )
}
