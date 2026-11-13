import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CERTIFICATIONS,
  certificationDataIdFor,
  certificationDisplayName,
  groupCertificationRows,
  resolveCertifications,
  scorecardCertificationName,
} from '@/features/projects/lib/certificationCatalog'

const grihaNewBuildings = {
  id: 1,
  certification_id: 'C1',
  certification_name: 'GRIHA',
  version_id: 'C1_V1',
  version_name: 'Version 2019',
  category_id: 'C1_V1_D1',
  category_name: 'New Buildings',
  typology: ['OFFICE', 'RESIDENTIAL'],
  benchmark: [
    { target_id: 'C1_T1', target_title: 'GRIHA 1 Star', min_pts: 25, max_pts: 40 },
    { target_id: 'C1_T2', target_title: 'GRIHA 2 Star', min_pts: 41, max_pts: 55 },
  ],
  state: 'ACTIVE',
}

const grihaExisting = {
  id: 2,
  certification_id: 'C1',
  certification_name: 'GRIHA',
  version_id: 'C1_V1',
  version_name: 'Version 2019',
  category_id: 'C1_V1_D2',
  category_name: 'Existing Buildings',
  typology: ['EXISTING BUILDING'],
  benchmark: [{ target_id: 'C1_T1', target_title: 'GRIHA 1 Star', min_pts: 25, max_pts: 40 }],
  state: 'ACTIVE',
}

const grihaV2015 = {
  id: 3,
  certification_id: 'C1',
  certification_name: 'GRIHA',
  version_id: 'C1_V2',
  version_name: 'Version 2015',
  category_id: 'C1_V2_D1',
  category_name: 'New Buildings',
  typology: ['OFFICE'],
  benchmark: [{ target_id: 'C1_T3', target_title: 'GRIHA 3 Star', min_pts: 56, max_pts: 70 }],
  state: 'ACTIVE',
}

const gems = {
  id: 10,
  certification_id: 'C4',
  certification_name: 'GEMS',
  version_id: 'C4_V1',
  version_name: 'Version 1',
  category_id: 'C4_V1_D1',
  category_name: 'GEMS',
  typology: ['CAMPUS'],
  benchmark: [{ target_id: 'C4_T1', target_title: 'GEMS Certified', min_pts: 10, max_pts: 20 }],
  state: 'ACTIVE',
}

const inactive = {
  ...gems,
  id: 99,
  certification_id: 'C9',
  certification_name: 'Retired',
  state: 'INACTIVE',
}

describe('groupCertificationRows', () => {
  it('groups flat certification_data rows into nested certifications', () => {
    const grouped = groupCertificationRows([grihaNewBuildings, grihaExisting, grihaV2015, gems])

    expect(grouped.map((item) => item.id)).toEqual(['C1', 'C4'])

    const griha = grouped[0]
    expect(griha).toMatchObject({
      id: 'C1',
      name: 'GRIHA',
      shortName: 'GRIHA',
    })
    expect(griha?.versions).toEqual([
      {
        id: 'C1_V1',
        name: 'Version 2019',
        categories: [
          { id: 'C1_V1_D1', name: 'New Buildings', certificationDataId: 1 },
          { id: 'C1_V1_D2', name: 'Existing Buildings', certificationDataId: 2 },
        ],
      },
      {
        id: 'C1_V2',
        name: 'Version 2015',
        categories: [{ id: 'C1_V2_D1', name: 'New Buildings', certificationDataId: 3 }],
      },
    ])
    expect(griha?.categories).toEqual([
      { id: 'C1_V1_D1', name: 'New Buildings', certificationDataId: 1 },
      { id: 'C1_V1_D2', name: 'Existing Buildings', certificationDataId: 2 },
      { id: 'C1_V2_D1', name: 'New Buildings', certificationDataId: 3 },
    ])
    expect(griha?.typologies).toEqual([
      { id: 'OFFICE', name: 'OFFICE' },
      { id: 'RESIDENTIAL', name: 'RESIDENTIAL' },
      { id: 'EXISTING BUILDING', name: 'EXISTING BUILDING' },
    ])
    expect(griha?.ratings).toEqual([
      { id: 'C1_T1', name: 'GRIHA 1 Star' },
      { id: 'C1_T2', name: 'GRIHA 2 Star' },
      { id: 'C1_T3', name: 'GRIHA 3 Star' },
    ])

    const gemsCert = grouped[1]
    expect(gemsCert).toMatchObject({
      id: 'C4',
      name: 'GEMS',
      shortName: 'GEMS',
    })
    expect(gemsCert?.categories?.[0]?.certificationDataId).toBe(10)
    expect(certificationDataIdFor(griha, 'C1_V1', 'C1_V1_D2')).toBe(2)
  })

  it('unwraps a { data: [...] } envelope and skips inactive rows', () => {
    const grouped = groupCertificationRows({ data: [gems, inactive] })
    expect(grouped).toHaveLength(1)
    expect(grouped[0]?.id).toBe('C4')
    expect(grouped[0]?.name).toBe('GEMS')
  })

  it('returns an empty list for empty or unknown payloads', () => {
    expect(groupCertificationRows([])).toEqual([])
    expect(groupCertificationRows({ data: [] })).toEqual([])
    expect(groupCertificationRows(null)).toEqual([])
  })
})

describe('resolveCertifications', () => {
  it('falls back to the bundled catalog only when the request errors', () => {
    expect(resolveCertifications(undefined, true)[0]?.id).toBe('griha')
    expect(resolveCertifications([], true)[0]?.name).toBe('GRIHA')
  })

  it('keeps a successful API payload as-is, including new certifications', () => {
    const apiData = groupCertificationRows([gems])
    const resolved = resolveCertifications(apiData)
    expect(resolved).toHaveLength(1)
    expect(resolved[0]?.id).toBe('C4')
    expect(resolved[0]?.name).toBe('GEMS')
    expect(resolved.some((item) => item.id === 'griha')).toBe(false)
  })

  it('does not merge API certifications with hardcoded versions or ratings', () => {
    const resolved = resolveCertifications([
      { id: 'C1', name: 'GRIHA', typologies: [{ id: 'campus', name: 'Campus' }] },
    ])
    expect(resolved).toHaveLength(1)
    expect(resolved[0]?.typologies).toEqual([{ id: 'campus', name: 'Campus' }])
    expect(resolved[0]?.versions ?? []).toEqual([])
    expect(resolved[0]?.ratings ?? []).toEqual([])
  })

  it('does not replace an empty successful response with stale defaults', () => {
    expect(resolveCertifications([])).toEqual([])
    expect(resolveCertifications(undefined)).toEqual([])
  })

  it('defaults the display name to GRIHA', () => {
    expect(certificationDisplayName(undefined)).toBe('GRIHA')
    expect(certificationDisplayName(DEFAULT_CERTIFICATIONS[1])).toBe('IGBC')
  })

  it('resolves the scorecard title from the API catalog, not bundled defaults', () => {
    const catalog = groupCertificationRows([gems])
    expect(scorecardCertificationName(catalog, 'C4')).toBe('GEMS')
    expect(scorecardCertificationName(catalog, 'C1')).toBe('C1')
    expect(scorecardCertificationName(undefined, 'C4')).toBe('C4')
    expect(scorecardCertificationName(DEFAULT_CERTIFICATIONS, 'C4')).toBe('C4')
    expect(scorecardCertificationName(undefined, '', 'IGBC')).toBe('IGBC')
  })
})
