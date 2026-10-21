import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/shared/lib/zodResolver'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux'
import { ProjectWizardShell } from '@/features/projects/components/ProjectWizardShell'
import { ProjectProfileForm } from '@/features/projects/components/ProjectProfileForm'
import { WizardPlaceholderStep } from '@/features/projects/components/WizardPlaceholderStep'
import { PROJECT_SETUP_STEPS } from '@/features/projects/constants'
import {
  emptyProjectProfile,
  projectProfileSchema,
  type ProjectProfileFormValues,
} from '@/features/projects/schemas/projectProfile'
import {
  persistProjectDraft,
  setWizardStep,
} from '@/features/projects/state/projectDraftSlice'

export function NewProjectPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const draft = useAppSelector((state) => state.projectDraft)
  const currentStep = draft.currentStep
  const stepMeta = PROJECT_SETUP_STEPS.find((step) => step.id === currentStep) ?? PROJECT_SETUP_STEPS[0]

  const form = useForm<ProjectProfileFormValues>({
    resolver: zodResolver(projectProfileSchema),
    defaultValues: { ...emptyProjectProfile, ...draft.profile },
    mode: 'onSubmit',
  })

  const handleSaveDraft = () => {
    dispatch(
      persistProjectDraft({
        profile: form.getValues(),
        currentStep,
      }),
    )
    toast.success('Draft saved')
  }

  const handleCancel = () => {
    navigate('/app/projects')
  }

  const handleNext = form.handleSubmit((values) => {
    dispatch(persistProjectDraft({ profile: values, currentStep: 2 }))
  })

  return (
    <ProjectWizardShell
      currentStep={currentStep}
      onStepChange={(step) => {
        dispatch(
          persistProjectDraft({
            profile: form.getValues(),
            currentStep: step,
          }),
        )
      }}
      onSaveDraft={handleSaveDraft}
      onCancel={handleCancel}
    >
      {currentStep === 1 ? (
        <form onSubmit={handleNext} noValidate>
          <p className="text-[12px] text-neutral-400">Step 1 of 6</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
            {stepMeta.label}
          </h1>
          <p className="mb-5 mt-1 text-[13px] text-neutral-500">{stepMeta.subtitle}</p>
          <ProjectProfileForm form={form} />
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
      ) : (
        <WizardPlaceholderStep
          step={currentStep}
          onBack={() => dispatch(setWizardStep(Math.max(1, currentStep - 1)))}
        />
      )}
    </ProjectWizardShell>
  )
}
