import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useApp } from '@/store/app'
import { setNavigator } from '@/lib/nav'
import LoginPage from '@/features/auth/LoginPage'
import AppShell, { WelcomeModal } from '@/components/layout/AppShell'
import DeviceStage from '@/components/device/DeviceStage'
import { FrameBridge } from '@/components/device/bridges'
import Tour from '@/components/tour/Tour'
import Trailer from '@/components/trailer/Trailer'
import Propuesta from '@/features/propuesta/Propuesta'
import Pedir from '@/features/cliente/Pedir'
import Viaje from '@/features/cliente/Viaje'
import MisViajes from '@/features/cliente/MisViajes'
import Pagos from '@/features/cliente/Pagos'
import Soporte from '@/features/cliente/Soporte'
import ConductorInicio from '@/features/conductor/Inicio'
import ConductorViaje from '@/features/conductor/ViajeActivo'
import Ganancias from '@/features/conductor/Ganancias'
import Documentos from '@/features/conductor/Documentos'
import Operacion from '@/features/admin/Operacion'
import AdminViajes from '@/features/admin/Viajes'
import Conductores from '@/features/admin/Conductores'
import Verificacion from '@/features/admin/Verificacion'
import Comisiones from '@/features/admin/Comisiones'
import Calificaciones from '@/features/admin/Calificaciones'
import Reportes from '@/features/admin/Reportes'
import Fase2 from '@/features/admin/Fase2'

function RequireAuth({ children }: { children: ReactNode }) {
  const authed = useApp((s) => s.authed)
  const trailer = useApp((s) => s.trailer)
  if (!authed && !trailer) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function AppRoutes() {
  const authed = useApp((s) => s.authed)
  const trailer = useApp((s) => s.trailer)
  return (
    <Routes>
      <Route path="/login" element={authed && !trailer ? <Navigate to="/propuesta" replace /> : <LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/propuesta" element={<Propuesta />} />
        <Route path="/pedir" element={<Pedir />} />
        <Route path="/viaje" element={<Viaje />} />
        <Route path="/mis-viajes" element={<MisViajes />} />
        <Route path="/pagos" element={<Pagos />} />
        <Route path="/soporte" element={<Soporte />} />
        <Route path="/conductor/inicio" element={<ConductorInicio />} />
        <Route path="/conductor/viaje" element={<ConductorViaje />} />
        <Route path="/conductor/ganancias" element={<Ganancias />} />
        <Route path="/conductor/documentos" element={<Documentos />} />
        <Route path="/admin/operacion" element={<Operacion />} />
        <Route path="/admin/viajes" element={<AdminViajes />} />
        <Route path="/admin/conductores" element={<Conductores />} />
        <Route path="/admin/verificacion" element={<Verificacion />} />
        <Route path="/admin/comisiones" element={<Comisiones />} />
        <Route path="/admin/calificaciones" element={<Calificaciones />} />
        <Route path="/admin/reportes" element={<Reportes />} />
        <Route path="/admin/fase2/:mod" element={<Fase2 />} />
        <Route path="/conductor" element={<Navigate to="/conductor/inicio" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/operacion" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={authed ? '/propuesta' : '/login'} replace />} />
    </Routes>
  )
}

function useWide() {
  const [wide, setWide] = useState(() => window.innerWidth >= 1024)
  useEffect(() => {
    const h = () => setWide(window.innerWidth >= 1024)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return wide
}

export default function App() {
  const navigate = useNavigate()
  const theme = useApp((s) => s.theme)
  const isFrame = useApp((s) => s.isFrame)
  const device = useApp((s) => s.device)
  const trailer = useApp((s) => s.trailer)
  const wide = useWide()
  useEffect(() => setNavigator((to, o) => navigate(to, o)), [navigate])
  const stage = !isFrame && device === 'mobile' && wide && !trailer
  return (
    <>
      {isFrame && <FrameBridge />}
      {stage ? <DeviceStage /> : <AppRoutes />}
      <WelcomeModal />
      {!stage && <Tour />}
      {!stage && <Trailer />}
      <Toaster theme={theme} position={isFrame ? 'top-center' : 'bottom-right'} richColors closeButton offset={16} />
    </>
  )
}
