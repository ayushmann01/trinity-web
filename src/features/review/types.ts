export type StakeholderId = 'architect' | 'mep' | 'gbc' | 'contractor' | 'landscape' | 'client'

export type DocumentType =
  | 'Drawing'
  | 'Report'
  | 'Calculation'
  | 'Invoice'
  | 'Log'
  | 'Certificate'

export type PhaseId =
  | 'scoping'
  | 'design'
  | 'post-design'
  | 'construction'
  | 'post-construction'

export type DocumentCard = {
  id: string
  type: DocumentType
  title: string
}

export type CellId = `${PhaseId}:${StakeholderId}`

export type Phase = {
  id: PhaseId
  label: string
  dateRange: string
  collapsed: boolean
}

export type Stakeholder = {
  id: StakeholderId
  label: string
  color: 'blue' | 'amber' | 'green' | 'rose' | 'violet' | 'sky'
  poc?: string
  you?: boolean
}

export type ResponsibilitiesBoard = {
  phases: Phase[]
  stakeholders: Stakeholder[]
  // key is `${phaseId}:${stakeholderId}`
  cells: Record<CellId, DocumentCard[]>
}

export type MovePayload = {
  id: string
  from: CellId
  to: CellId
  index: number // target index inside `to` cell
}

export type AddPayload = {
  cell: CellId
  type: DocumentType
  title: string
}

export type EditPayload = {
  id: string
  cell: CellId
  type?: DocumentType
  title?: string
}

export type RemovePayload = {
  id: string
  cell: CellId
}

export type PocPayload = {
  stakeholderId: StakeholderId
  poc?: string
}

