import { z } from 'zod'
import { isValidIsoDate, parseIsoDate } from '@/features/projects/lib/timeline'

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`
}

const requiredDate = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => isValidIsoDate(value), { message: `${label} is not a valid date` })

function isBefore(left: string, right: string): boolean {
  const start = parseIsoDate(left)
  const end = parseIsoDate(right)
  if (!start || !end) return false
  return start.getTime() < end.getTime()
}

function isOnOrBefore(left: string, right: string): boolean {
  const start = parseIsoDate(left)
  const end = parseIsoDate(right)
  if (!start || !end) return false
  return start.getTime() <= end.getTime()
}

export const projectTimelineSchema = z
  .object({
    projectStart: requiredDate('Project start'),
    designStart: requiredDate('Design phase start'),
    designEnd: requiredDate('Design phase end'),
    constructionStart: requiredDate('Construction phase start'),
    constructionEnd: requiredDate('Construction phase end'),
    preCertificationDeadline: requiredDate('Pre-certification deadline'),
    certificationDeadline: requiredDate('Certification deadline'),
    siteVisits: z.array(
      z.object({
        id: z.string(),
        date: z.string(),
      }),
    ),
    offWeeks: z.array(
      z.object({
        id: z.string(),
        start: z.string(),
        end: z.string(),
      }),
    ),
    otherMilestones: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        date: z.string(),
      }),
    ),
  })
  .superRefine((values, ctx) => {
    if (values.projectStart && values.designStart && !isBefore(values.projectStart, values.designStart)) {
      ctx.addIssue({
        code: 'custom',
        path: ['designStart'],
        message: 'Design phase must start after the project start',
      })
    }
    if (values.designStart && values.designEnd && !isBefore(values.designStart, values.designEnd)) {
      ctx.addIssue({
        code: 'custom',
        path: ['designEnd'],
        message: 'Design phase must end after it starts',
      })
    }
    if (
      values.designEnd &&
      values.constructionStart &&
      !isBefore(values.designEnd, values.constructionStart)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['constructionStart'],
        message: 'Construction must start after the design phase ends',
      })
    }
    if (
      values.constructionStart &&
      values.constructionEnd &&
      !isBefore(values.constructionStart, values.constructionEnd)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['constructionEnd'],
        message: 'Construction phase must end after it starts',
      })
    }
    if (
      values.constructionEnd &&
      values.certificationDeadline &&
      !isBefore(values.constructionEnd, values.certificationDeadline)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['certificationDeadline'],
        message: 'Certification deadline must be after construction ends',
      })
    }
    if (
      values.preCertificationDeadline &&
      values.certificationDeadline &&
      !isBefore(values.preCertificationDeadline, values.certificationDeadline)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['preCertificationDeadline'],
        message: 'Pre-certification deadline must be before the certification deadline',
      })
    }

    values.siteVisits.forEach((visit, index) => {
      if (visit.date.trim() && !isValidIsoDate(visit.date)) {
        ctx.addIssue({
          code: 'custom',
          path: ['siteVisits', index, 'date'],
          message: 'Enter a valid date',
        })
      }
    })

    values.offWeeks.forEach((week, index) => {
      const start = week.start.trim()
      const end = week.end.trim()
      if (!start && !end) return
      if (!start) {
        ctx.addIssue({
          code: 'custom',
          path: ['offWeeks', index, 'start'],
          message: 'Start date is required',
        })
      } else if (!isValidIsoDate(start)) {
        ctx.addIssue({
          code: 'custom',
          path: ['offWeeks', index, 'start'],
          message: 'Enter a valid date',
        })
      }
      if (!end) {
        ctx.addIssue({
          code: 'custom',
          path: ['offWeeks', index, 'end'],
          message: 'End date is required',
        })
      } else if (!isValidIsoDate(end)) {
        ctx.addIssue({
          code: 'custom',
          path: ['offWeeks', index, 'end'],
          message: 'Enter a valid date',
        })
      }
      if (start && end && isValidIsoDate(start) && isValidIsoDate(end) && !isOnOrBefore(start, end)) {
        ctx.addIssue({
          code: 'custom',
          path: ['offWeeks', index, 'end'],
          message: 'Off-week end must be on or after the start',
        })
      }
    })

    values.otherMilestones.forEach((milestone, index) => {
      const name = milestone.name.trim()
      const date = milestone.date.trim()
      if (!name && !date) return
      if (!name) {
        ctx.addIssue({
          code: 'custom',
          path: ['otherMilestones', index, 'name'],
          message: 'Milestone name is required',
        })
      }
      if (!date) {
        ctx.addIssue({
          code: 'custom',
          path: ['otherMilestones', index, 'date'],
          message: 'Date is required',
        })
      } else if (!isValidIsoDate(date)) {
        ctx.addIssue({
          code: 'custom',
          path: ['otherMilestones', index, 'date'],
          message: 'Enter a valid date',
        })
      }
    })
  })

export type ProjectTimelineFormValues = z.infer<typeof projectTimelineSchema>

export function createEmptyMilestone(): ProjectTimelineFormValues['otherMilestones'][number] {
  return { id: createId(), name: '', date: '' }
}

export function createEmptySiteVisit(): ProjectTimelineFormValues['siteVisits'][number] {
  return { id: createId(), date: '' }
}

export function createEmptyOffWeek(): ProjectTimelineFormValues['offWeeks'][number] {
  return { id: createId(), start: '', end: '' }
}

export function createEmptyProjectTimeline(): ProjectTimelineFormValues {
  return {
    projectStart: '',
    designStart: '',
    designEnd: '',
    constructionStart: '',
    constructionEnd: '',
    preCertificationDeadline: '',
    certificationDeadline: '',
    siteVisits: [],
    offWeeks: [],
    otherMilestones: [createEmptyMilestone()],
  }
}

export const emptyProjectTimeline: ProjectTimelineFormValues = createEmptyProjectTimeline()

export function cloneTimeline(
  values: ProjectTimelineFormValues = emptyProjectTimeline,
): ProjectTimelineFormValues {
  return {
    ...emptyProjectTimeline,
    ...values,
    siteVisits: (values.siteVisits ?? []).map((item) => ({ ...item })),
    offWeeks: (values.offWeeks ?? []).map((item) => ({ ...item })),
    otherMilestones: (values.otherMilestones ?? []).map((item) => ({ ...item })),
  }
}

export const sampleProjectTimeline: ProjectTimelineFormValues = {
  projectStart: '2027-01-15',
  designStart: '2027-03-01',
  designEnd: '2027-06-30',
  constructionStart: '2027-08-01',
  constructionEnd: '2027-11-30',
  preCertificationDeadline: '2027-06-15',
  certificationDeadline: '2027-12-20',
  siteVisits: [
    { id: 'sv-1', date: '2027-04-10' },
    { id: 'sv-2', date: '2027-09-12' },
  ],
  offWeeks: [],
  otherMilestones: [{ id: 'om-1', name: '', date: '' }],
}
