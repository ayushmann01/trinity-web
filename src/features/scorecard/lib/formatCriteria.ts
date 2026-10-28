import type { CriteriaNode } from '@/features/scorecard/types'
import { countThresholds, criteriaLabel } from '@/features/scorecard/lib/criteriaTree'

export function displayCode(criteriaId: string | null | undefined, depth: number): string {
  if (!criteriaId?.trim()) return ''
  const raw = criteriaId.trim()
  const stripped = raw.replace(/^P-?/i, '')
  if (depth <= 0) {
    if (/^\d+$/.test(stripped) && Number(stripped) >= 10) return stripped
    return `P${stripped}`
  }
  return `P-${stripped}`
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

export function checklistInstruction(node: CriteriaNode): string {
  if (node.criteria_state === 'BRANCH') {
    return 'select the criteria with against benchmarks and ? for unsure goal'
  }
  return 'select the criteria which applies to your project and ? for unsure goal'
}

export function isChecklistParent(node: CriteriaNode): boolean {
  if (node.children.length === 0) return false
  return node.children.every((child) => child.children.length === 0)
}

export function aimText(node: CriteriaNode): string {
  const description = node.description?.trim()
  if (!description) return ''
  if (/^aim:/i.test(description)) return description
  return `Aim: ${description}`
}
