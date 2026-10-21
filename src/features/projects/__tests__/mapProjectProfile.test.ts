import { describe, expect, it } from 'vitest'
import { mapProjectProfileToApi } from '@/features/projects/lib/mapProjectProfile'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'

describe('mapProjectProfileToApi', () => {
  it('maps wizard fields onto the existing project API shape', () => {
    const payload = mapProjectProfileToApi({
      ...emptyProjectProfile,
      name: '  Riverfront Tower  ',
      location: 'Pune, MH',
      climateZone: 'composite',
      typologyId: 'new-construction',
      plotArea: '2500',
      plotAreaUnit: 'sq_m',
      certificationBoundaryArea: '2400',
      certificationBoundaryAreaUnit: 'sq_ft',
      totalBuiltUpArea: '18000',
      totalBuiltUpAreaUnit: 'sq_m',
      approvedFar: '3.5',
      floorsAboveGround: '12',
      basements: '2',
    })

    expect(payload).toEqual({
      name: 'Riverfront Tower',
      location: 'Pune, MH',
      climateZone: 'composite',
      typologyId: 'new-construction',
      plotArea: 2500,
      plotAreaUnit: 'sq_m',
      certificationBoundaryArea: 2400,
      certificationBoundaryAreaUnit: 'sq_ft',
      totalBuiltUpArea: 18000,
      totalBuiltUpAreaUnit: 'sq_m',
      approvedFar: 3.5,
      floorsAboveGround: 12,
      basements: 2,
    })
  })

  it('omits blank optional fields', () => {
    const payload = mapProjectProfileToApi({
      ...emptyProjectProfile,
      name: 'Draft',
      location: 'Goa',
      typologyId: 'residential',
      plotArea: '100',
      totalBuiltUpArea: '80',
    })

    expect(payload.climateZone).toBeUndefined()
    expect(payload.certificationBoundaryArea).toBeUndefined()
    expect(payload.approvedFar).toBeUndefined()
    expect(payload.floorsAboveGround).toBeUndefined()
    expect(payload.basements).toBeUndefined()
    expect(payload.name).toBe('Draft')
    expect(payload.plotArea).toBe(100)
  })
})
