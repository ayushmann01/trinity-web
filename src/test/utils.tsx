import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { setupStore, type AppStore, type RootState } from '@/app/store'
import type { ProjectDraftState } from '@/features/projects/state/projectDraftSlice'
import { NewProjectPage } from '@/features/projects/pages/NewProjectPage'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'
import { emptyProjectCertification } from '@/features/projects/schemas/projectCertification'
import { emptyProjectTimeline } from '@/features/projects/schemas/projectTimeline'
import { emptyProjectStakeholders } from '@/features/projects/schemas/projectStakeholders'
import { emptyProjectScorecard } from '@/features/projects/schemas/projectScorecard'
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
  scorecard: emptyProjectScorecard,
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

function routeFrom(path: string) {
  const url = new URL(path, 'http://localhost')
  return { pathname: url.pathname, search: url.search }
}

export function renderNewProjectPage(
  options: {
    preloadedState?: Omit<Partial<RootState>, 'projectDraft'> & {
      projectDraft?: Partial<ProjectDraftState>
    }
    route?: string
    fromWizard?: boolean
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
  const hasPreloadedDraft = Boolean(options.preloadedState?.projectDraft)
  const parsed = routeFrom(options.route ?? '/projects/new')
  const router = createMemoryRouter(
    [
      { path: '/projects/new', element: <NewProjectPage /> },
      { path: '/projects/new/eligibility', element: <div>Eligibility placeholder</div> },
      { path: '/app/projects', element: <div>Projects list</div> },
      { path: '/app/projects/:projectId', element: <div>Project detail</div> },
    ],
    {
      initialEntries: [
        {
          pathname: parsed.pathname,
          search: parsed.search,
          state: options.fromWizard ?? hasPreloadedDraft ? { fromWizard: true } : undefined,
        },
      ],
    },
  )

  const view = render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )

  return { store, router, ...view }
}
