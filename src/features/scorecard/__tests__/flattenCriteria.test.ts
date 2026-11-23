import { describe, expect, it } from 'vitest'
import { recordFromNode } from '@/features/scorecard/lib/flattenCriteria'

describe('recordFromNode calculator_id', () => {
  it('keeps a non-empty calculator_id text array', () => {
    expect(recordFromNode({ id: 1, calculator_id: ['C-P09-01'] }).calculator_id).toEqual(['C-P09-01'])
  })

  it('treats null, empty arrays, and blank strings as no calculator', () => {
    expect(recordFromNode({ id: 1, calculator_id: null }).calculator_id).toBeNull()
    expect(recordFromNode({ id: 1, calculator_id: [] }).calculator_id).toBeNull()
    expect(recordFromNode({ id: 1, calculator_id: ['', ' '] }).calculator_id).toBeNull()
    expect(recordFromNode({ id: 1 }).calculator_id).toBeNull()
  })

  it('reads calculator_ids, a lone string, or nested calculator / criteria_data', () => {
    expect(recordFromNode({ id: 1, calculator_ids: ['C-G01-01'] }).calculator_id).toEqual(['C-G01-01'])
    expect(recordFromNode({ id: 1, calculator_id: 'C-P01-01' as unknown as string[] }).calculator_id).toEqual([
      'C-P01-01',
    ])
    expect(recordFromNode({ id: 1, calculator: { id: 'C-NEST-01' } }).calculator_id).toEqual(['C-NEST-01'])
    expect(
      recordFromNode({ id: 1, criteria_data: { calculator_id: ['C-DATA-01'] } }).calculator_id,
    ).toEqual(['C-DATA-01'])
  })
})

describe('recordFromNode references', () => {
  it('keeps a URL and drops null, empty string, or empty arrays', () => {
    expect(recordFromNode({ id: 1, references: 'https://www.grihaindia.org' }).references).toBe(
      'https://www.grihaindia.org',
    )
    expect(recordFromNode({ id: 1, references: null }).references).toBeNull()
    expect(recordFromNode({ id: 1, references: '  ' }).references).toBeNull()
    expect(recordFromNode({ id: 1, references: [] as unknown as string }).references).toBeNull()
  })

  it('joins a non-empty references array', () => {
    expect(
      recordFromNode({ id: 1, references: ['https://a.example', 'https://b.example'] as unknown as string })
        .references,
    ).toBe('https://a.example\nhttps://b.example')
  })
})
