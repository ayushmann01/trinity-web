import { ReviewResponsibilitiesStep } from '@/features/review/components/ReviewResponsibilitiesStep'
import { ProjectWizardShell } from '@/features/projects/components/ProjectWizardShell'

export function ReviewPreviewPage() {
  return (
    <ProjectWizardShell
      currentStep={5}
      onStepChange={() => {}}
      onSaveDraft={() => {}}
      onExit={() => {}}
      fillHeight
      contentClassName="max-w-[1400px]"
    >
      <ReviewResponsibilitiesStep onBack={() => {}} onNext={() => {}} />
    </ProjectWizardShell>
  )
}

