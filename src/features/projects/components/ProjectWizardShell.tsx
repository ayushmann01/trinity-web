import type { ReactNode } from 'react'
import commanLogo from '@/assets/comman-logo.png'
import { Button } from '@/shared/ui/button'
import { WizardStepper } from '@/features/projects/components/WizardStepper'

type ProjectWizardShellProps = {
  currentStep: number
  onStepChange: (step: number) => void
  onSaveDraft: () => void
  onCancel: () => void
  children: ReactNode
}

export function ProjectWizardShell({
  currentStep,
  onStepChange,
  onSaveDraft,
  onCancel,
  children,
}: ProjectWizardShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900" data-testid="project-wizard">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6">
        <div className="flex items-center gap-2.5">
          <img src={commanLogo} alt="Comman" className="h-[22px] w-auto" />
          <span className="text-neutral-300" aria-hidden="true">
            |
          </span>
          <span className="text-xs text-neutral-400">New project</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-neutral-200 bg-white text-xs font-medium text-neutral-800 shadow-none hover:bg-neutral-50"
            onClick={onSaveDraft}
            data-testid="save-draft"
          >
            Save draft
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-neutral-200 bg-white text-xs font-medium text-neutral-800 shadow-none hover:bg-neutral-50"
            onClick={onCancel}
            data-testid="cancel-wizard"
          >
            Cancel
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-[232px] shrink-0 border-r border-neutral-200 bg-neutral-50">
          <WizardStepper currentStep={currentStep} onStepChange={onStepChange} />
        </aside>
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="mx-auto w-full max-w-[720px] px-10 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
