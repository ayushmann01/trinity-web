import type { ProjectScorecardDraft } from '@/features/scorecard/types'

export const emptyProjectScorecard: ProjectScorecardDraft = {
  attemptedIds: [],
  maybeIds: [],
  notes: {},
  summary: {
    pointsAttempted: 0,
    pointsMaybe: 0,
    pointsAvailable: 0,
  },
}

export function cloneScorecard(
  value: ProjectScorecardDraft = emptyProjectScorecard,
): ProjectScorecardDraft {
  return {
    attemptedIds: [...(value.attemptedIds ?? [])],
    maybeIds: [...(value.maybeIds ?? [])],
    notes: { ...(value.notes ?? {}) },
    summary: {
      pointsAttempted: value.summary?.pointsAttempted ?? 0,
      pointsMaybe: value.summary?.pointsMaybe ?? 0,
      pointsAvailable: value.summary?.pointsAvailable ?? 0,
    },
  }
}
