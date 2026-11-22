import { describe, expect, it } from 'vitest'
import {
  isDraftProject,
  normalizeProject,
  normalizeProjectList,
  projectCertificationLabel,
  projectTargetLabel,
} from '@/features/projects/lib/normalizeProject'

describe('normalizeProject', () => {
  it('maps trinity project_information fields onto the list Project shape', () => {
    const project = normalizeProject({
      id: 42,
      project_title: 'Atrium Towers-101',
      certification_title: 'GRIHA Version 2019',
      certification_target: '4 Star',
    })

    expect(project).toMatchObject({
      id: '42',
      name: 'Atrium Towers-101',
      certificationTitle: 'GRIHA Version 2019',
      certificationId: 'GRIHA Version 2019',
      targetRating: '4 Star',
    })
    expect(projectCertificationLabel(project!)).toBe('GRIHA Version 2019')
    expect(projectTargetLabel(project!)).toBe('4 Star')
  })

  it('unwraps a nested project_information object', () => {
    const project = normalizeProject({
      id: 'p-1',
      project_information: {
        project_title: 'Harbor Residences',
        certification_target: 'Gold',
        certification_id: 'leed',
      },
    })

    expect(project).toMatchObject({
      id: 'p-1',
      name: 'Harbor Residences',
      certificationId: 'leed',
      targetRating: 'Gold',
    })
  })

  it('keeps camelCase API projects unchanged', () => {
    const project = normalizeProject({
      id: 'abc',
      name: 'Riverfront',
      certificationId: 'igbc',
      targetPoints: 50,
    })

    expect(project).toMatchObject({
      id: 'abc',
      name: 'Riverfront',
      certificationId: 'igbc',
      targetPoints: 50,
    })
    expect(projectTargetLabel(project!)).toBe('50')
  })

  it('prefers a string name over an empty title alias', () => {
    const project = normalizeProject({
      project_id: 7,
      name: '',
      project_title: 'Atrium Towers-101',
      target: 'Platinum',
    })

    expect(project?.id).toBe('7')
    expect(project?.name).toBe('Atrium Towers-101')
    expect(project?.targetRating).toBe('Platinum')
  })
})

describe('normalizeProjectList', () => {
  it('reads projects[] envelopes and maps each row', () => {
    const result = normalizeProjectList({
      projects: [
        {
          project_id: 1,
          project_title: 'Atrium Towers-101',
          certification_target: '4 Star',
          certification_title: 'GRIHA Version 2019',
        },
      ],
      total: 1,
      page: 1,
      page_size: 10,
    })

    expect(result.total).toBe(1)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      id: '1',
      name: 'Atrium Towers-101',
      certificationTitle: 'GRIHA Version 2019',
      targetRating: '4 Star',
    })
    expect(projectCertificationLabel(result.items[0]!)).toBe('GRIHA Version 2019')
  })

  it('maps draft state, draft_step, timeline, and meta', () => {
    const project = normalizeProject({
      id: '11111111-1111-4111-8111-111111111111',
      project_id: null,
      project_title: 'Atrium Towers',
      state: 'DRAFT',
      draft_step: 3,
      certification_id: 'C1',
      version_id: 'C1_V1',
      category_id: 'C1_V1_D1',
      certification_data_id: 1,
      target_id: '4',
      site_area: 12000,
      timeline: { start_date: '2027-01-15', certification_deadline: '2027-12-20' },
      meta: { plot_area_unit: 'sq_m', floors_above_ground: 8, certification_stage: 'pre-certification' },
    })

    expect(project).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Atrium Towers',
      state: 'DRAFT',
      draftStep: 3,
      certificationId: 'C1',
      certificationVersionId: 'C1_V1',
      certificationCategoryId: 'C1_V1_D1',
      certificationDataId: 1,
      targetId: '4',
      plotArea: 12000,
      startDate: '2027-01-15',
      certificationDeadline: '2027-12-20',
      floorsAboveGround: 8,
      certificationStage: 'pre-certification',
    })
  })

  it('accepts a bare array after envelope unwrap', () => {
    const result = normalizeProjectList([
      { id: 'x', name: 'Existing', certificationId: 'griha', targetPoints: 25 },
    ])
    expect(result.items[0]?.name).toBe('Existing')
    expect(projectTargetLabel(result.items[0]!)).toBe('25')
  })

  it('derives page from limit and offset', () => {
    const result = normalizeProjectList({
      items: [{ id: 'd1', project_title: 'Drafty', state: 'DRAFT' }],
      total: 12,
      limit: 10,
      offset: 10,
    })
    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(10)
    expect(result.items[0]?.state).toBe('DRAFT')
  })
})

describe('isDraftProject', () => {
  it('treats state DRAFT as a draft and CREATED as published', () => {
    expect(isDraftProject({ state: 'DRAFT' })).toBe(true)
    expect(isDraftProject({ state: 'CREATED' })).toBe(false)
    expect(isDraftProject({})).toBe(false)
  })
})
