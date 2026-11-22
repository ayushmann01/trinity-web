import { describe, expect, it } from 'vitest'
import {
  mapProjectResponseToDraft,
  mapStakeholdersToDraftApi,
  mapWizardToDraftPayload,
  UNTITLED_PROJECT_TITLE,
  wizardSnapshot,
} from '@/features/projects/lib/mapProjectDraftApi'
import { persistDraftOnServer } from '@/features/projects/lib/saveWizardDraft'
import { emptyProjectProfile } from '@/features/projects/schemas/projectProfile'
import { emptyProjectCertification } from '@/features/projects/schemas/projectCertification'
import { emptyProjectTimeline, sampleProjectTimeline } from '@/features/projects/schemas/projectTimeline'
import { createEmptyProjectStakeholders } from '@/features/projects/schemas/projectStakeholders'
import { emptyProjectScorecard } from '@/features/projects/schemas/projectScorecard'
import type { Certification, Project } from '@/features/projects/types'

const griha: Certification = {
  id: 'C1',
  name: 'GRIHA',
  typologies: [{ id: 'Office', name: 'Office' }],
  versions: [
    {
      id: 'C1_V1',
      name: 'Version 2019',
      categories: [{ id: 'C1_V1_D1', name: 'GRIHA', certificationDataId: 1 }],
    },
  ],
  categories: [{ id: 'C1_V1_D1', name: 'GRIHA', certificationDataId: 1 }],
  ratings: [{ id: '4', name: 'GRIHA 4 Star' }],
}

describe('mapWizardToDraftPayload', () => {
  it('maps wizard fields onto the backend draft contract and omits unknown keys', () => {
    const payload = mapWizardToDraftPayload(
      {
        ...emptyProjectProfile,
        name: 'Atrium Towers',
        location: 'New Delhi',
        climateZone: 'composite',
        typologyId: 'Office',
        plotArea: '12000',
        plotAreaUnit: 'sq_m',
        totalBuiltUpArea: '18000',
        floorsAboveGround: '8',
        basements: '2',
      },
      {
        ...emptyProjectCertification,
        certificationId: 'C1',
        versionId: 'C1_V1',
        categoryId: 'C1_V1_D1',
        typologyId: 'Office',
        targetRatingId: '4',
        stage: 'pre-certification',
      },
      {
        ...sampleProjectTimeline,
        otherMilestones: [{ id: 'om-1', name: 'Kickoff', date: '2027-01-20' }],
        offWeeks: [{ id: 'ow-1', start: '2027-05-01', end: '2027-05-07' }],
      },
      4,
      [griha],
      { state: 'DRAFT' },
    )

    expect(payload).toEqual({
      state: 'DRAFT',
      project_title: 'Atrium Towers',
      draft_step: 4,
      location: 'New Delhi',
      climate_zone: 'composite',
      site_area: 12000,
      typology: 'Office',
      certification_data_id: 1,
      target_id: '4',
      timeline: {
        start_date: '2027-01-15',
        design_phase_start: '2027-03-01',
        design_phase_end: '2027-06-30',
        construction_phase_start: '2027-08-01',
        construction_phase_end: '2027-11-30',
        pre_certification_deadline: '2027-06-15',
        certification_deadline: '2027-12-20',
        site_visit_dates: ['2027-04-10', '2027-09-12'],
        off_weeks: [{ start_date: '2027-05-01', end_date: '2027-05-07' }],
        milestones: [{ name: 'Kickoff', date: '2027-01-20' }],
      },
      meta: {
        plot_area_unit: 'sq_m',
        certification_boundary_area_unit: 'sq_m',
        total_built_up_area_unit: 'sq_m',
        total_built_up_area: 18000,
        floors_above_ground: 8,
        basements: 2,
        certification_stage: 'pre-certification',
      },
    })
    expect(payload).not.toHaveProperty('notes')
    expect(payload).not.toHaveProperty('attempted_ids')
    expect(payload).not.toHaveProperty('status')
  })

  it('uses Untitled project when the title is blank', () => {
    const payload = mapWizardToDraftPayload(
      emptyProjectProfile,
      emptyProjectCertification,
      emptyProjectTimeline,
      1,
    )
    expect(payload.project_title).toBe(UNTITLED_PROJECT_TITLE)
    expect(payload.timeline).toBeUndefined()
    expect(payload.certification_data_id).toBeUndefined()
  })
})

describe('mapProjectResponseToDraft', () => {
  it('resumes the wizard at draft_step with mapped profile, certification, and timeline', () => {
    const project: Project = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Atrium Towers',
      state: 'DRAFT',
      draftStep: 4,
      code: undefined,
      certificationId: 'C1',
      certificationVersionId: 'C1_V1',
      certificationCategoryId: 'C1_V1_D1',
      certificationDataId: 1,
      targetId: '4',
      typologyId: 'Office',
      location: 'New Delhi',
      climateZone: 'Composite',
      plotArea: 12000,
      plotAreaUnit: 'sq_m',
      totalBuiltUpArea: 18000,
      floorsAboveGround: 8,
      certificationStage: 'pre-certification',
      startDate: '2027-01-15',
      certificationDeadline: '2027-12-20',
      siteVisitDates: ['2027-04-10'],
      offWeeks: [{ startDate: '2027-05-01', endDate: '2027-05-07' }],
      milestones: [{ name: 'Kickoff', date: '2027-01-20' }],
    }

    const mapped = mapProjectResponseToDraft(project, {
      scorecard: { attemptedIds: [109], maybeIds: [121] },
      stakeholders: [{ stakeholder_id: 8, email: 'lead@example.com', status: 'ADMIN' }],
    })

    expect(mapped.currentStep).toBe(4)
    expect(mapped.profile.name).toBe('Atrium Towers')
    expect(mapped.profile.plotArea).toBe('12000')
    expect(mapped.certification).toMatchObject({
      certificationId: 'C1',
      versionId: 'C1_V1',
      categoryId: 'C1_V1_D1',
      targetRatingId: '4',
      typologyId: 'Office',
    })
    expect(mapped.timeline.projectStart).toBe('2027-01-15')
    expect(mapped.timeline.siteVisits[0]?.date).toBe('2027-04-10')
    expect(mapped.scorecard.attemptedIds).toEqual([109])
    expect(mapped.scorecard.maybeIds).toEqual([121])
    expect(mapped.stakeholders.people[0]).toMatchObject({
      email: 'lead@example.com',
      role: 'admin',
    })
    expect(mapped.project.id).toBe(project.id)
  })
})

describe('mapStakeholdersToDraftApi', () => {
  it('only posts rows that have a numeric stakeholder_id and an email', () => {
    const values = createEmptyProjectStakeholders()
    values.people[0] = { ...values.people[0], categoryId: 'architect', email: 'a@x.com', role: 'admin' }
    values.people[1] = { ...values.people[1], categoryId: '8', email: 'b@x.com', role: 'editor' }
    expect(mapStakeholdersToDraftApi(values)).toEqual([
      { stakeholder_id: 8, email: 'b@x.com', status: 'CONTRIBUTOR' },
    ])
  })
})

describe('persistDraftOnServer', () => {
  it('creates on first save and patches afterwards', async () => {
    const create = async (body: { state?: string }) => {
      expect(body.state).toBe('DRAFT')
      return { id: 'draft-1', name: 'Atrium', certificationId: '', state: 'DRAFT' } as Project
    }
    const update = async (id: string) =>
      ({ id, name: 'Atrium', certificationId: '', state: 'DRAFT' }) as Project
    const created = await persistDraftOnServer({
      payload: { project_title: 'Atrium', draft_step: 1 },
      create,
      update,
    })
    expect(created.created).toBe(true)
    expect(created.project.id).toBe('draft-1')

    const patched = await persistDraftOnServer({
      projectId: 'draft-1',
      payload: { project_title: 'Atrium', draft_step: 2 },
      create,
      update,
    })
    expect(patched.created).toBe(false)
    expect(patched.project.id).toBe('draft-1')

    const blankId = await persistDraftOnServer({
      projectId: '   ',
      payload: { project_title: 'Atrium' },
      create,
      update,
    })
    expect(blankId.created).toBe(true)
  })

  it('posts criteria once a certification_data_id is present', async () => {
    let posted: { attemptedIds: number[]; maybeIds: number[] } | null = null
    const result = await persistDraftOnServer({
      projectId: 'draft-1',
      payload: { project_title: 'Atrium', certification_data_id: 1, draft_step: 3 },
      create: async () => ({ id: 'x', name: '', certificationId: '' }),
      update: async (id) => ({ id, name: 'Atrium', certificationId: 'C1', certificationDataId: 1 }),
      saveCriteria: async (_id, attemptedIds, maybeIds) => {
        posted = { attemptedIds, maybeIds }
      },
      scorecard: { attemptedIds: [109], maybeIds: [121] },
    })
    expect(result.created).toBe(false)
    expect(posted).toEqual({ attemptedIds: [109], maybeIds: [121] })
  })
})

describe('wizardSnapshot', () => {
  it('ignores generated row ids when comparing dirty state', () => {
    const left = wizardSnapshot({
      currentStep: 4,
      profile: emptyProjectProfile,
      certification: emptyProjectCertification,
      timeline: {
        ...emptyProjectTimeline,
        siteVisits: [{ id: 'a', date: '2027-01-01' }],
      },
      stakeholders: createEmptyProjectStakeholders(),
      scorecard: emptyProjectScorecard,
    })
    const right = wizardSnapshot({
      currentStep: 4,
      profile: emptyProjectProfile,
      certification: emptyProjectCertification,
      timeline: {
        ...emptyProjectTimeline,
        siteVisits: [{ id: 'b', date: '2027-01-01' }],
      },
      stakeholders: createEmptyProjectStakeholders(),
      scorecard: emptyProjectScorecard,
    })
    expect(left).toBe(right)
  })
})
