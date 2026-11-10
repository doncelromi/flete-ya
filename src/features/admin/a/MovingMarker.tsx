import { useEffect, useRef, type ReactNode } from 'react'
import { Marker } from 'react-leaflet'
import type L from 'leaflet'
import type { LatLng } from '@/data/types'

/**
 * Marker that glides (rAF, linear) to each new `position`.
 * The Leaflet position is driven imperatively so zoom/pan stay native and crisp.
 */
export function MovingMarker({
  position,
  icon,
  duration = 2900,
  zIndexOffset,
  children,
}: {
  position: LatLng
  icon: L.DivIcon
  duration?: number
  zIndexOffset?: number
  children?: ReactNode
}) {
  const ref = useRef<L.Marker>(null)
  const initial = useRef<LatLng>(position)
  const [lat, lng] = position
  useEffect(() => {
    const m = ref.current
    if (!m) return
    const from = m.getLatLng()
    if (from.lat === lat && from.lng === lng) return
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / duration)
      m.setLatLng([from.lat + (lat - from.lat) * k, from.lng + (lng - from.lng) * k])
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [lat, lng, duration])
  return (
    <Marker ref={ref} position={initial.current} icon={icon} zIndexOffset={zIndexOffset}>
      {children}
    </Marker>
  )
}
