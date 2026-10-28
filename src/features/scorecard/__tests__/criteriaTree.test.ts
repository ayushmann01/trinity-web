import { describe, expect, it } from 'vitest'
import { materializeCatalog } from '@/features/scorecard/lib/catalogFactory'
import {
  buildScorecard,
  selectionError,
} from '@/features/scorecard/lib/criteriaTree'
import { originalScorecardRows } from '@/features/scorecard/lib/loadScorecard'
import { toggleAttemptState } from '@/features/scorecard/lib/toggleSelection'
import { GRIHA_DESIGN_RECORDS } from '@/features/scorecard/data/grihaDesignCatalog'

function score(
  rows: ReturnType<typeof materializeCatalog>,
  yes: number[] = [],
  maybe: number[] = [],
) {
  return buildScorecard({
    rows,
    projectTypology: null,
    attemptedYesIds: yes,
    maybeIds: maybe,
    targetMinPts: 25,
    targetMaxPts: 100,
  })
}

describe('criteriaTree scoring', () => {
  it('sums ROOT children and caps at parent.max_points', () => {
    const rows = materializeCatalog([
      {
        id: 1,
        criteria_id: '1',
        title: 'Root',
        max_points: 5,
        criteria_state: 'ROOT',
        children: [
          {
            id: 2,
            title: 'A',
            max_points: 4,
            criteria_state: 'NODE',
            criteria_status: 'BINARY',
          },
          {
            id: 3,
            title: 'B',
            max_points: 4,
            criteria_state: 'NODE',
            criteria_status: 'BINARY',
          },
        ],
      },
    ])

    const result = score(rows, [2, 3])
    expect(result.criteria[0]?.points_attempted).toBe(5)
    expect(result.summary.points_attempted).toBe(5)
  })

  it('scores BRANCH as the selected child only and switches alternatives in the UI', () => {
    const rows = materializeCatalog([
      {
        id: 10,
        title: 'Branch',
        max_points: 6,
        criteria_state: 'BRANCH',
        children: [
          {
            id: 11,
            title: 'Two',
            max_points: 2,
            criteria_state: 'NODE',
            criteria_status: 'BINARY',
          },
          {
            id: 12,
            title: 'Four',
            max_points: 4,
            criteria_state: 'NODE',
            criteria_status: 'BINARY',
          },
          {
            id: 13,
            title: 'Six',
            max_points: 6,
            criteria_state: 'NODE',
            criteria_status: 'BINARY',
          },
        ],
      },
    ])

    expect(score(rows, [12]).criteria[0]?.points_attempted).toBe(4)
    expect(selectionError(rows, [11, 12])).toMatch(/Select only one option/)

    const switched = toggleAttemptState(rows, [11], [], 12, 'YES')
    expect(switched.attemptedIds).toEqual([12])
    expect(selectionError(rows, switched.attemptedIds)).toBeNull()
    expect(score(rows, switched.attemptedIds).criteria[0]?.points_attempted).toBe(4)
  })

  it('scores SUB_ROOT by selection count thresholds including maybe remainder', () => {
    const rows = materializeCatalog([
      {
        id: 20,
        title: 'Meters',
        max_points: 3,
        criteria_state: 'SUB_ROOT',
        rules: { target_pt_1: 2, target_pt_2: 3 },
        children: [
          { id: 21, title: 'A', max_points: 1, criteria_state: 'SUB_NODE', criteria_status: 'BINARY' },
          { id: 22, title: 'B', max_points: 1, criteria_state: 'SUB_NODE', criteria_status: 'BINARY' },
          { id: 23, title: 'C', max_points: 1, criteria_state: 'SUB_NODE', criteria_status: 'BINARY' },
        ],
      },
    ])

    const twoYes = score(rows, [21, 22])
    expect(twoYes.criteria[0]?.points_attempted).toBe(1)

    const twoYesOneMaybe = score(rows, [21, 22], [23])
    expect(twoYesOneMaybe.criteria[0]?.points_attempted).toBe(1)
    expect(twoYesOneMaybe.criteria[0]?.points_maybe).toBe(1)
  })

  it('auto-attempts mandatory leaves unless they sit in an unchosen BRANCH alternative', () => {
    const rows = materializeCatalog([
      {
        id: 30,
        title: 'Choice',
        max_points: 2,
        criteria_state: 'BRANCH',
        children: [
          {
            id: 31,
            title: 'Alt A',
            max_points: 2,
            criteria_state: 'ROOT',
            children: [
              {
                id: 32,
                title: 'Must A',
                max_points: 2,
                criteria_state: 'NODE',
                criteria_status: 'MANDATORY',
              },
            ],
          },
          {
            id: 33,
            title: 'Alt B',
            max_points: 1,
            criteria_state: 'ROOT',
            children: [
              {
                id: 34,
                title: 'Must B',
                max_points: 1,
                criteria_state: 'NODE',
                criteria_status: 'MANDATORY',
              },
            ],
          },
        ],
      },
    ])

    const untouched = score(rows)
    expect(untouched.criteria[0]?.points_attempted).toBe(0)

    const choseA = toggleAttemptState(rows, [], [], 32, 'YES')
    // mandatory leaf is not user-selectable
    expect(choseA.attemptedIds).toEqual([])

    const choseAlt = toggleAttemptState(rows, [], [], 33, 'NO')
    expect(choseAlt.attemptedIds).toEqual([])

    const withSelectable = materializeCatalog([
      {
        id: 40,
        title: 'Choice',
        max_points: 2,
        criteria_state: 'BRANCH',
        children: [
          {
            id: 41,
            title: 'Alt A',
            max_points: 2,
            criteria_state: 'NODE',
            criteria_status: 'BINARY',
          },
          {
            id: 42,
            title: 'Alt B',
            max_points: 1,
            criteria_state: 'NODE',
            criteria_status: 'BINARY',
          },
        ],
      },
    ])
    const picked = toggleAttemptState(withSelectable, [], [], 41, 'MAYBE')
    expect(picked.maybeIds).toEqual([41])
    expect(score(withSelectable, [], picked.maybeIds).criteria[0]?.points_maybe).toBe(2)
  })

  it('filters the original GRIHA payload by typology and still builds a tree', () => {
    const rows = originalScorecardRows('new-construction')
    expect(rows.length).toBeGreaterThan(10)
    const result = score(rows)
    expect(result.criteria.length).toBeGreaterThan(0)
    expect(result.summary.points_available).toBeGreaterThan(0)
  })

  it('scores the design catalog energy meters with 2 points for 4 yes selections', () => {
    const meterChildren = [6311, 6312, 6313, 6314]
    const result = score(GRIHA_DESIGN_RECORDS, meterChildren)
    const meters = result.criteria
      .flatMap((root) => root.children)
      .flatMap((child) => child.children)
      .find((node) => node.id === 6310)
    expect(meters?.points_attempted).toBe(2)
  })
})
