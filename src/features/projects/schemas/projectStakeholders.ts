import { z } from 'zod'
import {
  DEFAULT_STAKEHOLDER_CATEGORIES,
  type StakeholderCatalogOption,
} from '@/features/projects/lib/stakeholderCatalog'

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`
}

const emailSchema = z.string().trim().email('Enter a valid email')

export const stakeholderPersonSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  email: z.string(),
  role: z.string(),
})

export const projectStakeholdersSchema = z
  .object({
    people: z.array(stakeholderPersonSchema),
  })
  .superRefine((values, ctx) => {
    values.people.forEach((person, index) => {
      const email = person.email.trim()
      const role = person.role.trim()
      if (!email && !role) return

      if (!email) {
        ctx.addIssue({
          code: 'custom',
          path: ['people', index, 'email'],
          message: 'Email is required',
        })
      } else if (!emailSchema.safeParse(email).success) {
        ctx.addIssue({
          code: 'custom',
          path: ['people', index, 'email'],
          message: 'Enter a valid email',
        })
      }

      if (!role) {
        ctx.addIssue({
          code: 'custom',
          path: ['people', index, 'role'],
          message: 'Role is required',
        })
      }
    })
  })

export type ProjectStakeholdersFormValues = z.infer<typeof projectStakeholdersSchema>
export type StakeholderPerson = ProjectStakeholdersFormValues['people'][number]

export function createEmptyPerson(categoryId: string): StakeholderPerson {
  return { id: createId(), categoryId, email: '', role: '' }
}

export function createEmptyProjectStakeholders(
  categories: StakeholderCatalogOption[] = DEFAULT_STAKEHOLDER_CATEGORIES,
): ProjectStakeholdersFormValues {
  return {
    people: categories.map((category) => createEmptyPerson(category.id)),
  }
}

export const emptyProjectStakeholders: ProjectStakeholdersFormValues =
  createEmptyProjectStakeholders()

export function cloneStakeholders(
  values: ProjectStakeholdersFormValues = emptyProjectStakeholders,
): ProjectStakeholdersFormValues {
  return {
    people: values.people.map((person) => ({ ...person })),
  }
}

export function filledStakeholders(values: ProjectStakeholdersFormValues): StakeholderPerson[] {
  return values.people.filter((person) => person.email.trim() || person.role.trim())
}
