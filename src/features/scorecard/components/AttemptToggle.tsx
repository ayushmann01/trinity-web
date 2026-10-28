import { Check, Lock } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { AttemptState } from '@/features/scorecard/types'

type AttemptToggleProps = {
  state: AttemptState
  onChange: (next: 'YES' | 'MAYBE') => void
  disabled?: boolean
  mandatory?: boolean
  size?: 'sm' | 'md'
}

export function AttemptToggle({
  state,
  onChange,
  disabled,
  mandatory,
  size = 'sm',
}: AttemptToggleProps) {
  const box = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'

  if (mandatory) {
    return (
      <div className="flex items-center gap-1" data-testid="mandatory-lock">
        <span
          className={cn(
            'flex items-center justify-center rounded-[4px] bg-violet-600 text-white',
            box,
            disabled && 'opacity-40',
          )}
        >
          <Lock className="h-3 w-3" aria-hidden="true" />
        </span>
        <span
          className={cn(
            'flex items-center justify-center rounded-[4px] bg-violet-600 text-white',
            box,
            disabled && 'opacity-40',
          )}
        >
          <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Mark maybe"
        aria-pressed={state === 'MAYBE'}
        disabled={disabled}
        onClick={() => onChange('MAYBE')}
        className={cn(
          'flex items-center justify-center rounded-[4px] border text-[11px] leading-none',
          box,
          state === 'MAYBE'
            ? 'border-amber-500 bg-amber-500 text-white'
            : 'border-neutral-300 bg-white text-neutral-400',
          disabled && 'cursor-not-allowed opacity-40',
        )}
      >
        {state === 'MAYBE' ? '?' : null}
      </button>
      <button
        type="button"
        aria-label="Mark yes"
        aria-pressed={state === 'YES'}
        disabled={disabled}
        onClick={() => onChange('YES')}
        className={cn(
          'flex items-center justify-center rounded-[4px] border',
          box,
          state === 'YES'
            ? 'border-blue-600 bg-blue-600 text-white'
            : 'border-neutral-300 bg-white text-neutral-400',
          disabled && 'cursor-not-allowed opacity-40',
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
      </button>
    </div>
  )
}

export function ScoreBoxes({
  maybe,
  yes,
  max,
}: {
  maybe: number
  yes: number
  max: number
}) {
  return (
    <div className="flex items-center gap-1" aria-label={`${maybe} maybe, ${yes} yes, ${max} max`}>
      <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-amber-100 px-1.5 text-[11px] font-medium text-amber-700">
        {maybe}
      </span>
      <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-blue-100 px-1.5 text-[11px] font-medium text-blue-700">
        {yes}
      </span>
      <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-neutral-800 px-1.5 text-[11px] font-medium text-white">
        {max}
      </span>
    </div>
  )
}
