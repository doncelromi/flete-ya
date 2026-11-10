// Global navigate handle so store actions (preview, tour, trailer) can route.
type NavFn = (to: string, opts?: { replace?: boolean }) => void
let navFn: NavFn = (to) => {
  window.history.pushState({}, '', to)
}
export function setNavigator(fn: NavFn) {
  navFn = fn
}
export function go(to: string, opts?: { replace?: boolean }) {
  navFn(to, opts)
}
