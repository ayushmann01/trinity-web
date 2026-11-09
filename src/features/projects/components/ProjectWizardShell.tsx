import type { ReactNode } from 'react'
import { Button } from '@/shared/ui/button'
import { CommanLogo } from '@/shared/ui/CommanLogo'
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
          <CommanLogo />
          <span className="text-neutral-300" aria-hidden="true">
            /
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
          <div className="px-3">
            <div className="mt-3 rounded-md border border-neutral-200 bg-white">
              <div className="border-b border-neutral-200 px-3 py-2">
                <p className="text-[12px] font-medium text-neutral-700">Summary</p>
              </div>
              <div className="space-y-2 px-3 py-3">
                <p className="text-[12px] text-neutral-700">GRIHA v2019 · target 4 Star</p>
                <p className="text-[12px] text-neutral-700">Yes 34 pts · Maybe 12 pts</p>
                <p className="text-[12px] text-neutral-700">Cert deadline 31 Mar 2029</p>
                <button
                  type="button"
                  className="text-left text-[12px] text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
                >
                  Edit details
                </button>
              </div>
            </div>
          </div>
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
                ? 'flex min-h-0 flex-1 flex-col px-6 py-5'
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
