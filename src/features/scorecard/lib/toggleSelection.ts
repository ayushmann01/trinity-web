import type { AttemptState, CriteriaRecord } from '@/features/scorecard/types'
import {
  childMap,
  collectSubtreeIds,
  isMandatoryLeaf,
  isSelectable,
  normalizeCriteriaState,
} from '@/features/scorecard/lib/criteriaTree'

export function toggleAttemptState(
  rows: CriteriaRecord[],
  attemptedIds: number[],
  maybeIds: number[],
  targetId: number,
  next: AttemptState,
): { attemptedIds: number[]; maybeIds: number[] } {
  const byId = new Map(rows.map((row) => [row.id, row]))
  const children = childMap(rows)
  const row = byId.get(targetId)
  if (!row) return { attemptedIds: [...attemptedIds], maybeIds: [...maybeIds] }
  if (isMandatoryLeaf(row, children)) {
    return { attemptedIds: [...attemptedIds], maybeIds: [...maybeIds] }
  }
  if (next !== 'NO' && !isSelectable(row, children)) {
    return { attemptedIds: [...attemptedIds], maybeIds: [...maybeIds] }
  }

  const yes = new Set(attemptedIds)
  const maybe = new Set(maybeIds)
  yes.delete(targetId)
  maybe.delete(targetId)

  if (next === 'YES' || next === 'MAYBE') {
    let current = row
    while (current.parent_id !== current.id) {
      const parent = byId.get(current.parent_id)
      if (!parent) break
      if (normalizeCriteriaState(parent.criteria_state) === 'BRANCH') {
        for (const sibling of children.get(parent.id) ?? []) {
          if (sibling.id === current.id) continue
          for (const id of collectSubtreeIds(sibling.id, children)) {
            yes.delete(id)
            maybe.delete(id)
          }
        }
      }
      current = parent
    }
    if (next === 'YES') yes.add(targetId)
    else maybe.add(targetId)
  }

  return { attemptedIds: [...yes], maybeIds: [...maybe] }
}

export function nextAttemptState(current: AttemptState, clicked: 'YES' | 'MAYBE'): AttemptState {
  return current === clicked ? 'NO' : clicked
}
