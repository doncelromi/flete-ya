import { Monitor, Moon, Smartphone, Sun } from 'lucide-react'
import { useApp } from '@/store/app'
import { useT } from '@/i18n'
import { Segmented } from '@/components/ui'
import { cn } from '@/lib/utils'

export function LangToggle({ className }: { className?: string }) {
  const lang = useApp((s) => s.lang)
  const setLang = useApp((s) => s.setLang)
  return (
    <Segmented
      className={className}
      value={lang}
      onChange={(l) => setLang(l)}
      items={[
        { id: 'es', label: 'ES' },
        { id: 'en', label: 'EN' },
      ]}
    />
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useApp((s) => s.theme)
  const toggle = useApp((s) => s.toggleTheme)
  const { t } = useT()
  return (
    <button
      onClick={toggle}
      title={t('chrome.theme')}
      aria-label={t('chrome.theme')}
      className={cn('grid h-8 w-8 place-items-center rounded-full border border-line bg-card text-ink2 hover:text-ink', className)}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}

/** Desktop | Mobile — hidden below 1024px and inside the phone frame. */
export function DeviceToggle({ className, tour = true, compact = true }: { className?: string; tour?: boolean; compact?: boolean }) {
  const device = useApp((s) => s.device)
  const setDevice = useApp((s) => s.setDevice)
  const trailer = useApp((s) => s.trailer)
  const isFrame = useApp((s) => s.isFrame)
  const { t } = useT()
  if (isFrame) return null
  return (
    <div className={cn('hidden lg:block', className)} data-tour={tour ? 'device-toggle' : undefined} title={t('device.tip')}>
      <Segmented
        value={device}
        onChange={(d) => !trailer && setDevice(d)}
        items={[
          { id: 'desktop', label: (<><Monitor size={13} /> <span className={compact ? 'hidden 2xl:inline' : ''}>{t('device.desktop')}</span></>), title: t('device.tip') },
          { id: 'mobile', label: (<><Smartphone size={13} /> <span className={compact ? 'hidden 2xl:inline' : ''}>{t('device.mobile')}</span></>), title: t('device.tip') },
        ]}
      />
    </div>
  )
}
