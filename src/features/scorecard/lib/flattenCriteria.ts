import type {
  CriteriaNode,
  CriteriaRecord,
  ProjectCriteriaResponse,
} from '@/features/scorecard/types'

type NestedCriteria = Partial<CriteriaNode> & {
  children?: NestedCriteria[] | null
  attempted?: boolean
  attempt_state?: string
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return fallback
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asRules(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const parsed: Record<string, number> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const numberValue = asNumber(raw, Number.NaN)
    if (Number.isInteger(numberValue)) parsed[key] = numberValue
  }
  return Object.keys(parsed).length > 0 ? parsed : null
}

export function recordFromNode(node: NestedCriteria, fallbackParentId?: number): CriteriaRecord {
  const id = asNumber(node.id)
  const parentId = asNumber(node.parent_id, fallbackParentId ?? id)
  return {
    id,
    parent_id: parentId || id,
    criteria_id: asNullableString(node.criteria_id),
    title: asNullableString(node.title),
    description: asNullableString(node.description),
    max_points: asNumber(node.max_points),
    criteria_status: asNullableString(node.criteria_status) ?? 'MAXIMUM',
    pr_stakeholder_id: node.pr_stakeholder_id ?? null,
    sc_stakeholder_id: node.sc_stakeholder_id ?? null,
    tr_stakeholder_id: node.tr_stakeholder_id ?? null,
    references: asNullableString(node.references),
    criteria_category: asNullableString(node.criteria_category) ?? 'CRITERIA',
    section: asNullableString(node.section),
    typology: asNullableString(node.typology),
    criteria_state: asNullableString(node.criteria_state),
    footnotes: asNullableString(node.footnotes),
    rules: asRules(node.rules),
  }
}

export function flattenCriteriaTree(
  nodes: NestedCriteria[] | null | undefined,
  parentId?: number,
): CriteriaRecord[] {
  const rows: CriteriaRecord[] = []

  const walk = (node: NestedCriteria, inheritedParent?: number) => {
    const record = recordFromNode(node, inheritedParent)
    rows.push(record)
    for (const child of node.children ?? []) {
      walk(child, record.id)
    }
  }

  for (const node of nodes ?? []) {
    walk(node, parentId)
  }
  return rows
}

export function collectAttemptIdsFromTree(nodes: NestedCriteria[] | null | undefined): {
  attemptedIds: number[]
  maybeIds: number[]
} {
  const attemptedIds: number[] = []
  const maybeIds: number[] = []

  const walk = (node: NestedCriteria) => {
    const id = asNumber(node.id, Number.NaN)
    if (Number.isInteger(id)) {
      const state = String(node.attempt_state ?? '').toUpperCase()
      if (state === 'YES' || node.attempted === true) attemptedIds.push(id)
      else if (state === 'MAYBE') maybeIds.push(id)
    }
    for (const child of node.children ?? []) walk(child)
  }

  for (const node of nodes ?? []) walk(node)
  return { attemptedIds, maybeIds }
}

export function normalizeCriteriaPayload(payload: ProjectCriteriaResponse | null | undefined): {
  rows: CriteriaRecord[]
  attemptedIds: number[]
  maybeIds: number[]
  certification: ProjectCriteriaResponse['certification']
  summary: ProjectCriteriaResponse['summary']
} {
  const criteria = payload?.criteria ?? []
  const fromTree = collectAttemptIdsFromTree(criteria)
  return {
    rows: flattenCriteriaTree(criteria),
    attemptedIds: payload?.attempted_ids ?? fromTree.attemptedIds,
    maybeIds: payload?.maybe_ids ?? fromTree.maybeIds,
    certification: payload?.certification,
    summary: payload?.summary,
  }
}
