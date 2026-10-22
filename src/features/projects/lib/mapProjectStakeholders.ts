import type { Stakeholder } from '@/features/stakeholders/api/stakeholdersApi'
import {
  filledStakeholders,
  type ProjectStakeholdersFormValues,
} from '@/features/projects/schemas/projectStakeholders'

function displayName(email: string): string {
  const trimmed = email.trim()
  const local = trimmed.split('@')[0]
  return local || trimmed
}

/** Maps wizard step-6 rows onto the stakeholder API shape. Does not submit. */
export function mapProjectStakeholdersToApi(
  values: ProjectStakeholdersFormValues,
): Omit<Stakeholder, 'id'>[] {
  return filledStakeholders(values).map((person) => ({
    name: displayName(person.email),
    email: person.email.trim() || undefined,
    bucketId: person.categoryId.trim() || undefined,
    role: person.role.trim() || undefined,
  }))
}
