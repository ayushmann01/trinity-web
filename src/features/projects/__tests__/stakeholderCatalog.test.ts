import { describe, expect, it } from 'vitest'
import {
  DEFAULT_STAKEHOLDER_CATEGORIES,
  DEFAULT_STAKEHOLDER_ROLES,
  resolveStakeholderCategories,
  resolveStakeholderRoles,
} from '@/features/projects/lib/stakeholderCatalog'

describe('stakeholderCatalog', () => {
  it('falls back to the design category list when the API is empty', () => {
    expect(resolveStakeholderCategories()).toEqual(DEFAULT_STAKEHOLDER_CATEGORIES)
    expect(resolveStakeholderCategories([])).toEqual(DEFAULT_STAKEHOLDER_CATEGORIES)
    expect(resolveStakeholderCategories(undefined)).toEqual(DEFAULT_STAKEHOLDER_CATEGORIES)
  })

  it('uses API buckets when they are available', () => {
    expect(
      resolveStakeholderCategories([
        { id: 'pm', name: 'Project Manager' },
        { id: 'client', name: 'Client' },
      ]),
    ).toEqual([
      { id: 'pm', name: 'Project Manager' },
      { id: 'client', name: 'Client' },
    ])
  })

  it('falls back to Viewer, Editor and Admin roles', () => {
    expect(resolveStakeholderRoles()).toEqual(DEFAULT_STAKEHOLDER_ROLES)
    expect(resolveStakeholderRoles([{ id: 'owner', name: 'Owner' }])).toEqual([
      { id: 'owner', name: 'Owner' },
    ])
  })
})
