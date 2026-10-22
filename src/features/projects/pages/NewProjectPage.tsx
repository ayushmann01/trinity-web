import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/shared/lib/zodResolver'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux'
import { ProjectWizardShell } from '@/features/projects/components/ProjectWizardShell'
import { ProjectProfileForm } from '@/features/projects/components/ProjectProfileForm'
import { CertificationDetailsForm } from '@/features/projects/components/CertificationDetailsForm'
import { ProjectTimelineForm } from '@/features/projects/components/ProjectTimelineForm'
import { ProjectStakeholdersForm } from '@/features/projects/components/ProjectStakeholdersForm'
import { WizardPlaceholderStep } from '@/features/projects/components/WizardPlaceholderStep'
import { PROJECT_SETUP_STEPS } from '@/features/projects/constants'
import {
  emptyProjectProfile,
  projectProfileSchema,
  type ProjectProfileFormValues,
} from '@/features/projects/schemas/projectProfile'
import {
  emptyProjectCertification,
  projectCertificationSchema,
  type ProjectCertificationFormValues,
} from '@/features/projects/schemas/projectCertification'
import {
  cloneTimeline,
  emptyProjectTimeline,
  projectTimelineSchema,
  type ProjectTimelineFormValues,
} from '@/features/projects/schemas/projectTimeline'
import {
  cloneStakeholders,
  emptyProjectStakeholders,
  projectStakeholdersSchema,
  type ProjectStakeholdersFormValues,
} from '@/features/projects/schemas/projectStakeholders'
import { persistProjectDraft } from '@/features/projects/state/projectDraftSlice'
import { mapProjectStakeholdersToApi } from '@/features/projects/lib/mapProjectStakeholders'
import { useCreateStakeholderMutation } from '@/features/stakeholders/api/stakeholdersApi'

function placeholderNextLabel(step: number) {
  if (step === 3) return 'Next: Timeline'
  if (step === 5) return 'Next: Stakeholders'
  return 'Next'
}

export function NewProjectPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const draft = useAppSelector((state) => state.projectDraft)
  const currentStep = draft.currentStep
  const stepMeta = PROJECT_SETUP_STEPS.find((step) => step.id === currentStep) ?? PROJECT_SETUP_STEPS[0]
  const certificationDraft = draft.certification ?? emptyProjectCertification
  const timelineDraft = draft.timeline ?? emptyProjectTimeline
  const stakeholdersDraft = draft.stakeholders ?? emptyProjectStakeholders
  const [createStakeholder, { isLoading: savingStakeholders }] = useCreateStakeholderMutation()

  const profileForm = useForm<ProjectProfileFormValues>({
    resolver: zodResolver(projectProfileSchema),
    defaultValues: { ...emptyProjectProfile, ...draft.profile },
    mode: 'onSubmit',
  })

  const certificationForm = useForm<ProjectCertificationFormValues>({
    resolver: zodResolver(projectCertificationSchema),
    defaultValues: { ...emptyProjectCertification, ...certificationDraft },
    mode: 'onSubmit',
  })

  const timelineForm = useForm<ProjectTimelineFormValues>({
    resolver: zodResolver(projectTimelineSchema),
    defaultValues: cloneTimeline({ ...emptyProjectTimeline, ...timelineDraft }),
    mode: 'onSubmit',
  })

  const stakeholdersForm = useForm<ProjectStakeholdersFormValues>({
    resolver: zodResolver(projectStakeholdersSchema),
    defaultValues: cloneStakeholders({ ...emptyProjectStakeholders, ...stakeholdersDraft }),
    mode: 'onSubmit',
  })

  const persistDraft = (step = currentStep) => {
    dispatch(
      persistProjectDraft({
        profile: profileForm.getValues(),
        certification: certificationForm.getValues(),
        timeline: cloneTimeline(timelineForm.getValues()),
        stakeholders: cloneStakeholders(stakeholdersForm.getValues()),
        currentStep: step,
      }),
    )
  }

  const handleSaveDraft = () => {
    persistDraft()
    toast.success('Draft saved')
  }

  const handleExit = () => {
    navigate('/app/projects')
  }

  const handleProfileNext = profileForm.handleSubmit((values) => {
    dispatch(
      persistProjectDraft({
        profile: values,
        certification: certificationForm.getValues(),
        timeline: timelineForm.getValues(),
        stakeholders: stakeholdersForm.getValues(),
        currentStep: 2,
      }),
    )
  })

  const handleCertificationNext = certificationForm.handleSubmit((values) => {
    dispatch(
      persistProjectDraft({
        profile: profileForm.getValues(),
        certification: values,
        timeline: timelineForm.getValues(),
        stakeholders: stakeholdersForm.getValues(),
        currentStep: 3,
      }),
    )
  })

  const handleTimelineNext = timelineForm.handleSubmit((values) => {
    dispatch(
      persistProjectDraft({
        profile: profileForm.getValues(),
        certification: certificationForm.getValues(),
        timeline: values,
        stakeholders: stakeholdersForm.getValues(),
        currentStep: 5,
      }),
    )
  })

  const handleSaveStakeholders = stakeholdersForm.handleSubmit(async (values) => {
    dispatch(
      persistProjectDraft({
        profile: profileForm.getValues(),
        certification: certificationForm.getValues(),
        timeline: timelineForm.getValues(),
        stakeholders: values,
        currentStep: 6,
      }),
    )

    const projectId = draft.project.id
    const payload = mapProjectStakeholdersToApi(values)
    if (projectId && payload.length > 0) {
      try {
        await Promise.all(
          payload.map((person) => createStakeholder({ projectId, values: person }).unwrap()),
        )
        toast.success('Stakeholders saved')
      } catch (error) {
        const message = (error as { data?: { message?: string } })?.data?.message
        toast.error(message || 'Failed to save stakeholders')
      }
      return
    }

    toast.success('Stakeholders saved')
  })

  return (
    <ProjectWizardShell
      currentStep={currentStep}
      onStepChange={(step) => persistDraft(step)}
      onSaveDraft={handleSaveDraft}
      onExit={handleExit}
      contentClassName={currentStep === 4 ? 'max-w-[1100px]' : undefined}
    >
      {currentStep === 1 ? (
        <form onSubmit={handleProfileNext} noValidate>
          <p className="text-[12px] text-neutral-400">Step 1 of 6</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
            {stepMeta.pageTitle}
          </h1>
          <p className="mb-5 mt-1 text-[13px] text-neutral-500">{stepMeta.subtitle}</p>
          <ProjectProfileForm form={profileForm} />
          <div className="mt-6 flex justify-end border-t border-neutral-200 pt-6">
            <Button
              type="submit"
              className="h-9 bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-800"
              data-testid="next-certification"
            >
              Certification Information
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </form>
      ) : currentStep === 2 ? (
        <form onSubmit={handleCertificationNext} noValidate>
          <p className="text-[12px] text-neutral-400">Step 2 of 6</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
            {stepMeta.pageTitle}
          </h1>
          <p className="mb-5 mt-1 text-[13px] text-neutral-500">{stepMeta.subtitle}</p>
          <CertificationDetailsForm form={certificationForm} onBack={() => persistDraft(1)} />
        </form>
      ) : currentStep === 4 ? (
        <form onSubmit={handleTimelineNext} noValidate>
          <p className="text-[12px] text-neutral-400">Step 4 of 6</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
            {stepMeta.pageTitle}
          </h1>
          <p className="mb-5 mt-1 text-[13px] text-neutral-500">{stepMeta.subtitle}</p>
          <ProjectTimelineForm form={timelineForm} onBack={() => persistDraft(3)} />
        </form>
      ) : currentStep === 6 ? (
        <form onSubmit={handleSaveStakeholders} noValidate>
          <p className="text-[12px] text-neutral-400">Step 6 of 6 · Optional</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
            {stepMeta.pageTitle}
          </h1>
          <p className="mb-5 mt-1 text-[13px] text-neutral-500">{stepMeta.subtitle}</p>
          <ProjectStakeholdersForm
            form={stakeholdersForm}
            onBack={() => persistDraft(5)}
            saving={savingStakeholders}
          />
        </form>
      ) : (
        <WizardPlaceholderStep
          step={currentStep}
          onBack={() => persistDraft(Math.max(1, currentStep - 1))}
          onNext={currentStep < 6 ? () => persistDraft(Math.min(6, currentStep + 1)) : undefined}
          nextLabel={placeholderNextLabel(currentStep)}
        />
      )}
    </ProjectWizardShell>
  )
}
