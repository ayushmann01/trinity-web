import type { StakeholderBucket } from '@/features/stakeholders/api/stakeholdersApi'

export type StakeholderCatalogOption = {
  id: string
  name: string
}

export const DEFAULT_STAKEHOLDER_CATEGORIES: StakeholderCatalogOption[] = [
  { id: 'acoustic-consultant', name: 'Acoustic Consultant' },
  { id: 'architect', name: 'Architect' },
  { id: 'civil-engineer', name: 'Civil Engineer' },
  { id: 'client', name: 'Client' },
  { id: 'contractor', name: 'Contractor' },
  { id: 'electrical-consultant', name: 'Electrical Consultant' },
  { id: 'facade-designer-consultant', name: 'Facade Designer/Consultant' },
  { id: 'green-building-consultant', name: 'Green Building Consultant' },
  { id: 'hvac-consultant', name: 'HVAC Consultant' },
  { id: 'interior-consultant', name: 'Interior Consultant' },
  { id: 'landscape-architect-consultant', name: 'Landscape Architect/Consultant' },
]

export const DEFAULT_STAKEHOLDER_ROLES: StakeholderCatalogOption[] = [
  { id: 'viewer', name: 'Viewer' },
  { id: 'editor', name: 'Editor' },
  { id: 'admin', name: 'Admin' },
]

export function resolveStakeholderCategories(
  apiData?: StakeholderBucket[] | null,
): StakeholderCatalogOption[] {
  if (!apiData || apiData.length === 0) return DEFAULT_STAKEHOLDER_CATEGORIES
  return apiData.map((item) => ({ id: item.id, name: item.name }))
}

export function resolveStakeholderRoles(
  apiData?: StakeholderCatalogOption[] | null,
): StakeholderCatalogOption[] {
  if (!apiData || apiData.length === 0) return DEFAULT_STAKEHOLDER_ROLES
  return apiData.map((item) => ({ id: item.id, name: item.name }))
}
