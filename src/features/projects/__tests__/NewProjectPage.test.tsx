import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderNewProjectPage } from '@/test/utils'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'
import { emptyProjectCertification } from '@/features/projects/schemas/projectCertification'
import { emptyProjectTimeline, sampleProjectTimeline } from '@/features/projects/schemas/projectTimeline'
import { createEmptyProjectStakeholders } from '@/features/projects/schemas/projectStakeholders'
import { barPosition, buildGanttModel } from '@/features/projects/lib/timeline'
import { DEFAULT_STAKEHOLDER_CATEGORIES } from '@/features/projects/lib/stakeholderCatalog'

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

const createStakeholderMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/stakeholders/api/stakeholdersApi', () => ({
  useListStakeholderBucketsQuery: () => ({ data: undefined, isLoading: false, isError: false }),
  useListStakeholderRolesQuery: () => ({ data: undefined, isLoading: false, isError: false }),
  useCreateStakeholderMutation: () => [
    createStakeholderMock.mockReturnValue({ unwrap: () => Promise.resolve({ id: 's1' }) }),
    { isLoading: false },
  ],
}))

async function completeStep1(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/project title/i), 'Harbor Campus')
  await user.type(screen.getByLabelText(/^location/i), 'Mumbai')
  await user.selectOptions(screen.getByLabelText(/typology/i), 'new-construction')
  await user.type(screen.getByLabelText(/plot area/i), '1500')
  await user.type(screen.getByLabelText(/total built-up area/i), '4200')
  await user.click(screen.getByRole('button', { name: /certification information/i }))
  expect(await screen.findByTestId('certification-form')).toBeInTheDocument()
}

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
    expect(screen.getByRole('button', { name: 'Exit' })).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: /certification information/i })).toBeInTheDocument()

    const stepper = screen.getByTestId('wizard-stepper')
    expect(within(stepper).getByText('Project set-up')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-step-1')).toHaveAttribute('aria-current', 'step')
    expect(within(stepper).getByText('Project information')).toBeInTheDocument()
    expect(within(stepper).getByText('Certification')).toBeInTheDocument()
    expect(within(stepper).getByText('Scorecard')).toBeInTheDocument()
    expect(within(stepper).getByText('Timeline')).toBeInTheDocument()
    expect(within(stepper).getByText('Review')).toBeInTheDocument()
    expect(within(stepper).getByText('Stakeholders (optional)')).toBeInTheDocument()
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

  it('advances to certification details after a valid profile', async () => {
    const user = userEvent.setup()
    const { store } = renderNewProjectPage()
    await completeStep1(user)

    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Certification Details' })).toBeInTheDocument()
    expect(screen.getByTestId('wizard-step-2')).toHaveAttribute('aria-current', 'step')
    expect(store.getState().projectDraft.currentStep).toBe(2)
    expect(store.getState().projectDraft.profile.name).toBe('Harbor Campus')
    expect(screen.getByRole('button', { name: /continue to griha scorecard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /check griha eligibility/i })).toBeInTheDocument()
    expect(screen.getByTestId('stage-pre-certification')).toHaveAttribute('aria-checked', 'true')
  })

  it('validates required certification fields before leaving step 2', async () => {
    const user = userEvent.setup()
    renderNewProjectPage()
    await completeStep1(user)

    await user.click(screen.getByRole('button', { name: /continue to griha scorecard/i }))
    expect(await screen.findByText('Certification is required')).toBeInTheDocument()
    expect(screen.getByText('Version is required')).toBeInTheDocument()
    expect(screen.getByText('Target rating is required')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Certification Details' })).toBeInTheDocument()
  })

  it('populates dependent options from the selected certification and continues to step 3', async () => {
    const user = userEvent.setup()
    const { store } = renderNewProjectPage()
    await completeStep1(user)

    await user.selectOptions(screen.getByLabelText(/certification \*/i), 'griha')
    await user.selectOptions(screen.getByLabelText(/version \*/i), 'v2019')
    await user.selectOptions(screen.getByLabelText(/^category$/i), 'new-buildings')
    await user.selectOptions(screen.getByLabelText(/^typology$/i), 'new-construction')
    await user.selectOptions(screen.getByLabelText(/target rating \*/i), '3-star')
    await user.click(screen.getByTestId('stage-certification'))
    expect(screen.getByTestId('stage-certification')).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('button', { name: /continue to griha scorecard/i }))
    expect(await screen.findByTestId('placeholder-step')).toBeInTheDocument()
    expect(screen.getByText('Step 3 of 6')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Scorecard' })).toBeInTheDocument()
    expect(store.getState().projectDraft.currentStep).toBe(3)
    expect(store.getState().projectDraft.certification).toMatchObject({
      certificationId: 'griha',
      versionId: 'v2019',
      categoryId: 'new-buildings',
      typologyId: 'new-construction',
      targetRatingId: '3-star',
      stage: 'certification',
    })
    expect(store.getState().projectDraft.project).toMatchObject({
      certificationId: 'griha',
      certificationVersionId: 'v2019',
      targetRating: '3-star',
      certificationStage: 'certification',
    })
  })

  it('returns to step 1 from certification details without losing values', async () => {
    const user = userEvent.setup()
    renderNewProjectPage()
    await completeStep1(user)

    await user.selectOptions(screen.getByLabelText(/certification \*/i), 'griha')
    await user.click(screen.getByTestId('certification-back'))

    expect(await screen.findByRole('heading', { name: 'Project Profile' })).toBeInTheDocument()
    expect(screen.getByLabelText(/project title/i)).toHaveValue('Harbor Campus')
    expect(screen.getByLabelText(/^location/i)).toHaveValue('Mumbai')
  })

  it('saves both wizard steps into redux so a remount restores values', async () => {
    const user = userEvent.setup()
    const { store, unmount } = renderNewProjectPage()
    await completeStep1(user)
    await user.selectOptions(screen.getByLabelText(/certification \*/i), 'igbc')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => {
      expect(store.getState().projectDraft.certification.certificationId).toBe('igbc')
    })
    expect(store.getState().projectDraft.profile.name).toBe('Harbor Campus')
    expect(store.getState().projectDraft.currentStep).toBe(2)

    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('Draft saved')

    const saved = store.getState().projectDraft
    unmount()
    renderNewProjectPage({ preloadedState: { projectDraft: saved } })

    expect(screen.getByRole('heading', { name: 'Certification Details' })).toBeInTheDocument()
    expect(screen.getByLabelText(/certification \*/i)).toHaveValue('igbc')
    expect(screen.getByRole('button', { name: /continue to igbc scorecard/i })).toBeInTheDocument()
  })

  it('opens the eligibility placeholder from the callout', async () => {
    const user = userEvent.setup()
    renderNewProjectPage()
    await completeStep1(user)
    await user.click(screen.getByRole('link', { name: /check griha eligibility/i }))
    expect(screen.getByText('Eligibility placeholder')).toBeInTheDocument()
  })

  it('navigates to the projects list on exit', async () => {
    const user = userEvent.setup()
    renderNewProjectPage()
    await user.click(screen.getByRole('button', { name: 'Exit' }))
    expect(screen.getByText('Projects list')).toBeInTheDocument()
  })

  it('opens later wizard steps as placeholders', async () => {
    const user = userEvent.setup()
    renderNewProjectPage()
    await user.click(screen.getByTestId('wizard-step-5'))
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument()
    expect(screen.getByText('This step will be available in a later release.')).toBeInTheDocument()
  })

  it('reaches the timeline step from the scorecard placeholder next button', async () => {
    const user = userEvent.setup()
    const { store } = renderNewProjectPage({
      preloadedState: {
        projectDraft: {
          currentStep: 3,
          profile: emptyProjectProfile,
          certification: emptyProjectCertification,
          timeline: sampleProjectTimeline,
          project: { name: '' },
        },
      },
    })

    expect(screen.getByRole('heading', { name: 'Scorecard' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next: timeline/i }))
    expect(await screen.findByTestId('timeline-form')).toBeInTheDocument()
    expect(screen.getByText('Step 4 of 6')).toBeInTheDocument()
    expect(store.getState().projectDraft.currentStep).toBe(4)
  })

  it('renders the project timeline step, live gantt, and current phase', async () => {
    renderNewProjectPage({
      preloadedState: {
        projectDraft: {
          currentStep: 4,
          profile: emptyProjectProfile,
          certification: emptyProjectCertification,
          timeline: sampleProjectTimeline,
          project: { name: '' },
        },
      },
    })

    expect(screen.getByText('Step 4 of 6')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Project timeline' })).toBeInTheDocument()
    expect(
      screen.getByText('Key dates drive task due dates for every POC and the progress projections.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Phases & deadlines')).toBeInTheDocument()
    expect(screen.getByText('Other milestones')).toBeInTheDocument()
    expect(screen.getByText('Timeline Preview')).toBeInTheDocument()
    expect(screen.getByText('Updates as you enter dates')).toBeInTheDocument()
    expect(screen.getByText('15 Jan 2027')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next: review/i })).toBeInTheDocument()

    const model = buildGanttModel(sampleProjectTimeline, new Date(2027, 3, 15))
    const designBar = screen.getByTestId('gantt-bar-design')
    const expected = barPosition(
      new Date(2027, 2, 1),
      new Date(2027, 6, 1),
      model.rangeStart,
      model.rangeEnd,
    )
    expect(designBar).toHaveStyle({
      left: `${expected.left}%`,
      width: `${expected.width}%`,
    })
    expect(screen.getByTestId('gantt-marker-pre-cert')).toBeInTheDocument()
    expect(screen.getByTestId('gantt-marker-cert')).toBeInTheDocument()
    expect(screen.getByText("Jan '27")).toBeInTheDocument()
  })

  it('requires phase dates before leaving step 4', async () => {
    const user = userEvent.setup()
    renderNewProjectPage({
      preloadedState: {
        projectDraft: {
          currentStep: 4,
          profile: emptyProjectProfile,
          certification: emptyProjectCertification,
          timeline: emptyProjectTimeline,
          project: { name: '' },
        },
      },
    })

    await user.click(screen.getByRole('button', { name: /next: review/i }))
    expect(await screen.findByText('Project start is required')).toBeInTheDocument()
    expect(screen.getByText('Design phase start is required')).toBeInTheDocument()
    expect(screen.getByText('Certification deadline is required')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Project timeline' })).toBeInTheDocument()
  })

  it('shows inline errors when timeline dates are missing or out of order', async () => {
    const user = userEvent.setup()
    renderNewProjectPage({
      preloadedState: {
        projectDraft: {
          currentStep: 4,
          profile: emptyProjectProfile,
          certification: emptyProjectCertification,
          timeline: sampleProjectTimeline,
          project: { name: '' },
        },
      },
    })

    fireEvent.change(screen.getByTestId('designEnd-value'), { target: { value: '2027-02-01' } })
    await user.click(screen.getByRole('button', { name: /next: review/i }))

    expect(await screen.findByText('Design phase must end after it starts')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Project timeline' })).toBeInTheDocument()
  })

  it('saves timeline values and continues to the review placeholder', async () => {
    const user = userEvent.setup()
    const { store, unmount } = renderNewProjectPage({
      preloadedState: {
        projectDraft: {
          currentStep: 4,
          profile: { ...emptyProjectProfile, name: 'Harbor Campus' },
          certification: emptyProjectCertification,
          timeline: sampleProjectTimeline,
          project: { name: 'Harbor Campus' },
        },
      },
    })

    fireEvent.change(screen.getByTestId('projectStart-value'), { target: { value: '2027-01-20' } })
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => {
      expect(store.getState().projectDraft.timeline.projectStart).toBe('2027-01-20')
    })

    const saved = store.getState().projectDraft
    unmount()
    const remounted = renderNewProjectPage({ preloadedState: { projectDraft: saved } })
    expect(screen.getByRole('heading', { name: 'Project timeline' })).toBeInTheDocument()
    expect(screen.getByText('20 Jan 2027')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next: review/i }))
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument()
    expect(remounted.store.getState().projectDraft.currentStep).toBe(5)
    expect(remounted.store.getState().projectDraft.project.startDate).toBe('2027-01-20')
  })

  it('returns to the scorecard placeholder from the timeline back button', async () => {
    const user = userEvent.setup()
    renderNewProjectPage({
      preloadedState: {
        projectDraft: {
          currentStep: 4,
          profile: emptyProjectProfile,
          certification: emptyProjectCertification,
          timeline: sampleProjectTimeline,
          project: { name: '' },
        },
      },
    })
    await user.click(screen.getByTestId('timeline-back'))
    expect(await screen.findByRole('heading', { name: 'Scorecard' })).toBeInTheDocument()
  })

  it('adds and removes site visits so the gantt markers update', async () => {
    const user = userEvent.setup()
    renderNewProjectPage({
      preloadedState: {
        projectDraft: {
          currentStep: 4,
          profile: emptyProjectProfile,
          certification: emptyProjectCertification,
          timeline: { ...sampleProjectTimeline, siteVisits: [] },
          project: { name: '' },
        },
      },
    })

    expect(screen.queryByTestId('gantt-marker-site-sv-1')).not.toBeInTheDocument()
    await user.click(screen.getByTestId('add-site-visit'))
    fireEvent.change(screen.getByTestId('siteVisit-0-value'), { target: { value: '2027-04-10' } })
    expect(screen.getByTestId('gantt-marker-site-0')).toBeInTheDocument()

    await user.click(screen.getByLabelText(/remove site visit 1/i))
    expect(screen.queryByTestId('gantt-marker-site-0')).not.toBeInTheDocument()
  })

  it('renders the optional stakeholders step from the review placeholder', async () => {
    const user = userEvent.setup()
    const { store } = renderNewProjectPage({
      preloadedState: { projectDraft: { currentStep: 5 } },
    })
    await user.click(screen.getByRole('button', { name: /next: stakeholders/i }))
    expect(await screen.findByTestId('stakeholders-form')).toBeInTheDocument()
    expect(screen.getByText('Step 6 of 6 · Optional')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Stakeholder Information' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Add the people working on this project and choose what each can access. You can skip this step and invite stakeholders later.',
      ),
    ).toBeInTheDocument()
    for (const category of DEFAULT_STAKEHOLDER_CATEGORIES) {
      expect(screen.getByText(category.name)).toBeInTheDocument()
    }
    expect(screen.getAllByPlaceholderText('Enter email address')).toHaveLength(
      DEFAULT_STAKEHOLDER_CATEGORIES.length,
    )
    expect(screen.getByRole('button', { name: 'Save stakeholders' })).toBeInTheDocument()
    expect(store.getState().projectDraft.currentStep).toBe(6)
  })

  it('saves a blank optional stakeholders step and persists filled emails', async () => {
    const user = userEvent.setup()
    const { store } = renderNewProjectPage({
      preloadedState: { projectDraft: { currentStep: 6 } },
    })

    await user.click(screen.getByRole('button', { name: 'Save stakeholders' }))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('Stakeholders saved')
    expect(createStakeholderMock).not.toHaveBeenCalled()

    await user.type(
      screen.getByTestId('stakeholder-email-architect-0'),
      'architect@example.com',
    )
    await user.selectOptions(screen.getByTestId('stakeholder-role-architect-0'), 'editor')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => {
      expect(
        store.getState().projectDraft.stakeholders.people.some(
          (person) => person.email === 'architect@example.com' && person.role === 'editor',
        ),
      ).toBe(true)
    })
  })

  it('validates emails and can add or remove extra rows in a category', async () => {
    const user = userEvent.setup()
    renderNewProjectPage({
      preloadedState: { projectDraft: { currentStep: 6 } },
    })

    await user.type(screen.getByTestId('stakeholder-email-architect-0'), 'not-valid')
    await user.click(screen.getByRole('button', { name: 'Save stakeholders' }))
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument()

    await user.click(screen.getByTestId('add-more-architect'))
    expect(screen.getByTestId('stakeholder-email-architect-1')).toBeInTheDocument()
    await user.click(screen.getByLabelText(/remove architect 2/i))
    expect(screen.queryByTestId('stakeholder-email-architect-1')).not.toBeInTheDocument()
  })

  it('posts stakeholders when the draft already has a project id', async () => {
    const user = userEvent.setup()
    renderNewProjectPage({
      preloadedState: {
        projectDraft: {
          currentStep: 6,
          stakeholders: {
            people: [
              ...createEmptyProjectStakeholders().people.filter(
                (person) => person.categoryId !== 'architect',
              ),
              {
                id: 'arch-1',
                categoryId: 'architect',
                email: 'architect@example.com',
                role: 'admin',
              },
            ],
          },
          project: { id: 'proj-1', name: 'Harbor Campus', certificationId: 'griha' },
        },
      },
    })

    await user.click(screen.getByRole('button', { name: 'Save stakeholders' }))
    await waitFor(() => {
      expect(createStakeholderMock).toHaveBeenCalledWith({
        projectId: 'proj-1',
        values: {
          name: 'architect',
          email: 'architect@example.com',
          bucketId: 'architect',
          role: 'admin',
        },
      })
    })
  })

  it('returns to the review placeholder from the stakeholders back button', async () => {
    const user = userEvent.setup()
    renderNewProjectPage({
      preloadedState: { projectDraft: { currentStep: 6 } },
    })
    await user.click(screen.getByTestId('stakeholders-back'))
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument()
  })
})
