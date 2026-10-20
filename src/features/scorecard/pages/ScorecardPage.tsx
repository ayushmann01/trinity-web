import { useParams } from 'react-router-dom'
import { useGetScorecardQuery, useSaveScorecardMutation } from '@/features/scorecard/api/scorecardApi'
import type { CriterionNode } from '@/features/scorecard/types'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { useState } from 'react'
import { toast } from 'sonner'

type Selection = Record<string, 'YES' | 'NO' | 'MAYBE' | undefined>

function flattenLeaves(nodes: CriterionNode[]): CriterionNode[] {
  const out: CriterionNode[] = []
  const walk = (n: CriterionNode) => {
    if (!n.children?.length) {
      out.push(n)
    } else {
      n.children.forEach(walk)
    }
  }
  nodes.forEach(walk)
  return out
}

function computeSummary(nodes: CriterionNode[], selection: Selection, target?: number) {
  const leaves = flattenLeaves(nodes).filter((n) => n.selectable !== false)
  const total = leaves.reduce((s, n) => s + (n.points ?? 0), 0)
  const attempted = leaves
    .filter((n) => selection[n.id] === 'YES' || (n.mandatory && selection[n.id] !== 'NO'))
    .reduce((s, n) => s + (n.points ?? 0), 0)
  const maybe = leaves
    .filter((n) => selection[n.id] === 'MAYBE')
    .reduce((s, n) => s + (n.points ?? 0), 0)
  const pointsToTarget = Math.max(0, (target ?? 0) - attempted)
  return { total, attempted, maybe, pointsToTarget }
}

export function ScorecardPage() {
  const { projectId = '' } = useParams()
  const { data, isLoading } = useGetScorecardQuery({ projectId }, { skip: !projectId })
  const [save, { isLoading: saving }] = useSaveScorecardMutation()
  const [selection, setSelection] = useState<Selection>({})

  const initialSelection: Selection = {}
  data?.attemptedIds.forEach((id) => (initialSelection[id] = 'YES'))
  data?.maybeIds.forEach((id) => (initialSelection[id] = 'MAYBE'))

  const effectiveSelection: Selection = { ...initialSelection, ...selection }
  const summary = computeSummary(
    data?.criteriaTree ?? [],
    effectiveSelection,
    data?.summary?.pointsToTarget ? data.summary.totalPoints : undefined,
  )

  const onChange = (id: string, next: 'YES' | 'NO' | 'MAYBE') => {
    setSelection((s) => ({ ...s, [id]: next }))
  }

  const onSave = async () => {
    try {
      const attemptedIds = Object.entries(effectiveSelection)
        .filter(([, v]) => v === 'YES')
        .map(([k]) => k)
      const maybeIds = Object.entries(effectiveSelection)
        .filter(([, v]) => v === 'MAYBE')
        .map(([k]) => k)
      await save({ projectId, attemptedIds, maybeIds }).unwrap()
      toast.success('Scorecard saved')
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message
      toast.error(msg || 'Failed to save')
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Scorecard</h1>
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="rounded-md border p-3 flex items-center gap-4">
        <div>
          <span className="font-medium">Credits Selected:</span>{' '}
          {summary.attempted} / {summary.total}
        </div>
        <Badge variant="secondary">Maybe: {summary.maybe}</Badge>
        <Badge>To Target: {summary.pointsToTarget}</Badge>
        <div className="text-sm text-muted-foreground ml-auto">
          <span className="mr-2">Legend:</span>
          <span className="mr-3">M = Mandatory</span>
          <span>Disabled = Non-selectable</span>
        </div>
      </div>

      <div className="rounded-md border p-3">
        {data?.criteriaTree?.map((node) => (
          <CriterionNodeView
            key={node.id}
            node={node}
            selection={effectiveSelection}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  )
}

function CriterionNodeView({
  node,
  selection,
  onChange,
}: {
  node: CriterionNode
  selection: Selection
  onChange: (id: string, next: 'YES' | 'NO' | 'MAYBE') => void
}) {
  const isLeaf = !node.children?.length
  const disabled = node.selectable === false
  const current = selection[node.id]
  return (
    <div className="pl-2">
      <div className="flex items-center gap-3 py-1">
        <div className="min-w-[24px] text-xs text-muted-foreground">{node.code ?? ''}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{node.label}</span>
            {node.mandatory && <Badge variant="outline">M</Badge>}
            {node.points != null && (
              <span className="text-xs text-muted-foreground">{node.points} pts</span>
            )}
          </div>
        </div>
        {isLeaf && (
          <div className="flex gap-2">
            <ToggleButton
              active={current === 'YES'}
              onClick={() => onChange(node.id, 'YES')}
              disabled={disabled}
            >
              Yes
            </ToggleButton>
            <ToggleButton
              active={current === 'MAYBE'}
              onClick={() => onChange(node.id, 'MAYBE')}
              disabled={disabled}
            >
              Maybe
            </ToggleButton>
            <ToggleButton
              active={current === 'NO' || current == null}
              onClick={() => onChange(node.id, 'NO')}
              disabled={disabled}
            >
              No
            </ToggleButton>
          </div>
        )}
      </div>
      {node.children?.length ? (
        <div className="border-l ml-3 pl-3">
          {node.children.map((c) => (
            <CriterionNodeView key={c.id} node={c} selection={selection} onChange={onChange} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ToggleButton({
  active,
  children,
  onClick,
  disabled,
}: {
  active?: boolean
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'text-xs rounded-md px-2 py-1 border',
        active ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
