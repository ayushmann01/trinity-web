import { cn } from '@/shared/lib/utils'
import type { CertificationStage } from '@/features/projects/types'

const STAGES: { id: CertificationStage; title: string; description: string }[] = [
  {
    id: 'pre-certification',
    title: 'Pre-certification',
    description: 'Design-stage review before construction',
  },
  {
    id: 'certification',
    title: 'Certification',
    description: 'Final certification after construction',
  },
]

type CertificationStageCardsProps = {
  value: CertificationStage
  onChange: (value: CertificationStage) => void
}

export function CertificationStageCards({ value, onChange }: CertificationStageCardsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Certification stage"
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
      data-testid="certification-stage"
    >
      {STAGES.map((stage) => {
        const selected = value === stage.id
        return (
          <button
            key={stage.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-testid={`stage-${stage.id}`}
            onClick={() => onChange(stage.id)}
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
              selected
                ? 'border-neutral-800 bg-neutral-100'
                : 'border-neutral-200 bg-white hover:bg-neutral-50',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                selected ? 'border-neutral-900' : 'border-neutral-400',
              )}
              aria-hidden="true"
            >
              {selected ? <span className="h-2 w-2 rounded-full bg-neutral-900" /> : null}
            </span>
            <span>
              <span className="block text-[13px] font-medium text-neutral-900">{stage.title}</span>
              <span className="mt-0.5 block text-[12px] text-neutral-500">{stage.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
