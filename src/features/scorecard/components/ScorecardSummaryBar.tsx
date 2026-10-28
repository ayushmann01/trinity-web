import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  CERTIFICATION_SCALE,
  DEFAULT_SCORECARD_THRESHOLDS,
} from '@/features/scorecard/lib/thresholds'
import type { ScorecardThreshold } from '@/features/scorecard/types'

type ScorecardSummaryBarProps = {
  certificationName: string
  subtitle: string
  collapsed: boolean
  onToggleCollapsed: () => void
  yesPoints: number
  maybePoints: number
  totalPoints?: number
  thresholds?: ScorecardThreshold[]
  activeThresholdId?: string | null
}

export function ScorecardSummaryBar({
  certificationName,
  subtitle,
  collapsed,
  onToggleCollapsed,
  yesPoints,
  maybePoints,
  totalPoints = CERTIFICATION_SCALE,
  thresholds = DEFAULT_SCORECARD_THRESHOLDS,
  activeThresholdId,
}: ScorecardSummaryBarProps) {
  const scale = Math.max(totalPoints, 1)
  const yesWidth = Math.min(100, (yesPoints / scale) * 100)
  const maybeWidth = Math.min(100 - yesWidth, (maybePoints / scale) * 100)
  const combined = yesPoints + maybePoints

  return (
    <div
      className="flex shrink-0 items-start justify-between gap-6 border-b border-neutral-200 bg-white px-6 py-4"
      data-testid="scorecard-summary"
    >
      <div className="min-w-[220px] max-w-[280px]">
        <button
          type="button"
          className="flex items-center gap-1 text-left text-[15px] font-semibold text-neutral-900"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          data-testid="scorecard-title-toggle"
        >
          {certificationName} Scorecard
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          ) : (
            <ChevronUp className="h-4 w-4 text-neutral-500" />
          )}
        </button>
        {!collapsed ? (
          <p className="mt-1 text-[12px] leading-snug text-neutral-500">{subtitle}</p>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 pt-1">
        <div className="relative mb-2 flex h-6 items-center justify-between">
          {thresholds.map((tier) => {
            const left = (tier.points / scale) * 100
            const active = activeThresholdId === tier.id || combined >= tier.points
            const highlighted = activeThresholdId === tier.id
            return (
              <div
                key={tier.id}
                className="absolute -translate-x-1/2"
                style={{ left: `${left}%` }}
              >
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                    highlighted
                      ? 'bg-neutral-900 text-white'
                      : active
                        ? 'bg-neutral-200 text-neutral-800'
                        : 'bg-neutral-100 text-neutral-500',
                  )}
                >
                  {tier.label} {tier.points}pts
                </span>
              </div>
            )
          })}
        </div>
        <div
          className="relative h-2 overflow-hidden rounded-full bg-neutral-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={scale}
          aria-valuenow={yesPoints}
          data-testid="scorecard-progress"
        >
          <div
            className="absolute inset-y-0 left-0 bg-blue-600"
            style={{ width: `${yesWidth}%` }}
            data-testid="progress-yes"
          />
          <div
            className="absolute inset-y-0 bg-amber-400"
            style={{ left: `${yesWidth}%`, width: `${maybeWidth}%` }}
            data-testid="progress-maybe"
          />
          {thresholds.map((tier) => (
            <span
              key={`tick-${tier.id}`}
              className="absolute top-0 h-full w-px bg-white/80"
              style={{ left: `${(tier.points / scale) * 100}%` }}
            />
          ))}
        </div>
      </div>

      <div className="w-[140px] shrink-0 text-right">
        <p className="text-[18px] font-semibold tabular-nums text-neutral-900" data-testid="scorecard-total">
          {yesPoints} / {scale} pts
        </p>
        <div className="mt-1 flex items-center justify-end gap-3 text-[11px] text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Yes: {yesPoints} pts
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Maybe: {maybePoints} pts
          </span>
        </div>
      </div>
    </div>
  )
}
