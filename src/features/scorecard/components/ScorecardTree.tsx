import { Calculator, Paperclip } from 'lucide-react'
import { AttemptToggle, ScoreBoxes } from '@/features/scorecard/components/AttemptToggle'
import {
  aimText,
  calculatorCopy,
  checklistInstruction,
  displayCode,
  displayTitle,
  isChecklistParent,
  pointsLabel,
} from '@/features/scorecard/lib/formatCriteria'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Textarea } from '@/shared/ui/textarea'
import type { CriteriaNode } from '@/features/scorecard/types'

type ScorecardTreeProps = {
  criteria: CriteriaNode[]
  notes: Record<string, string>
  expandedNotes: Set<number>
  onToggle: (id: number, clicked: 'YES' | 'MAYBE') => void
  onNoteChange: (id: number, note: string) => void
  onToggleNote: (id: number) => void
  isInactive: (node: CriteriaNode) => boolean
  selectedId: number | null
}

export function ScorecardTree(props: ScorecardTreeProps) {
  return (
    <div className="space-y-4" data-testid="scorecard-tree">
      {props.criteria.map((node) => (
        <CriterionSection key={node.id} node={node} depth={0} {...props} />
      ))}
    </div>
  )
}

function CriterionSection({
  node,
  depth,
  ...props
}: ScorecardTreeProps & { node: CriteriaNode; depth: number }) {
  const checklist = isChecklistParent(node)
  const inactive = props.isInactive(node)
  const leafToggle = node.children.length === 0 && (node.selectable || node.mandatory)

  return (
    <article
      id={`criterion-${node.id}`}
      data-testid={`criterion-${node.id}`}
      className={cn(
        'rounded-xl border bg-white',
        props.selectedId === node.id ? 'border-neutral-800' : 'border-neutral-200',
        inactive && 'opacity-60',
      )}
    >
      <header className="flex items-start gap-3 px-4 py-3">
        <CodeBadge code={displayCode(node.criteria_id, depth)} nested={depth > 0} />
        {leafToggle ? (
          <AttemptToggle
            state={node.attempt_state}
            mandatory={node.mandatory}
            disabled={inactive && !node.selectable}
            onChange={(clicked) => props.onToggle(node.id, clicked)}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[13px] font-semibold text-neutral-900">{displayTitle(node)}</h3>
            {node.mandatory ? (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-700">
                Mandatory
              </span>
            ) : null}
          </div>
          {node.description ? (
            <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-neutral-500">
              {node.description}
            </p>
          ) : null}
        </div>
        <ScoreBoxes maybe={node.points_maybe} yes={node.points_attempted} max={node.max_points} />
      </header>

      <ActionRow
        node={node}
        note={props.notes[String(node.id)] ?? ''}
        noteOpen={props.expandedNotes.has(node.id)}
        onNoteChange={(value) => props.onNoteChange(node.id, value)}
        onToggleNote={() => props.onToggleNote(node.id)}
      />

      {checklist ? (
        <ChecklistBox
          node={node}
          inactive={inactive}
          onToggle={props.onToggle}
        />
      ) : node.children.length > 0 ? (
        <div className="px-4 pb-4">
          <ul className="relative ml-3 border-l border-neutral-200 pl-5">
            {node.children.map((child) => (
              <li key={child.id} className="relative pb-3 last:pb-0">
                <span className="absolute -left-5 top-5 h-px w-5 bg-neutral-200" />
                <NestedCriterion node={child} depth={depth + 1} {...props} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  )
}

function NestedCriterion({
  node,
  depth,
  ...props
}: ScorecardTreeProps & { node: CriteriaNode; depth: number }) {
  const checklist = isChecklistParent(node)
  const inactive = props.isInactive(node)
  const leafToggle = node.children.length === 0 && (node.selectable || node.mandatory)

  return (
    <div
      id={`criterion-${node.id}`}
      data-testid={`criterion-${node.id}`}
      className={cn('rounded-xl border border-neutral-200 bg-white', inactive && 'opacity-50')}
    >
      <header className="flex items-start gap-3 px-3 py-3">
        <CodeBadge code={displayCode(node.criteria_id, depth)} nested={depth > 0} />
        {leafToggle ? (
          <AttemptToggle
            state={node.attempt_state}
            mandatory={node.mandatory}
            disabled={inactive && !node.selectable}
            onChange={(clicked) => props.onToggle(node.id, clicked)}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[13px] font-medium text-neutral-900">{displayTitle(node)}</h4>
            {node.mandatory ? (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-700">
                Mandatory
              </span>
            ) : null}
          </div>
          {node.description ? (
            <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-neutral-500">
              {node.description}
            </p>
          ) : null}
        </div>
        <ScoreBoxes maybe={node.points_maybe} yes={node.points_attempted} max={node.max_points} />
      </header>
      <ActionRow
        node={node}
        note={props.notes[String(node.id)] ?? ''}
        noteOpen={props.expandedNotes.has(node.id)}
        onNoteChange={(value) => props.onNoteChange(node.id, value)}
        onToggleNote={() => props.onToggleNote(node.id)}
      />
      {checklist ? (
        <ChecklistBox node={node} inactive={inactive} onToggle={props.onToggle} />
      ) : node.children.length > 0 ? (
        <ul className="relative ml-6 border-l border-neutral-200 pl-5 pb-3">
          {node.children.map((child) => (
            <li key={child.id} className="relative pb-3 last:pb-0">
              <span className="absolute -left-5 top-5 h-px w-5 bg-neutral-200" />
              <NestedCriterion node={child} depth={depth + 1} {...props} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function CodeBadge({ code, nested }: { code: string; nested: boolean }) {
  if (!code) return null
  return (
    <span
      className={cn(
        'mt-0.5 inline-flex min-w-[42px] shrink-0 items-center justify-center rounded-md px-1.5 py-1 text-[10px] font-semibold',
        nested
          ? 'border border-neutral-300 bg-white text-neutral-700'
          : 'bg-neutral-900 text-white',
      )}
    >
      {code}
    </span>
  )
}

function ActionRow({
  node,
  note,
  noteOpen,
  onNoteChange,
  onToggleNote,
}: {
  node: CriteriaNode
  note: string
  noteOpen: boolean
  onNoteChange: (value: string) => void
  onToggleNote: () => void
}) {
  const calc = calculatorCopy(node)
  const hasRefs = Boolean(node.references || node.footnotes)

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {hasRefs ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 border-neutral-200 bg-white px-2 text-[11px] font-medium text-neutral-700 shadow-none"
                  data-testid={`references-${node.id}`}
                >
                  <Paperclip className="mr-1 h-3 w-3" />
                  References
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 text-[12px] text-neutral-700">
                {node.references ? (
                  <a
                    href={node.references}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-blue-700 underline"
                  >
                    {node.references}
                  </a>
                ) : null}
                {node.footnotes ? <p className="mt-2 whitespace-pre-line">{node.footnotes}</p> : null}
              </PopoverContent>
            </Popover>
          ) : null}
          {calc ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 border-neutral-200 bg-white px-2 text-[11px] font-medium text-neutral-700 shadow-none"
                  data-testid={`calculator-${node.id}`}
                >
                  <Calculator className="mr-1 h-3 w-3" />
                  Calculator
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 text-[12px] text-neutral-700">
                {calc}
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
        <button
          type="button"
          className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800"
          onClick={onToggleNote}
          data-testid={`notes-toggle-${node.id}`}
        >
          {noteOpen ? 'Hide note' : 'Show notes'}
        </button>
      </div>
      {noteOpen ? (
        <Textarea
          className="mt-2 min-h-[72px] text-[12px]"
          placeholder="Add a note for this criterion"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          data-testid={`note-${node.id}`}
        />
      ) : null}
    </div>
  )
}

function ChecklistBox({
  node,
  inactive,
  onToggle,
}: {
  node: CriteriaNode
  inactive: boolean
  onToggle: (id: number, clicked: 'YES' | 'MAYBE') => void
}) {
  return (
    <div className="mx-4 mb-4 rounded-lg bg-neutral-100/80 p-3" data-testid={`checklist-${node.id}`}>
      <p className="mb-2 text-[11px] text-neutral-400">{checklistInstruction(node)}</p>
      <div className="space-y-1">
        {node.children.map((child) => {
          const yes = child.attempt_state === 'YES'
          const maybe = child.attempt_state === 'MAYBE'
          return (
            <div
              key={child.id}
              data-testid={`option-${child.id}`}
              className={cn(
                'flex items-center gap-3 rounded-md border px-3 py-2',
                yes
                  ? 'border-blue-200 bg-blue-50/70'
                  : maybe
                    ? 'border-amber-200 bg-amber-50/70'
                    : 'border-transparent bg-white',
                inactive && !child.selectable && 'opacity-50',
              )}
            >
              <AttemptToggle
                state={child.attempt_state}
                mandatory={child.mandatory}
                disabled={inactive && !child.selectable}
                onChange={(clicked) => onToggle(child.id, clicked)}
              />
              <p className="min-w-0 flex-1 text-[12px] text-neutral-800">{displayTitle(child)}</p>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  yes
                    ? 'bg-blue-600 text-white'
                    : maybe
                      ? 'bg-amber-500 text-white'
                      : 'bg-neutral-100 text-neutral-500',
                )}
              >
                {pointsLabel(child.max_points || 1)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SelectedCriterionHeader({ node }: { node: CriteriaNode }) {
  return (
    <div
      className="mb-4 flex items-start justify-between gap-4 border-b border-neutral-100 pb-4"
      data-testid="selected-criterion-header"
    >
      <div>
        <h2 className="text-[16px] font-semibold text-neutral-900">
          {displayCode(node.criteria_id, 0)}{' '}
          {displayCode(node.criteria_id, 0)} {displayTitle(node)}
        </h2>
        <p className="mt-1 text-[12px] text-neutral-500">{aimText(node)}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">
          {node.points_maybe} Maybe
        </span>
        <span className="rounded-md bg-blue-100 px-2 py-1 text-[11px] font-medium text-blue-700">
          {node.points_attempted} Yes
        </span>
        <span className="rounded-md bg-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-700">
          {node.max_points} Total
        </span>
      </div>
    </div>
  )
}

