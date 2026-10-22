import { describe, expect, it } from 'vitest'
import {
  emptyProjectCertification,
  projectCertificationSchema,
} from '@/features/projects/schemas/projectCertification'

describe('projectCertificationSchema', () => {
  it('requires certification, version and target rating', () => {
    const result = projectCertificationSchema.safeParse(emptyProjectCertification)
    expect(result.success).toBe(false)
    if (result.success) return
    const paths = result.error.issues.map((issue) => issue.path[0])
    expect(paths).toEqual(expect.arrayContaining(['certificationId', 'versionId', 'targetRatingId']))
  })

  it('accepts a complete certification payload', () => {
    const result = projectCertificationSchema.safeParse({
      certificationId: 'griha',
      versionId: 'v2019',
      categoryId: 'new-buildings',
      typologyId: 'new-construction',
      targetRatingId: '4-star',
      stage: 'pre-certification',
    })
    expect(result.success).toBe(true)
  })
})
