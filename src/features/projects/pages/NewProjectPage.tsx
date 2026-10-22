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
import { persistProjectDraft } from '@/features/projects/state/projectDraftSlice'

export function NewProjectPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const draft = useAppSelector((state) => state.projectDraft)
  const currentStep = draft.currentStep
  const stepMeta = PROJECT_SETUP_STEPS.find((step) => step.id === currentStep) ?? PROJECT_SETUP_STEPS[0]
  const certificationDraft = draft.certification ?? emptyProjectCertification

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

  const persistDraft = (step = currentStep) => {
    dispatch(
      persistProjectDraft({
        profile: profileForm.getValues(),
        certification: certificationForm.getValues(),
        currentStep: step,
      }),
    )
  }

  const handleSaveDraft = () => {
    persistDraft()
    toast.success('Draft saved')
  }

  const handleCancel = () => {
    navigate('/app/projects')
  }

  const handleProfileNext = profileForm.handleSubmit((values) => {
    dispatch(
      persistProjectDraft({
        profile: values,
        certification: certificationForm.getValues(),
        currentStep: 2,
      }),
    )
  })

  const handleCertificationNext = certificationForm.handleSubmit((values) => {
    dispatch(
      persistProjectDraft({
        profile: profileForm.getValues(),
        certification: values,
        currentStep: 3,
      }),
    )
  })

  return (
    <ProjectWizardShell
      currentStep={currentStep}
      onStepChange={(step) => persistDraft(step)}
      onSaveDraft={handleSaveDraft}
      onCancel={handleCancel}
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
      ) : (
        <WizardPlaceholderStep step={currentStep} onBack={() => persistDraft(Math.max(1, currentStep - 1))} />
      )}
    </ProjectWizardShell>
  )
}
