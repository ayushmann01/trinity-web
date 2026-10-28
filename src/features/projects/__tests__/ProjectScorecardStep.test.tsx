import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderNewProjectPage } from '@/test/utils'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'
import { emptyProjectCertification } from '@/features/projects/schemas/projectCertification'
import { emptyProjectTimeline } from '@/features/projects/schemas/projectTimeline'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/features/projects/api/projectsApi', () => ({
  useListCertificationsQuery: () => ({ data: undefined, isLoading: false }),
  useGetCertificationQuery: () => ({ data: undefined, isLoading: false }),
}))

vi.mock('@/features/stakeholders/api/stakeholdersApi', () => ({
  useListStakeholderBucketsQuery: () => ({ data: undefined, isLoading: false, isError: false }),
  useListStakeholderRolesQuery: () => ({ data: undefined, isLoading: false, isError: false }),
  useCreateStakeholderMutation: () => [vi.fn(), { isLoading: false }],
}))

function renderScorecard() {
  return renderNewProjectPage({
    preloadedState: {
      projectDraft: {
        currentStep: 3,
        profile: { ...emptyProjectProfile, name: 'Harbor Campus' },
        certification: {
          ...emptyProjectCertification,
          certificationId: 'griha',
          versionId: 'v2019',
          targetRatingId: '4-star',
        },
        timeline: emptyProjectTimeline,
        project: { name: 'Harbor Campus' },
      },
    },
  })
}

describe('ProjectScorecardStep', () => {
  it('renders the summary bar, criteria list, and hierarchical tree', () => {
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
      expect(store.getState().projectDraft.scorecard.maybeIds).not.toContain(6603)
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
