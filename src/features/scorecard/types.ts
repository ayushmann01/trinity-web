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

export type CriteriaState = 'ROOT' | 'BRANCH' | 'NODE' | 'SUB_ROOT' | 'SUB_NODE'

export type CriteriaRecord = {
  id: number
  parent_id: number
  criteria_id: string | null
  title: string | null
  description: string | null
  max_points: number
  criteria_status: string
  pr_stakeholder_id: number | null
  sc_stakeholder_id: number | null
  tr_stakeholder_id: number | null
  references: string | null
  criteria_category: string
  section: string | null
  typology: string | null
  criteria_state: string | null
  footnotes: string | null
  rules: Record<string, number> | null
}

export type CriteriaNode = {
  id: number
  parent_id: number
  criteria_id: string | null
  title: string | null
  description: string | null
  section: string | null
  max_points: number
  points_attempted: number
  points_maybe: number
  criteria_status: string
  criteria_category: string
  criteria_state: string | null
  typology: string | null
  footnotes: string | null
  references: string | null
  rules: Record<string, number> | null
  mandatory: boolean
  selectable: boolean
  attempted: boolean
  attempt_state: AttemptState
  pr_stakeholder_id: number | null
  sc_stakeholder_id: number | null
  tr_stakeholder_id: number | null
  children: CriteriaNode[]
}

export type CriteriaSummary = {
  points_attempted: number
  points_maybe: number
  points_available: number
  target_min_pts: number | null
  target_max_pts: number | null
  points_to_target: number
}

export type ScorecardCertificationMeta = {
  certification_id?: string
  version_id?: string
  category_id?: string
  certification_title?: string
  certification_version?: string
  certification_category?: string
  typology?: string
  certification_target?: string
  min_pts?: number
  max_pts?: number
}

export type ProjectCriteriaResponse = {
  certification?: ScorecardCertificationMeta
  summary?: CriteriaSummary
  criteria?: CriteriaNode[]
  attempted_ids?: number[]
  maybe_ids?: number[]
}

export type ScorecardThreshold = {
  id: string
  label: string
  points: number
}

export type ProjectScorecardDraft = {
  attemptedIds: number[]
  maybeIds: number[]
  notes: Record<string, string>
  summary: {
    pointsAttempted: number
    pointsMaybe: number
    pointsAvailable: number
  }
}
