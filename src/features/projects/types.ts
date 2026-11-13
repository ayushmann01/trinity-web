import type { AreaUnit } from '@/features/projects/constants'

export type CatalogOption = {
  id: string
  name: string
  /** Numeric `certification_data.id` used when creating a project. */
  certificationDataId?: number
}

export type CertificationTypology = CatalogOption

export type CertificationCategoryOption = CatalogOption

export type CertificationVersionOption = CatalogOption & {
  categories?: CertificationCategoryOption[]
}

export type CertificationStage = 'pre-certification' | 'certification'

export type Certification = {
  id: string
  name: string
  shortName?: string
  totalPoints?: number
  typologies: CertificationTypology[]
  versions?: CertificationVersionOption[]
  categories?: CertificationCategoryOption[]
  ratings?: CatalogOption[]
}

export type ProjectOffWeek = {
  startDate: string
  endDate: string
}

export type ProjectMilestone = {
  name: string
  date: string
}

export type Project = {
  id: string
  name: string
  certificationId: string
  certificationTitle?: string
  typologyId?: string
  targetPoints?: number
  location?: string
  climateZone?: string
  plotArea?: number
  plotAreaUnit?: AreaUnit
  certificationBoundaryArea?: number
  certificationBoundaryAreaUnit?: AreaUnit
  totalBuiltUpArea?: number
  totalBuiltUpAreaUnit?: AreaUnit
  approvedFar?: number
  floorsAboveGround?: number
  basements?: number
  certificationVersionId?: string
  certificationCategoryId?: string
  targetRating?: string
  certificationStage?: CertificationStage
  startDate?: string
  designPhaseStart?: string
  designPhaseEnd?: string
  constructionPhaseStart?: string
  constructionPhaseEnd?: string
  preCertificationDeadline?: string
  certificationDeadline?: string
  siteVisitDates?: string[]
  offWeeks?: ProjectOffWeek[]
  milestones?: ProjectMilestone[]
  createdAt?: string
  updatedAt?: string
}
