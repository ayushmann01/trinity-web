import originalScorecard from '@/features/scorecard/data/trinityOriginalScorecard.json'
import { GRIHA_DESIGN_RECORDS } from '@/features/scorecard/data/grihaDesignCatalog'
import {
  applicableCriteria,
  typologyKey,
} from '@/features/scorecard/lib/criteriaTree'
import { flattenCriteriaTree, normalizeCriteriaPayload } from '@/features/scorecard/lib/flattenCriteria'
import type { CriteriaRecord, ProjectCriteriaResponse } from '@/features/scorecard/types'

type OriginalPayload = {
  certification?: ProjectCriteriaResponse['certification']
  summary?: ProjectCriteriaResponse['summary']
  criteria?: ProjectCriteriaResponse['criteria']
}

const originalPayload = originalScorecard as unknown as OriginalPayload

export function mapProjectTypology(typologyId?: string | null): string | null {
  if (!typologyId?.trim()) return null
  const key = typologyKey(typologyId)
  if (['office', 'newconstruction', 'coreshell', 'commercial', 'mixeduse'].includes(key)) {
    return 'OFFICE'
  }
  if (['residential', 'affordablehousing', 'existingbuilding'].includes(key)) {
    return 'RESIDENTIAL'
  }
  if (['institutional', 'healthcare', 'hospital', 'interiors'].includes(key)) {
    return 'INSTITUTIONAL'
  }
  if (key === 'industrial' || key === 'largedevelopment') return 'INDUSTRIAL'
  return typologyId
}

export function originalScorecardRows(typologyId?: string | null): CriteriaRecord[] {
  const rows = flattenCriteriaTree(originalPayload.criteria)
  const mapped = mapProjectTypology(typologyId)
  if (!mapped) return rows
  const filtered = applicableCriteria(rows, mapped)
  return filtered.length > 0 ? filtered : rows
}

export function originalScorecardMeta(): OriginalPayload {
  return originalPayload
}

export function resolveCriteriaRows(options: {
  apiPayload?: ProjectCriteriaResponse | null
  certificationId?: string | null
  typologyId?: string | null
}): CriteriaRecord[] {
  if (options.apiPayload?.criteria && options.apiPayload.criteria.length > 0) {
    return normalizeCriteriaPayload(options.apiPayload).rows
  }
  const cert = (options.certificationId ?? '').trim().toLowerCase()
  if (!cert || cert === 'griha') return GRIHA_DESIGN_RECORDS
  const original = originalScorecardRows(options.typologyId)
  return original.length > 0 ? original : GRIHA_DESIGN_RECORDS
}
