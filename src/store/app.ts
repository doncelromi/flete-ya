import { create } from 'zustand'
import { IS_FRAME, postToParent } from '@/lib/frame'
import { go } from '@/lib/nav'
import { lsGet, lsSet, ssGet, ssSet } from '@/lib/utils'

export type Role = 'cliente' | 'conductor' | 'admin'
export type Lang = 'es' | 'en'
export type Theme = 'light' | 'dark'
export type Device = 'desktop' | 'mobile'

export interface PreviewState {
  modulo: number
  view: string
  rolePrevio: Role
  devicePrevio: Device
  titulo: string
}

export const ROLE_HOME: Record<Role, string> = {
  cliente: '/pedir',
  conductor: '/conductor/inicio',
  admin: '/admin/operacion',
}

const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')

function readSession(): { role: Role } | null {
  try {
    const raw = ssGet('fleta_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
const session = readSession()

const initialTheme = ((IS_FRAME && q.get('theme')) || lsGet('fleta_theme') || 'light') as Theme
const initialLang = ((IS_FRAME && q.get('lang')) || lsGet('fleta_lang') || 'es') as Lang
const initialRole = ((IS_FRAME && q.get('role')) || session?.role || 'cliente') as Role

export function applyTheme(t: Theme) {
  const d = document.documentElement
  d.classList.toggle('dark', t === 'dark')
  d.style.background = t === 'dark' ? '#09090b' : '#ffffff'
}
applyTheme(initialTheme)
document.documentElement.lang = initialLang

interface AppState {
  isFrame: boolean
  authed: boolean
  role: Role
  lang: Lang
  theme: Theme
  device: Device
  preview: PreviewState | null
  moduloDestacado: number | null
  welcomeOpen: boolean
  tourOpen: boolean
  tourKey: number
  trailer: boolean
  moreOpen: boolean
  sheetOpen: boolean
  bannerCollapsed: Record<string, boolean>

  login: (role: Role, email: string) => void
  logout: () => void
  setRole: (r: Role) => void
  switchRole: (r: Role) => void
  setLang: (l: Lang, fromRemote?: boolean) => void
  setTheme: (t: Theme, fromRemote?: boolean) => void
  toggleTheme: () => void
  setDevice: (d: Device) => void
  abrirPreview: (modulo: number, view: string, rol: Role, titulo: string, device?: Device) => void
  cerrarPreview: () => void
  cancelPreview: () => void
  limpiarDestacado: () => void
  closeWelcome: () => void
  startTour: () => void
  stopTour: () => void
  setTrailer: (on: boolean) => void
  launchTrailer: () => void
  setMoreOpen: (o: boolean) => void
  setSheetOpen: (o: boolean) => void
  toggleBanner: (key: string) => void
}

export const useApp = create<AppState>((set, get) => ({
  isFrame: IS_FRAME,
  authed: !!session,
  role: initialRole,
  lang: initialLang,
  theme: initialTheme,
  device: IS_FRAME ? 'desktop' : ((lsGet('fleta_device_view') as Device) || 'desktop'),
  preview: null,
  moduloDestacado: null,
  welcomeOpen: false,
  tourOpen: false,
  tourKey: 0,
  trailer: false,
  moreOpen: false,
  sheetOpen: false,
  bannerCollapsed: {},

  login: (role, email) => {
    ssSet('fleta_session', JSON.stringify({ role, email }))
    const seen = ssGet('fleta_welcome_seen')
    set({ authed: true, role, preview: null })
    if (IS_FRAME) postToParent({ type: 'login', role, email })
    go('/propuesta', { replace: true })
    if (!seen && !IS_FRAME) {
      setTimeout(() => set({ welcomeOpen: true }), 400)
    }
  },
  logout: () => {
    try {
      sessionStorage.clear()
    } catch {
      /* ignore */
    }
    set({ authed: false, preview: null, tourOpen: false, welcomeOpen: false, sheetOpen: false, moreOpen: false })
    if (IS_FRAME) postToParent({ type: 'logout' })
    go('/login', { replace: true })
  },
  setRole: (r) => {
    if (get().role === r) return
    set({ role: r })
    const raw = ssGet('fleta_session')
    if (raw) {
      try {
        ssSet('fleta_session', JSON.stringify({ ...JSON.parse(raw), role: r }))
      } catch {
        /* ignore */
      }
    }
  },
  /** Manual switch from the role switcher: cancels preview and goes to the role home. */
  switchRole: (r) => {
    get().cancelPreview()
    get().setRole(r)
    if (IS_FRAME) postToParent({ type: 'setRole', role: r })
    set({ sheetOpen: false })
    go(ROLE_HOME[r])
  },
  setLang: (l, fromRemote) => {
    set({ lang: l })
    document.documentElement.lang = l
    lsSet('fleta_lang', l)
    if (IS_FRAME && !fromRemote) postToParent({ type: 'setLang', lang: l })
  },
  setTheme: (t, fromRemote) => {
    set({ theme: t })
    applyTheme(t)
    lsSet('fleta_theme', t)
    if (IS_FRAME && !fromRemote) postToParent({ type: 'setTheme', theme: t })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
  setDevice: (d) => {
    if (IS_FRAME) {
      postToParent({ type: 'setDevice', device: d })
      return
    }
    set({ device: d })
    lsSet('fleta_device_view', d)
  },
  abrirPreview: (modulo, view, rol, titulo, device) => {
    if (IS_FRAME) {
      postToParent({ type: 'openPreview', args: [modulo, view, rol, titulo, device] })
      return
    }
    const s = get()
    set({
      preview: { modulo, view, rolePrevio: s.role, devicePrevio: s.device, titulo },
      moduloDestacado: null,
    })
    s.setRole(rol)
    if (device) s.setDevice(device)
    go(view)
  },
  cerrarPreview: () => {
    if (IS_FRAME) {
      postToParent({ type: 'closePreview' })
      return
    }
    const p = get().preview
    if (!p) return
    set({ preview: null, moduloDestacado: p.modulo })
    // route first, then restore role/device: otherwise the role-from-path guard
    // would see the old module route and switch the role back.
    go('/propuesta')
    setTimeout(() => {
      get().setRole(p.rolePrevio)
      get().setDevice(p.devicePrevio)
    }, 0)
  },
  cancelPreview: () => {
    if (!get().preview) return
    set({ preview: null })
    if (IS_FRAME) postToParent({ type: 'cancelPreview' })
  },
  limpiarDestacado: () => set({ moduloDestacado: null }),
  closeWelcome: () => {
    ssSet('fleta_welcome_seen', '1')
    set({ welcomeOpen: false })
  },
  startTour: () => {
    if (get().trailer) return
    set((s) => ({ tourOpen: true, tourKey: s.tourKey + 1, moreOpen: false, sheetOpen: false }))
  },
  stopTour: () => set({ tourOpen: false, moreOpen: false, sheetOpen: false }),
  setTrailer: (on) => {
    set({ trailer: on, tourOpen: false })
    if (on) set({ preview: null })
  },
  /** The trailer always runs on desktop: from inside the phone frame it asks the parent to switch back. */
  launchTrailer: () => {
    if (IS_FRAME) {
      postToParent({ type: 'startTrailer' })
      return
    }
    get().setDevice('desktop')
    get().setTrailer(true)
  },
  setMoreOpen: (o) => set({ moreOpen: o }),
  setSheetOpen: (o) => set({ sheetOpen: o }),
  toggleBanner: (key) => set((s) => ({ bannerCollapsed: { ...s.bannerCollapsed, [key]: !s.bannerCollapsed[key] } })),
}))

export function roleForPath(path: string): Role | null {
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/conductor')) return 'conductor'
  if (['/pedir', '/viaje', '/mis-viajes', '/pagos', '/soporte'].some((p) => path.startsWith(p))) return 'cliente'
  return null
}
