import type { Lang, Role } from '@/store/app'
import { navFor } from '@/components/layout/navConfig'
import { translate } from '@/i18n'

export interface TourStep {
  id: string
  target?: string // data-tour value
  path?: string // route to show behind the spotlight
  title: string
  body: string
}

type Pair = [string, string]
const pick = (lang: Lang, p: Pair) => (lang === 'en' ? p[1] : p[0])

const WELCOME: Record<Role, [Pair, Pair]> = {
  cliente: [
    ['Esta es la vista del cliente que pide un flete', 'This is the view of the customer booking a move'],
    [
      'Vas a ver la app como la usa Lucía, de Pocitos: elige el vehículo, sigue al conductor y paga. Te muestro cada sección en orden.',
      'You’ll see the app the way Lucía from Pocitos uses it: she picks a vehicle, tracks the driver and pays. I’ll walk you through each section in order.',
    ],
  ],
  conductor: [
    ['Esta es la vista del conductor', 'This is the driver’s view'],
    [
      'Así trabaja Martín Gómez con su Fiorino: se conecta, recibe solicitudes, cobra y ve cuánto le debe la plataforma.',
      'This is how Martín Gómez works with his Fiorino: he goes online, gets requests, collects payment and sees what the platform owes him.',
    ],
  ],
  admin: [
    ['Esta es la vista de tu panel de operación', 'This is your operations panel'],
    [
      'Desde acá controlás todo Fletes ya: el mapa en vivo, los viajes, la verificación de conductores y las comisiones.',
      'From here you control all of Fletes ya: the live map, trips, driver verification and commissions.',
    ],
  ],
}

const NAV_BODY: Record<string, Pair> = {
  propuesta: [
    'Acá está todo lo que incluye el desarrollo, módulo por módulo. Desde cada tarjeta saltás a verlo funcionando en esta demo y volvés con un clic.',
    'Everything the build includes, module by module. From each card you jump to see it working in this demo and come back with one click.',
  ],
  pedir: [
    'El corazón de la app: elegís Fiorino, Traffic o Ducato mirando la ilustración, ves la tarifa por hora (desde $U 1.200/h) y pedís. En 3 segundos aparece Martín, ★4.9, a 6 minutos.',
    'The heart of the app: pick a Fiorino, Traffic or Ducato by its illustration, see the hourly rate (from $U 1,200/h) and book. In 3 seconds Martín shows up, ★4.9, 6 minutes away.',
  ],
  viaje: [
    'Seguís a Martín en el mapa acercándose, con el reloj de la hora corriendo y el costo acumulado. Al entregar, cobro y calificación.',
    'Follow Martín on the map as he approaches, with the hourly clock running and the cost so far. On delivery: payment and rating.',
  ],
  'mis-viajes': [
    'El historial de Lucía: 12 viajes, uno programado para el sábado y recibos en PDF de cada uno.',
    'Lucía’s history: 12 trips, one scheduled for Saturday and a PDF receipt for each.',
  ],
  pagos: [
    'Sus tarjetas guardadas (Visa ··4417 y Mastercard ··0921), efectivo habilitado y los comprobantes enviados por email.',
    'Her saved cards (Visa ··4417 and Mastercard ··0921), cash enabled and receipts sent by email.',
  ],
  soporte: [
    'Formulario de reclamos por viaje (objeto dañado, cobro incorrecto…) y el seguimiento de cada incidencia.',
    'Claim form per trip (damaged item, wrong charge…) and tracking of each incident.',
  ],
  'c-inicio': [
    'Martín se pone en línea, ve las zonas con demanda y sus números del día. Con “Simular solicitud” le entra un viaje con cuenta regresiva de 20 s.',
    'Martín goes online, sees demand zones and his numbers for the day. “Simulate request” sends him a trip with a 20-second countdown.',
  ],
  'c-viaje': [
    'El viaje paso a paso: llegó, cargó, viajó, entregó. Si es en efectivo confirma el cobro y queda la comisión a rendir registrada.',
    'The trip step by step: arrived, loaded, drove, delivered. If it’s cash he confirms payment and the commission owed is recorded.',
  ],
  'c-ganancias': [
    'Esta semana: $U 13.950 cobrados en efectivo y $U 18.300 con tarjeta. Saldo a su favor: $U 13.462, calculado solo.',
    'This week: $U 13,950 collected in cash and $U 18,300 by card. Balance in his favor: $U 13,462, calculated automatically.',
  ],
  'c-documentos': [
    'Sus papeles con estado y vencimiento: el seguro vence en 12 días y la app se lo avisa.',
    'His documents with status and expiry: insurance expires in 12 days and the app warns him.',
  ],
  operacion: [
    'Acá ves a los 31 conductores en línea sobre el mapa de Montevideo, los 9 viajes en curso y el radio de búsqueda por zona.',
    'Here you see the 31 online drivers on the Montevideo map, the 9 trips in progress and the search radius per zone.',
  ],
  viajes: [
    'Todos los viajes con filtros por estado, fecha, conductor y método, con la comisión de cada uno.',
    'Every trip with filters by status, date, driver and method, with each one’s commission.',
  ],
  conductores: [
    'El directorio de 112 conductores y la importación de los ~100 contactos de tu teléfono, con detección de duplicados.',
    'The directory of 112 drivers and the import of the ~100 contacts from your phone, with duplicate detection.',
  ],
  verificacion: [
    '6 conductores esperan aprobación. Revisás cédula, licencia, antecedentes y seguro; Walter Benítez tiene el seguro vencido.',
    '6 drivers await approval. Review ID, license, background check and insurance; Walter Benítez has expired insurance.',
  ],
  comisiones: [
    'Lo que el desarrollador anterior no pudo resolver: el saldo neto de cada conductor cruzando efectivo y tarjeta. Hernán Ruiz debe $U 4.212.',
    'What the previous developer couldn’t solve: each driver’s net balance crossing cash and card. Hernán Ruiz owes $U 4,212.',
  ],
  calificaciones: [
    'Promedios, ranking y la lista en riesgo: Carlos Medina está en ★3.9 con 3 quejas por demora.',
    'Averages, ranking and the at-risk list: Carlos Medina sits at ★3.9 with 3 delay complaints.',
  ],
  reportes: [
    'Reportes diarios, semanales y mensuales: viajes, ingresos vs comisión y mix de vehículos, descargables en PDF.',
    'Daily, weekly and monthly reports: trips, revenue vs commission and vehicle mix, downloadable as PDF.',
  ],
  fase2: [
    'Los 4 módulos de la Fase 2 (liquidaciones automáticas, matching avanzado, antecedentes automáticos y analytics) se ven bloqueados con su alcance.',
    'The 4 Phase 2 modules (automatic payouts, advanced matching, automated checks and analytics) appear locked with their scope.',
  ],
}

export function getTourSteps(role: Role, lang: Lang, mobile: boolean): TourStep[] {
  const w = WELCOME[role]
  const steps: TourStep[] = [{ id: 'welcome', title: pick(lang, w[0]), body: pick(lang, w[1]) }]
  steps.push({
    id: 'main-nav',
    target: 'main-nav',
    title: lang === 'en' ? 'Navigation' : 'La navegación',
    body: mobile
      ? pick(lang, ['Abajo tenés las secciones principales; en “Más” está todo lo demás.', 'The main sections are at the bottom; everything else is under “More”.'])
      : pick(lang, ['Todas las secciones de esta vista, de izquierda a derecha. Primero la Propuesta comercial.', 'All sections of this view, left to right. The sales proposal comes first.']),
  })
  const items = navFor(role)
  const all = role === 'admin' ? [...items, { id: 'fase2', path: '/admin/fase2/liquidaciones', label: 'chrome.phase2' as const }] : items
  all.forEach((it, i) => {
    steps.push({
      id: `nav-${it.id}`,
      target: `nav-${it.id}`,
      path: it.path,
      title: `${i + 1}. ${translate(lang, it.label)}`,
      body: pick(lang, NAV_BODY[it.id] ?? ['', '']),
    })
  })
  if (!mobile)
    steps.push({
      id: 'device',
      target: 'device-toggle',
      title: lang === 'en' ? 'Desktop or mobile' : 'Escritorio o celular',
      body: pick(lang, [
        'Pasá a “Celular” y ves la misma app dentro de un iPhone, con su diseño mobile real.',
        'Switch to “Mobile” and see the same app inside an iPhone, with its real mobile layout.',
      ]),
    })
  steps.push({
    id: 'switch',
    target: 'switch-user',
    title: lang === 'en' ? 'Switch view' : 'Cambiar de vista',
    body: pick(lang, [
      'Pasá de Cliente a Conductor o Admin sin cerrar sesión: es la misma plataforma vista por cada actor.',
      'Jump between Customer, Driver and Admin without signing out: the same platform seen by each actor.',
    ]),
  })
  steps.push({
    id: 'cta',
    target: 'whatsapp-cta',
    title: lang === 'en' ? 'Shall we start?' : '¿Arrancamos?',
    body: pick(lang, [
      'Si te gusta lo que ves, tocá “Quiero arrancar” y nos escribimos por WhatsApp.',
      'If you like what you see, tap “Let’s start” and we’ll talk on WhatsApp.',
    ]),
  })
  return steps
}
