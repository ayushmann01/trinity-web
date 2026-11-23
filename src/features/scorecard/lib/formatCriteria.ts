import type { CriteriaNode } from '@/features/scorecard/types'
import { countThresholds, criteriaLabel } from '@/features/scorecard/lib/criteriaTree'

/** Raw `criteria_id` from the API node — do not invent P1 / P- prefixes. */
export function displayCode(criteriaId: string | null | undefined, _depth?: number): string {
  void _depth
  return criteriaId?.trim() ?? ''
}

export function chipCode(criteriaId: string | null | undefined): string {
  return displayCode(criteriaId)
}

export function displayTitle(node: Pick<CriteriaNode, 'criteria_id' | 'title' | 'description' | 'id'>): string {
  if (node.title?.trim()) return node.title.trim()
  return criteriaLabel(node)
}

export function formatNavPoints(maybe: number, yes: number, max: number): string {
  if (maybe > 0) return `${maybe} / ${yes} / ${max}`
  return `${yes}/${max}`
}

export function pointsLabel(points: number): string {
  return `${points} pt${points === 1 ? '' : 's'}`
}

export function calculatorCopy(node: CriteriaNode): string | null {
  const thresholds = countThresholds(node.rules)
  if (thresholds.length === 0) return null
  const parts = thresholds
    .sort((a, b) => a.count - b.count)
    .map((item) => `${item.points} point${item.points === 1 ? '' : 's'} for ${item.count} selections`)
  return parts.join(' & ')
}

function collectNonEmptyStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? [trimmed] : []
  }
  if (Array.isArray(value)) return value.flatMap(collectNonEmptyStrings)
  return []
}

export function calculatorIdsOf(
  node: Pick<CriteriaNode, 'calculator_id'> & { calculator_ids?: unknown },
): string[] {
  return [...new Set([...collectNonEmptyStrings(node.calculator_id), ...collectNonEmptyStrings(node.calculator_ids)])]
}

/** True when criteria_data.calculator_id (or calculator_ids) has at least one non-empty id. */
export function hasCalculatorData(
  node: Pick<CriteriaNode, 'calculator_id'> & { calculator_ids?: unknown },
): boolean {
  return calculatorIdsOf(node).length > 0
}

export function referenceItems(value: string | null | undefined): string[] {
  return collectNonEmptyStrings(value?.split(/\n+/))
}

/** True when the API `references` field has a URL or non-empty text — not null / "" / []. */
export function hasCriterionReferences(node: Pick<CriteriaNode, 'references'>): boolean {
  return referenceItems(node.references).length > 0
}

export function checklistInstruction(_node: CriteriaNode): string {
  void _node
  return 'select the criteria with highest benchmark and ? for stretch goal'
}

export function isChecklistParent(node: CriteriaNode): boolean {
  if (node.children.length === 0) return false
  return node.children.every(
    (child) => child.children.length === 0 && !child.criteria_id?.trim(),
  )
}

export function aimText(node: CriteriaNode): string {
  const description = node.description?.trim()
  if (!description) return ''
  if (/^aim:/i.test(description)) return description
  return `Aim: ${description}`
}
