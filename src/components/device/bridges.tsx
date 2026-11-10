import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp, type Device, type Lang, type PreviewState, type Role, type Theme } from '@/store/app'
import { postToFrame, postToParent, type FrameMsg } from '@/lib/frame'

function cleanPath(pathname: string, search: string) {
  const q = new URLSearchParams(search)
  ;['device', 'theme', 'lang', 'role'].forEach((k) => q.delete(k))
  const s = q.toString()
  return pathname + (s ? `?${s}` : '')
}

/** Runs INSIDE the phone-frame iframe: applies parent state, reports navigation. */
export function FrameBridge() {
  const navigate = useNavigate()
  const loc = useLocation()
  const fromParent = useRef<string | null>(null)

  useEffect(() => {
    const onMsg = (e: MessageEvent<FrameMsg>) => {
      if (e.origin !== window.location.origin || !e.data || typeof e.data !== 'object') return
      const m = e.data
      const s = useApp.getState()
      if (m.type === 'sync') {
        if (m.theme !== s.theme) s.setTheme(m.theme as Theme, true)
        if (m.lang !== s.lang) s.setLang(m.lang as Lang, true)
        if (m.role !== s.role) s.setRole(m.role as Role)
        useApp.setState({ preview: (m.preview as PreviewState | null) ?? null, moduloDestacado: m.destacado })
      } else if (m.type === 'navigate') {
        const cur = cleanPath(window.location.pathname, window.location.search)
        if (m.path !== cur) {
          fromParent.current = m.path
          navigate(m.path)
        }
      } else if (m.type === 'startTour') {
        s.startTour()
      }
    }
    window.addEventListener('message', onMsg)
    // ask for state now and again shortly after (the first sync can race the iframe load)
    postToParent({ type: 'ready' })
    const r1 = setTimeout(() => postToParent({ type: 'ready' }), 600)
    const r2 = setTimeout(() => postToParent({ type: 'ready' }), 1500)
    return () => {
      clearTimeout(r1)
      clearTimeout(r2)
      window.removeEventListener('message', onMsg)
    }
  }, [navigate])

  useEffect(() => {
    const path = cleanPath(loc.pathname, loc.search)
    if (fromParent.current === path) {
      fromParent.current = null
      return
    }
    postToParent({ type: 'nav', path, role: useApp.getState().role })
  }, [loc.pathname, loc.search])

  return null
}

/** Runs in the desktop PARENT while the phone frame is shown. */
export function useParentBridge(iframe: React.RefObject<HTMLIFrameElement>) {
  const navigate = useNavigate()
  const loc = useLocation()
  const lastFramePath = useRef<string | null>(null)
  const theme = useApp((s) => s.theme)
  const lang = useApp((s) => s.lang)
  const role = useApp((s) => s.role)
  const preview = useApp((s) => s.preview)
  const destacado = useApp((s) => s.moduloDestacado)

  const sync = () => {
    const s = useApp.getState()
    postToFrame({ type: 'sync', theme: s.theme, lang: s.lang, role: s.role, preview: s.preview, destacado: s.moduloDestacado })
  }

  // state → frame
  useEffect(sync, [theme, lang, role, preview, destacado])

  // parent route → frame (only when it didn't originate in the frame)
  useEffect(() => {
    const path = cleanPath(loc.pathname, loc.search)
    if (path === lastFramePath.current) return
    postToFrame({ type: 'navigate', path })
  }, [loc.pathname, loc.search])

  // frame → parent
  useEffect(() => {
    const onMsg = (e: MessageEvent<FrameMsg>) => {
      if (e.origin !== window.location.origin || e.source !== iframe.current?.contentWindow) return
      const m = e.data
      const s = useApp.getState()
      switch (m.type) {
        case 'ready':
          sync()
          break
        case 'nav':
          lastFramePath.current = m.path
          if (m.role !== s.role) s.setRole(m.role as Role)
          navigate(m.path, { replace: true })
          break
        case 'setTheme':
          s.setTheme(m.theme as Theme, true)
          break
        case 'setLang':
          s.setLang(m.lang as Lang, true)
          break
        case 'setRole':
          s.setRole(m.role as Role)
          break
        case 'setDevice':
          s.setDevice(m.device as Device)
          break
        case 'closePreview':
          s.cerrarPreview()
          break
        case 'cancelPreview':
          s.cancelPreview()
          break
        case 'openPreview': {
          const [mod, view, rol, titulo, dev] = m.args
          s.abrirPreview(mod, view, rol as Role, titulo, dev as Device | undefined)
          break
        }
        case 'login':
          s.login(m.role as Role, m.email)
          break
        case 'logout':
          s.logout()
          break
        case 'startTrailer':
          s.launchTrailer()
          break
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, iframe])
}

export { cleanPath }
