import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux'
import { persistProjectDraft } from '@/features/projects/state/projectDraftSlice'
import { cloneScorecard, emptyProjectScorecard } from '@/features/projects/schemas/projectScorecard'
import { emptyProjectCertification } from '@/features/projects/schemas/projectCertification'
import { useListCertificationsQuery } from '@/features/projects/api/projectsApi'
import { scorecardCertificationName } from '@/features/projects/lib/certificationCatalog'
import {
  useGetCriteriaCatalogQuery,
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
import {
  criteriaCatalogQueryArgs,
  resolveCriteriaRows,
} from '@/features/scorecard/lib/mapCriteriaCatalog'
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
  const catalogArgs = criteriaCatalogQueryArgs(certification)
  const skipCatalog = Boolean(projectId) || !catalogArgs
  const { data: certifications } = useListCertificationsQuery()
  const catalogQuery = useGetCriteriaCatalogQuery(catalogArgs ?? { certificationId: '', versionId: '' }, {
    skip: skipCatalog,
  })
  const projectQuery = useGetProjectCriteriaQuery(
    { projectId: String(projectId) },
    { skip: !projectId },
  )
  const [saveCriteria] = useSaveProjectCriteriaMutation()

  const activeQuery = projectId ? projectQuery : catalogQuery
  const apiPayload = activeQuery.data
  const hasCriteriaRequest = Boolean(projectId) || Boolean(catalogArgs)
  const isLoading = hasCriteriaRequest ? activeQuery.isLoading : false
  const isError = hasCriteriaRequest ? activeQuery.isError : false

  const rows = useMemo(() => resolveCriteriaRows(apiPayload), [apiPayload])

  const attemptedIds = stored.attemptedIds
  const maybeIds = stored.maybeIds
  const notes = stored.notes
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [collapsed, setCollapsed] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const displayName = scorecardCertificationName(
    certifications,
    certification.certificationId,
    certificationName,
  )

  const targetMin = targetPointsForRating(
    certification.targetRatingId,
    apiPayload?.certification?.min_pts ?? apiPayload?.summary?.target_min_pts ?? 25,
  )

  const projectTypology = certification.typologyId.trim() || null

  const scored = useMemo(
    () =>
      buildScorecard({
        rows,
        projectTypology,
        attemptedYesIds: attemptedIds,
        maybeIds,
        targetMinPts: targetMin,
        targetMaxPts: apiPayload?.certification?.max_pts ?? apiPayload?.summary?.target_max_pts ?? 100,
      }),
    [rows, projectTypology, attemptedIds, maybeIds, targetMin, apiPayload],
  )

  const preferredId =
    scored.criteria.find((item) => (item.title ?? '').toLowerCase().includes('passive design'))?.id ??
    null
  const selected =
    scored.criteria.find((item) => item.id === (selectedId ?? preferredId)) ??
    scored.criteria[0] ??
    null

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
      projectTypology,
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
  const treeStatus = isLoading
    ? 'Loading criteria…'
    : isError
      ? 'Could not load criteria for this certification.'
      : rows.length === 0
        ? 'No criteria for this certification.'
        : null

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="scorecard-step">
      <h1 className="sr-only">Scorecard</h1>
      <ScorecardSummaryBar
        certificationName={displayName}
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
            {!treeStatus && selected ? <SelectedCriterionHeader node={selected} /> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">
            {treeStatus ? (
              <p className="py-8 text-[13px] text-neutral-500" data-testid="scorecard-tree-status">
                {treeStatus}
              </p>
            ) : (
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
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-neutral-200 bg-white px-6 py-3.5">
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-md border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-800 shadow-none hover:bg-neutral-50"
          onClick={() => {
            persistScorecard()
            onBack()
          }}
          data-testid="scorecard-back"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to certification
        </Button>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-[12px] font-medium text-neutral-500 hover:text-neutral-800"
            onClick={() => {
              void handleSave()
            }}
            data-testid="scorecard-save-draft"
          >
            Save your selections as a draft
          </button>
          <Button
            type="button"
            className="h-9 rounded-md bg-blue-600 px-4 text-[13px] font-medium text-white hover:bg-blue-700"
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
