import { cn } from '@/shared/lib/utils'
import { PROJECT_SETUP_STEPS } from '@/features/projects/constants'

type WizardStepperProps = {
  currentStep: number
  onStepChange: (step: number) => void
}

export function WizardStepper({ currentStep, onStepChange }: WizardStepperProps) {
  return (
    <nav aria-label="Project set-up" className="px-3 py-5" data-testid="wizard-stepper">
      <p className="mb-3 px-2 text-[11px] font-medium text-neutral-400">Project set-up</p>
      <ol className="space-y-1">
        {PROJECT_SETUP_STEPS.map((step) => {
          const active = step.id === currentStep
          return (
            <li key={step.id}>
              <button
                type="button"
                data-testid={`wizard-step-${step.id}`}
                aria-current={active ? 'step' : undefined}
                onClick={() => onStepChange(step.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors',
                  active
                    ? 'bg-neutral-100 font-medium text-neutral-900'
                    : 'font-normal text-neutral-700 hover:bg-neutral-100/80',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] leading-none',
                    active
                      ? 'bg-neutral-900 text-white'
                      : 'border border-neutral-400 bg-white text-neutral-700',
                  )}
                >
                  {step.id}
                </span>
                {step.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
