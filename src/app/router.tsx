import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/ui/AppLayout'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ProjectsListPage } from '@/features/projects/pages/ProjectsListPage'
import { ProjectFormPage } from '@/features/projects/pages/ProjectFormPage'
import { ProjectDetailPage } from '@/features/projects/pages/ProjectDetailPage'
import { NewProjectPage } from '@/features/projects/pages/NewProjectPage'
import { EligibilityPlaceholderPage } from '@/features/projects/pages/EligibilityPlaceholderPage'
import { ScorecardPage } from '@/features/scorecard/pages/ScorecardPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/projects" replace />,
  },
  {
    path: '/auth',
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'forgot', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: '/projects/new',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <NewProjectPage /> },
      { path: 'eligibility', element: <EligibilityPlaceholderPage /> },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: 'projects', element: <ProjectsListPage /> },
          { path: 'projects/new', element: <Navigate to="/projects/new" replace /> },
          { path: 'projects/:projectId', element: <ProjectDetailPage /> },
          { path: 'projects/:projectId/edit', element: <ProjectFormPage /> },
          { path: 'projects/:projectId/scorecard', element: <ScorecardPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
