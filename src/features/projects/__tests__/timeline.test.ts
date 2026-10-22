import { describe, expect, it } from 'vitest'
import {
  barPosition,
  buildGanttModel,
  buildGanttRange,
  dateToPercent,
  deriveCurrentPhase,
  formatDisplayDate,
  parseIsoDate,
} from '@/features/projects/lib/timeline'
import { sampleProjectTimeline } from '@/features/projects/schemas/projectTimeline'

const sample = sampleProjectTimeline

describe('timeline date helpers', () => {
  it('parses and formats ISO dates as local calendar days', () => {
    const date = parseIsoDate('2027-01-15')
    expect(date?.getFullYear()).toBe(2027)
    expect(date?.getMonth()).toBe(0)
    expect(date?.getDate()).toBe(15)
    expect(formatDisplayDate('2027-01-15')).toBe('15 Jan 2027')
    expect(parseIsoDate('2027-13-40')).toBeUndefined()
  })
})

describe('deriveCurrentPhase', () => {
  it('returns scoping between project start and design start', () => {
    expect(deriveCurrentPhase(sample, new Date(2027, 0, 15))).toBe('scoping')
    expect(deriveCurrentPhase(sample, new Date(2027, 1, 28))).toBe('scoping')
  })

  it('returns design for dates inside the design range, inclusive', () => {
    expect(deriveCurrentPhase(sample, new Date(2027, 2, 1))).toBe('design')
    expect(deriveCurrentPhase(sample, new Date(2027, 3, 15))).toBe('design')
    expect(deriveCurrentPhase(sample, new Date(2027, 5, 30))).toBe('design')
  })

  it('returns post-design in the gap before construction', () => {
    expect(deriveCurrentPhase(sample, new Date(2027, 6, 1))).toBe('post-design')
    expect(deriveCurrentPhase(sample, new Date(2027, 6, 31))).toBe('post-design')
  })

  it('returns construction and post-construction from the remaining ranges', () => {
    expect(deriveCurrentPhase(sample, new Date(2027, 7, 1))).toBe('construction')
    expect(deriveCurrentPhase(sample, new Date(2027, 10, 30))).toBe('construction')
    expect(deriveCurrentPhase(sample, new Date(2027, 11, 1))).toBe('post-construction')
    expect(deriveCurrentPhase(sample, new Date(2027, 11, 20))).toBe('post-construction')
  })

  it('returns null when today is outside the project window', () => {
    expect(deriveCurrentPhase(sample, new Date(2026, 9, 22))).toBeNull()
    expect(deriveCurrentPhase(sample, new Date(2027, 11, 21))).toBeNull()
  })
})

describe('gantt position math', () => {
  it('maps range bounds to 0% and 100%', () => {
    const start = new Date(2027, 0, 1)
    const end = new Date(2028, 0, 1)
    expect(dateToPercent(start, start, end)).toBe(0)
    expect(dateToPercent(end, start, end)).toBe(100)
  })

  it('places a date halfway through a 10-day window at 50%', () => {
    const start = new Date(2027, 0, 1)
    const end = new Date(2027, 0, 11)
    const mid = new Date(2027, 0, 6)
    expect(dateToPercent(mid, start, end)).toBe(50)
  })

  it('computes bar left/width from start and exclusive end', () => {
    const rangeStart = new Date(2027, 0, 1)
    const rangeEnd = new Date(2028, 0, 1)
    const start = new Date(2027, 2, 1)
    const endExclusive = new Date(2027, 6, 1)
    const position = barPosition(start, endExclusive, rangeStart, rangeEnd)
    expect(position.left).toBe(dateToPercent(start, rangeStart, rangeEnd))
    expect(position.width).toBe(
      dateToPercent(endExclusive, rangeStart, rangeEnd) - dateToPercent(start, rangeStart, rangeEnd),
    )
    expect(position.width).toBeGreaterThan(0)
  })

  it('expands the chart range to month boundaries of the data', () => {
    const range = buildGanttRange([new Date(2027, 0, 15), new Date(2027, 11, 20)])
    expect(range.start).toEqual(new Date(2027, 0, 1))
    expect(range.end).toEqual(new Date(2028, 0, 1))
  })

  it('builds bars and markers from the sample timeline', () => {
    const model = buildGanttModel(sample, new Date(2027, 3, 15))
    expect(model.months[0]?.label).toBe("Jan '27")
    expect(model.months.map((month) => month.label)).toEqual([
      "Jan '27",
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ])
    expect(model.currentPhase).toBe('design')

    const design = model.bars.find((bar) => bar.id === 'design')
    expect(design).toBeDefined()
    expect(design?.left).toBe(
      dateToPercent(new Date(2027, 2, 1), model.rangeStart, model.rangeEnd),
    )
    expect(design?.width).toBe(
      dateToPercent(new Date(2027, 6, 1), model.rangeStart, model.rangeEnd) -
        dateToPercent(new Date(2027, 2, 1), model.rangeStart, model.rangeEnd),
    )

    const scoping = model.bars.find((bar) => bar.id === 'scoping')
    expect(scoping?.left).toBe(
      dateToPercent(new Date(2027, 0, 15), model.rangeStart, model.rangeEnd),
    )

    const cert = model.markers.find((marker) => marker.type === 'cert')
    const preCert = model.markers.find((marker) => marker.type === 'pre-cert')
    expect(cert?.percent).toBe(
      dateToPercent(new Date(2027, 11, 20), model.rangeStart, model.rangeEnd),
    )
    expect(preCert?.percent).toBe(
      dateToPercent(new Date(2027, 5, 15), model.rangeStart, model.rangeEnd),
    )
    expect(model.markers.filter((marker) => marker.type === 'milestone')).toHaveLength(2)
  })
})
