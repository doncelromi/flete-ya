import type { Device, Role } from '@/store/app'

type Pair = readonly [string, string]

export interface Modulo {
  n: number
  title: Pair
  desc: Pair
  bullets: Pair[]
  link?: { role: Role; view: string; device?: Device }
}

export const CIRCUITO: { title: Pair; body: Pair; highlight?: boolean }[] = [
  {
    title: ['Pedís el flete', 'You book the move'],
    body: [
      'Elegís Fiorino, Traffic o Ducato mirando la foto, cargás origen y destino y ves la tarifa por hora.',
      'Pick a Fiorino, Traffic or Ducato by its photo, enter pickup and drop-off and see the hourly rate.',
    ],
  },
  {
    title: ['Matching con verificados', 'Matching with verified drivers'],
    body: [
      'El sistema busca al conductor libre más cercano y solo ofrece conductores con cédula, licencia, antecedentes y seguro aprobados.',
      'The system finds the nearest free driver and only offers drivers with approved ID, license, background check and insurance.',
    ],
    highlight: true,
  },
  {
    title: ['Seguimiento en vivo', 'Live tracking'],
    body: ['Ves al conductor acercarse en el mapa y el reloj de la hora corriendo.', 'Watch the driver approach on the map and the hourly clock running.'],
  },
  {
    title: ['Cobro tarjeta o efectivo', 'Card or cash payment'],
    body: [
      'Tarjeta tokenizada o efectivo confirmado por el conductor, con comprobante al instante.',
      'Tokenized card or cash confirmed by the driver, with an instant receipt.',
    ],
  },
  {
    title: ['Calificación mutua', 'Two-way rating'],
    body: ['Usuario y conductor se califican; el promedio queda en el perfil.', 'Customer and driver rate each other; the average shows on each profile.'],
  },
  {
    title: ['Vos controlás todo', 'You control everything'],
    body: ['Comisión calculada por viaje, saldo de cada conductor y reportes.', 'Commission per trip, each driver’s balance and reports.'],
  },
]

export const MODULOS: Modulo[] = [
  {
    n: 0,
    title: ['Onboarding + migración de conductores', 'Onboarding + driver migration'],
    desc: ['Relevamos tu operación y cargamos los ~100 conductores que tenés en el teléfono.', 'We map your operation and load the ~100 drivers you have in your phone.'],
    bullets: [
      ['Relevamiento del flujo actual', 'Review of the current workflow'],
      ['Importación de conductores existentes', 'Import of existing drivers'],
      ['Arquitectura definida desde el día 1', 'Architecture defined from day 1'],
    ],
    link: { role: 'admin', view: '/admin/conductores?tab=importacion', device: 'desktop' },
  },
  {
    n: 1,
    title: ['App iOS', 'iOS app'],
    desc: ['La app del usuario en iPhone: pedir, seguir y pagar el flete.', 'The customer app on iPhone: book, track and pay for the move.'],
    bullets: [
      ['Solicitud con origen y destino', 'Request with pickup and drop-off'],
      ['Mapa en vivo del conductor', 'Live driver map'],
      ['Notificaciones push', 'Push notifications'],
      ['Historial con tarifa', 'History with fares'],
    ],
    link: { role: 'cliente', view: '/pedir', device: 'mobile' },
  },
  {
    n: 2,
    title: ['App Android', 'Android app'],
    desc: ['Paridad total con iOS, en Android 10+.', 'Full parity with iOS, on Android 10+.'],
    bullets: [
      ['Autocompletado de direcciones', 'Address autocomplete'],
      ['Tracking en vivo', 'Live tracking'],
      ['Recibos digitales', 'Digital receipts'],
      ['Varios métodos de pago', 'Multiple payment methods'],
    ],
    link: { role: 'conductor', view: '/conductor/inicio', device: 'mobile' },
  },
  {
    n: 3,
    title: ['Web responsive', 'Responsive web'],
    desc: ['Para usar Fletes ya desde la compu o la tablet, sin instalar nada.', 'Use Fletes ya from a computer or tablet, nothing to install.'],
    bullets: [
      ['Viajes activos y pendientes', 'Active and upcoming trips'],
      ['Perfil con métodos de pago', 'Profile with payment methods'],
      ['Recibos en PDF', 'PDF receipts'],
      ['Soporte e incidencias', 'Support and incidents'],
    ],
    link: { role: 'cliente', view: '/mis-viajes', device: 'desktop' },
  },
  {
    n: 4,
    title: ['Geolocalización y matching', 'Geolocation and matching'],
    desc: ['El conductor libre más cercano, asignado al instante.', 'The nearest free driver, assigned instantly.'],
    bullets: [
      ['GPS continuo de conductores', 'Continuous driver GPS'],
      ['Algoritmo de proximidad', 'Proximity algorithm'],
      ['Radio configurable por zona', 'Configurable radius per zone'],
      ['Actualización cada 5-10 s', 'Updates every 5-10 s'],
    ],
    link: { role: 'admin', view: '/admin/operacion', device: 'desktop' },
  },
  {
    n: 5,
    title: ['Pagos: tarjeta + efectivo', 'Payments: card + cash'],
    desc: ['Cobrás de las dos formas, con registro auditable.', 'Get paid both ways, with an auditable record.'],
    bullets: [
      ['Tarjetas tokenizadas (Plexo / dLocal)', 'Tokenized cards (Plexo / dLocal)'],
      ['Efectivo confirmado por el conductor', 'Cash confirmed by the driver'],
      ['Comprobante por email', 'Receipt by email'],
      ['Varias tarjetas por usuario', 'Several cards per user'],
    ],
    link: { role: 'cliente', view: '/pagos', device: 'desktop' },
  },
  {
    n: 6,
    title: ['Panel de administración', 'Admin panel'],
    desc: ['Viajes, conductores, comisiones y reportes en un solo lugar.', 'Trips, drivers, commissions and reports in one place.'],
    bullets: [
      ['Tabla de viajes con filtros', 'Trips table with filters'],
      ['Cálculo automático de comisiones', 'Automatic commission calculation'],
      ['Reportes en PDF', 'PDF reports'],
      ['Acceso por rol', 'Role-based access'],
    ],
    link: { role: 'admin', view: '/admin/comisiones', device: 'desktop' },
  },
  {
    n: 7,
    title: ['Verificación de conductores', 'Driver verification'],
    desc: ['Nadie maneja sin tener los papeles aprobados.', 'Nobody drives without approved paperwork.'],
    bullets: [
      ['Carga de cédula, licencia, antecedentes y seguro', 'Upload of ID, license, background check and insurance'],
      ['Aprobar / rechazar', 'Approve / reject'],
      ['Notificación del resultado', 'Result notification'],
      ['Auditoría con timestamp', 'Timestamped audit trail'],
    ],
    link: { role: 'admin', view: '/admin/verificacion', device: 'desktop' },
  },
  {
    n: 8,
    title: ['Calificaciones', 'Ratings'],
    desc: ['Reputación en las dos direcciones.', 'Reputation in both directions.'],
    bullets: [
      ['1-5 estrellas + comentario', '1-5 stars + comment'],
      ['Usuario ↔ conductor', 'Customer ↔ driver'],
      ['Promedio en perfiles', 'Average on profiles'],
      ['Historial por viaje', 'History per trip'],
    ],
    link: { role: 'admin', view: '/admin/calificaciones', device: 'desktop' },
  },
]

export const FASE2: Modulo[] = [
  {
    n: 9,
    title: ['Liquidaciones automáticas a conductores', 'Automatic driver payouts'],
    desc: ['Transferencias semanales automáticas y cobro de saldos deudores.', 'Automatic weekly transfers and collection of outstanding balances.'],
    bullets: [],
  },
  {
    n: 10,
    title: ['Matching avanzado', 'Advanced matching'],
    desc: ['Puntaje por cercanía, rating, capacidad y zona.', 'Scoring by proximity, rating, capacity and zone.'],
    bullets: [],
  },
  {
    n: 11,
    title: ['Antecedentes penales automáticos', 'Automated criminal record checks'],
    desc: ['Consulta automática integrada al alta del conductor.', 'Automatic check built into driver sign-up.'],
    bullets: [],
  },
  {
    n: 12,
    title: ['Análisis y reportes avanzados', 'Advanced analytics and reports'],
    desc: ['Tableros de demanda, retención y rentabilidad por zona.', 'Dashboards for demand, retention and profitability by zone.'],
    bullets: [],
  },
]
