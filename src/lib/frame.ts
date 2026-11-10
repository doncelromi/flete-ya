// postMessage bridge between the desktop parent and the phone-frame iframe (same origin).
export const IS_FRAME =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('device') === 'frame'

export type FrameMsg =
  | { type: 'sync'; theme: string; lang: string; role: string; preview: unknown; destacado: number | null }
  | { type: 'navigate'; path: string }
  | { type: 'startTour' }
  | { type: 'nav'; path: string; role: string }
  | { type: 'closePreview' }
  | { type: 'cancelPreview' }
  | { type: 'openPreview'; args: [number, string, string, string, string | undefined] }
  | { type: 'setTheme'; theme: string }
  | { type: 'setLang'; lang: string }
  | { type: 'setRole'; role: string }
  | { type: 'setDevice'; device: string }
  | { type: 'logout' }
  | { type: 'login'; role: string; email: string }
  | { type: 'ready' }
  | { type: 'startTrailer' }

let frameWin: Window | null = null
export function setFrameWindow(w: Window | null) {
  frameWin = w
}
export function postToFrame(msg: FrameMsg) {
  frameWin?.postMessage(msg, window.location.origin)
}
export function postToParent(msg: FrameMsg) {
  if (IS_FRAME && window.parent !== window) window.parent.postMessage(msg, window.location.origin)
}
