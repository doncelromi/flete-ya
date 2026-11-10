import {
  BarChart3,
  CreditCard,
  FileCheck2,
  FileText,
  Gauge,
  History,
  LifeBuoy,
  MapPinned,
  Navigation,
  Percent,
  Radar,
  Route,
  ShieldCheck,
  Star,
  Truck,
  Users,
  Wallet,
  Home,
  Folder,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/store/app'
import type { DictKey } from '@/i18n/dict'

export interface NavItem {
  id: string
  path: string
  label: DictKey
  icon: LucideIcon
}

export const PROPUESTA: NavItem = { id: 'propuesta', path: '/propuesta', label: 'nav.propuesta', icon: FileText }

export const NAV: Record<Role, NavItem[]> = {
  cliente: [
    { id: 'pedir', path: '/pedir', label: 'nav.pedir', icon: Truck },
    { id: 'viaje', path: '/viaje', label: 'nav.viaje', icon: Navigation },
    { id: 'mis-viajes', path: '/mis-viajes', label: 'nav.misViajes', icon: History },
    { id: 'pagos', path: '/pagos', label: 'nav.pagos', icon: CreditCard },
    { id: 'soporte', path: '/soporte', label: 'nav.soporte', icon: LifeBuoy },
  ],
  conductor: [
    { id: 'c-inicio', path: '/conductor/inicio', label: 'nav.cInicio', icon: Home },
    { id: 'c-viaje', path: '/conductor/viaje', label: 'nav.cViaje', icon: Route },
    { id: 'c-ganancias', path: '/conductor/ganancias', label: 'nav.cGanancias', icon: Wallet },
    { id: 'c-documentos', path: '/conductor/documentos', label: 'nav.cDocumentos', icon: Folder },
  ],
  admin: [
    { id: 'operacion', path: '/admin/operacion', label: 'nav.operacion', icon: MapPinned },
    { id: 'viajes', path: '/admin/viajes', label: 'nav.viajes', icon: Route },
    { id: 'conductores', path: '/admin/conductores', label: 'nav.conductores', icon: Users },
    { id: 'verificacion', path: '/admin/verificacion', label: 'nav.verificacion', icon: ShieldCheck },
    { id: 'comisiones', path: '/admin/comisiones', label: 'nav.comisiones', icon: Percent },
    { id: 'calificaciones', path: '/admin/calificaciones', label: 'nav.calificaciones', icon: Star },
    { id: 'reportes', path: '/admin/reportes', label: 'nav.reportes', icon: BarChart3 },
  ],
}

export const PHASE2: NavItem[] = [
  { id: 'f2-liquidaciones', path: '/admin/fase2/liquidaciones', label: 'nav.f2liquidaciones', icon: Wallet },
  { id: 'f2-matching', path: '/admin/fase2/matching', label: 'nav.f2matching', icon: Radar },
  { id: 'f2-antecedentes', path: '/admin/fase2/antecedentes', label: 'nav.f2antecedentes', icon: FileCheck2 },
  { id: 'f2-analytics', path: '/admin/fase2/analytics', label: 'nav.f2analytics', icon: Gauge },
]

/** Full ordered nav for a role (Propuesta first). Admin's "Fase 2" is a pseudo item. */
export function navFor(role: Role): NavItem[] {
  return [PROPUESTA, ...NAV[role]]
}

export function isActive(path: string, itemPath: string) {
  return path === itemPath || path.startsWith(itemPath + '/')
}
