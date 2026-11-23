import type { AreaUnit, Project, ProjectMilestone, ProjectOffWeek } from '@/features/projects/types'

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

function asAreaUnit(value: unknown): AreaUnit | undefined {
  return value === 'sq_m' || value === 'sq_ft' ? value : undefined
}

function readStringDates(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const dates = value.map((item) => firstString(item)).filter((item): item is string => Boolean(item))
  return dates.length ? dates : undefined
}

function readOffWeeks(value: unknown): ProjectOffWeek[] | undefined {
  if (!Array.isArray(value)) return undefined
  const weeks = value.flatMap((item) => {
    if (!isRecord(item)) return []
    const startDate = firstString(item.start_date, item.startDate)
    const endDate = firstString(item.end_date, item.endDate)
    if (!startDate || !endDate) return []
    return [{ startDate, endDate }]
  })
  return weeks.length ? weeks : undefined
}

function readMilestones(value: unknown): ProjectMilestone[] | undefined {
  if (!Array.isArray(value)) return undefined
  const milestones = value.flatMap((item) => {
    if (!isRecord(item)) return []
    const name = firstString(item.name)
    const date = firstString(item.date)
    if (!name || !date) return []
    return [{ name, date }]
  })
  return milestones.length ? milestones : undefined
}

function projectStateOf(value: unknown): string | undefined {
  return firstString(value)
}

/** Maps trinity `project_information` / list envelopes onto the frontend Project type. */
export function normalizeProject(raw: unknown): Project | null {
  const src = sourceRecord(raw)
  if (!src) return null

  const id = firstString(src.id) ?? firstString(src.project_id, src.projectId)
  if (!id) return null

  const meta = isRecord(src.meta) ? src.meta : null
  const timeline = isRecord(src.timeline) ? src.timeline : null

  const plotAreaUnit = asAreaUnit(meta?.plot_area_unit ?? src.plotAreaUnit ?? src.plot_area_unit)
  const boundaryUnit = asAreaUnit(
    meta?.certification_boundary_area_unit ??
      src.certificationBoundaryAreaUnit ??
      src.certification_boundary_area_unit,
  )
  const builtUpUnit = asAreaUnit(
    meta?.total_built_up_area_unit ?? src.totalBuiltUpAreaUnit ?? src.total_built_up_area_unit,
  )
  const stage = firstString(
    meta?.certification_stage,
    src.certificationStage,
    src.certification_stage,
  ) as Project['certificationStage'] | undefined

  return {
    id,
    code: firstString(src.project_id, src.projectId, src.code),
    name: firstString(src.name, src.project_title, src.projectTitle, src.title) ?? '',
    state: projectStateOf(src.state),
    draftStep: firstNumber(src.draft_step, src.draftStep),
    certificationDataId: firstNumber(src.certification_data_id, src.certificationDataId),
    targetId: firstString(src.target_id, src.targetId, meta?.target_id),
    certificationTitle: firstString(src.certificationTitle, src.certification_title),
    certificationId:
      firstString(src.certificationId, src.certification_id) ??
      nestedLabel(src.certification) ??
      firstString(src.certificationTitle, src.certification_title) ??
      '',
    typologyId: firstString(src.typologyId, src.typology_id, src.typology) ?? nestedLabel(src.typology),
    targetPoints: firstNumber(src.targetPoints, src.target_points, src.min_pts),
    location: firstString(src.location),
    climateZone: firstString(src.climateZone, src.climate_zone),
    plotArea: firstNumber(src.plotArea, src.plot_area, src.site_area),
    plotAreaUnit,
    certificationBoundaryArea: firstNumber(
      src.certificationBoundaryArea,
      src.certification_boundary_area,
      meta?.certification_boundary_area,
    ),
    certificationBoundaryAreaUnit: boundaryUnit,
    totalBuiltUpArea: firstNumber(
      src.totalBuiltUpArea,
      src.total_built_up_area,
      meta?.total_built_up_area,
    ),
    totalBuiltUpAreaUnit: builtUpUnit,
    approvedFar: firstNumber(src.approvedFar, src.approved_far, meta?.approved_far),
    floorsAboveGround: firstNumber(
      src.floorsAboveGround,
      src.floors_above_ground,
      meta?.floors_above_ground,
    ),
    basements: firstNumber(src.basements, meta?.basements),
    targetRating: firstString(
      src.targetRating,
      src.target_rating,
      src.certification_target,
      src.certificationTarget,
      typeof src.target === 'string' ? src.target : undefined,
    ),
    certificationVersionId: firstString(
      src.certificationVersionId,
      src.certification_version_id,
      src.version_id,
    ),
    certificationCategoryId: firstString(
      src.certificationCategoryId,
      src.certification_category_id,
      src.category_id,
    ),
    certificationStage: stage,
    startDate: firstString(src.startDate, src.start_date, timeline?.start_date),
    designPhaseStart: firstString(src.designPhaseStart, src.design_phase_start, timeline?.design_phase_start),
    designPhaseEnd: firstString(src.designPhaseEnd, src.design_phase_end, timeline?.design_phase_end),
    constructionPhaseStart: firstString(
      src.constructionPhaseStart,
      src.construction_phase_start,
      timeline?.construction_phase_start,
    ),
    constructionPhaseEnd: firstString(
      src.constructionPhaseEnd,
      src.construction_phase_end,
      timeline?.construction_phase_end,
    ),
    preCertificationDeadline: firstString(
      src.preCertificationDeadline,
      src.pre_certification_deadline,
      timeline?.pre_certification_deadline,
    ),
    certificationDeadline: firstString(
      src.certificationDeadline,
      src.certification_deadline,
      timeline?.certification_deadline,
    ),
    siteVisitDates: readStringDates(src.siteVisitDates ?? src.site_visit_dates ?? timeline?.site_visit_dates),
    offWeeks: readOffWeeks(src.offWeeks ?? src.off_weeks ?? timeline?.off_weeks),
    milestones: readMilestones(src.milestones ?? timeline?.milestones),
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

export function projectCertificationLabel(
  project: Pick<Project, 'certificationTitle' | 'certificationId'>,
): string {
  return project.certificationTitle || project.certificationId || ''
}

export function isDraftProject(project: Pick<Project, 'state'>): boolean {
  return project.state === 'DRAFT'
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
    pageSize =
      firstNumber(raw.limit, raw.pageSize, raw.page_size, nested?.limit, nested?.pageSize, nested?.page_size) ?? 10
    const offset = firstNumber(raw.offset, nested?.offset)
    page = firstNumber(raw.page, nested?.page) ?? (offset != null ? Math.floor(offset / pageSize) + 1 : 1)
  }

  const items = list.map(normalizeProject).filter((item): item is Project => item !== null)
  return {
    items,
    total: total ?? items.length,
    page,
    pageSize,
  }
}
