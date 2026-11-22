import { describe, expect, it } from 'vitest'
import { chipCode, displayCode } from '@/features/scorecard/lib/formatCriteria'

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
