import { describe, expect, it } from 'vitest'
import { selectedRootCriteria } from '@/features/scorecard/components/ScorecardTree'
import type { CriteriaNode } from '@/features/scorecard/types'

function root(id: number, title: string, children: CriteriaNode[] = []): CriteriaNode {
  return {
    id,
    parent_id: id,
    criteria_id: String(id),
    title,
    description: null,
    section: null,
    max_points: 1,
    points_attempted: 0,
    points_maybe: 0,
    criteria_status: 'MAXIMUM',
    criteria_category: 'CRITERIA',
    criteria_state: 'ROOT',
    typology: 'ALL',
    footnotes: null,
    references: null,
    rules: null,
    mandatory: false,
    selectable: false,
    attempted: false,
    attempt_state: 'NO',
    pr_stakeholder_id: null,
    sc_stakeholder_id: null,
    tr_stakeholder_id: null,
    children,
  }
}

describe('selectedRootCriteria', () => {
  const criteria = [
    root(1, 'One', [root(11, '1.1')]),
    root(2, 'Two', [root(21, '2.1.1')]),
  ]

  it('defaults to the first top-level criterion and its descendants', () => {
    expect(selectedRootCriteria(criteria, null).map((node) => node.id)).toEqual([1])
    expect(selectedRootCriteria(criteria, null)[0]?.children.map((node) => node.id)).toEqual([11])
  })

  it('returns only the selected top-level subtree', () => {
    expect(selectedRootCriteria(criteria, 2).map((node) => node.id)).toEqual([2])
    expect(selectedRootCriteria(criteria, 2)[0]?.children.map((node) => node.id)).toEqual([21])
  })

  it('falls back to the first root when the selection is missing', () => {
    expect(selectedRootCriteria(criteria, 99)[0]?.id).toBe(1)
    expect(selectedRootCriteria([], 1)).toEqual([])
  })
})
