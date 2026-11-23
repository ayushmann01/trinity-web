import { describe, expect, it } from 'vitest'
import {
  chipCode,
  displayCode,
  hasCalculatorData,
  hasCriterionReferences,
} from '@/features/scorecard/lib/formatCriteria'

describe('displayCode / chipCode', () => {
  it('uses the raw criteria_id from the API, without inventing P1 / P- prefixes', () => {
    expect(displayCode('1', 0)).toBe('1')
    expect(displayCode('9', 0)).toBe('9')
    expect(displayCode('10', 0)).toBe('10')
    expect(displayCode('1.1.1', 1)).toBe('1.1.1')
    expect(displayCode('G1', 0)).toBe('G1')
    expect(displayCode('P1', 0)).toBe('P1')
    expect(chipCode('1')).toBe('1')
    expect(chipCode('G1.1')).toBe('G1.1')
  })

  it('returns empty when the API node has no criteria_id', () => {
    expect(displayCode(null, 0)).toBe('')
    expect(displayCode('  ', 0)).toBe('')
    expect(chipCode(undefined)).toBe('')
  })
})

describe('hasCalculatorData', () => {
  it('treats null, empty, and blank calculator_id entries as unavailable', () => {
    expect(hasCalculatorData({ calculator_id: null })).toBe(false)
    expect(hasCalculatorData({ calculator_id: undefined })).toBe(false)
    expect(hasCalculatorData({ calculator_id: [] })).toBe(false)
    expect(hasCalculatorData({ calculator_id: ['', '  '] })).toBe(false)
  })

  it('accepts calculator_id or calculator_ids with a real id', () => {
    expect(hasCalculatorData({ calculator_id: ['C-P09-01'] })).toBe(true)
    expect(hasCalculatorData({ calculator_id: null, calculator_ids: ['C-G01-01'] })).toBe(true)
  })
})

describe('hasCriterionReferences', () => {
  it('treats null, empty string, and empty arrays as none', () => {
    expect(hasCriterionReferences({ references: null })).toBe(false)
    expect(hasCriterionReferences({ references: '' })).toBe(false)
    expect(hasCriterionReferences({ references: '   ' })).toBe(false)
  })

  it('is true for a URL or other non-empty references text', () => {
    expect(hasCriterionReferences({ references: 'https://www.grihaindia.org' })).toBe(true)
  })
})
