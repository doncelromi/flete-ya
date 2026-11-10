# PROGRESO · Fletes ya demo

## Completado
- Bloque 1 — Setup: Vite 5 + React 18 + TS + Tailwind 3 (darkMode class), deps en `dependencies`, render.yaml static, tokens claro/oscuro, fuentes, anti-flash, i18n base, store zustand.
- Bloque 2 — Login dos columnas + auth mock + auto-fill por rol + toggles (ES/EN, tema, dispositivo).
- Bloque 3 — Shell: topbar top-nav con overflow "Más", sub-bar (switcher + CTA), bottom-nav + sheet mobile, Welcome Modal, router con /propuesta como default, PreviewBanner, DevNotice.
- Bloque 4 — Datos mock coherentes: 112 conductores (31 en línea, 9 ocupados, 6 pendientes, 2 rechazados), 40 usuarios, 60 viajes de 13 días + 47 de hoy (9 en curso), 100 contactos (3 duplicados), traducciones de enums.
- Bloque 5 — Cliente /pedir (WOW #1): autocompletado Montevideo, ruta en mapa, 3 categorías con ilustración SVG, detalles, resumen, matching animado → Martín Gómez.
- Bloque 6 — Cliente /viaje (seguimiento, estados, reloj, cobro, comprobante, calificación), /mis-viajes, /pagos, /soporte.
- Bloque 7 — Conductor: inicio (online + solicitud con countdown), viaje activo con cobro en efectivo auditable, ganancias (cuadran con Comisiones), documentos.
- Bloque 8 — Admin: operación (mapa vivo + radios por zona + feed), viajes (tabla + drawer), conductores (directorio + importación).
- Bloque 9 — Admin: verificación (visor de documentos + auditoría), comisiones (WOW #2: saldo neto efectivo vs tarjeta), calificaciones, reportes, 4 páginas Fase 2 bloqueadas.
- Bloque 10 — Propuesta completa + "Ver en el demo" con retorno señalizado y tarjeta resaltada + inversión oculta por defecto + estilos de impresión.
- Bloque 11 — Vista de dispositivo: iframe real al mismo origen (390px), sync por postMessage en ambos sentidos (tema, idioma, rol, ruta, preview).
- Bloque 12 — Tour guiado manual (máscara SVG, desktop y dentro del marco con bottom-nav/sheet).
- Bloque 13 — Modo Trailer: 11 escenas, ~81 s, loop, cursor virtual con clicks reales.
- Bloque 14 — Pulido/QA: i18n 100% (escaneo automático por ruta en EN), sin overflow a 375px, modales centrados (desvío 0 px a 1440×900, 1920×854, 375×812), fixes de estabilidad.
- Bloque 15 — Build final, `npx serve dist -s` con links profundos OK.

## En curso
- (nada)

## Pendiente
- Deploy manual en Render (static site, usa `render.yaml`).

## Decisiones
- **Versión Uruguay (Jonathan):** mapa y direcciones de Montevideo/Canelones, pesos uruguayos ($U, tarifas 1.200 / 1.700 / 2.200 por hora + ayudante 500), pasarela Plexo / dLocal, cédula uruguaya, propuesta para Jonathan a USD 5.000 (2 pagos de 2.500 o pago único USD 4.250 con 15% off). Martín semana: efectivo 13.950 / tarjeta 18.300 / saldo +13.462. Hernán debe 4.212.
- La app se llama **"Fletes ya"** (pedido del cliente a mitad del desarrollo). Credenciales demo: `cliente@fletesya.app`, `conductor@fletesya.app`, `admin@fletesya.app` · `demo1234`.
- **Mapas:** CARTO Positron / Dark Matter ahora exigen API key (los tiles devuelven "API KEY REQUIRED"), así que se usan los equivalentes Esri World Light/Dark Gray Canvas (sin key) + capa de etiquetas.
- `npm run build` = `tsc --noEmit && vite build`.
- i18n: diccionario compartido `src/i18n/dict.ts` ({clave: [es, en]}) + pares inline `L(es, en)` en cada pantalla.
- Coherencia de números: todo sale de `src/data/trips.ts` (`weeklyBalances`, `TODAY_KPIS`, `MARTIN_TODAY`). Martín: efectivo 210.000 / tarjeta 276.000 / saldo +203.100. Hernán: debe 64.500. Hoy: 47 viajes, 9 en curso.
- KPIs de Martín del día calculados de los datos (4 viajes · ARS 164.000 · 9,5 h) en lugar de los valores literales del brief, para que cuadren con la tabla de viajes.
- Walter Benítez (seguro vencido) no se puede aprobar: muestra toast de error.
- `useNavigate` cambia de identidad al navegar: Tour y Trailer lo guardan en un ref para no reiniciarse.

## Bloqueos
- Repo en GitHub: `gh` está logueado como `doncelromi`; `developers-insights` es una cuenta de usuario (no una organización), así que no se puede crear el repo ahí sin loguearse con esa cuenta.
