import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/shared/hooks/redux'

export function ProtectedRoute() {
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken))
  if (!isAuthed) return <Navigate to="/auth/login" replace />
  return <Outlet />
}
