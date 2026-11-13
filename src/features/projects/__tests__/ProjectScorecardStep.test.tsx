import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderNewProjectPage } from '@/test/utils'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'
import { emptyProjectCertification } from '@/features/projects/schemas/projectCertification'
import { emptyProjectTimeline } from '@/features/projects/schemas/projectTimeline'
import { buildScorecard } from '@/features/scorecard/lib/criteriaTree'
import { GRIHA_DESIGN_RECORDS } from '@/features/scorecard/data/grihaDesignCatalog'
import type { CriteriaNode, ProjectCriteriaResponse } from '@/features/scorecard/types'
import type { CriteriaCatalogQueryArgs } from '@/features/scorecard/lib/mapCriteriaCatalog'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const queryState = vi.hoisted(() => ({
  catalog: {
    isLoading: false,
    isError: false,
    payload: undefined as ProjectCriteriaResponse | undefined,
    lastArgs: undefined as CriteriaCatalogQueryArgs | undefined,
    skip: false,
  },
  project: {
    isLoading: false,
    isError: false,
    payload: undefined as ProjectCriteriaResponse | undefined,
    lastArgs: undefined as { projectId: string } | undefined,
    skip: false,
  },
  certifications: [] as Array<{ id: string; name: string; shortName?: string; typologies: [] }>,
}))

vi.mock('@/features/projects/api/projectsApi', () => ({
  useListCertificationsQuery: () => ({
    data: queryState.certifications,
    isLoading: false,
    isError: false,
  }),
  useGetCertificationQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))

vi.mock('@/features/stakeholders/api/stakeholdersApi', () => ({
  useListStakeholderBucketsQuery: () => ({ data: undefined, isLoading: false, isError: false }),
  useListStakeholderRolesQuery: () => ({ data: undefined, isLoading: false, isError: false }),
  useCreateStakeholderMutation: () => [vi.fn(), { isLoading: false }],
}))

vi.mock('@/features/scorecard/api/scorecardApi', () => ({
  useGetCriteriaCatalogQuery: (args: CriteriaCatalogQueryArgs, opts?: { skip?: boolean }) => {
    queryState.catalog.lastArgs = args
    queryState.catalog.skip = Boolean(opts?.skip)
    if (opts?.skip) return { data: undefined, isLoading: false, isError: false }
    return {
      data: queryState.catalog.payload,
      isLoading: queryState.catalog.isLoading,
      isError: queryState.catalog.isError,
    }
  },
  useGetProjectCriteriaQuery: (args: { projectId: string }, opts?: { skip?: boolean }) => {
    queryState.project.lastArgs = args
    queryState.project.skip = Boolean(opts?.skip)
    if (opts?.skip) return { data: undefined, isLoading: false, isError: false }
    return {
      data: queryState.project.payload,
      isLoading: queryState.project.isLoading,
      isError: queryState.project.isError,
    }
  },
  useSaveProjectCriteriaMutation: () => [vi.fn(), { isLoading: false }],
}))

const gemsTree: CriteriaNode[] = [
  {
    id: 9100,
    parent_id: 9100,
    criteria_id: 'G1',
    title: 'GEMS Campus Planning',
    description: null,
    section: 'Campus',
    max_points: 4,
    points_attempted: 0,
    points_maybe: 0,
    criteria_status: 'MAXIMUM',
    criteria_category: 'CRITERIA',
    criteria_state: 'ROOT',
    typology: 'CAMPUS',
    footnotes: null,
    references: null,
    rules: null,
    mandatory: false,
    selectable: false,
    attempted: false,
    attempt_state: 'NO',
    pr_stakeholder_id: null,
    sc_stakeholder_id: null,
    tr_stakeholder_id: null,
    children: [],
  },
]

function payloadFromRows(
  rows: typeof GRIHA_DESIGN_RECORDS,
  certification: ProjectCriteriaResponse['certification'],
): ProjectCriteriaResponse {
  const scored = buildScorecard({
    rows,
    projectTypology: null,
    attemptedYesIds: [],
    maybeIds: [],
    targetMinPts: 25,
    targetMaxPts: 100,
  })
  return {
    certification,
    summary: scored.summary,
    criteria: scored.criteria,
  }
}

function grihaPayload(): ProjectCriteriaResponse {
  return payloadFromRows(GRIHA_DESIGN_RECORDS, {
    certification_id: 'C1',
    version_id: 'C1_V1',
    certification_title: 'GRIHA',
    min_pts: 25,
    max_pts: 100,
  })
}

function gemsPayload(): ProjectCriteriaResponse {
  return {
    certification: {
      certification_id: 'C4',
      version_id: 'C4_V1',
      category_id: 'C4_V1_D1',
      certification_title: 'GEMS',
    },
    summary: {
      points_attempted: 0,
      points_maybe: 0,
      points_available: 4,
      target_min_pts: 10,
      target_max_pts: 20,
      points_to_target: 10,
    },
    criteria: gemsTree,
  }
}

function renderScorecard(
  overrides: {
    certificationId?: string
    versionId?: string
    categoryId?: string
    typologyId?: string
    projectId?: string
  } = {},
) {
  return renderNewProjectPage({
    preloadedState: {
      projectDraft: {
        currentStep: 3,
        profile: { ...emptyProjectProfile, name: 'Harbor Campus' },
        certification: {
          ...emptyProjectCertification,
          certificationId: overrides.certificationId ?? 'griha',
          versionId: overrides.versionId ?? 'v2019',
          categoryId: overrides.categoryId ?? '',
          typologyId: overrides.typologyId ?? '',
          targetRatingId: '4-star',
        },
        timeline: emptyProjectTimeline,
        project: { name: 'Harbor Campus', id: overrides.projectId },
      },
    },
  })
}

describe('ProjectScorecardStep', () => {
  beforeEach(() => {
    queryState.catalog.isLoading = false
    queryState.catalog.isError = false
    queryState.catalog.payload = grihaPayload()
    queryState.catalog.lastArgs = undefined
    queryState.catalog.skip = false
    queryState.project.isLoading = false
    queryState.project.isError = false
    queryState.project.payload = undefined
    queryState.project.lastArgs = undefined
    queryState.project.skip = false
    queryState.certifications = [
      { id: 'griha', name: 'GRIHA', shortName: 'GRIHA', typologies: [] },
      { id: 'C4', name: 'GEMS', shortName: 'GEMS', typologies: [] },
    ]
  })

  it('renders the summary bar, criteria list, and hierarchical tree from the catalog API', () => {
    renderScorecard()

    expect(screen.getByTestId('scorecard-step')).toBeInTheDocument()
    expect(screen.getByText('GRIHA Scorecard')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Build your credit plan, one criterion at a time. Build your credit plan, one criterion at a time.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Certified 25pts')).toBeInTheDocument()
    expect(screen.getByText('Silver 50pts')).toBeInTheDocument()
    expect(screen.getByText('Gold 75pts')).toBeInTheDocument()
    expect(screen.getByText('Platinum 90pts')).toBeInTheDocument()
    expect(screen.getByTestId('scorecard-criteria-nav')).toBeInTheDocument()
    expect(screen.getAllByText(/Propagating Passive Design Strategies/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Fire and Life Safety in Sustainable Buildings/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Energy meters/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /back to certification/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next: timeline/i })).toBeInTheDocument()
    expect(screen.getByText('Save your selections as a draft')).toBeInTheDocument()

    const checklists = screen.getAllByTestId(/checklist-/)
    expect(checklists.length).toBeGreaterThan(0)
    for (const list of checklists) {
      expect(list).toHaveClass('border')
      expect(list).toHaveClass('border-neutral-200')
    }
    expect(screen.getByTestId('criterion-6600')).not.toHaveClass('border')
    expect(queryState.catalog.lastArgs).toEqual({ certificationId: 'griha', versionId: 'v2019' })
    expect(queryState.project.skip).toBe(true)
  })

  it('loads GEMS criteria and title when step 2 selected C4', () => {
    queryState.catalog.payload = gemsPayload()
    renderScorecard({
      certificationId: 'C4',
      versionId: 'C4_V1',
      categoryId: 'C4_V1_D1',
      typologyId: 'CAMPUS',
    })

    expect(screen.getByText('GEMS Scorecard')).toBeInTheDocument()
    expect(screen.getAllByText(/GEMS Campus Planning/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Propagating Passive Design Strategies/)).not.toBeInTheDocument()
    expect(queryState.catalog.lastArgs).toEqual({
      certificationId: 'C4',
      versionId: 'C4_V1',
      categoryId: 'C4_V1_D1',
      typology: 'CAMPUS',
    })
  })

  it('shows loading, empty, and error in the tree area', () => {
    queryState.catalog.isLoading = true
    queryState.catalog.payload = undefined
    const loading = renderScorecard()
    expect(screen.getByTestId('scorecard-tree-status')).toHaveTextContent('Loading criteria…')
    expect(screen.queryByTestId('scorecard-tree')).not.toBeInTheDocument()
    loading.unmount()

    queryState.catalog.isLoading = false
    queryState.catalog.isError = true
    const errored = renderScorecard()
    expect(screen.getByTestId('scorecard-tree-status')).toHaveTextContent(
      'Could not load criteria for this certification.',
    )
    errored.unmount()

    queryState.catalog.isError = false
    queryState.catalog.payload = { criteria: [] }
    renderScorecard()
    expect(screen.getByTestId('scorecard-tree-status')).toHaveTextContent(
      'No criteria for this certification.',
    )
  })

  it('uses GET /projects/:id/criteria when the draft already has a project id', () => {
    queryState.project.payload = gemsPayload()
    renderScorecard({ projectId: 'project-1', typologyId: 'CAMPUS' })

    expect(queryState.catalog.skip).toBe(true)
    expect(queryState.project.skip).toBe(false)
    expect(queryState.project.lastArgs).toEqual({ projectId: 'project-1' })
    expect(screen.getAllByText(/GEMS Campus Planning/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Propagating Passive Design Strategies/)).not.toBeInTheDocument()
  })

  it('toggles YES and MAYBE on a BRANCH option and persists the draft', async () => {
    const user = userEvent.setup()
    const { store } = renderScorecard()

    const twoStrategies = screen.getByTestId('option-6603')
    await user.click(twoStrategies.querySelector('button[aria-label="Mark yes"]') as HTMLButtonElement)

    await waitFor(() => {
      expect(store.getState().projectDraft.scorecard.attemptedIds).toContain(6603)
    })
    expect(twoStrategies).toHaveClass('bg-blue-50/70')

    await user.click(twoStrategies.querySelector('button[aria-label="Mark maybe"]') as HTMLButtonElement)
    await waitFor(() => {
      expect(store.getState().projectDraft.scorecard.maybeIds).toContain(6603)
      expect(store.getState().projectDraft.scorecard.attemptedIds).not.toContain(6603)
    })

    const fourStrategies = screen.getByTestId('option-6605')
    await user.click(fourStrategies.querySelector('button[aria-label="Mark yes"]') as HTMLButtonElement)
    await waitFor(() => {
      expect(store.getState().projectDraft.scorecard.attemptedIds).toContain(6605)
      expect(store.getState().projectDraft.scorecard.maybeIds).toContain(6603)
      expect(store.getState().projectDraft.scorecard.attemptedIds).not.toContain(6603)
    })
  })

  it('stores notes and navigates back and forward', async () => {
    const user = userEvent.setup()
    const { store } = renderScorecard()

    await user.click(screen.getByTestId('notes-toggle-6600'))
    await user.type(screen.getByTestId('note-6600'), 'Need shading study')
    await waitFor(() => {
      expect(store.getState().projectDraft.scorecard.notes['6600']).toBe('Need shading study')
    })

    await user.click(screen.getByTestId('scorecard-back'))
    expect(await screen.findByTestId('certification-form')).toBeInTheDocument()
    expect(store.getState().projectDraft.currentStep).toBe(2)

    await user.click(screen.getByTestId('wizard-step-3'))
    expect(await screen.findByTestId('scorecard-step')).toBeInTheDocument()
    await user.click(screen.getByTestId('scorecard-next'))
    expect(await screen.findByTestId('timeline-form')).toBeInTheDocument()
    expect(store.getState().projectDraft.currentStep).toBe(4)
  })

  it('selects a criterion in the sidebar', async () => {
    const user = userEvent.setup()
    renderScorecard()
    await user.click(screen.getByTestId('criteria-nav-6600'))
    expect(screen.getByTestId('selected-criterion-header')).toHaveTextContent(
      'Propagating Passive Design Strategies',
    )
  })
})
