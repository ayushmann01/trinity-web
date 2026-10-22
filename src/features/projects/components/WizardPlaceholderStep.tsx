import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PROJECT_SETUP_STEPS } from '@/features/projects/constants'
import { Button } from '@/shared/ui/button'

type WizardPlaceholderStepProps = {
  step: number
  onBack: () => void
  onNext?: () => void
  nextLabel?: string
}

export function WizardPlaceholderStep({
  step,
  onBack,
  onNext,
  nextLabel = 'Next',
}: WizardPlaceholderStepProps) {
  const meta = PROJECT_SETUP_STEPS.find((item) => item.id === step) ?? PROJECT_SETUP_STEPS[0]

  return (
    <div data-testid="placeholder-step">
      <p className="text-[12px] text-neutral-400">Step {step} of 6</p>
      <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-neutral-900">
        {meta.pageTitle}
      </h1>
      <p className="mt-1 text-[13px] text-neutral-500">{meta.subtitle}</p>
      <p className="mt-6 text-sm text-neutral-500">This step will be available in a later release.</p>
      <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-6">
        <Button
          type="button"
          variant="outline"
          className="h-9 border-neutral-200 bg-white text-[13px] font-medium text-neutral-800 shadow-none"
          onClick={onBack}
          data-testid="placeholder-back"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        {onNext ? (
          <Button
            type="button"
            className="h-9 bg-neutral-900 px-4 text-[13px] font-medium text-white hover:bg-neutral-800"
            onClick={onNext}
            data-testid="placeholder-next"
          >
            {nextLabel}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
