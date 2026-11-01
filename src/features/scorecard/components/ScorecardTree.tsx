import type { ReactNode } from 'react'
import { Calculator, Paperclip } from 'lucide-react'
import { AttemptToggle, ScoreBoxes } from '@/features/scorecard/components/AttemptToggle'
import {
  aimText,
  calculatorCopy,
  checklistInstruction,
  chipCode,
  displayCode,
  displayTitle,
  isChecklistParent,
  pointsLabel,
} from '@/features/scorecard/lib/formatCriteria'
import { cn } from '@/shared/lib/utils'
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
    <div className="space-y-3" data-testid="scorecard-tree">
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
      className={cn(inactive && 'opacity-60')}
    >
      <CriterionHeader node={node} depth={depth} leafToggle={leafToggle} inactive={inactive} onToggle={props.onToggle} />
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
        <TreeBranch>
          {node.children.map((child) => (
            <TreeNode key={child.id}>
              <NestedCriterion node={child} depth={depth + 1} {...props} />
            </TreeNode>
          ))}
        </TreeBranch>
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
      className={cn(inactive && 'opacity-50')}
    >
      <CriterionHeader node={node} depth={depth} leafToggle={leafToggle} inactive={inactive} onToggle={props.onToggle} />
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
        <TreeBranch>
          {node.children.map((child) => (
            <TreeNode key={child.id}>
              <NestedCriterion node={child} depth={depth + 1} {...props} />
            </TreeNode>
          ))}
        </TreeBranch>
      ) : null}
    </div>
  )
}

function CriterionHeader({
  node,
  depth,
  leafToggle,
  inactive,
  onToggle,
}: {
  node: CriteriaNode
  depth: number
  leafToggle: boolean
  inactive: boolean
  onToggle: (id: number, clicked: 'YES' | 'MAYBE') => void
}) {
  return (
    <header className="flex items-start gap-2.5 py-2">
      <CodeBadge code={chipCode(node.criteria_id) || displayCode(node.criteria_id, depth)} />
      {leafToggle ? (
        <AttemptToggle
          state={node.attempt_state}
          mandatory={node.mandatory}
          disabled={inactive && !node.selectable}
          onChange={(clicked) => onToggle(node.id, clicked)}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[13px] font-medium leading-5 text-neutral-900">{displayTitle(node)}</h3>
          {node.mandatory ? <MandatoryPill /> : null}
        </div>
        {node.description ? (
          <p className="mt-1 whitespace-pre-line text-[12px] leading-5 text-neutral-500">
            {node.description}
          </p>
        ) : null}
      </div>
      <ScoreBoxes maybe={node.points_maybe} yes={node.points_attempted} max={node.max_points} />
    </header>
  )
}

function MandatoryPill() {
  return (
    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-violet-600">
      Mandatory
    </span>
  )
}

function CodeBadge({ code }: { code: string }) {
  if (!code) return null
  return (
    <span className="mt-0.5 inline-flex h-[22px] min-w-[34px] shrink-0 items-center justify-center rounded-md bg-neutral-900 px-1.5 text-[10px] font-semibold text-white">
      {code}
    </span>
  )
}

function ActionLink({
  children,
  onClick,
  disabled,
  testId,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  testId?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-800',
        disabled && 'cursor-default opacity-70 hover:text-neutral-500',
      )}
    >
      {children}
    </button>
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
    <div className="pb-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <ActionLink testId={`references-${node.id}`}>
                <Paperclip className="h-3 w-3" />
                References
              </ActionLink>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 text-[12px] text-neutral-700">
              {hasRefs ? (
                <>
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
                </>
              ) : (
                <p>No references for this criterion.</p>
              )}
            </PopoverContent>
          </Popover>
          {calc ? (
            <Popover>
              <PopoverTrigger asChild>
                <ActionLink testId={`calculator-${node.id}`}>
                  <Calculator className="h-3 w-3" />
                  Calculator
                </ActionLink>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 text-[12px] text-neutral-700">{calc}</PopoverContent>
            </Popover>
          ) : (
            <ActionLink testId={`calculator-${node.id}`} disabled>
              <Calculator className="h-3 w-3" />
              Calculator
            </ActionLink>
          )}
        </div>
        <ActionLink testId={`notes-toggle-${node.id}`} onClick={onToggleNote}>
          {noteOpen ? 'Hide note' : 'Show notes'}
        </ActionLink>
      </div>
      {noteOpen ? (
        <Textarea
          className="mt-2 min-h-[72px] border-neutral-200 text-[12px] shadow-none"
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
    <div
      className="mb-1 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5"
      data-testid={`checklist-${node.id}`}
    >
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
                'flex items-center gap-3 rounded-md px-3 py-2',
                yes ? 'bg-blue-50/70' : maybe ? 'bg-orange-50/70' : 'bg-white',
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
                  'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium',
                  yes
                    ? 'bg-blue-600 text-white'
                    : maybe
                      ? 'bg-orange-500 text-white'
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

function TreeBranch({ children }: { children: ReactNode }) {
  return <ul className="relative ml-5 border-l border-neutral-200 pl-5 pb-2">{children}</ul>
}

function TreeNode({ children }: { children: ReactNode }) {
  return (
    <li className="relative pb-3 last:pb-0">
      <span className="absolute -left-5 top-5 h-px w-5 bg-neutral-200" />
      {children}
    </li>
  )
}

export function SelectedCriterionHeader({ node }: { node: CriteriaNode }) {
  return (
    <div
      className="mb-1 flex items-start justify-between gap-4 pb-4"
      data-testid="selected-criterion-header"
    >
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
          {displayCode(node.criteria_id, 0)} {displayTitle(node)}
        </h2>
        <p className="mt-1 text-[12px] leading-5 text-neutral-500">{aimText(node)}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="rounded-md bg-orange-100 px-2 py-1 text-[11px] font-medium text-orange-600">
          {node.points_maybe} maybe
        </span>
        <span className="rounded-md bg-blue-100 px-2 py-1 text-[11px] font-medium text-blue-600">
          {node.points_attempted} yes
        </span>
        <span className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-500">
          {node.max_points} target
        </span>
      </div>
    </div>
  )
}
