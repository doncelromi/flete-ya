import { useEffect, type ReactNode } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useApp } from '@/store/app'
import { cn } from '@/lib/utils'
import type { LatLng } from '@/data/types'

// Clean gray canvas basemaps (light / dark) with a separate label layer. No API key required.
// (CARTO Positron / Dark Matter now require an API key, so we use the Esri equivalents.)
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
const LIGHT = `${ESRI}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`
const LIGHT_REF = `${ESRI}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`
const DARK = `${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`
const DARK_REF = `${ESRI}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`
const ATTR = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap'

/** Calls invalidateSize on mount and whenever the container resizes (tabs, drawers, iframe). */
function SizeFix() {
  const map = useMap()
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 60)
    const t2 = setTimeout(() => map.invalidateSize(), 400)
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
    }
  }, [map])
  return null
}

/** Fits the map to the given points once (or when `fitKey` changes). */
function Fit({ points, fitKey, padding }: { points: LatLng[]; fitKey?: string | number; padding: number }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    const b = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])))
    const t = setTimeout(() => map.fitBounds(b, { padding: [padding, padding], maxZoom: 15 }), 80)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey])
  return null
}

export function MapView({
  center,
  zoom = 13,
  children,
  className,
  fit,
  fitKey,
  fitPadding = 40,
  interactive = true,
}: {
  center: LatLng
  zoom?: number
  children?: ReactNode
  className?: string
  fit?: LatLng[]
  fitKey?: string | number
  fitPadding?: number
  interactive?: boolean
}) {
  const theme = useApp((s) => s.theme)
  return (
    <div className={cn('relative isolate z-0 overflow-hidden rounded-card border border-line', className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={interactive}
        scrollWheelZoom={false}
        dragging={interactive}
        doubleClickZoom={interactive}
        attributionControl
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer key={theme} url={theme === 'dark' ? DARK : LIGHT} attribution={ATTR} maxNativeZoom={16} maxZoom={19} />
        <TileLayer key={theme + '-ref'} url={theme === 'dark' ? DARK_REF : LIGHT_REF} maxNativeZoom={16} maxZoom={19} />
        <SizeFix />
        {fit && <Fit points={fit} fitKey={fitKey} padding={fitPadding} />}
        {children}
      </MapContainer>
    </div>
  )
}

/* ───────── divIcons ───────── */
export const icons = {
  /** Available driver: accent dot with pulsing halo */
  available: (big = false) =>
    L.divIcon({ className: 'fl-icon', html: `<div class="fl-driver halo ${big ? 'big' : ''}"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] }),
  /** Busy driver: grey dot */
  busy: () => L.divIcon({ className: 'fl-icon', html: '<div class="fl-driver busy"></div>', iconSize: [14, 14], iconAnchor: [7, 7] }),
  /** Dimmed (not lit yet during matching) */
  dim: () => L.divIcon({ className: 'fl-icon', html: '<div class="fl-driver dim"></div>', iconSize: [14, 14], iconAnchor: [7, 7] }),
  /** Assigned driver (truck badge) */
  truck: () =>
    L.divIcon({
      className: 'fl-icon',
      html: '<div class="fl-truck" data-trailer="driver-marker"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    }),
  origin: () => L.divIcon({ className: 'fl-icon', html: '<div class="fl-pin origin"></div>', iconSize: [22, 22], iconAnchor: [11, 26] }),
  dest: () => L.divIcon({ className: 'fl-icon', html: '<div class="fl-pin dest"></div>', iconSize: [22, 22], iconAnchor: [11, 26] }),
  radar: () => L.divIcon({ className: 'fl-icon', html: '<div class="fl-radar"></div>', iconSize: [260, 260], iconAnchor: [130, 130] }),
}

export const ACCENT = '#1F5BFF'
