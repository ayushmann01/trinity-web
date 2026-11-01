import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { GuestRoute } from '@/app/GuestRoute'
import { renderWithStore } from '@/test/utils'

describe('GuestRoute', () => {
  it('redirects authenticated users away from guest auth screens', () => {
    const { getByText, queryByText } = renderWithStore(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/auth/login" element={<div>Login form</div>} />
        </Route>
        <Route path="/app/projects" element={<div>Projects list</div>} />
      </Routes>,
      { route: '/auth/login' },
    )

    expect(getByText('Projects list')).toBeInTheDocument()
    expect(queryByText('Login form')).not.toBeInTheDocument()
  })

  it('renders guest auth screens when there is no access token', () => {
    const { getByText, queryByText } = renderWithStore(
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/auth/login" element={<div>Login form</div>} />
        </Route>
        <Route path="/app/projects" element={<div>Projects list</div>} />
      </Routes>,
      {
        route: '/auth/login',
        preloadedState: {
          auth: { accessToken: null, refreshToken: null, user: null },
        },
      },
    )

    expect(getByText('Login form')).toBeInTheDocument()
    expect(queryByText('Projects list')).not.toBeInTheDocument()
  })
})
