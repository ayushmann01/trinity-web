import { cn } from '@/shared/lib/utils'
import { displayCode, displayTitle, formatNavPoints } from '@/features/scorecard/lib/formatCriteria'
import type { CriteriaNode } from '@/features/scorecard/types'

type ScorecardCriteriaNavProps = {
  criteria: CriteriaNode[]
  selectedId: number | null
  onSelect: (id: number) => void
  attemptedCount: number
  totalCount: number
}

export function ScorecardCriteriaNav({
  criteria,
  selectedId,
  onSelect,
  attemptedCount,
  totalCount,
}: ScorecardCriteriaNavProps) {
  return (
    <aside
      className="flex w-[280px] shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/80"
      data-testid="scorecard-criteria-nav"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-[12px] font-medium text-neutral-500">Criteria</p>
        <p className="text-[11px] tabular-nums text-neutral-400">
          {attemptedCount}/{totalCount}
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {criteria.map((item) => {
          const selected = item.id === selectedId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              data-testid={`criteria-nav-${item.id}`}
              className={cn(
                'flex w-full items-start justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors',
                selected
                  ? 'border-neutral-800 bg-neutral-100'
                  : 'border-transparent bg-transparent hover:bg-white',
              )}
            >
              <span className="text-[12px] font-medium leading-snug text-neutral-800">
                {displayCode(item.criteria_id, 0)} {displayTitle(item)}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-neutral-500">
                {formatNavPoints(item.points_maybe, item.points_attempted, item.max_points)}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
