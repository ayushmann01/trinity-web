import type { Project } from '@/features/projects/types'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function nestedLabel(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') return firstString(value)
  if (isRecord(value)) return firstString(value.id, value.name, value.title, value.shortName)
  return undefined
}

function sourceRecord(raw: unknown): UnknownRecord | null {
  if (!isRecord(raw)) return null
  const nested = [raw.project_information, raw.projectInformation, raw.project].find(isRecord)
  return nested ? { ...raw, ...nested } : raw
}

/** Maps trinity `project_information` / list envelopes onto the frontend Project type. */
export function normalizeProject(raw: unknown): Project | null {
  const src = sourceRecord(raw)
  if (!src) return null

  const id = firstString(src.id, src.project_id, src.projectId)
  if (!id) return null

  return {
    id,
    name: firstString(src.name, src.project_title, src.projectTitle, src.title) ?? '',
    certificationId:
      firstString(src.certificationId, src.certification_id) ?? nestedLabel(src.certification) ?? '',
    typologyId: firstString(src.typologyId, src.typology_id) ?? nestedLabel(src.typology),
    targetPoints: firstNumber(src.targetPoints, src.target_points),
    location: firstString(src.location),
    climateZone: firstString(src.climateZone, src.climate_zone),
    targetRating: firstString(
      src.targetRating,
      src.target_rating,
      src.certification_target,
      src.certificationTarget,
      typeof src.target === 'string' ? src.target : undefined,
    ),
    certificationVersionId: firstString(src.certificationVersionId, src.certification_version_id),
    certificationCategoryId: firstString(src.certificationCategoryId, src.certification_category_id),
    certificationStage: firstString(src.certificationStage, src.certification_stage) as
      | Project['certificationStage']
      | undefined,
    createdAt: firstString(src.createdAt, src.created_at),
    updatedAt: firstString(src.updatedAt, src.updated_at),
  }
}

export function projectTargetLabel(
  project: Pick<Project, 'targetRating' | 'targetPoints'>,
): string {
  if (project.targetRating) return project.targetRating
  if (project.targetPoints != null) return String(project.targetPoints)
  return '-'
}

export function normalizeProjectList(raw: unknown): {
  items: Project[]
  total: number
  page: number
  pageSize: number
} {
  let list: unknown[] = []
  let total: number | undefined
  let page = 1
  let pageSize = 10

  if (Array.isArray(raw)) {
    list = raw
    total = raw.length
  } else if (isRecord(raw)) {
    const nested = isRecord(raw.data) ? raw.data : null
    const fromRoot = [raw.items, raw.projects, raw.results, raw.data].find(Array.isArray)
    const fromNested = nested
      ? [nested.items, nested.projects, nested.results].find(Array.isArray)
      : undefined
    list = (fromRoot ?? fromNested ?? []) as unknown[]
    total = firstNumber(raw.total, raw.count, nested?.total, nested?.count)
    page = firstNumber(raw.page, nested?.page) ?? 1
    pageSize = firstNumber(raw.pageSize, raw.page_size, nested?.pageSize, nested?.page_size) ?? 10
  }

  const items = list.map(normalizeProject).filter((item): item is Project => item !== null)
  return {
    items,
    total: total ?? items.length,
    page,
    pageSize,
  }
}
