import type { Project, ProjectMilestone, ProjectOffWeek } from '@/features/projects/types'
import type { ProjectTimelineFormValues } from '@/features/projects/schemas/projectTimeline'

function isoOrUndefined(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed || undefined
}

/** Maps wizard step-4 fields onto the project API shape. Does not submit. */
export function mapProjectTimelineToApi(values: ProjectTimelineFormValues): Partial<Project> {
  const siteVisitDates = values.siteVisits
    .map((visit) => visit.date.trim())
    .filter(Boolean)
  const offWeeks: ProjectOffWeek[] = values.offWeeks
    .filter((week) => week.start.trim() && week.end.trim())
    .map((week) => ({ startDate: week.start.trim(), endDate: week.end.trim() }))
  const milestones: ProjectMilestone[] = values.otherMilestones
    .filter((milestone) => milestone.name.trim() && milestone.date.trim())
    .map((milestone) => ({ name: milestone.name.trim(), date: milestone.date.trim() }))

  return {
    startDate: isoOrUndefined(values.projectStart),
    designPhaseStart: isoOrUndefined(values.designStart),
    designPhaseEnd: isoOrUndefined(values.designEnd),
    constructionPhaseStart: isoOrUndefined(values.constructionStart),
    constructionPhaseEnd: isoOrUndefined(values.constructionEnd),
    preCertificationDeadline: isoOrUndefined(values.preCertificationDeadline),
    certificationDeadline: isoOrUndefined(values.certificationDeadline),
    siteVisitDates: siteVisitDates.length ? siteVisitDates : undefined,
    offWeeks: offWeeks.length ? offWeeks : undefined,
    milestones: milestones.length ? milestones : undefined,
  }
}
