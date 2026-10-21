import type { AreaUnit } from '@/features/projects/constants'

export type CertificationTypology = {
  id: string
  name: string
}

export type Certification = {
  id: string
  name: string
  totalPoints?: number
  typologies: CertificationTypology[]
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
  createdAt?: string
  updatedAt?: string
}
