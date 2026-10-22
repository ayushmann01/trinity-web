import { PROJECT_SETUP_STEPS } from '@/features/projects/constants'
import { Button } from '@/shared/ui/button'

type WizardPlaceholderStepProps = {
  step: number
  onBack: () => void
}

export function WizardPlaceholderStep({ step, onBack }: WizardPlaceholderStepProps) {
  const meta = PROJECT_SETUP_STEPS.find((item) => item.id === step) ?? PROJECT_SETUP_STEPS[0]

  return (
    <div data-testid="placeholder-step">
      <p className="text-[12px] text-neutral-400">Step {step} of 6</p>
      <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
        {meta.pageTitle}
      </h1>
      <p className="mt-1 text-[13px] text-neutral-500">{meta.subtitle}</p>
      <p className="mt-6 text-sm text-neutral-500">This step will be available in a later release.</p>
      <div className="mt-8">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBack}
          data-testid="placeholder-back"
        >
          Back
        </Button>
      </div>
    </div>
  )
}
