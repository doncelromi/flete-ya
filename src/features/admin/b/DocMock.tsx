import type { CSSProperties, ReactNode } from 'react'
import type { Driver, DocType } from '@/data/types'
import { CATEGORY_LABEL } from '@/data/labels'
import { at, fmtDate } from '@/data/dates'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { hash } from './common'

/* Mock document "images" drawn with HTML/SVG. Sizes use container-query units (cqw)
   so the same component renders as a thumbnail or full size. They are pictures of
   physical documents, so they keep a light palette in dark mode too. */

const u = (n: number) => `${n}cqw`

export const PAPER_DOCS: DocType[] = ['antecedentes', 'seguro']

function Photo({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={cn('overflow-hidden rounded-[0.8cqw] bg-[#cbd5e1]', className)} style={style}>
      <svg viewBox="0 0 60 75" className="h-full w-full" preserveAspectRatio="xMidYMax slice">
        <rect width="60" height="75" fill="#cfd8e3" />
        <circle cx="30" cy="30" r="13" fill="#94a3b8" />
        <path d="M6 75c0-15 10.7-24 24-24s24 9 24 24z" fill="#94a3b8" />
      </svg>
    </div>
  )
}

function Watermark({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
      <span
        className="whitespace-nowrap font-black tracking-[.12em]"
        style={{ fontSize: u(9), color: 'rgba(220,38,38,.13)', rotate: '-22deg' }}
      >
        {text}
      </span>
    </div>
  )
}

function Field({ k, v, mono, red }: { k: string; v: ReactNode; mono?: boolean; red?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="uppercase tracking-[.04em] text-[#64748b]" style={{ fontSize: u(2.1) }}>
        {k}
      </div>
      <div className={cn('truncate font-bold', mono && 'font-mono', red ? 'text-[#DC2626]' : 'text-[#0f172a]')} style={{ fontSize: u(3.3), lineHeight: 1.15 }}>
        {v}
      </div>
    </div>
  )
}

function QR({ seed }: { seed: number }) {
  const cells: ReactNode[] = []
  let s = seed
  for (let y = 0; y < 11; y++)
    for (let x = 0; x < 11; x++) {
      s = (Math.imul(s, 1103515245) + 12345) >>> 0
      const corner = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7)
      if (corner || (s >>> 16) % 2 === 0) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0f172a" />)
    }
  return (
    <svg viewBox="-1 -1 13 13" className="h-full w-full bg-white">
      {cells}
    </svg>
  )
}

function Signature() {
  return (
    <svg viewBox="0 0 120 40" className="h-full w-full">
      <path d="M4 30c10-18 16-22 20-10s4 12 12-4 10-10 12 2 8 10 16-8 12-6 14 6 10 4 18-6 10 0 20-4" fill="none" stroke="#1e3a8a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function DocMock({
  driver,
  tipo,
  expired,
  className,
}: {
  driver: Driver
  tipo: DocType
  expired?: boolean
  className?: string
}) {
  const { L, P } = useT()
  const h = hash(driver.id + tipo)
  const [nombre, ...rest] = driver.nombre.split(' ')
  const apellido = rest.join(' ')
  const dniDigits = driver.dni.replace(/\./g, '')
  const birthYear = 1972 + (hash(driver.id) % 24)
  const birth = `${String((hash(driver.id) % 27) + 1).padStart(2, '0')}/${String((hash(driver.nombre) % 12) + 1).padStart(2, '0')}/${birthYear}`
  const doc = driver.documentos.find((d) => d.tipo === tipo)
  const upDate = doc?.auditoria[0]?.fecha ?? driver.alta
  const paper = PAPER_DOCS.includes(tipo)
  const wm = L('MUESTRA · SAMPLE', 'SAMPLE · MUESTRA')

  let body: ReactNode = null

  if (tipo === 'dni') {
    body = (
      <div className="absolute inset-0 flex flex-col" style={{ background: 'linear-gradient(135deg,#eef3f9 0%,#dde7f2 55%,#eaf0f6 100%)' }}>
        <div className="absolute inset-0 opacity-40" style={{ background: 'repeating-radial-gradient(circle at 70% 40%, transparent 0 1.2cqw, rgba(31,91,255,.07) 1.2cqw 1.4cqw)' }} />
        <div className="relative flex items-start justify-between px-[4cqw] pt-[3cqw]">
          <div>
            <div className="font-black tracking-[.06em] text-[#0f2a5c]" style={{ fontSize: u(3.4) }}>
              REPÚBLICA ORIENTAL DEL URUGUAY
            </div>
            <div className="font-semibold text-[#475569]" style={{ fontSize: u(2) }}>
              MERCOSUR · {L('DIRECCIÓN NACIONAL DE IDENTIFICACIÓN CIVIL', 'NATIONAL CIVIL IDENTIFICATION OFFICE')}
            </div>
          </div>
          <div className="text-right font-bold text-[#0f2a5c]" style={{ fontSize: u(2.2) }}>
            {L('CÉDULA', 'IDENTITY')}
            <br />
            {L('DE IDENTIDAD', 'CARD')}
          </div>
        </div>
        <div className="relative flex flex-1 gap-[4cqw] px-[4cqw] pt-[2.5cqw]">
          <Photo className="h-[72%] w-[27%] shrink-0" />
          <div className="grid flex-1 grid-cols-2 content-start gap-x-[3cqw] gap-y-[1.6cqw]">
            <div className="col-span-2">
              <Field k={L('Apellido / Surname', 'Surname / Apellido')} v={apellido.toUpperCase()} />
            </div>
            <div className="col-span-2">
              <Field k={L('Nombre / Name', 'Name / Nombre')} v={nombre.toUpperCase()} />
            </div>
            <Field k={L('Sexo / Sex', 'Sex / Sexo')} v={driver.nombre.match(/^(Rocío|Gisela|Luciana|Paola|Valeria|Soledad|Florencia|Romina|Carla)/) ? 'F' : 'M'} />
            <Field k={L('Nacionalidad', 'Nationality')} v="URUGUAYA" />
            <Field k={L('Nacimiento / Birth', 'Birth / Nacimiento')} v={birth} mono />
            <Field k={L('Documento', 'Document')} v={driver.dni} mono />
          </div>
        </div>
        <div className="relative bg-white/60 px-[4cqw] py-[1.6cqw] font-mono leading-[1.25] tracking-[.14em] text-[#334155]" style={{ fontSize: u(2.5) }}>
          <div className="truncate">{`IDURY${dniDigits}<${h % 10}<<<<<<<<<<<<<<<`}</div>
          <div className="truncate">{`${apellido.toUpperCase().replace(/[^A-Z]/g, '<')}<<${nombre.toUpperCase().replace(/[^A-Z]/g, '<')}<<<<<<<<<<<<`}</div>
        </div>
      </div>
    )
  } else if (tipo === 'licencia') {
    const vence = doc?.vence ?? at(700)
    body = (
      <div className="absolute inset-0 flex flex-col" style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#d7f0e6 60%,#e8f7f0 100%)' }}>
        <div className="relative flex items-center justify-between bg-[#0f766e] px-[4cqw] py-[2cqw] text-white">
          <div>
            <div className="font-black tracking-[.05em]" style={{ fontSize: u(3.4) }}>
              {L('LIBRETA DE CONDUCIR · SUCIVE', 'DRIVING LICENSE · SUCIVE')}
            </div>
            <div className="opacity-85" style={{ fontSize: u(2) }}>
              INTENDENCIA DE MONTEVIDEO · URUGUAY
            </div>
          </div>
          <div className="rounded-[1cqw] bg-white/20 px-[2cqw] py-[0.6cqw] font-black" style={{ fontSize: u(3.6) }}>
            {driver.licenciaClase.split(' ')[0]}
          </div>
        </div>
        <div className="relative flex flex-1 gap-[4cqw] px-[4cqw] pt-[3cqw]">
          <Photo className="h-[78%] w-[26%] shrink-0" />
          <div className="grid flex-1 grid-cols-2 content-start gap-x-[3cqw] gap-y-[1.8cqw]">
            <div className="col-span-2">
              <Field k={L('Apellido y nombre', 'Full name')} v={driver.nombre.toUpperCase()} />
            </div>
            <div className="col-span-2">
              <Field k={L('Domicilio', 'Address')} v={`${driver.barrio.toUpperCase()}, MONTEVIDEO`} />
            </div>
            <Field k={L('Clase', 'Class')} v={driver.licenciaClase.toUpperCase()} />
            <Field k={L('N° de licencia', 'License no.')} v={dniDigits} mono />
            <Field k={L('Otorgamiento', 'Issued')} v={fmtDate(upDate)} mono />
            <Field k={L('Vencimiento', 'Expires')} v={fmtDate(vence)} mono />
          </div>
        </div>
      </div>
    )
  } else if (tipo === 'cedula') {
    body = (
      <div className="absolute inset-0 flex flex-col" style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 60%,#eefcf2 100%)' }}>
        <div className="relative bg-[#15803d] px-[4cqw] py-[2cqw] text-white">
          <div className="font-black tracking-[.04em]" style={{ fontSize: u(3.1) }}>
            {L('LIBRETA DE PROPIEDAD DEL VEHÍCULO', 'VEHICLE OWNERSHIP CERTIFICATE')}
          </div>
          <div className="opacity-85" style={{ fontSize: u(2) }}>
            {L('SUCIVE · República Oriental del Uruguay', 'SUCIVE · Uruguay')}
          </div>
        </div>
        <div className="relative flex flex-1 gap-[4cqw] px-[4cqw] pt-[3cqw]">
          <div className="flex w-[34%] shrink-0 flex-col gap-[2cqw]">
            <div className="rounded-[1.2cqw] border-[0.5cqw] border-[#0f172a] bg-white text-center">
              <div className="bg-[#1e40af] font-bold text-white" style={{ fontSize: u(1.8) }}>
                URUGUAY
              </div>
              <div className="font-mono font-black text-[#0f172a]" style={{ fontSize: u(4.6), lineHeight: 1.4 }}>
                {driver.vehiculo.patente}
              </div>
            </div>
            <Field k={L('Motor N°', 'Engine no.')} v={`K9K${(h % 900000) + 100000}`} mono />
          </div>
          <div className="grid flex-1 grid-cols-2 content-start gap-x-[3cqw] gap-y-[1.8cqw]">
            <div className="col-span-2">
              <Field k={L('Titular', 'Owner')} v={driver.nombre.toUpperCase()} />
            </div>
            <Field k={L('Modelo', 'Model')} v={driver.vehiculo.modelo.toUpperCase()} />
            <Field k={L('Tipo', 'Type')} v={L('FURGÓN', 'VAN')} />
            <Field k="Color" v={L(driver.vehiculo.color, driver.vehiculo.colorEn).toUpperCase()} />
            <Field k={L('Año', 'Year')} v={String(2012 + (h % 12))} mono />
            <div className="col-span-2">
              <Field k={L('Chasis N°', 'Chassis no.')} v={`8A1${(h * 7).toString(36).toUpperCase().slice(0, 10)}`} mono />
            </div>
          </div>
        </div>
      </div>
    )
  } else if (tipo === 'antecedentes') {
    body = (
      <div className="absolute inset-0 flex flex-col bg-[#fdfdfb] px-[7cqw] pt-[6cqw]">
        <div className="flex items-center gap-[3cqw] border-b border-[#cbd5e1] pb-[3cqw]">
          <div className="grid h-[12cqw] w-[12cqw] shrink-0 place-items-center rounded-full border-[0.6cqw] border-[#1e3a8a] font-black text-[#1e3a8a]" style={{ fontSize: u(3) }}>
            ROU
          </div>
          <div>
            <div className="font-black tracking-[.05em] text-[#0f172a]" style={{ fontSize: u(3.6) }}>
              REPÚBLICA ORIENTAL DEL URUGUAY
            </div>
            <div className="font-semibold text-[#475569]" style={{ fontSize: u(2.6) }}>
              {L('Ministerio del Interior · Policía Nacional', 'Ministry of the Interior · National Police')}
            </div>
          </div>
        </div>
        <div className="mt-[5cqw] text-center font-black tracking-[.04em] text-[#0f172a]" style={{ fontSize: u(4.2) }}>
          {L('CERTIFICADO DE ANTECEDENTES PENALES', 'CRIMINAL RECORD CERTIFICATE')}
        </div>
        <p className="mt-[5cqw] text-justify leading-[1.55] text-[#1e293b]" style={{ fontSize: u(3.1) }}>
          {L('Se certifica que ', 'This certifies that ')}
          <b>{driver.nombre.toUpperCase()}</b>
          {L(', C.I. N° ', ', ID no. ')}
          <b className="font-mono">{driver.dni}</b>
          {L(', a la fecha de emisión ', ', as of the issue date, ')}
          <b>{L('NO REGISTRA ANTECEDENTES PENALES', 'HAS NO CRIMINAL RECORD')}</b>
          {L(' en el Registro Nacional de Antecedentes Judiciales.', ' in the National Judicial Records Registry.')}
        </p>
        <div className="mt-[4cqw] space-y-[1.6cqw]">
          {[88, 94, 72, 90, 60].map((w, i) => (
            <div key={i} className="h-[1.4cqw] rounded-full bg-[#e2e8f0]" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between pb-[7cqw]">
          <div>
            <div className="h-[16cqw] w-[16cqw]">
              <QR seed={h} />
            </div>
            <div className="mt-[1cqw] font-mono text-[#475569]" style={{ fontSize: u(2.2) }}>
              {L('Cód.', 'Code')} {(h >>> 4).toString(16).toUpperCase().padStart(7, '0')}
            </div>
          </div>
          <div className="text-center">
            <div className="h-[10cqw] w-[30cqw]">
              <Signature />
            </div>
            <div className="border-t border-[#94a3b8] pt-[1cqw] text-[#475569]" style={{ fontSize: u(2.2) }}>
              {L('Emitido', 'Issued')} {fmtDate(upDate)}
            </div>
          </div>
        </div>
      </div>
    )
  } else {
    // seguro
    const vence = doc?.vence ?? at(120)
    const desde = new Date(vence)
    desde.setFullYear(desde.getFullYear() - 1)
    body = (
      <div className="absolute inset-0 flex flex-col bg-[#fdfdfb]">
        <div className="bg-[#1e3a8a] px-[7cqw] py-[4cqw] text-white">
          <div className="font-black tracking-[.04em]" style={{ fontSize: u(4) }}>
            {L('PÓLIZA DE SEGURO AUTOMOTOR', 'MOTOR INSURANCE POLICY')}
          </div>
          <div className="opacity-85" style={{ fontSize: u(2.5) }}>
            {L('Certificado de cobertura · Responsabilidad civil', 'Certificate of cover · Third-party liability')}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-[4cqw] gap-y-[3.2cqw] px-[7cqw] pt-[5cqw]">
          <div className="col-span-2">
            <Field k={L('Aseguradora', 'Insurer')} v={L('Aseguradora del Plata S.A. (muestra)', 'Aseguradora del Plata S.A. (sample)')} />
          </div>
          <Field k={L('Póliza N°', 'Policy no.')} v={`AU-${(h % 9000000) + 1000000}`} mono />
          <Field k={L('Endoso', 'Endorsement')} v={`0${h % 9}`} mono />
          <div className="col-span-2">
            <Field k={L('Asegurado', 'Insured')} v={driver.nombre.toUpperCase()} />
          </div>
          <Field k={L('Vehículo', 'Vehicle')} v={`${driver.vehiculo.modelo} · ${P(CATEGORY_LABEL[driver.vehiculo.categoria])}`} />
          <Field k={L('Dominio', 'Plate')} v={driver.vehiculo.patente} mono />
          <Field k={L('Vigencia desde', 'Valid from')} v={fmtDate(desde.toISOString())} mono />
          <Field k={L('Vigencia hasta', 'Valid until')} v={fmtDate(vence)} mono red={expired} />
          <div className="col-span-2">
            <Field k={L('Cobertura', 'Coverage')} v={L('RC hasta USD 500.000 · carga transportada', 'TPL up to USD 500,000 · cargo in transit')} />
          </div>
        </div>
        <div className="mt-[5cqw] space-y-[1.6cqw] px-[7cqw]">
          {[92, 84, 96, 70].map((w, i) => (
            <div key={i} className="h-[1.4cqw] rounded-full bg-[#e2e8f0]" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between px-[7cqw] pb-[7cqw]">
          <div className="h-[14cqw] w-[14cqw]">
            <QR seed={h} />
          </div>
          <div className="h-[10cqw] w-[30cqw]">
            <Signature />
          </div>
        </div>
        {expired && (
          <div className="pointer-events-none absolute inset-x-0 top-[38%] grid place-items-center">
            <span
              className="rounded-[1.5cqw] border-[0.8cqw] border-[#DC2626] px-[4cqw] py-[1cqw] font-black tracking-[.1em] text-[#DC2626]"
              style={{ fontSize: u(7), rotate: '-12deg', background: 'rgba(254,226,226,.55)' }}
            >
              {L('VENCIDA', 'EXPIRED')}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative w-full select-none overflow-hidden border border-black/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,.35)]',
        paper ? 'rounded-[4px]' : 'rounded-[10px]',
        className,
      )}
      style={{ containerType: 'inline-size', aspectRatio: paper ? '0.77' : '1.586' }}
    >
      {body}
      <Watermark text={wm} />
    </div>
  )
}
