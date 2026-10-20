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
  createdAt?: string
  updatedAt?: string
}
