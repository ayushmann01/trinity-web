import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux'
import { logout } from '@/features/auth/state/authSlice'

export function AppLayout() {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const onLogout = () => {
    dispatch(logout())
    navigate('/auth/login', { replace: true })
  }
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex gap-4">
            <NavLink
              to="/app/projects"
              className={({ isActive }) =>
                [
                  'text-sm font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                ].join(' ')
              }
            >
              Projects
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">{user?.email}</div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
