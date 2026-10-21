import type { Project } from '@/features/projects/types'
import type { ProjectProfileFormValues } from '@/features/projects/schemas/projectProfile'

function parseNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Maps wizard step-1 fields onto the existing project API shape. Does not submit. */
export function mapProjectProfileToApi(values: ProjectProfileFormValues): Partial<Project> {
  return {
    name: values.name.trim(),
    location: values.location.trim() || undefined,
    climateZone: values.climateZone.trim() || undefined,
    typologyId: values.typologyId.trim() || undefined,
    plotArea: parseNumber(values.plotArea),
    plotAreaUnit: values.plotAreaUnit,
    certificationBoundaryArea: parseNumber(values.certificationBoundaryArea),
    certificationBoundaryAreaUnit: values.certificationBoundaryAreaUnit,
    totalBuiltUpArea: parseNumber(values.totalBuiltUpArea),
    totalBuiltUpAreaUnit: values.totalBuiltUpAreaUnit,
    approvedFar: parseNumber(values.approvedFar),
    floorsAboveGround: parseNumber(values.floorsAboveGround),
    basements: parseNumber(values.basements),
  }
}
