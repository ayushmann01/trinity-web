import { describe, expect, it } from 'vitest'
import { mapProjectStakeholdersToApi } from '@/features/projects/lib/mapProjectStakeholders'
import { createEmptyProjectStakeholders } from '@/features/projects/schemas/projectStakeholders'

describe('mapProjectStakeholdersToApi', () => {
  it('maps filled rows onto the stakeholder API shape and drops blanks', () => {
    const values = createEmptyProjectStakeholders()
    values.people[0] = {
      ...values.people[0],
      email: 'ada@example.com',
      role: 'admin',
    }
    values.people[3] = {
      ...values.people[3],
      email: 'client@example.com',
      role: 'viewer',
    }

    expect(mapProjectStakeholdersToApi(values)).toEqual([
      {
        name: 'ada',
        email: 'ada@example.com',
        bucketId: 'acoustic-consultant',
        role: 'admin',
      },
      {
        name: 'client',
        email: 'client@example.com',
        bucketId: 'client',
        role: 'viewer',
      },
    ])
  })

  it('returns an empty list when every row is blank', () => {
    expect(mapProjectStakeholdersToApi(createEmptyProjectStakeholders())).toEqual([])
  })
})
