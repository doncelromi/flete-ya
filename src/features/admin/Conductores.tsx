import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilterX, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, PreviewBanner, VerifPill } from '@/components/shared'
import { Avatar, Button, Card, Select, Tabs } from '@/components/ui'
import { DRIVERS, DRIVER_STATS } from '@/data/drivers'
import { CATEGORY_LABEL, VERIF_LABEL, ZONE_LABEL } from '@/data/labels'
import { fmtAgo } from '@/data/dates'
import type { Driver, VerificationStatus, Zone } from '@/data/types'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { Empty, MobileList, SearchInput, TableWrap, Td, Th, rating, rowCls } from './a/kit'
import { DriverDrawer } from './a/DriverDrawer'
import { ImportTab } from './a/ImportTab'

type Tab = 'directorio' | 'importacion'
type OnlineF = '' | 'si' | 'no'
const ZONES: Zone[] = ['CABA', 'Norte', 'Sur', 'Oeste']
const SORTED = [...DRIVERS].sort((a, b) => Number(b.enLinea) - Number(a.enLinea) || b.viajes - a.viajes)
const PAGE = 30

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export default function Conductores() {
  const { L } = useT()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'importacion' ? 'importacion' : 'directorio'
  const setTab = useCallback(
    (t: Tab) => {
      setParams(
        (p) => {
          const n = new URLSearchParams(p)
          if (t === 'importacion') n.set('tab', 'importacion')
          else n.delete('tab')
          return n
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return (
    <div>
      <PreviewBanner
        id="admin-conductores"
        bullets={[
          L('Directorio de toda la flota con documentación, vencimientos y métricas reales', 'Full-fleet directory with real documents, expirations and metrics'),
          L('Importación de la agenda del celular con detección de duplicados', 'Phone contacts import with duplicate detection'),
          L('Invitaciones masivas por WhatsApp y seguimiento del onboarding de cada conductor', 'Bulk WhatsApp invites and per-driver onboarding tracking'),
        ]}
      />
      <PageHeader
        title={L('Conductores', 'Drivers')}
        subtitle={L('{t} conductores registrados · {o} en línea ahora · {p} pendientes de verificación', '{t} registered drivers · {o} online now · {p} pending verification', {
          t: DRIVER_STATS.total,
          o: DRIVER_STATS.online,
          p: DRIVER_STATS.pending,
        })}
        actions={
          <Button size="sm" onClick={() => setTab('importacion')}>
            <UserPlus size={14} /> {L('Importar agenda', 'Import contacts')}
          </Button>
        }
      />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        className="mb-4"
        items={[
          { id: 'directorio', label: L('Directorio', 'Directory'), count: DRIVER_STATS.total },
          { id: 'importacion', label: L('Importación', 'Import') },
        ]}
      />
      {/* keep both mounted so the import state survives tab switches */}
      <div className={cn(tab !== 'directorio' && 'hidden')}>
        <Directorio />
      </div>
      <div className={cn(tab !== 'importacion' && 'hidden')} data-trailer="driver-import">
        <ImportTab />
      </div>
    </div>
  )
}

function Directorio() {
  const { L, P, lang } = useT()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [verif, setVerif] = useState<'' | VerificationStatus>('')
  const [zona, setZona] = useState<'' | Zone>('')
  const [online, setOnline] = useState<OnlineF>('')
  const [shown, setShown] = useState(PAGE)
  const [open, setOpen] = useState<Driver | null>(null)
  const closeDrawer = useCallback(() => setOpen(null), [])

  const filtered = useMemo(() => {
    const nq = norm(q.trim())
    return SORTED.filter((d) => {
      if (verif && d.verificacion !== verif) return false
      if (zona && d.zona !== zona) return false
      if (online === 'si' && !d.enLinea) return false
      if (online === 'no' && d.enLinea) return false
      if (nq && !norm(`${d.nombre} ${d.vehiculo.patente} ${d.vehiculo.modelo} ${d.barrio} ${d.telefono}`).includes(nq)) return false
      return true
    })
  }, [q, verif, zona, online])
  useEffect(() => setShown(PAGE), [q, verif, zona, online])

  const rows = filtered.slice(0, shown)
  const hasFilters = !!q || !!verif || !!zona || !!online
  const clear = () => {
    setQ('')
    setVerif('')
    setZona('')
    setOnline('')
  }

  const lastSeen = (d: Driver) =>
    d.enLinea ? (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-st-green">
        <span className="h-2 w-2 rounded-full bg-st-green" /> {d.ocupado ? L('En viaje', 'On a trip') : L('En línea', 'Online')}
      </span>
    ) : (
      <span className="text-ink2">{fmtAgo(d.ultimaConexion, lang)}</span>
    )

  return (
    <>
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <SearchInput value={q} onChange={setQ} placeholder={L('Buscar por nombre, patente o barrio', 'Search by name, plate or neighborhood')} />
          <Select value={verif} onChange={(e) => setVerif(e.target.value as '' | VerificationStatus)} aria-label={L('Verificación', 'Verification')}>
            <option value="">{L('Toda verificación', 'Any verification')}</option>
            {(['aprobado', 'pendiente', 'rechazado'] as VerificationStatus[]).map((v) => (
              <option key={v} value={v}>
                {P(VERIF_LABEL[v])}
              </option>
            ))}
          </Select>
          <Select value={zona} onChange={(e) => setZona(e.target.value as '' | Zone)} aria-label={L('Zona', 'Zone')}>
            <option value="">{L('Todas las zonas', 'All zones')}</option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {P(ZONE_LABEL[z])}
              </option>
            ))}
          </Select>
          <Select value={online} onChange={(e) => setOnline(e.target.value as OnlineF)} aria-label={L('Conexión', 'Connection')}>
            <option value="">{L('En línea y desconectados', 'Online and offline')}</option>
            <option value="si">{L('Solo en línea', 'Online only')}</option>
            <option value="no">{L('Solo desconectados', 'Offline only')}</option>
          </Select>
        </div>
      </Card>

      <div className="my-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-ink2">
        <span>
          <span className="mono font-bold text-ink">{filtered.length}</span> {L('conductores', 'drivers')}
        </span>
        <span>
          <span className="mono font-bold text-st-green">{filtered.filter((d) => d.enLinea).length}</span> {L('en línea', 'online')}
        </span>
        <span>
          <span className="mono font-bold text-st-amber">{filtered.filter((d) => d.verificacion === 'pendiente').length}</span> {L('pendientes', 'pending')}
        </span>
        {hasFilters && (
          <button onClick={clear} className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline">
            <FilterX size={13} /> {L('Limpiar filtros', 'Clear filters')}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Empty>{L('No hay conductores que coincidan con los filtros.', 'No drivers match the filters.')}</Empty>
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>{L('Conductor', 'Driver')}</Th>
                <Th>{L('Vehículo', 'Vehicle')}</Th>
                <Th>{L('Patente', 'Plate')}</Th>
                <Th>{L('Zona', 'Zone')}</Th>
                <Th>{L('Verificación', 'Verification')}</Th>
                <Th className="text-right">Rating</Th>
                <Th className="text-right">{L('Viajes', 'Trips')}</Th>
                <Th>{L('Última conexión', 'Last seen')}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className={rowCls} onClick={() => setOpen(d)}>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={d.nombre} size={28} />
                      <span className="font-semibold">{d.nombre}</span>
                    </span>
                  </Td>
                  <Td>
                    {d.vehiculo.modelo} <span className="text-ink2">· {P(CATEGORY_LABEL[d.vehiculo.categoria])}</span>
                  </Td>
                  <Td className="mono text-[12.5px]">{d.vehiculo.patente}</Td>
                  <Td>
                    {P(ZONE_LABEL[d.zona])} <span className="text-ink2">· {d.barrio}</span>
                  </Td>
                  <Td>
                    <VerifPill status={d.verificacion} />
                  </Td>
                  <Td className="mono text-right">{d.rating > 0 ? <span>★ {rating(d.rating)}</span> : <span className="text-ink2">—</span>}</Td>
                  <Td className="mono text-right">{d.viajes}</Td>
                  <Td>{lastSeen(d)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <MobileList>
            {rows.map((d) => (
              <button key={d.id} onClick={() => setOpen(d)} className="flex items-center gap-3 rounded-card border border-line bg-card p-3 text-left shadow-card transition-colors hover:bg-subtle">
                <Avatar name={d.nombre} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13.5px] font-semibold text-ink">{d.nombre}</span>
                    <VerifPill status={d.verificacion} />
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-ink2">
                    {d.vehiculo.modelo} · <span className="mono">{d.vehiculo.patente}</span> · {d.barrio}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[12px]">
                    {lastSeen(d)}
                    <span className="mono text-ink2">
                      {d.rating > 0 ? `★ ${rating(d.rating)}` : '—'} · {d.viajes} {L('viajes', 'trips')}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </MobileList>

          <div className="mt-3 flex items-center justify-between gap-3 text-[12.5px] text-ink2">
            <span>
              {L('Mostrando', 'Showing')} <span className="mono text-ink">{rows.length}</span> {L('de', 'of')} <span className="mono text-ink">{filtered.length}</span>
            </span>
            {shown < filtered.length ? (
              <Button variant="secondary" size="sm" onClick={() => setShown((s) => s + PAGE)}>
                {L('Ver más', 'Show more')}
              </Button>
            ) : (
              <button onClick={() => toast(L('Exportación del directorio disponible en la versión final', 'Directory export available in the final version'))} className="text-[12px] font-semibold text-accent hover:underline">
                {L('Exportar directorio', 'Export directory')}
              </button>
            )}
          </div>
        </>
      )}

      <DriverDrawer driver={open} onClose={closeDrawer} />
    </>
  )
}
