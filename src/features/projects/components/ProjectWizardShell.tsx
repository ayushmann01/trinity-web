import type { ReactNode } from 'react'
import commanLogo from '@/assets/comman-logo.png'
import { Button } from '@/shared/ui/button'
import { WizardStepper } from '@/features/projects/components/WizardStepper'
import { cn } from '@/shared/lib/utils'

type ProjectWizardShellProps = {
  currentStep: number
  onStepChange: (step: number) => void
  onSaveDraft: () => void
  onExit: () => void
  contentClassName?: string
  fillHeight?: boolean
  children: ReactNode
}

export function ProjectWizardShell({
  currentStep,
  onStepChange,
  onSaveDraft,
  onExit,
  contentClassName,
  fillHeight = false,
  children,
}: ProjectWizardShellProps) {
  return (
    <div className="flex h-screen min-h-0 flex-col bg-white text-neutral-900" data-testid="project-wizard">
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
            onClick={onExit}
            data-testid="exit-wizard"
          >
            Exit
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-[232px] shrink-0 border-r border-neutral-200 bg-neutral-50">
          <WizardStepper currentStep={currentStep} onStepChange={onStepChange} />
        </aside>
        <main
          className={cn(
            'flex-1 bg-white',
            fillHeight ? 'flex min-h-0 flex-col overflow-hidden' : 'overflow-y-auto',
          )}
        >
          <div
            className={cn(
              fillHeight
                ? 'flex min-h-0 flex-1 flex-col'
                : cn('mx-auto w-full px-10 py-8', contentClassName ?? 'max-w-[720px]'),
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
