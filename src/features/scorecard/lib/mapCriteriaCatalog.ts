import { normalizeCriteriaPayload } from '@/features/scorecard/lib/flattenCriteria'
import type { CriteriaRecord, ProjectCriteriaResponse } from '@/features/scorecard/types'

export type CriteriaCatalogQueryArgs = {
  certificationId: string
  versionId: string
  categoryId?: string
  typology?: string
}

type CertificationSelection = {
  certificationId?: string | null
  versionId?: string | null
  categoryId?: string | null
  typologyId?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function trimToUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** Builds catalog query args from the wizard's step 2 selection. */
export function criteriaCatalogQueryArgs(
  certification: CertificationSelection,
): CriteriaCatalogQueryArgs | undefined {
  const certificationId = trimToUndefined(certification.certificationId)
  const versionId = trimToUndefined(certification.versionId)
  if (!certificationId || !versionId) return undefined

  const args: CriteriaCatalogQueryArgs = { certificationId, versionId }
  // Always send category_id when step 2 has one — without it the API 400s if
  // more than one ACTIVE certification_data row matches cert + version.
  const categoryId = trimToUndefined(certification.categoryId)
  const typology = trimToUndefined(certification.typologyId)
  if (categoryId) args.categoryId = categoryId
  if (typology) args.typology = typology
  return args
}

export function criteriaCatalogRequestUrl(args: CriteriaCatalogQueryArgs): string {
  const params = new URLSearchParams()
  params.set('certification_id', args.certificationId)
  params.set('version_id', args.versionId)
  if (args.categoryId) params.set('category_id', args.categoryId)
  if (args.typology) params.set('typology', args.typology)
  return `/projects/criteria?${params.toString()}`
}

function asCriteriaList(value: unknown): ProjectCriteriaResponse['criteria'] {
  if (!Array.isArray(value)) return []
  return value as NonNullable<ProjectCriteriaResponse['criteria']>
}

/**
 * Normalizes GET /projects/criteria (and the project-scoped twin) after the
 * shared `{ data: ... }` unwrap. Also accepts an extra envelope so mapping
 * tests can feed the raw HTTP body.
 */
export function mapCriteriaCatalogResponse(raw: unknown): ProjectCriteriaResponse {
  let payload: unknown = raw
  if (isRecord(payload) && 'data' in payload && !Array.isArray(payload.criteria)) {
    payload = payload.data
  }
  if (!isRecord(payload)) {
    return { criteria: [] }
  }

  return {
    certification: payload.certification as ProjectCriteriaResponse['certification'],
    summary: payload.summary as ProjectCriteriaResponse['summary'],
    criteria: asCriteriaList(payload.criteria),
    attempted_ids: Array.isArray(payload.attempted_ids)
      ? (payload.attempted_ids as number[])
      : undefined,
    maybe_ids: Array.isArray(payload.maybe_ids) ? (payload.maybe_ids as number[]) : undefined,
  }
}

export function resolveCriteriaRows(
  apiPayload?: ProjectCriteriaResponse | null,
): CriteriaRecord[] {
  const criteria = apiPayload?.criteria
  if (!criteria || criteria.length === 0) return []
  return normalizeCriteriaPayload(apiPayload).rows
}
