import type { AreaUnit } from '@/features/projects/constants'

export type CatalogOption = {
  id: string
  name: string
}

export type CertificationTypology = CatalogOption

export type CertificationStage = 'pre-certification' | 'certification'

export type Certification = {
  id: string
  name: string
  shortName?: string
  totalPoints?: number
  typologies: CertificationTypology[]
  versions?: CatalogOption[]
  categories?: CatalogOption[]
  ratings?: CatalogOption[]
}

export type Project = {
  id: string
  name: string
  certificationId: string
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
  createdAt?: string
  updatedAt?: string
}
