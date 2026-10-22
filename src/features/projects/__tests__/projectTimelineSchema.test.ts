import { describe, expect, it } from 'vitest'
import {
  emptyProjectTimeline,
  projectTimelineSchema,
  sampleProjectTimeline,
} from '@/features/projects/schemas/projectTimeline'

describe('projectTimelineSchema', () => {
  it('requires the phase and deadline dates', () => {
    const result = projectTimelineSchema.safeParse(emptyProjectTimeline)
    expect(result.success).toBe(false)
    if (result.success) return
    const paths = result.error.issues.map((issue) => issue.path[0])
    expect(paths).toEqual(
      expect.arrayContaining([
        'projectStart',
        'designStart',
        'designEnd',
        'constructionStart',
        'constructionEnd',
        'preCertificationDeadline',
        'certificationDeadline',
      ]),
    )
  })

  it('accepts the sample timeline and ignores empty other-milestone rows', () => {
    const result = projectTimelineSchema.safeParse(sampleProjectTimeline)
    expect(result.success).toBe(true)
  })

  it('rejects ends that are not after starts and out-of-order phases', () => {
    const result = projectTimelineSchema.safeParse({
      ...sampleProjectTimeline,
      designEnd: '2027-02-01',
      constructionStart: '2027-01-20',
    })
    expect(result.success).toBe(false)
    if (result.success) return
    const messages = result.error.issues.map((issue) => issue.message)
    expect(messages).toEqual(
      expect.arrayContaining([
        'Design phase must end after it starts',
        'Construction must start after the design phase ends',
      ]),
    )
  })

  it('rejects an off-week whose end is before its start', () => {
    const result = projectTimelineSchema.safeParse({
      ...sampleProjectTimeline,
      offWeeks: [{ id: 'ow-1', start: '2027-05-10', end: '2027-05-01' }],
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((issue) => issue.path.join('.') === 'offWeeks.0.end')).toBe(true)
  })

  it('requires a date when an other milestone has a name', () => {
    const result = projectTimelineSchema.safeParse({
      ...sampleProjectTimeline,
      otherMilestones: [{ id: 'om-2', name: 'Kickoff', date: '' }],
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((issue) => issue.path.join('.') === 'otherMilestones.0.date')).toBe(
      true,
    )
  })
})
