import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/shared/hooks/redux'

export function GuestRoute() {
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken))
  if (isAuthed) return <Navigate to="/app/projects" replace />
  return <Outlet />
}
