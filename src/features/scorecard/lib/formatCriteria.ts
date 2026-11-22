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
