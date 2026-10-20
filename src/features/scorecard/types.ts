export type CriterionNode = {
  id: string
  code?: string
  label: string
  points?: number
  selectable?: boolean
  mandatory?: boolean
  children?: CriterionNode[]
}

export type AttemptState = 'YES' | 'NO' | 'MAYBE'

export type Scorecard = {
  criteriaTree: CriterionNode[]
  attemptedIds: string[]
  maybeIds: string[]
  summary: {
    pointsAttempted: number
    pointsMaybe: number
    pointsToTarget: number
    totalPoints?: number
  }
}
