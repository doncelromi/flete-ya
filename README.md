# Fletes ya · Demo navegable (Uruguay)

MVP de previsualización (datos mock) de una app de fletes tipo Uber para Montevideo (Uruguay): apps de cliente y conductor, panel de administración y la propuesta comercial dentro de la demo.

**Stack:** Vite 5 · React 18 · TypeScript · Tailwind 3 · framer-motion · react-leaflet · Recharts · zustand · sonner.

## Correr local

```bash
npm install
npm run dev
```

Credenciales: `cliente@fletesya.app`, `conductor@fletesya.app` o `admin@fletesya.app` · contraseña `demo1234`.

## Deploy en Render

Static Site (plan gratis) usando `render.yaml`: build `npm install && npm run build`, publica `./dist` con rewrite SPA `/* → /index.html`.

## Qué mirar

- `/propuesta` — propuesta comercial, "Ver en el demo" con retorno, inversión oculta (ojito).
- `/pedir` → `/viaje` — WOW #1: elección de vehículo, matching, seguimiento en vivo, cobro y calificación.
- `/admin/comisiones` — WOW #2: saldo neto por conductor cruzando efectivo y tarjeta.
- Toggle **Escritorio / Celular**, **Tour** guiado y **demo automática** (trailer) desde el login.


Powered by Insights.
