import type {
  AttemptState,
  CriteriaNode,
  CriteriaRecord,
  CriteriaState,
  CriteriaSummary,
} from '@/features/scorecard/types'

const CRITERIA_STATE_ALIASES: Record<string, CriteriaState> = {
  ROOT: 'ROOT',
  BRANCH: 'BRANCH',
  NODE: 'NODE',
  SUB_ROOT: 'SUB_ROOT',
  SUBROOT: 'SUB_ROOT',
  SUB_NODE: 'SUB_NODE',
  SUBNODE: 'SUB_NODE',
  NDOE: 'NODE',
}

export function typologyKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

export function normalizeCriteriaState(value: string | null | undefined): CriteriaState | null {
  if (!value?.trim()) return null
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, '_')
  return CRITERIA_STATE_ALIASES[key] ?? null
}

function displayedCriteriaState(value: string | null): string | null {
  return normalizeCriteriaState(value) ?? (value?.trim() ? value.trim() : value)
}

export function typologyApplies(
  criteriaTypology: string | null,
  projectTypology: string | null,
): boolean {
  if (!criteriaTypology?.trim()) return true
  const parts = criteriaTypology
    .split(',')
    .map((part) => typologyKey(part))
    .filter(Boolean)
  if (parts.length === 0 || parts.includes('all')) return true
  if (!projectTypology?.trim()) return false
  return parts.includes(typologyKey(projectTypology))
}

export function applicableCriteria(
  rows: CriteriaRecord[],
  projectTypology: string | null,
): CriteriaRecord[] {
  const allIds = new Set(rows.map((row) => row.id))
  let kept = rows.filter((row) => typologyApplies(row.typology, projectTypology))
  let changed = true

  while (changed) {
    const keptIds = new Set(kept.map((row) => row.id))
    const next = kept.filter((row) => {
      if (row.parent_id === row.id) return true
      if (keptIds.has(row.parent_id)) return true
      return !allIds.has(row.parent_id)
    })
    changed = next.length !== kept.length
    kept = next
  }

  return kept
}

function integerRules(rules: CriteriaRecord['rules']): Record<string, number> | null {
  if (!rules) return null
  const parsed: Record<string, number> = {}
  for (const [key, value] of Object.entries(rules)) {
    if (Number.isInteger(value)) parsed[key] = value
  }
  return Object.keys(parsed).length > 0 ? parsed : null
}

function selectionLimit(
  rules: CriteriaRecord['rules'],
  key: 'max_selections' | 'min_selections',
): number | undefined {
  const value = rules?.[key]
  return Number.isInteger(value) ? value : undefined
}

type CountThreshold = { count: number; points: number }

export function countThresholds(rules: CriteriaRecord['rules']): CountThreshold[] {
  if (!rules) return []
  const thresholds: CountThreshold[] = []
  for (const [key, value] of Object.entries(rules)) {
    if (!Number.isInteger(value)) continue
    const targetPoints = /^target_pt_(\d+)$/.exec(key)
    if (targetPoints) {
      thresholds.push({ count: value, points: Number(targetPoints[1]) })
      continue
    }
    if (/^\d+$/.test(key) && key !== 'max_selections' && key !== 'min_selections') {
      thresholds.push({ count: Number(key), points: value })
    }
  }
  return thresholds
}

function pointsForSelectionCount(row: CriteriaRecord, selectedCount: number): number {
  let awarded = 0
  for (const threshold of countThresholds(row.rules)) {
    if (selectedCount >= threshold.count) awarded = Math.max(awarded, threshold.points)
  }
  return row.max_points > 0 ? Math.min(row.max_points, awarded) : awarded
}

export function criteriaLabel(row: Pick<CriteriaRecord, 'id' | 'criteria_id' | 'title' | 'description'>): string {
  if (row.criteria_id && row.title) return `${row.criteria_id} ${row.title}`
  if (row.title) return row.title
  if (row.criteria_id) return row.criteria_id
  const description = row.description?.trim()
  if (!description) return `criteria ${row.id}`
  return description.length > 80 ? `${description.slice(0, 77)}...` : description
}

function compareCriteria(left: CriteriaRecord, right: CriteriaRecord): number {
  const leftParts = (left.criteria_id ?? '').split('.').filter(Boolean)
  const rightParts = (right.criteria_id ?? '').split('.').filter(Boolean)
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index]
    const rightPart = rightParts[index]
    if (leftPart === undefined) return -1
    if (rightPart === undefined) return 1
    const leftNumber = Number(leftPart)
    const rightNumber = Number(rightPart)
    const bothNumeric = Number.isInteger(leftNumber) && Number.isInteger(rightNumber)
    if (bothNumeric && leftNumber !== rightNumber) return leftNumber - rightNumber
    if (leftPart !== rightPart) return leftPart < rightPart ? -1 : 1
  }

  return left.id - right.id
}

export function childMap(rows: CriteriaRecord[]): Map<number, CriteriaRecord[]> {
  const children = new Map<number, CriteriaRecord[]>()
  for (const row of rows) {
    if (row.parent_id === row.id) continue
    const list = children.get(row.parent_id) ?? []
    list.push(row)
    children.set(row.parent_id, list)
  }
  for (const list of children.values()) list.sort(compareCriteria)
  return children
}

export function isSelectable(row: CriteriaRecord, children: Map<number, CriteriaRecord[]>): boolean {
  return (
    row.id !== row.parent_id &&
    row.criteria_status !== 'MANDATORY' &&
    (children.get(row.id)?.length ?? 0) === 0
  )
}

export function isMandatoryLeaf(row: CriteriaRecord, children: Map<number, CriteriaRecord[]>): boolean {
  return row.criteria_status === 'MANDATORY' && (children.get(row.id)?.length ?? 0) === 0
}

export function collectSubtreeIds(
  rootId: number,
  children: Map<number, CriteriaRecord[]>,
): Set<number> {
  const ids = new Set<number>()
  const visit = (id: number) => {
    ids.add(id)
    for (const kid of children.get(id) ?? []) visit(kid.id)
  }
  visit(rootId)
  return ids
}

function subtreeHasAttempt(
  row: CriteriaRecord,
  children: Map<number, CriteriaRecord[]>,
  attempted: Set<number>,
): boolean {
  if (attempted.has(row.id)) return true
  for (const kid of children.get(row.id) ?? []) {
    if (subtreeHasAttempt(kid, children, attempted)) return true
  }
  return false
}

function activeBranchChildren(
  parent: CriteriaRecord,
  children: Map<number, CriteriaRecord[]>,
  attempted: Set<number>,
): CriteriaRecord[] {
  return (children.get(parent.id) ?? []).filter((kid) => subtreeHasAttempt(kid, children, attempted))
}

export function selectionError(
  rows: CriteriaRecord[],
  attemptedIds: Iterable<number>,
  maybeIds: Iterable<number> = [],
): string | null {
  const applicable = new Map(rows.map((row) => [row.id, row]))
  const children = childMap(rows)
  const attempted = new Set(attemptedIds)
  const maybe = new Set<number>()
  for (const id of maybeIds) if (!attempted.has(id)) maybe.add(id)
  const userAttempts = new Set<number>([...attempted, ...maybe])

  for (const id of userAttempts) {
    const row = applicable.get(id)
    if (!row) return 'Criteria is not applicable to this project'
    if (!isSelectable(row, children)) return `${criteriaLabel(row)} cannot be selected`
  }

  for (const [parentId, kids] of children) {
    const parent = applicable.get(parentId)
    if (!parent) continue
    const selected = kids.filter((kid) => attempted.has(kid.id))
    const maxSelections = selectionLimit(parent.rules, 'max_selections')
    if (maxSelections !== undefined && selected.length > maxSelections) {
      return `Select at most ${maxSelections} options under ${criteriaLabel(parent)}`
    }
    if (parent.max_points > 0 && normalizeCriteriaState(parent.criteria_state) !== 'BRANCH') {
      const selectedPoints = selected.reduce((sum, kid) => sum + kid.max_points, 0)
      if (selectedPoints > parent.max_points) {
        return `Selections under ${criteriaLabel(parent)} exceed its maximum of ${parent.max_points} points`
      }
    }
  }

  for (const parent of rows) {
    if (normalizeCriteriaState(parent.criteria_state) !== 'BRANCH') continue
    const active = activeBranchChildren(parent, children, userAttempts)
    if (active.length > 1) {
      return `Select only one option under ${criteriaLabel(parent)}`
    }
  }

  return null
}

function applyPointCap(
  row: CriteriaRecord,
  yesPts: number,
  maybePts: number,
): { yesPts: number; maybePts: number } {
  if (row.max_points > 0) {
    const cappedYes = Math.min(row.max_points, yesPts)
    const remaining = Math.max(0, row.max_points - cappedYes)
    return { yesPts: cappedYes, maybePts: Math.min(remaining, maybePts) }
  }
  return { yesPts, maybePts }
}

function scoreNode(
  row: CriteriaRecord,
  children: Map<number, CriteriaRecord[]>,
  yes: Set<number>,
  maybe: Set<number>,
  cache: Map<number, { yesPts: number; maybePts: number }>,
): { yesPts: number; maybePts: number } {
  const cached = cache.get(row.id)
  if (cached) return cached

  const kids = children.get(row.id) ?? []
  const state = normalizeCriteriaState(row.criteria_state)
  let result: { yesPts: number; maybePts: number }

  if (kids.length === 0) {
    result = {
      yesPts: yes.has(row.id) ? row.max_points : 0,
      maybePts: !yes.has(row.id) && maybe.has(row.id) ? row.max_points : 0,
    }
  } else if (state === 'BRANCH') {
    const userAttempts = new Set<number>([...yes, ...maybe])
    const active = kids.filter((kid) => subtreeHasAttempt(kid, children, userAttempts))
    const chosen =
      active.find((kid) => subtreeHasAttempt(kid, children, yes)) ?? active[0] ?? null
    result = { yesPts: 0, maybePts: 0 }
    if (chosen) {
      const childScore = scoreNode(chosen, children, yes, maybe, cache)
      result = applyPointCap(row, childScore.yesPts, childScore.maybePts)
    }
    for (const kid of kids) {
      if (!chosen || kid.id !== chosen.id) scoreNode(kid, children, yes, maybe, cache)
    }
  } else if (state === 'SUB_ROOT') {
    let yesCount = 0
    let maybeCount = 0
    for (const kid of kids) {
      scoreNode(kid, children, yes, maybe, cache)
      if (subtreeHasAttempt(kid, children, yes)) yesCount += 1
      else if (subtreeHasAttempt(kid, children, maybe)) maybeCount += 1
    }
    const yesPts = pointsForSelectionCount(row, yesCount)
    const combined = pointsForSelectionCount(row, yesCount + maybeCount)
    result = applyPointCap(row, yesPts, Math.max(0, combined - yesPts))
  } else {
    let sumYes = 0
    let sumMaybe = 0
    for (const kid of kids) {
      const childScore = scoreNode(kid, children, yes, maybe, cache)
      sumYes += childScore.yesPts
      sumMaybe += childScore.maybePts
    }
    result = applyPointCap(row, sumYes, sumMaybe)
  }

  cache.set(row.id, result)
  return result
}

function awardedYes(row: CriteriaRecord, children: Map<number, CriteriaRecord[]>, yes: Set<number>): number {
  return scoreNode(row, children, yes, new Set(), new Map()).yesPts
}

function computePointsYesMaybe(
  rows: CriteriaRecord[],
  yes: Set<number>,
  maybe: Set<number>,
): { yesMap: Map<number, number>; maybeMap: Map<number, number> } {
  const children = childMap(rows)
  const cache = new Map<number, { yesPts: number; maybePts: number }>()
  const yesMap = new Map<number, number>()
  const maybeMap = new Map<number, number>()

  const ids = new Set(rows.map((r) => r.id))
  for (const row of rows) {
    if (row.parent_id === row.id || !ids.has(row.parent_id)) {
      scoreNode(row, children, yes, maybe, cache)
    }
  }
  for (const row of rows) {
    const scored = cache.get(row.id) ?? scoreNode(row, children, yes, maybe, cache)
    yesMap.set(row.id, scored.yesPts)
    maybeMap.set(row.id, scored.maybePts)
  }
  return { yesMap, maybeMap }
}

function deriveAttemptStateFromChildren(childrenStates: AttemptState[]): AttemptState {
  if (childrenStates.some((s) => s === 'YES')) return 'YES'
  if (childrenStates.some((s) => s === 'MAYBE')) return 'MAYBE'
  return 'NO'
}

function nodeAttemptState(
  row: CriteriaRecord,
  children: Map<number, CriteriaRecord[]>,
  yes: Set<number>,
  maybe: Set<number>,
  childStateCache: Map<number, AttemptState>,
): AttemptState {
  const kids = children.get(row.id) ?? []
  if (kids.length === 0) {
    if (yes.has(row.id)) return 'YES'
    if (maybe.has(row.id)) return 'MAYBE'
    return 'NO'
  }
  const childStates: AttemptState[] = []
  for (const kid of kids) {
    const cached = childStateCache.get(kid.id)
    if (cached) {
      childStates.push(cached)
    } else {
      const st = nodeAttemptState(kid, children, yes, maybe, childStateCache)
      childStateCache.set(kid.id, st)
      childStates.push(st)
    }
  }
  return deriveAttemptStateFromChildren(childStates)
}

function toNode(
  row: CriteriaRecord,
  children: Map<number, CriteriaRecord[]>,
  yes: Set<number>,
  maybe: Set<number>,
  yesPts: Map<number, number>,
  maybePts: Map<number, number>,
  stateCache: Map<number, AttemptState>,
): CriteriaNode {
  const kidRows = children.get(row.id) ?? []
  const kids = kidRows.map((kid) => toNode(kid, children, yes, maybe, yesPts, maybePts, stateCache))
  const points = yesPts.get(row.id) ?? awardedYes(row, children, yes)
  const pointsMaybe = maybePts.get(row.id) ?? 0
  const attemptState = nodeAttemptState(row, children, yes, maybe, stateCache)
  return {
    id: row.id,
    parent_id: row.parent_id,
    criteria_id: row.criteria_id,
    title: row.title,
    description: row.description,
    section: row.section,
    max_points: row.max_points,
    points_attempted: points,
    points_maybe: pointsMaybe,
    criteria_status: row.criteria_status,
    criteria_category: row.criteria_category,
    criteria_state: displayedCriteriaState(row.criteria_state),
    typology: row.typology,
    footnotes: row.footnotes,
    references: row.references,
    rules: integerRules(row.rules),
    mandatory: row.criteria_status === 'MANDATORY',
    selectable: isSelectable(row, children),
    attempted: attemptState === 'YES',
    attempt_state: attemptState,
    pr_stakeholder_id: row.pr_stakeholder_id,
    sc_stakeholder_id: row.sc_stakeholder_id,
    tr_stakeholder_id: row.tr_stakeholder_id,
    children: kids,
  }
}

export function isPathAllowed(
  row: CriteriaRecord,
  rows: CriteriaRecord[],
  attemptedIds: Iterable<number>,
): boolean {
  const children = childMap(rows)
  const byId = new Map(rows.map((item) => [item.id, item]))
  const attempted = new Set(attemptedIds)

  function chosenBranchChild(branch: CriteriaRecord): CriteriaRecord | null {
    const active = activeBranchChildren(branch, children, attempted)
    return active.length === 1 ? (active[0] ?? null) : null
  }

  let current = row
  while (current.parent_id !== current.id) {
    const parent = byId.get(current.parent_id)
    if (!parent) return true
    if (normalizeCriteriaState(parent.criteria_state) === 'BRANCH') {
      const chosen = chosenBranchChild(parent)
      if (chosen && chosen.id !== current.id) return false
    }
    current = parent
  }
  return true
}

export function buildScorecard(input: {
  rows: CriteriaRecord[]
  projectTypology: string | null
  attemptedYesIds: Iterable<number>
  maybeIds: Iterable<number>
  targetMinPts: number | null
  targetMaxPts: number | null
}): { criteria: CriteriaNode[]; summary: CriteriaSummary } {
  const applicable = applicableCriteria(input.rows, input.projectTypology)
  const children = childMap(applicable)
  const applicableIds = new Set(applicable.map((row) => row.id))
  const yes = new Set<number>()
  const maybe = new Set<number>()
  for (const id of input.attemptedYesIds) {
    if (applicableIds.has(id)) yes.add(id)
  }
  for (const id of input.maybeIds) {
    if (applicableIds.has(id) && !yes.has(id)) maybe.add(id)
  }
  const defaults = mandatoryDefaultAttempted(applicable, yes)
  for (const id of defaults) {
    yes.add(id)
    maybe.delete(id)
  }
  const { yesMap, maybeMap } = computePointsYesMaybe(applicable, yes, maybe)
  const stateCache = new Map<number, AttemptState>()

  const rootIndex = new Map(applicable.map((row, index) => [row.id, index]))
  const roots = applicable
    .filter((row) => row.parent_id === row.id || !applicableIds.has(row.parent_id))
    .sort((left, right) => (rootIndex.get(left.id) ?? 0) - (rootIndex.get(right.id) ?? 0))
  const criteria = roots.map((row) => toNode(row, children, yes, maybe, yesMap, maybeMap, stateCache))
  const pointsAttempted = criteria.reduce((sum, criterion) => sum + criterion.points_attempted, 0)
  const pointsMaybe = criteria.reduce((sum, criterion) => sum + criterion.points_maybe, 0)
  const pointsAvailable = criteria.reduce((sum, criterion) => sum + criterion.max_points, 0)
  const targetMin = input.targetMinPts

  return {
    criteria,
    summary: {
      points_attempted: pointsAttempted,
      points_maybe: pointsMaybe,
      points_available: pointsAvailable,
      target_min_pts: targetMin,
      target_max_pts: input.targetMaxPts,
      points_to_target: targetMin === null ? 0 : Math.max(0, targetMin - pointsAttempted),
    },
  }
}

export function mandatoryDefaultAttempted(
  rows: CriteriaRecord[],
  attemptedIds: Iterable<number> = [],
): Set<number> {
  const children = childMap(rows)
  const byId = new Map(rows.map((row) => [row.id, row]))
  const attempted = new Set(attemptedIds)

  function chosenBranchChild(branch: CriteriaRecord): CriteriaRecord | null {
    const active = activeBranchChildren(branch, children, attempted)
    return active.length === 1 ? (active[0] ?? null) : null
  }

  function pathAllowed(row: CriteriaRecord): boolean {
    let current = row
    while (current.parent_id !== current.id) {
      const parent = byId.get(current.parent_id)
      if (!parent) return true
      if (normalizeCriteriaState(parent.criteria_state) === 'BRANCH') {
        const chosen = chosenBranchChild(parent)
        if (!chosen || chosen.id !== current.id) return false
      }
      current = parent
    }
    return true
  }

  const defaults = new Set<number>()
  for (const row of rows) {
    const isLeaf = (children.get(row.id)?.length ?? 0) === 0
    if (row.criteria_status === 'MANDATORY' && isLeaf && pathAllowed(row)) defaults.add(row.id)
  }
  return defaults
}

export function effectiveAttemptSets(
  rows: CriteriaRecord[],
  attemptedYesIds: Iterable<number>,
  maybeIds: Iterable<number>,
): { yes: Set<number>; maybe: Set<number> } {
  const ids = new Set(rows.map((row) => row.id))
  const yes = new Set<number>()
  const maybe = new Set<number>()
  for (const id of attemptedYesIds) {
    if (ids.has(id)) yes.add(id)
  }
  for (const id of maybeIds) {
    if (ids.has(id) && !yes.has(id)) maybe.add(id)
  }
  for (const id of mandatoryDefaultAttempted(rows, yes)) {
    yes.add(id)
    maybe.delete(id)
  }
  return { yes, maybe }
}
