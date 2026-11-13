import { describe, expect, it } from 'vitest'
import {
  criteriaCatalogQueryArgs,
  criteriaCatalogRequestUrl,
  mapCriteriaCatalogResponse,
  resolveCriteriaRows,
} from '@/features/scorecard/lib/mapCriteriaCatalog'
import type { CriteriaNode, ProjectCriteriaResponse } from '@/features/scorecard/types'

const gemsTree: CriteriaNode[] = [
  {
    id: 9100,
    parent_id: 9100,
    criteria_id: 'G1',
    title: 'GEMS Campus Planning',
    description: null,
    section: 'Campus',
    max_points: 4,
    points_attempted: 0,
    points_maybe: 0,
    criteria_status: 'MAXIMUM',
    criteria_category: 'CRITERIA',
    criteria_state: 'ROOT',
    typology: 'CAMPUS',
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
    certification_stage: 'design',
    calculator_id: ['C-G01-01'],
    children: [
      {
        id: 9101,
        parent_id: 9100,
        criteria_id: 'G1.1',
        title: 'Site master plan',
        description: null,
        section: 'Campus',
        max_points: 2,
        points_attempted: 0,
        points_maybe: 0,
        criteria_status: 'BINARY',
        criteria_category: 'SUB_CRITERIA',
        criteria_state: 'NODE',
        typology: 'CAMPUS',
        footnotes: null,
        references: null,
        rules: null,
        mandatory: false,
        selectable: true,
        attempted: false,
        attempt_state: 'NO',
        pr_stakeholder_id: null,
        sc_stakeholder_id: null,
        tr_stakeholder_id: null,
        children: [],
      },
    ],
  },
]

const catalogBody = {
  certification: {
    certification_id: 'C4',
    version_id: 'C4_V1',
    category_id: 'C4_V1_D1',
    certification_title: 'GEMS',
  },
  summary: {
    points_attempted: 0,
    points_maybe: 0,
    points_available: 4,
    target_min_pts: null,
    target_max_pts: null,
    points_to_target: 0,
  },
  criteria: gemsTree,
}

describe('criteriaCatalogQueryArgs', () => {
  it('requires certification_id and version_id from step 2', () => {
    expect(
      criteriaCatalogQueryArgs({
        certificationId: 'C4',
        versionId: '',
        categoryId: 'C4_V1_D1',
      }),
    ).toBeUndefined()
    expect(
      criteriaCatalogQueryArgs({
        certificationId: '',
        versionId: 'C4_V1',
      }),
    ).toBeUndefined()
  })

  it('always passes category_id from step 2 so cert+version is unambiguous', () => {
    expect(
      criteriaCatalogQueryArgs({
        certificationId: 'C4',
        versionId: 'C4_V1',
        categoryId: 'C4_V1_D1',
        typologyId: 'CAMPUS',
      }),
    ).toEqual({
      certificationId: 'C4',
      versionId: 'C4_V1',
      categoryId: 'C4_V1_D1',
      typology: 'CAMPUS',
    })
  })

  it('omits blank optional filters so the cache key stays stable', () => {
    expect(
      criteriaCatalogQueryArgs({
        certificationId: ' C1 ',
        versionId: 'C1_V1',
        categoryId: '  ',
        typologyId: '',
      }),
    ).toEqual({ certificationId: 'C1', versionId: 'C1_V1' })
  })
})

describe('criteriaCatalogRequestUrl', () => {
  it('builds GET /projects/criteria from the step 2 ids, not a fixed GEMS/GRIHA id', () => {
    expect(
      criteriaCatalogRequestUrl({
        certificationId: 'C4',
        versionId: 'C4_V1',
        categoryId: 'C4_V1_D1',
        typology: 'CAMPUS',
      }),
    ).toBe(
      '/projects/criteria?certification_id=C4&version_id=C4_V1&category_id=C4_V1_D1&typology=CAMPUS',
    )
    expect(
      criteriaCatalogRequestUrl({
        certificationId: 'C1',
        versionId: 'C1_V1',
        categoryId: 'C1_V1_D1',
      }),
    ).toBe('/projects/criteria?certification_id=C1&version_id=C1_V1&category_id=C1_V1_D1')
    expect(criteriaCatalogRequestUrl({ certificationId: 'C4', versionId: 'C4_V1' })).not.toMatch(
      /extra=/,
    )
  })
})

describe('mapCriteriaCatalogResponse', () => {
  it('unwraps { data } and keeps the project-criteria tree shape', () => {
    const mapped = mapCriteriaCatalogResponse({ data: catalogBody })
    expect(mapped.certification?.certification_id).toBe('C4')
    expect(mapped.certification?.certification_title).toBe('GEMS')
    expect(mapped.summary?.target_min_pts).toBeNull()
    expect(mapped.summary?.points_to_target).toBe(0)
    expect(mapped.criteria).toHaveLength(1)
    expect(mapped.criteria?.[0]?.title).toBe('GEMS Campus Planning')
    expect(mapped.criteria?.[0]?.certification_stage).toBe('design')
    expect(mapped.criteria?.[0]?.calculator_id).toEqual(['C-G01-01'])
  })

  it('accepts an already unwrapped body', () => {
    expect(mapCriteriaCatalogResponse(catalogBody).criteria?.[0]?.id).toBe(9100)
  })

  it('returns an empty criteria list for unknown payloads', () => {
    expect(mapCriteriaCatalogResponse(null).criteria).toEqual([])
    expect(mapCriteriaCatalogResponse([]).criteria).toEqual([])
    expect(mapCriteriaCatalogResponse({ data: null }).criteria).toEqual([])
  })
})

describe('resolveCriteriaRows', () => {
  it('flattens the catalog tree and does not fall back to bundled GRIHA/GEMS data', () => {
    const rows = resolveCriteriaRows(catalogBody as ProjectCriteriaResponse)
    expect(rows.map((row) => row.id)).toEqual([9100, 9101])
    expect(rows[0]?.title).toBe('GEMS Campus Planning')
    expect(rows[0]?.certification_stage).toBe('design')
    expect(rows[0]?.calculator_id).toEqual(['C-G01-01'])
    expect(resolveCriteriaRows(undefined)).toEqual([])
    expect(resolveCriteriaRows({ criteria: [] })).toEqual([])
  })
})
