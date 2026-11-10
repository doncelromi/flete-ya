import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Clock, CreditCard, Eye, EyeOff, LogIn, MapPin, MessageCircle, PlayCircle, ShieldCheck, Truck, User, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { useApp, type Role } from '@/store/app'
import { useT } from '@/i18n'
import { Button, Input, Label, Card } from '@/components/ui'
import { BrandName, Logo, LogoMark } from '@/components/brand'
import { DeviceToggle, LangToggle, ThemeToggle } from '@/components/layout/toggles'
import { cn, openWhatsApp } from '@/lib/utils'

const ACCOUNTS: { role: Role; email: string; icon: typeof User }[] = [
  { role: 'cliente', email: 'cliente@fletesya.app', icon: User },
  { role: 'conductor', email: 'conductor@fletesya.app', icon: Truck },
  { role: 'admin', email: 'admin@fletesya.app', icon: Wrench },
]

export default function LoginPage() {
  const { t } = useT()
  const login = useApp((s) => s.login)
  const launchTrailer = useApp((s) => s.launchTrailer)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [err, setErr] = useState(false)

  const fill = (r: Role, e: string) => {
    setEmail(e)
    setPass('demo1234')
    setErr(false)
    toast(t('login.filled', { role: t(`role.${r}`) }))
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const acc = ACCOUNTS.find((a) => a.email === email.trim().toLowerCase())
    if (!acc || pass !== 'demo1234') {
      setErr(true)
      return
    }
    login(acc.role, acc.email)
  }

  const features = [
    { icon: ShieldCheck, text: t('login.f1') },
    { icon: Clock, text: t('login.f2') },
    { icon: MapPin, text: t('login.f3') },
    { icon: CreditCard, text: t('login.f4') },
  ]

  return (
    <div className="relative flex min-h-screen bg-bg">
      {/* top-right toggles */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <DeviceToggle tour={false} compact={false} />
        <LangToggle />
        <ThemeToggle />
      </div>

      {/* HERO 55% */}
      <section className="relative hidden w-[55%] overflow-hidden border-r border-line bg-subtle lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-accent opacity-[.10] blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-[380px] w-[380px] rounded-full bg-accent opacity-[.08] blur-[100px]" />
        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2 shadow-card">
              <LogoMark size={28} />
              <BrandName className="text-[17px]" />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 py-1 text-[11px] font-bold tracking-[.08em] text-accent">
              <span className="pulse-dot" /> {t('brand.demo')}
            </span>
          </div>

          <div className="max-w-[560px]">
            <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight xl:text-[54px]">
              {t('login.headline1')}
              <br />
              <span className="text-accent">{t('login.headline2')}</span>
            </h1>
            <p className="mt-5 max-w-[480px] text-[16px] leading-relaxed text-ink2">{t('login.sub')}</p>
            <ul className="mt-8 space-y-3">
              {features.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, translate: '-12px 0px' }}
                  animate={{ opacity: 1, translate: '0px 0px' }}
                  transition={{ delay: 0.25 + i * 0.12, duration: 0.4 }}
                  className="flex items-center gap-3 text-[15px] font-medium"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent">
                    <f.icon size={16} />
                  </span>
                  {f.text}
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-xs text-ink2">
            <BadgeCheck size={14} className="text-accent" /> {t('brand.powered')} · Montevideo, Uruguay
          </div>
        </div>
      </section>

      {/* CARD 45% */}
      <section className="flex w-full items-center justify-center px-4 py-20 lg:w-[45%] lg:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Logo />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-2.5 py-0.5 text-[10px] font-bold tracking-[.08em] text-accent">
              <span className="pulse-dot" /> {t('brand.demo')}
            </span>
          </div>
          <Card className="p-6 sm:p-7">
            <h2 className="text-[22px] font-extrabold tracking-tight">{t('login.title')}</h2>
            <p className="mt-1 text-sm text-ink2">{t('login.subtitle')}</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">{t('login.user')}</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@fletesya.app" autoComplete="username" />
              </div>
              <div>
                <Label htmlFor="pass">{t('login.pass')}</Label>
                <div className="relative">
                  <Input id="pass" type={show ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="pr-10" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink2 hover:text-ink" aria-label="toggle">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <label className="flex cursor-pointer items-center gap-2 text-ink2">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#1F5BFF]" />
                  {t('login.remember')}
                </label>
                <button type="button" onClick={() => toast(t('login.forgotToast'))} className="font-semibold text-accent hover:underline">
                  {t('login.forgot')}
                </button>
              </div>
              {err && <div className="rounded-lg bg-[var(--red-soft)] px-3 py-2 text-[13px] font-medium text-st-red">{t('login.error')}</div>}
              <Button type="submit" size="lg" className="w-full">
                <LogIn size={17} /> {t('login.submit')}
              </Button>
            </form>

            <div className="mt-6">
              <div className="kpi-label mb-2">{t('login.quick')}</div>
              <div className="flex flex-wrap gap-2">
                {ACCOUNTS.map((a) => (
                  <button
                    key={a.role}
                    onClick={() => fill(a.role, a.email)}
                    className={cn(
                      'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
                      email === a.email ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-card text-ink hover:border-accent/40',
                    )}
                  >
                    <a.icon size={14} /> {t(`role.${a.role}`)}
                  </button>
                ))}
              </div>
              <p className="mono mt-2 text-[11px] text-ink2">pass: demo1234</p>
            </div>

            <div className="mt-6 space-y-2 border-t border-line pt-5">
              <button
                onClick={launchTrailer}
                className="flex w-full items-center justify-between rounded-[10px] bg-subtle px-3.5 py-3 text-left text-[13.5px] font-semibold text-ink hover:bg-accent-soft hover:text-accent"
              >
                <span className="flex items-center gap-2">
                  <PlayCircle size={17} className="text-accent" /> {t('login.trailer')}
                </span>
                <ArrowRight size={15} />
              </button>
              <button onClick={openWhatsApp} className="flex w-full items-center gap-2 px-1 py-1 text-[13px] font-medium text-ink2 hover:text-st-green">
                <MessageCircle size={15} /> {t('login.noAccess')}
              </button>
            </div>
          </Card>
          <p className="mt-4 text-center text-[11px] text-ink2 lg:hidden">{t('brand.powered')}</p>
        </div>
      </section>
    </div>
  )
}
