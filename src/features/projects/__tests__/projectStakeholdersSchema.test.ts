import { describe, expect, it } from 'vitest'
import {
  createEmptyPerson,
  createEmptyProjectStakeholders,
  filledStakeholders,
  projectStakeholdersSchema,
} from '@/features/projects/schemas/projectStakeholders'

describe('projectStakeholdersSchema', () => {
  it('allows a fully blank optional step', () => {
    const result = projectStakeholdersSchema.safeParse(createEmptyProjectStakeholders())
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email when a row is filled', () => {
    const values = createEmptyProjectStakeholders()
    values.people[0] = { ...values.people[0], email: 'not-an-email', role: 'viewer' }
    const result = projectStakeholdersSchema.safeParse(values)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((issue) => issue.message === 'Enter a valid email')).toBe(true)
  })

  it('requires a role when an email is present', () => {
    const values = createEmptyProjectStakeholders()
    values.people[1] = { ...values.people[1], email: 'architect@example.com', role: '' }
    const result = projectStakeholdersSchema.safeParse(values)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((issue) => issue.path.join('.') === 'people.1.role')).toBe(true)
  })

  it('accepts a valid email and role pair', () => {
    const values = createEmptyProjectStakeholders()
    values.people[0] = {
      ...values.people[0],
      email: 'acoustic@example.com',
      role: 'editor',
    }
    const result = projectStakeholdersSchema.safeParse(values)
    expect(result.success).toBe(true)
    expect(filledStakeholders(values)).toHaveLength(1)
  })

  it('ignores extra blank rows added under a category', () => {
    const values = createEmptyProjectStakeholders()
    values.people.push(createEmptyPerson('architect'))
    const result = projectStakeholdersSchema.safeParse(values)
    expect(result.success).toBe(true)
  })
})
