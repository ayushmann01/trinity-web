import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CERTIFICATIONS,
  certificationDisplayName,
  resolveCertifications,
} from '@/features/projects/lib/certificationCatalog'

describe('resolveCertifications', () => {
  it('falls back to the bundled GRIHA catalog when the API is empty', () => {
    expect(resolveCertifications(undefined)[0]?.id).toBe('griha')
    expect(resolveCertifications([])[0]?.name).toBe('GRIHA')
  })

  it('merges API certifications with fallback versions and ratings', () => {
    const resolved = resolveCertifications([
      { id: 'griha', name: 'GRIHA', typologies: [{ id: 'campus', name: 'Campus' }] },
    ])
    expect(resolved[0]?.typologies).toEqual([{ id: 'campus', name: 'Campus' }])
    expect(resolved[0]?.versions?.some((item) => item.id === 'v2019')).toBe(true)
    expect(resolved[0]?.ratings?.length).toBeGreaterThan(0)
  })

  it('defaults the display name to GRIHA', () => {
    expect(certificationDisplayName(undefined)).toBe('GRIHA')
    expect(certificationDisplayName(DEFAULT_CERTIFICATIONS[1])).toBe('IGBC')
  })
})
