import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderNewProjectPage } from '@/test/utils'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/features/projects/api/projectsApi', () => ({
  useListCertificationsQuery: () => ({ data: undefined, isLoading: false }),
}))

describe('NewProjectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the project profile step to match the wizard chrome', () => {
    renderNewProjectPage()

    expect(screen.getByAltText('Comman')).toBeInTheDocument()
    expect(screen.getByText('New project')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Project Profile' })).toBeInTheDocument()
    expect(
      screen.getByText('Basic details used across the scorecard, reports and documents.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('info-banner')).toHaveTextContent(
      "can't be changed after the project is saved",
    )
    expect(screen.getByLabelText(/project id/i)).toBeDisabled()
    expect(screen.getByLabelText(/project id/i)).toHaveAttribute('placeholder', 'CMN-[auto]')
    expect(screen.getByText('Site and Building Details')).toBeInTheDocument()
    expect(screen.getByText('Used by calculators and credit thresholds.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /certification information/i })).toBeInTheDocument()

    const stepper = screen.getByTestId('wizard-stepper')
    expect(within(stepper).getByText('Project set-up')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-step-1')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByTestId('wizard-step-2')).not.toHaveAttribute('aria-current')
    expect(within(stepper).getByText('Certification Details')).toBeInTheDocument()
    expect(within(stepper).getByText('Scorecard')).toBeInTheDocument()
    expect(within(stepper).getByText('Project Timeline')).toBeInTheDocument()
    expect(within(stepper).getByText('Review')).toBeInTheDocument()
    expect(within(stepper).getByText('Project Stakeholders')).toBeInTheDocument()
  })

  it('marks required fields with a red asterisk', () => {
    renderNewProjectPage()
    const requiredLabels = [
      'Project title',
      'Location',
      'Typology',
      'Plot area',
      'Total built-up area',
    ]
    const ids = ['name', 'location', 'typologyId', 'plotArea', 'totalBuiltUpArea']
    expect(ids).toHaveLength(requiredLabels.length)
    for (const id of ids) {
      const label = document.querySelector(`label[for="${id}"]`)
      expect(label?.textContent).toMatch('*')
    }
  })

  it('validates required fields before leaving step 1', async () => {
    const user = userEvent.setup()
    renderNewProjectPage()

    await user.click(screen.getByRole('button', { name: /certification information/i }))

    expect(await screen.findByText('Project title is required')).toBeInTheDocument()
    expect(screen.getByText('Location is required')).toBeInTheDocument()
    expect(screen.getByText('Typology is required')).toBeInTheDocument()
    expect(screen.getByText('Plot area is required')).toBeInTheDocument()
    expect(screen.getByText('Total built-up area is required')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Project Profile' })).toBeInTheDocument()
  })

  it('advances to the certification placeholder after a valid profile', async () => {
    const user = userEvent.setup()
    const { store } = renderNewProjectPage()

    await user.type(screen.getByLabelText(/project title/i), 'Harbor Campus')
    await user.type(screen.getByLabelText(/^location/i), 'Mumbai')
    await user.selectOptions(screen.getByLabelText(/typology/i), 'new-construction')
    await user.type(screen.getByLabelText(/plot area/i), '1500')
    await user.type(screen.getByLabelText(/total built-up area/i), '4200')
    await user.click(screen.getByRole('button', { name: /certification information/i }))

    expect(await screen.findByTestId('placeholder-step')).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Certification Details' })).toBeInTheDocument()
    expect(screen.getByTestId('wizard-step-2')).toHaveAttribute('aria-current', 'step')
    expect(store.getState().projectDraft.currentStep).toBe(2)
    expect(store.getState().projectDraft.profile.name).toBe('Harbor Campus')
    expect(store.getState().projectDraft.project).toMatchObject({
      name: 'Harbor Campus',
      location: 'Mumbai',
      typologyId: 'new-construction',
      plotArea: 1500,
      totalBuiltUpArea: 4200,
    })
  })

  it('saves the draft into redux so a remount restores values', async () => {
    const user = userEvent.setup()
    const { store, unmount } = renderNewProjectPage()

    await user.type(screen.getByLabelText(/project title/i), 'Saved Draft')
    await user.type(screen.getByLabelText(/^location/i), 'Hyderabad')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => {
      expect(store.getState().projectDraft.profile.name).toBe('Saved Draft')
    })
    expect(store.getState().projectDraft.profile.location).toBe('Hyderabad')

    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('Draft saved')

    const saved = store.getState().projectDraft
    unmount()
    renderNewProjectPage({
      preloadedState: {
        projectDraft: saved,
      },
    })

    expect(screen.getByLabelText(/project title/i)).toHaveValue('Saved Draft')
    expect(screen.getByLabelText(/^location/i)).toHaveValue('Hyderabad')
  })

  it('navigates to the projects list on cancel', async () => {
    const user = userEvent.setup()
    renderNewProjectPage()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Projects list')).toBeInTheDocument()
  })

  it('opens later wizard steps as placeholders', async () => {
    const user = userEvent.setup()
    renderNewProjectPage({
      preloadedState: {
        projectDraft: {
          currentStep: 1,
          profile: emptyProjectProfile,
          project: { name: '' },
        },
      },
    })
    await user.click(screen.getByTestId('wizard-step-6'))
    expect(await screen.findByRole('heading', { name: 'Project Stakeholders' })).toBeInTheDocument()
    expect(screen.getByText('This step will be available in a later release.')).toBeInTheDocument()
  })
})
