import { describe, expect, it } from 'vitest'
import { emptyProjectProfile, projectProfileSchema } from '@/features/projects/schemas/projectProfile'

describe('projectProfileSchema', () => {
  it('requires title, location, typology, plot area and built-up area', () => {
    const result = projectProfileSchema.safeParse(emptyProjectProfile)
    expect(result.success).toBe(false)
    if (result.success) return
    const paths = result.error.issues.map((issue) => issue.path[0])
    expect(paths).toEqual(
      expect.arrayContaining(['name', 'location', 'typologyId', 'plotArea', 'totalBuiltUpArea']),
    )
  })

  it('accepts a complete profile', () => {
    const result = projectProfileSchema.safeParse({
      ...emptyProjectProfile,
      name: 'North Campus',
      location: 'Bengaluru',
      typologyId: 'new-construction',
      plotArea: '1200.5',
      totalBuiltUpArea: '8000',
      climateZone: 'temperate',
    })
    expect(result.success).toBe(true)
  })
})
