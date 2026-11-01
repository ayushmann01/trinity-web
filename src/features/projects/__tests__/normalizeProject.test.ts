import { describe, expect, it } from 'vitest'
import {
  normalizeProject,
  normalizeProjectList,
  projectTargetLabel,
} from '@/features/projects/lib/normalizeProject'

describe('normalizeProject', () => {
  it('maps trinity project_information fields onto the list Project shape', () => {
    const project = normalizeProject({
      id: 42,
      project_title: 'Atrium Towers-101',
      certification: 'GRIHA',
      certification_target: '4 Star',
    })

    expect(project).toMatchObject({
      id: '42',
      name: 'Atrium Towers-101',
      certificationId: 'GRIHA',
      targetRating: '4 Star',
    })
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
          certification: 'GRIHA',
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
      certificationId: 'GRIHA',
      targetRating: '4 Star',
    })
  })

  it('accepts a bare array after envelope unwrap', () => {
    const result = normalizeProjectList([
      { id: 'x', name: 'Existing', certificationId: 'griha', targetPoints: 25 },
    ])
    expect(result.items[0]?.name).toBe('Existing')
    expect(projectTargetLabel(result.items[0]!)).toBe('25')
  })
})
