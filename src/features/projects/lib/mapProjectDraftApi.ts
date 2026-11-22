import type { Certification, Project } from '@/features/projects/types'
import { CLIMATE_ZONES } from '@/features/projects/constants'
import { certificationDataIdFor } from '@/features/projects/lib/certificationCatalog'
import {
  emptyProjectProfile,
  type ProjectProfileFormValues,
} from '@/features/projects/schemas/projectProfile'
import {
  emptyProjectCertification,
  type ProjectCertificationFormValues,
} from '@/features/projects/schemas/projectCertification'
import {
  cloneTimeline,
  createEmptyMilestone,
  createEmptyOffWeek,
  createEmptySiteVisit,
  emptyProjectTimeline,
  type ProjectTimelineFormValues,
} from '@/features/projects/schemas/projectTimeline'
import {
  cloneStakeholders,
  createEmptyPerson,
  createEmptyProjectStakeholders,
  emptyProjectStakeholders,
  filledStakeholders,
  type ProjectStakeholdersFormValues,
} from '@/features/projects/schemas/projectStakeholders'
import { cloneScorecard, emptyProjectScorecard } from '@/features/projects/schemas/projectScorecard'
import { mapWizardDraftToApi } from '@/features/projects/lib/mapProjectDraft'
import type { ProjectDraftState } from '@/features/projects/state/projectDraftSlice'
import type { ProjectScorecardDraft } from '@/features/scorecard/types'

export const UNTITLED_PROJECT_TITLE = 'Untitled project'

export type DraftTimelinePayload = {
  start_date?: string | null
  design_phase_start?: string | null
  design_phase_end?: string | null
  construction_phase_start?: string | null
  construction_phase_end?: string | null
  pre_certification_deadline?: string | null
  certification_deadline?: string | null
  site_visit_dates?: string[]
  off_weeks?: Array<{ start_date: string; end_date: string }>
  milestones?: Array<{ name: string; date: string }>
}

export type DraftMetaPayload = {
  plot_area_unit?: 'sq_m' | 'sq_ft' | null
  certification_boundary_area?: number | null
  certification_boundary_area_unit?: 'sq_m' | 'sq_ft' | null
  total_built_up_area?: number | null
  total_built_up_area_unit?: 'sq_m' | 'sq_ft' | null
  approved_far?: number | null
  floors_above_ground?: number | null
  basements?: number | null
  certification_stage?: 'pre-certification' | 'certification' | null
}

export type DraftApiPayload = {
  state?: 'DRAFT' | 'CREATED'
  project_title: string
  project_id?: string | null
  draft_step?: number
  certification_data_id?: number
  target_id?: string
  typology?: string | null
  location?: string | null
  climate_zone?: string | null
  site_area?: number | null
  timeline?: DraftTimelinePayload | null
  meta?: DraftMetaPayload | null
}

export type DraftStakeholderPayload = {
  stakeholder_id: number
  email: string
  status?: 'ADMIN' | 'CONTRIBUTOR' | 'COORDINATOR' | 'TEMP'
  level?: 'PRIMARY' | 'SECONDARY'
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function trimOrUndefined(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function parseNumber(value: string | null | undefined): number | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseInteger(value: string | null | undefined): number | undefined {
  const parsed = parseNumber(value)
  if (parsed == null) return undefined
  return Math.round(parsed)
}

function isoDate(value: string | null | undefined): string | undefined {
  const trimmed = trimOrUndefined(value)
  if (!trimmed || !ISO_DATE.test(trimmed)) return undefined
  return trimmed
}

function mapTimeline(values: ProjectTimelineFormValues): DraftTimelinePayload | undefined {
  const site_visit_dates = values.siteVisits.map((visit) => isoDate(visit.date)).filter((item): item is string => Boolean(item))
  const off_weeks = values.offWeeks
    .map((week) => {
      const start_date = isoDate(week.start)
      const end_date = isoDate(week.end)
      if (!start_date || !end_date) return null
      return { start_date, end_date }
    })
    .filter((item): item is { start_date: string; end_date: string } => item !== null)
  const milestones = values.otherMilestones
    .map((milestone) => {
      const name = trimOrUndefined(milestone.name)
      const date = isoDate(milestone.date)
      if (!name || !date) return null
      return { name, date }
    })
    .filter((item): item is { name: string; date: string } => item !== null)

  const payload: DraftTimelinePayload = {}
  const start_date = isoDate(values.projectStart)
  const design_phase_start = isoDate(values.designStart)
  const design_phase_end = isoDate(values.designEnd)
  const construction_phase_start = isoDate(values.constructionStart)
  const construction_phase_end = isoDate(values.constructionEnd)
  const pre_certification_deadline = isoDate(values.preCertificationDeadline)
  const certification_deadline = isoDate(values.certificationDeadline)
  if (start_date) payload.start_date = start_date
  if (design_phase_start) payload.design_phase_start = design_phase_start
  if (design_phase_end) payload.design_phase_end = design_phase_end
  if (construction_phase_start) payload.construction_phase_start = construction_phase_start
  if (construction_phase_end) payload.construction_phase_end = construction_phase_end
  if (pre_certification_deadline) payload.pre_certification_deadline = pre_certification_deadline
  if (certification_deadline) payload.certification_deadline = certification_deadline
  if (site_visit_dates.length) payload.site_visit_dates = site_visit_dates
  if (off_weeks.length) payload.off_weeks = off_weeks
  if (milestones.length) payload.milestones = milestones
  return Object.keys(payload).length > 0 ? payload : undefined
}

export function mapWizardToDraftPayload(
  profile: ProjectProfileFormValues,
  certification: ProjectCertificationFormValues,
  timeline: ProjectTimelineFormValues,
  currentStep: number,
  certifications: Certification[] = [],
  options: { projectCode?: string | null; state?: 'DRAFT' | 'CREATED' } = {},
): DraftApiPayload {
  const title = trimOrUndefined(profile.name) ?? UNTITLED_PROJECT_TITLE
  const selectedCert = certifications.find((item) => item.id === certification.certificationId.trim())
  const certificationDataId = certificationDataIdFor(
    selectedCert,
    certification.versionId,
    certification.categoryId,
  )
  const typology = trimOrUndefined(certification.typologyId) ?? trimOrUndefined(profile.typologyId)
  const targetId = trimOrUndefined(certification.targetRatingId)
  const plotArea = parseInteger(profile.plotArea)
  const boundary = parseNumber(profile.certificationBoundaryArea)
  const builtUp = parseNumber(profile.totalBuiltUpArea)
  const far = parseNumber(profile.approvedFar)
  const floors = parseInteger(profile.floorsAboveGround)
  const basements = parseInteger(profile.basements)

  const payload: DraftApiPayload = {
    project_title: title,
    draft_step: currentStep,
    meta: {
      plot_area_unit: profile.plotAreaUnit,
      certification_boundary_area_unit: profile.certificationBoundaryAreaUnit,
      total_built_up_area_unit: profile.totalBuiltUpAreaUnit,
      certification_stage: certification.stage,
    },
  }

  if (options.state) payload.state = options.state
  const code = trimOrUndefined(options.projectCode ?? undefined)
  if (code) payload.project_id = code

  const location = trimOrUndefined(profile.location)
  if (location) payload.location = location
  const climate = trimOrUndefined(profile.climateZone)
  if (climate) payload.climate_zone = climate
  if (plotArea != null) payload.site_area = Math.max(0, plotArea)
  if (typology) payload.typology = typology
  if (certificationDataId != null) payload.certification_data_id = certificationDataId
  if (targetId) payload.target_id = targetId

  if (payload.meta) {
    if (boundary != null) payload.meta.certification_boundary_area = boundary
    if (builtUp != null) payload.meta.total_built_up_area = builtUp
    if (far != null) payload.meta.approved_far = far
    if (floors != null) payload.meta.floors_above_ground = floors
    if (basements != null) payload.meta.basements = basements
  }

  const mappedTimeline = mapTimeline(timeline)
  if (mappedTimeline) payload.timeline = mappedTimeline

  return payload
}

export function mapStakeholdersToDraftApi(
  values: ProjectStakeholdersFormValues,
): DraftStakeholderPayload[] {
  return filledStakeholders(values).flatMap((person) => {
    const email = person.email.trim()
    const stakeholderId = Number(person.categoryId)
    if (!email || !Number.isInteger(stakeholderId) || stakeholderId <= 0) return []
    const role = person.role.trim().toLowerCase()
    const status =
      role === 'admin'
        ? 'ADMIN'
        : role === 'editor' || role === 'contributor'
          ? 'CONTRIBUTOR'
          : role === 'coordinator'
            ? 'COORDINATOR'
            : role
              ? 'TEMP'
              : undefined
    const payload: DraftStakeholderPayload = { stakeholder_id: stakeholderId, email }
    if (status) payload.status = status
    return [payload]
  })
}

function climateZoneFor(value: string | undefined): string {
  if (!value) return ''
  const match = CLIMATE_ZONES.find(
    (zone) => zone.value === value || zone.label.toLowerCase() === value.toLowerCase(),
  )
  return match?.value ?? value
}

function stringFrom(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

export function mapTimelineFromApi(
  timeline: DraftTimelinePayload | Project | null | undefined,
): ProjectTimelineFormValues {
  const source = (timeline ?? {}) as DraftTimelinePayload & {
    startDate?: string
    designPhaseStart?: string
    designPhaseEnd?: string
    constructionPhaseStart?: string
    constructionPhaseEnd?: string
    preCertificationDeadline?: string
    certificationDeadline?: string
    siteVisitDates?: string[]
    offWeeks?: Array<{ startDate?: string; endDate?: string; start_date?: string; end_date?: string }>
    milestones?: Array<{ name?: string; date?: string }>
  }
  const siteDates = source.site_visit_dates ?? source.siteVisitDates ?? []
  const offWeeks: Array<{ startDate?: string; endDate?: string; start_date?: string; end_date?: string }> =
    source.offWeeks ?? source.off_weeks ?? []
  const milestones = source.milestones ?? []
  const mapped: ProjectTimelineFormValues = {
    projectStart: isoDate(source.start_date ?? source.startDate) ?? '',
    designStart: isoDate(source.design_phase_start ?? source.designPhaseStart) ?? '',
    designEnd: isoDate(source.design_phase_end ?? source.designPhaseEnd) ?? '',
    constructionStart: isoDate(source.construction_phase_start ?? source.constructionPhaseStart) ?? '',
    constructionEnd: isoDate(source.construction_phase_end ?? source.constructionPhaseEnd) ?? '',
    preCertificationDeadline: isoDate(source.pre_certification_deadline ?? source.preCertificationDeadline) ?? '',
    certificationDeadline: isoDate(source.certification_deadline ?? source.certificationDeadline) ?? '',
    siteVisits: siteDates.filter(Boolean).map((date) => ({ ...createEmptySiteVisit(), date })),
    offWeeks: offWeeks
      .map((week) => ({
        ...createEmptyOffWeek(),
        start: isoDate(week.start_date ?? week.startDate) ?? '',
        end: isoDate(week.end_date ?? week.endDate) ?? '',
      }))
      .filter((week) => week.start || week.end),
    otherMilestones: milestones
      .map((milestone) => ({
        ...createEmptyMilestone(),
        name: milestone.name?.trim() ?? '',
        date: isoDate(milestone.date) ?? '',
      }))
      .filter((milestone) => milestone.name || milestone.date),
  }
  if (mapped.otherMilestones.length === 0) mapped.otherMilestones = [createEmptyMilestone()]
  return cloneTimeline(mapped)
}

export function mapProjectResponseToDraft(
  project: Project,
  extras: {
    scorecard?: Partial<ProjectScorecardDraft> | null
    stakeholders?: Array<{
      stakeholder_id?: number | string
      email?: string
      status?: string
      level?: string
      stakeholder_category?: string
    }>
  } = {},
): ProjectDraftState {
  const profile: ProjectProfileFormValues = {
    ...emptyProjectProfile,
    name: project.name ?? '',
    location: project.location ?? '',
    climateZone: climateZoneFor(project.climateZone),
    typologyId: project.typologyId ?? '',
    plotArea: project.plotArea != null ? String(project.plotArea) : '',
    plotAreaUnit: project.plotAreaUnit ?? 'sq_m',
    certificationBoundaryArea:
      project.certificationBoundaryArea != null ? String(project.certificationBoundaryArea) : '',
    certificationBoundaryAreaUnit: project.certificationBoundaryAreaUnit ?? 'sq_m',
    totalBuiltUpArea: project.totalBuiltUpArea != null ? String(project.totalBuiltUpArea) : '',
    totalBuiltUpAreaUnit: project.totalBuiltUpAreaUnit ?? 'sq_m',
    approvedFar: project.approvedFar != null ? String(project.approvedFar) : '',
    floorsAboveGround: project.floorsAboveGround != null ? String(project.floorsAboveGround) : '',
    basements: project.basements != null ? String(project.basements) : '',
  }

  const stage = project.certificationStage === 'certification' ? 'certification' : 'pre-certification'
  const certification: ProjectCertificationFormValues = {
    ...emptyProjectCertification,
    certificationId: project.certificationId ?? '',
    versionId: project.certificationVersionId ?? '',
    categoryId: project.certificationCategoryId ?? '',
    typologyId: project.typologyId ?? '',
    targetRatingId: project.targetId ?? project.targetRating ?? '',
    stage,
  }

  const timeline = mapTimelineFromApi({
    startDate: project.startDate,
    designPhaseStart: project.designPhaseStart,
    designPhaseEnd: project.designPhaseEnd,
    constructionPhaseStart: project.constructionPhaseStart,
    constructionPhaseEnd: project.constructionPhaseEnd,
    preCertificationDeadline: project.preCertificationDeadline,
    certificationDeadline: project.certificationDeadline,
    siteVisitDates: project.siteVisitDates,
    offWeeks: project.offWeeks,
    milestones: project.milestones,
  })

  const people = (extras.stakeholders ?? []).map((row) => {
    const categoryId = stringFrom(row.stakeholder_id || row.stakeholder_category)
    const status = row.status?.toLowerCase() ?? ''
    const role =
      status === 'admin' ? 'admin' : status === 'contributor' ? 'editor' : status === 'temp' ? 'viewer' : status
    return {
      ...createEmptyPerson(categoryId || 'client'),
      email: row.email ?? '',
      role,
    }
  })

  const stakeholders =
    people.length > 0 ? cloneStakeholders({ people }) : createEmptyProjectStakeholders()

  const scorecard = cloneScorecard({
    ...emptyProjectScorecard,
    attemptedIds: extras.scorecard?.attemptedIds ?? [],
    maybeIds: extras.scorecard?.maybeIds ?? [],
    notes: extras.scorecard?.notes ?? {},
    summary: extras.scorecard?.summary ?? emptyProjectScorecard.summary,
  })

  const step = project.draftStep && project.draftStep >= 1 && project.draftStep <= 6 ? project.draftStep : 1

  return {
    currentStep: step,
    profile,
    certification,
    timeline,
    stakeholders,
    scorecard,
    project: {
      ...mapWizardDraftToApi(profile, certification, timeline),
      id: project.id,
      code: project.code,
      state: project.state,
      draftStep: step,
      certificationDataId: project.certificationDataId,
      targetId: project.targetId,
    },
  }
}

export function wizardSnapshot(input: {
  currentStep: number
  profile: ProjectProfileFormValues
  certification: ProjectCertificationFormValues
  timeline: ProjectTimelineFormValues
  stakeholders: ProjectStakeholdersFormValues
  scorecard: ProjectScorecardDraft
}): string {
  return JSON.stringify({
    currentStep: input.currentStep,
    profile: input.profile,
    certification: input.certification,
    timeline: {
      ...input.timeline,
      siteVisits: input.timeline.siteVisits.map((item) => item.date),
      offWeeks: input.timeline.offWeeks.map((item) => ({ start: item.start, end: item.end })),
      otherMilestones: input.timeline.otherMilestones.map((item) => ({
        name: item.name,
        date: item.date,
      })),
    },
    stakeholders: input.stakeholders.people.map((person) => ({
      categoryId: person.categoryId,
      email: person.email,
      role: person.role,
    })),
    scorecard: {
      attemptedIds: input.scorecard.attemptedIds,
      maybeIds: input.scorecard.maybeIds,
      notes: input.scorecard.notes,
    },
  })
}

export function emptyWizardSnapshot(): string {
  return wizardSnapshot({
    currentStep: 1,
    profile: emptyProjectProfile,
    certification: emptyProjectCertification,
    timeline: emptyProjectTimeline,
    stakeholders: emptyProjectStakeholders,
    scorecard: emptyProjectScorecard,
  })
}

export function generatedProjectCode(): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase()
  return `CMN-${suffix}`
}

export function isWizardPath(pathname: string): boolean {
  return pathname === '/projects/new' || pathname.startsWith('/projects/new/')
}

export { cloneTimeline, cloneStakeholders }
