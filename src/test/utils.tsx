import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { setupStore, type AppStore, type RootState } from '@/app/store'
import { NewProjectPage } from '@/features/projects/pages/NewProjectPage'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'
import { emptyProjectCertification } from '@/features/projects/schemas/projectCertification'
import { mapWizardDraftToApi } from '@/features/projects/lib/mapProjectDraft'

export const authedState: Pick<RootState, 'auth'> = {
  auth: {
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    user: { id: 'u1', email: 'tester@example.com', name: 'Tester' },
  },
}

export function renderWithStore(
  ui: ReactElement,
  {
    preloadedState,
    store = setupStore({ ...authedState, ...preloadedState }),
    route = '/projects/new',
    ...options
  }: Omit<RenderOptions, 'wrapper'> & {
    preloadedState?: Partial<RootState>
    store?: AppStore
    route?: string
  } = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    )
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...options }) }
}

export function renderNewProjectPage(
  options: {
    preloadedState?: Partial<RootState>
    route?: string
  } = {},
) {
  const store = setupStore({
    ...authedState,
    projectDraft: {
      currentStep: 1,
      profile: emptyProjectProfile,
      certification: emptyProjectCertification,
      project: mapWizardDraftToApi(emptyProjectProfile, emptyProjectCertification),
    },
    ...options.preloadedState,
  })

  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[options.route ?? '/projects/new']}>
        <Routes>
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/projects/new/eligibility" element={<div>Eligibility placeholder</div>} />
          <Route path="/app/projects" element={<div>Projects list</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )

  return { store, ...view }
}
