import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { setupStore, type AppStore, type RootState } from '@/app/store'
import type { ProjectDraftState } from '@/features/projects/state/projectDraftSlice'
import { NewProjectPage } from '@/features/projects/pages/NewProjectPage'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'
import { emptyProjectCertification } from '@/features/projects/schemas/projectCertification'
import { emptyProjectTimeline } from '@/features/projects/schemas/projectTimeline'
import { emptyProjectStakeholders } from '@/features/projects/schemas/projectStakeholders'
import { mapWizardDraftToApi } from '@/features/projects/lib/mapProjectDraft'

export const authedState: Pick<RootState, 'auth'> = {
  auth: {
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    user: { id: 'u1', email: 'tester@example.com', name: 'Tester' },
  },
}

export const emptyDraftState = {
  currentStep: 1,
  profile: emptyProjectProfile,
  certification: emptyProjectCertification,
  timeline: emptyProjectTimeline,
  stakeholders: emptyProjectStakeholders,
  project: mapWizardDraftToApi(emptyProjectProfile, emptyProjectCertification, emptyProjectTimeline),
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
    preloadedState?: Omit<Partial<RootState>, 'projectDraft'> & {
      projectDraft?: Partial<ProjectDraftState>
    }
    route?: string
  } = {},
) {
  const store = setupStore({
    ...authedState,
    ...options.preloadedState,
    projectDraft: {
      ...emptyDraftState,
      ...options.preloadedState?.projectDraft,
    },
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
