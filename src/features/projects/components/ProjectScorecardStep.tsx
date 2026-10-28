import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux'
import { persistProjectDraft } from '@/features/projects/state/projectDraftSlice'
import { cloneScorecard, emptyProjectScorecard } from '@/features/projects/schemas/projectScorecard'
import { emptyProjectCertification } from '@/features/projects/schemas/projectCertification'
import { DEFAULT_CERT_DISPLAY_NAME } from '@/features/projects/lib/certificationCatalog'
import {
  useGetProjectCriteriaQuery,
  useSaveProjectCriteriaMutation,
} from '@/features/scorecard/api/scorecardApi'
import { ScorecardSummaryBar } from '@/features/scorecard/components/ScorecardSummaryBar'
import { ScorecardCriteriaNav } from '@/features/scorecard/components/ScorecardCriteriaNav'
import {
  ScorecardTree,
  SelectedCriterionHeader,
} from '@/features/scorecard/components/ScorecardTree'
import {
  buildScorecard,
  childMap,
  effectiveAttemptSets,
  isMandatoryLeaf,
  isPathAllowed,
} from '@/features/scorecard/lib/criteriaTree'
import { resolveCriteriaRows } from '@/features/scorecard/lib/loadScorecard'
import { nextAttemptState, toggleAttemptState } from '@/features/scorecard/lib/toggleSelection'
import {
  CERTIFICATION_SCALE,
  activeThresholdId,
  targetPointsForRating,
} from '@/features/scorecard/lib/thresholds'
import { countLeaves } from '@/features/scorecard/lib/countLeaves'
import type { AttemptState, CriteriaNode, ProjectScorecardDraft } from '@/features/scorecard/types'

const SCORECARD_SUBTITLE =
  'Build your credit plan, one criterion at a time. Build your credit plan, one criterion at a time.'

type ProjectScorecardStepProps = {
  onBack: () => void
  onNext: (scorecard: ProjectScorecardDraft) => void
  onSaveDraft: (scorecard: ProjectScorecardDraft) => void
  certificationName?: string
}

export function ProjectScorecardStep({
  onBack,
  onNext,
  onSaveDraft,
  certificationName,
}: ProjectScorecardStepProps) {
  const dispatch = useAppDispatch()
  const draft = useAppSelector((state) => state.projectDraft)
  const certification = draft.certification ?? emptyProjectCertification
  const stored = draft.scorecard ?? emptyProjectScorecard
  const projectId = draft.project.id
  const { data: apiPayload } = useGetProjectCriteriaQuery(
    { projectId: String(projectId) },
    { skip: !projectId },
  )
  const [saveCriteria] = useSaveProjectCriteriaMutation()

  const rows = useMemo(
    () =>
      resolveCriteriaRows({
        apiPayload,
        certificationId: certification.certificationId,
        typologyId: certification.typologyId,
      }),
    [apiPayload, certification.certificationId, certification.typologyId],
  )

  const attemptedIds = stored.attemptedIds
  const maybeIds = stored.maybeIds
  const notes = stored.notes
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [collapsed, setCollapsed] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const targetMin = targetPointsForRating(
    certification.targetRatingId,
    apiPayload?.certification?.min_pts ?? apiPayload?.summary?.target_min_pts ?? 25,
  )

  const scored = useMemo(
    () =>
      buildScorecard({
        rows,
        projectTypology: null,
        attemptedYesIds: attemptedIds,
        maybeIds,
        targetMinPts: targetMin,
        targetMaxPts: apiPayload?.certification?.max_pts ?? apiPayload?.summary?.target_max_pts ?? 100,
      }),
    [rows, attemptedIds, maybeIds, targetMin, apiPayload],
  )

  const selected = scored.criteria.find((item) => item.id === selectedId) ?? scored.criteria[0] ?? null

  const children = useMemo(() => childMap(rows), [rows])
  const attempts = useMemo(
    () => effectiveAttemptSets(rows, attemptedIds, maybeIds),
    [rows, attemptedIds, maybeIds],
  )

  const isInactive = (node: CriteriaNode) => {
    const record = rows.find((row) => row.id === node.id)
    if (!record) return false
    const userAttempts = new Set([...attempts.yes, ...attempts.maybe])
    if (isMandatoryLeaf(record, children)) return !isPathAllowed(record, rows, userAttempts)
    return false
  }

  const persistScorecard = (next: {
    attemptedIds?: number[]
    maybeIds?: number[]
    notes?: Record<string, string>
  } = {}) => {
    const nextAttempted = next.attemptedIds ?? attemptedIds
    const nextMaybe = next.maybeIds ?? maybeIds
    const nextNotes = next.notes ?? notes
    const nextScored = buildScorecard({
      rows,
      projectTypology: null,
      attemptedYesIds: nextAttempted,
      maybeIds: nextMaybe,
      targetMinPts: targetMin,
      targetMaxPts: 100,
    })
    const payload = cloneScorecard({
      attemptedIds: nextAttempted,
      maybeIds: nextMaybe,
      notes: nextNotes,
      summary: {
        pointsAttempted: nextScored.summary.points_attempted,
        pointsMaybe: nextScored.summary.points_maybe,
        pointsAvailable: nextScored.summary.points_available,
      },
    })
    dispatch(persistProjectDraft({ scorecard: payload }))
    return payload
  }

  const handleToggle = (id: number, clicked: 'YES' | 'MAYBE') => {
    const current: AttemptState = attempts.yes.has(id) ? 'YES' : attempts.maybe.has(id) ? 'MAYBE' : 'NO'
    const next = toggleAttemptState(rows, attemptedIds, maybeIds, id, nextAttemptState(current, clicked))
    persistScorecard(next)
  }

  const handleNoteChange = (id: number, note: string) => {
    persistScorecard({ notes: { ...notes, [String(id)]: note } })
  }

  const currentDraft = (): ProjectScorecardDraft =>
    cloneScorecard({
      attemptedIds,
      maybeIds,
      notes,
      summary: {
        pointsAttempted: scored.summary.points_attempted,
        pointsMaybe: scored.summary.points_maybe,
        pointsAvailable: scored.summary.points_available,
      },
    })

  const handleSelect = (id: number) => {
    setSelectedId(id)
    document.getElementById(`criterion-${id}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  const handleSave = async () => {
    const payload = persistScorecard()
    if (projectId) {
      try {
        await saveCriteria({
          projectId: String(projectId),
          attemptedIds: payload.attemptedIds,
          maybeIds: payload.maybeIds,
        }).unwrap()
      } catch {
        toast.error('Could not save scorecard to the server. Draft kept locally.')
      }
    }
    onSaveDraft(payload)
  }

  const leafCounts = countLeaves(scored.criteria, attempts.yes)

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="scorecard-step">
      <h1 className="sr-only">Scorecard</h1>
      <ScorecardSummaryBar
        certificationName={certificationName || DEFAULT_CERT_DISPLAY_NAME}
        subtitle={SCORECARD_SUBTITLE}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        yesPoints={scored.summary.points_attempted}
        maybePoints={scored.summary.points_maybe}
        totalPoints={CERTIFICATION_SCALE}
        activeThresholdId={activeThresholdId(certification.targetRatingId)}
      />
      <div className="flex min-h-0 flex-1">
        <ScorecardCriteriaNav
          criteria={scored.criteria}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
          attemptedCount={leafCounts.attempted}
          totalCount={leafCounts.total}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 px-6 pt-5">
            {selected ? <SelectedCriterionHeader node={selected} /> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">
          <ScorecardTree
            criteria={scored.criteria}
            notes={notes}
            expandedNotes={expandedNotes}
            onToggle={handleToggle}
            onNoteChange={handleNoteChange}
            onToggleNote={(id) => {
              setExpandedNotes((current) => {
                const next = new Set(current)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }}
            isInactive={isInactive}
            selectedId={selected?.id ?? null}
          />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-neutral-200 bg-white px-6 py-4">
        <Button
          type="button"
          variant="outline"
          className="h-9 border-neutral-200 bg-white text-[13px] font-medium text-neutral-800 shadow-none"
          onClick={() => {
            persistScorecard()
            onBack()
          }}
          data-testid="scorecard-back"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to certification
        </Button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-[12px] text-neutral-500 hover:text-neutral-800"
            onClick={() => {
              void handleSave()
            }}
            data-testid="scorecard-save-draft"
          >
            Save your selections as a draft
          </button>
          <Button
            type="button"
            className="h-9 bg-blue-600 px-4 text-[13px] font-medium text-white hover:bg-blue-700"
            onClick={() => onNext(currentDraft())}
            data-testid="scorecard-next"
          >
            Next: Timeline
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
