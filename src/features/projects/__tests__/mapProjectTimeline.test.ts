import { describe, expect, it } from 'vitest'
import { mapProjectTimelineToApi } from '@/features/projects/lib/mapProjectTimeline'
import { mapWizardDraftToApi } from '@/features/projects/lib/mapProjectDraft'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'
import { emptyProjectCertification } from '@/features/projects/schemas/projectCertification'
import { emptyProjectTimeline, sampleProjectTimeline } from '@/features/projects/schemas/projectTimeline'

describe('mapProjectTimelineToApi', () => {
  it('maps filled timeline fields onto the project API shape', () => {
    const payload = mapProjectTimelineToApi({
      ...sampleProjectTimeline,
      otherMilestones: [{ id: 'om-1', name: 'Facade review', date: '2027-05-01' }],
      offWeeks: [{ id: 'ow-1', start: '2027-10-01', end: '2027-10-07' }],
    })

    expect(payload).toMatchObject({
      startDate: '2027-01-15',
      designPhaseStart: '2027-03-01',
      designPhaseEnd: '2027-06-30',
      constructionPhaseStart: '2027-08-01',
      constructionPhaseEnd: '2027-11-30',
      preCertificationDeadline: '2027-06-15',
      certificationDeadline: '2027-12-20',
      siteVisitDates: ['2027-04-10', '2027-09-12'],
      offWeeks: [{ startDate: '2027-10-01', endDate: '2027-10-07' }],
      milestones: [{ name: 'Facade review', date: '2027-05-01' }],
    })
  })

  it('omits blank optional collections', () => {
    const payload = mapProjectTimelineToApi(emptyProjectTimeline)
    expect(payload.startDate).toBeUndefined()
    expect(payload.siteVisitDates).toBeUndefined()
    expect(payload.offWeeks).toBeUndefined()
    expect(payload.milestones).toBeUndefined()
  })
})

describe('mapWizardDraftToApi timeline', () => {
  it('includes timeline dates on the combined project payload', () => {
    const payload = mapWizardDraftToApi(
      { ...emptyProjectProfile, name: 'Harbor' },
      { ...emptyProjectCertification, certificationId: 'griha' },
      sampleProjectTimeline,
    )
    expect(payload).toMatchObject({
      name: 'Harbor',
      certificationId: 'griha',
      startDate: '2027-01-15',
      certificationDeadline: '2027-12-20',
    })
  })
})
