import { cn } from '@/shared/lib/utils'
import {
  GANTT_PHASES,
  buildGanttModel,
  type TimelineDateFields,
} from '@/features/projects/lib/timeline'

type TimelinePreviewProps = {
  values: TimelineDateFields
  now?: Date
}

export function TimelinePreview({ values, now }: TimelinePreviewProps) {
  const model = buildGanttModel(values, now)

  return (
    <div data-testid="timeline-preview">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">Timeline Preview</h2>
        <p className="text-[12px] text-neutral-400">Updates as you enter dates</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="flex">
            <div className="w-[168px] shrink-0" />
            <div className="relative h-6 flex-1">
              {model.months.map((month) => (
                <div
                  key={month.key}
                  className="absolute top-0 text-center text-[11px] text-neutral-400"
                  style={{ left: `${month.left}%`, width: `${month.width}%` }}
                  data-testid={`gantt-month-${month.key}`}
                >
                  {month.label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {GANTT_PHASES.map((phase) => {
              const bar = model.bars.find((item) => item.id === phase.id)
              return (
                <div
                  key={phase.id}
                  className="flex h-11 items-center border-b border-neutral-200"
                  data-testid={`gantt-row-${phase.id}`}
                >
                  <div className="w-[168px] shrink-0 pr-3 text-[12px] text-neutral-700">
                    {phase.label}
                  </div>
                  <div className="relative h-full flex-1">
                    {bar ? (
                      <div
                        data-testid={`gantt-bar-${phase.id}`}
                        className="absolute top-1/2 h-3 -translate-y-1/2 rounded-[2px] border border-neutral-600 bg-neutral-200"
                        style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                      />
                    ) : null}
                  </div>
                </div>
              )
            })}

            <div className="pointer-events-none absolute bottom-0 left-[168px] right-0 top-0">
              {model.markers.map((marker) => (
                <div
                  key={marker.id}
                  data-testid={`gantt-marker-${marker.id}`}
                  data-marker-type={marker.type}
                  className={cn(
                    'absolute top-0 h-full',
                    marker.type === 'milestone' && 'w-px bg-neutral-400',
                    marker.type === 'pre-cert' && 'w-0 border-l border-dashed border-red-500',
                    marker.type === 'cert' && 'w-px bg-red-500',
                  )}
                  style={{ left: `${marker.percent}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-[1px] border border-neutral-600 bg-neutral-200" />
          Phase duration
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px bg-neutral-400" />
          Site visits & milestones
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0 border-l border-dashed border-red-500" />
          Pre-certification deadline
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px bg-red-500" />
          Certification deadline
        </span>
      </div>
    </div>
  )
}
